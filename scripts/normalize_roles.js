const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db');

const canonicalRoles = [
  { name: 'clinic_owner', permissions: { clinics: true, users: true, appointments: true, invoices: true } },
  { name: 'doctor', permissions: { appointments: true, health_records: true, prescriptions: true } },
  { name: 'receptionist', permissions: { appointments: true, clients: true, invoices: true } },
];

const duplicateRoleMap = [
  { target: 'doctor', variants: ['Doctor', 'Dr', 'DR'] },
  { target: 'receptionist', variants: ['Receptionist'] },
  { target: 'clinic_owner', variants: ['Clinic Owner', 'Clinic owner', 'clinic owner', 'ClinicOwner', 'clinic-owner', 'owner'] },
];

async function backupData() {
  const roles = await db.query('SELECT id, name, permissions FROM roles ORDER BY id');
  const users = await db.query('SELECT id, name, email, role_id, clinic_id FROM users ORDER BY id');
  const backupDir = path.resolve(__dirname, 'backup');
  await fs.mkdir(backupDir, { recursive: true });
  await fs.writeFile(path.join(backupDir, 'roles_backup.json'), JSON.stringify(roles.rows, null, 2));
  await fs.writeFile(path.join(backupDir, 'users_backup.json'), JSON.stringify(users.rows, null, 2));
  console.log('Backups written to:', backupDir);
}

async function ensureCanonicalRoles() {
  const ids = {};

  for (const role of canonicalRoles) {
    const result = await db.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [role.name]);
    if (result.rows.length > 0) {
      ids[role.name] = result.rows[0].id;
      console.log(`Found canonical role ${role.name} (id=${ids[role.name]})`);
      continue;
    }

    const insertResult = await db.query(
      `INSERT INTO roles (name, permissions, created_at)
       VALUES ($1, $2, now())
       RETURNING id`,
      [role.name, role.permissions]
    );
    ids[role.name] = insertResult.rows[0].id;
    console.log(`Created canonical role ${role.name} (id=${ids[role.name]})`);
  }

  return ids;
}

async function reassignUsers(roleIds) {
  for (const map of duplicateRoleMap) {
    const lowerVariants = map.variants.map((v) => v.toLowerCase()).concat(map.target.toLowerCase());
    const roles = await db.query('SELECT id, name FROM roles WHERE lower(name) = ANY($1)', [lowerVariants]);

    for (const role of roles.rows) {
      if (role.name.toLowerCase() === map.target.toLowerCase()) continue;
      const updateResult = await db.query(
        'UPDATE users SET role_id = $1 WHERE role_id = $2 RETURNING id',
        [roleIds[map.target], role.id]
      );
      console.log(`Reassigned ${updateResult.rowCount} users from role '${role.name}' (id=${role.id}) to '${map.target}'`);

      const rpResult = await db.query(
        'UPDATE role_permissions SET role_id = $1 WHERE role_id = $2 RETURNING id',
        [roleIds[map.target], role.id]
      );
      console.log(`Reassigned ${rpResult.rowCount} role_permissions from role '${role.name}' (id=${role.id}) to '${map.target}'`);
    }
  }
}

const roleSynonymMap = new Map(
  duplicateRoleMap
    .flatMap((map) => map.variants.map((variant) => [variant.toLowerCase(), map.target]))
    .concat(canonicalRoles.map((role) => [role.name.toLowerCase(), role.name]))
);

function normalizeRoleName(name) {
  if (!name) return '';
  const lower = name.trim().toLowerCase();
  return roleSynonymMap.get(lower) || name.trim();
}

async function cleanupDuplicateRoles(roleIds) {
  const duplicateNames = Array.from(roleSynonymMap.keys());
  const duplicateRoles = await db.query(
    'SELECT id, name FROM roles WHERE lower(name) = ANY($1)',
    [duplicateNames]
  );

  if (duplicateRoles.rows.length === 0) {
    console.log('No duplicate role rows found to delete.');
    return;
  }

  const duplicateIds = duplicateRoles.rows
    .filter((role) => {
      const canonicalName = normalizeRoleName(role.name);
      return roleIds[canonicalName] && role.id !== roleIds[canonicalName];
    })
    .map((role) => role.id);

  if (duplicateIds.length === 0) {
    console.log('No duplicate role rows to delete after canonical reassignment.');
    return;
  }

  console.log('Deleting duplicate non-canonical role rows:');
  duplicateRoles.rows
    .filter((role) => duplicateIds.includes(role.id))
    .forEach((role) => console.log(`  id=${role.id}, name='${role.name}'`));

  await db.query('DELETE FROM roles WHERE id = ANY($1)', [duplicateIds]);
  console.log(`Deleted ${duplicateIds.length} duplicate role rows.`);
}

async function summaryPerClinic() {
  const clinics = await db.query('SELECT id, name FROM clinics ORDER BY id');
  for (const clinic of clinics.rows) {
    const total = await db.query('SELECT COUNT(*) FROM users WHERE clinic_id = $1', [clinic.id]);
    const doctors = await db.query(
      "SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE u.clinic_id = $1 AND lower(r.name) = 'doctor'",
      [clinic.id]
    );
    const receptionists = await db.query(
      "SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE u.clinic_id = $1 AND lower(r.name) = 'receptionist'",
      [clinic.id]
    );
    console.log(
      `CLINIC: ${clinic.name} (${clinic.id}) -> total=${total.rows[0].count} doctors=${doctors.rows[0].count} receptionists=${receptionists.rows[0].count}`
    );
  }
}

(async () => {
  try {
    await backupData();
    const roleIds = await ensureCanonicalRoles();
    await reassignUsers(roleIds);
    await cleanupDuplicateRoles(roleIds);
    await summaryPerClinic();
    console.log('\nRole normalization complete.');
  } catch (err) {
    console.error('Failed to normalize roles:', err);
    process.exit(1);
  }
})();
