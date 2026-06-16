const db = require('../config/db');

// Maintenance script to fix role rows that cause UI and auth issues.
// Usage: node scripts/fix_roles.js

const canonicalRoles = [
  { name: 'super_admin', permissions: { all: true } },
  { name: 'clinic_owner', permissions: { clinics: true, users: true, appointments: true, invoices: true } },
  { name: 'doctor', permissions: { appointments: true, health_records: true, prescriptions: true } },
  { name: 'receptionist', permissions: { appointments: true, clients: true, invoices: true } },
];

// Only create the `super_admin` canonical role if explicitly allowed via env
const createSuperAdmin = process.env.CREATE_SUPER_ADMIN === 'true';

const duplicateRoleMap = [
  { target: 'doctor', variants: ['doctor', 'dr', 'dr.'] },
  { target: 'receptionist', variants: ['receptionist'] },
  { target: 'clinic_owner', variants: ['clinic owner', 'clinicowner', 'clinic-owner', 'owner', 'clinic_owner'] },
  { target: 'super_admin', variants: ['super admin', 'super_admin', 'superadmin'] },
];

function normalizeName(n) {
  return (n || '').trim();
}

function lower(n) { return (n || '').trim().toLowerCase(); }

async function ensureCanonicalRoles() {
  const ids = {};
  for (const role of canonicalRoles) {
    // skip creating super_admin unless explicitly enabled
    if (role.name === 'super_admin' && !createSuperAdmin) {
      // try to find an existing row but do not create one
      const res = await db.query('SELECT id FROM roles WHERE lower(name)=lower($1) LIMIT 1', [role.name]);
      if (res.rows.length) {
        ids[role.name] = res.rows[0].id;
        console.log(`Found role ${role.name} id=${ids[role.name]}`);
      }
      continue;
    }
    const res = await db.query('SELECT id FROM roles WHERE lower(name)=lower($1) LIMIT 1', [role.name]);
    if (res.rows.length) {
      ids[role.name] = res.rows[0].id;
      console.log(`Found role ${role.name} id=${ids[role.name]}`);
      continue;
    }
    const insert = await db.query(
      `INSERT INTO roles (name, permissions, created_at) VALUES ($1, $2, now()) RETURNING id`,
      [role.name, role.permissions]
    );
    ids[role.name] = insert.rows[0].id;
    console.log(`Created role ${role.name} id=${ids[role.name]}`);
  }
  return ids;
}

async function deleteAdminRows() {
  const del = await db.query("DELETE FROM roles WHERE lower(name) = 'admin' RETURNING id, name");
  if (del.rowCount) console.log(`Deleted ${del.rowCount} legacy admin role(s)`);
}

async function reassignAndCleanup(roleIds) {
  // Reassign users and role_permissions for variant names to canonical
  for (const map of duplicateRoleMap) {
    const variants = map.variants.map(v => v.toLowerCase());
    const rows = await db.query('SELECT id, name FROM roles WHERE lower(name) = ANY($1)', [variants]);
    for (const row of rows.rows) {
      const rowLower = row.name.toLowerCase();
      if (rowLower === map.target.toLowerCase()) continue;
      const targetId = roleIds[map.target];
      if (!targetId) continue;
      const u = await db.query('UPDATE users SET role_id=$1 WHERE role_id=$2 RETURNING id', [targetId, row.id]);
      const rp = await db.query('UPDATE role_permissions SET role_id=$1 WHERE role_id=$2 RETURNING id', [targetId, row.id]);
      console.log(`Reassigned users(${u.rowCount}) and role_permissions(${rp.rowCount}) from '${row.name}' -> '${map.target}'`);
    }
  }

  // Remove duplicate non-canonical roles (keep canonical ids)
  const allVariants = duplicateRoleMap.flatMap(m => m.variants.map(v => v.toLowerCase()));
  const dupRes = await db.query('SELECT id, name FROM roles WHERE lower(name) = ANY($1)', [allVariants]);
  const toDelete = [];
  for (const r of dupRes.rows) {
    const canon = duplicateRoleMap.find(m => m.variants.map(v => v.toLowerCase()).includes(r.name.toLowerCase()));
    const target = canon ? canon.target : null;
    if (target && roleIds[target] && r.id !== roleIds[target]) toDelete.push(r.id);
  }
  if (toDelete.length) {
    await db.query('DELETE FROM roles WHERE id = ANY($1)', [toDelete]);
    console.log(`Deleted ${toDelete.length} duplicate role rows.`);
  }
}

async function assignSuperAdminToUser(email) {
  const res = await db.query('SELECT id FROM roles WHERE lower(name) = $1 LIMIT 1', ['super_admin']);
  if (!res.rows.length) return;
  const roleId = res.rows[0].id;
  const u = await db.query('UPDATE users SET role_id=$1 WHERE lower(email)=lower($2) RETURNING id,email', [roleId, email]);
  if (u.rowCount) console.log(`Assigned super_admin role to ${u.rowCount} user(s) matching ${email}`);
  else console.log(`No user with email ${email} found to assign super_admin`);
}

async function run() {
  try {
    console.log('Starting role cleanup...');
    await deleteAdminRows();
    const ids = await ensureCanonicalRoles();
    await reassignAndCleanup(ids);
    const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@vetintel.com';
    if (createSuperAdmin) {
      await assignSuperAdminToUser(adminEmail);
    } else {
      console.log('Skipping assignment of super_admin to users (CREATE_SUPER_ADMIN not set)');
    }
    console.log('Role cleanup complete. Restart your server and clear browser localStorage, then log in.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to run fix_roles:', err);
    process.exit(1);
  }
}

run();
