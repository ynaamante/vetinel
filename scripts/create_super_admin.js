const db = require('../config/db');
const bcrypt = require('bcryptjs');

const email = process.argv[2] || process.env.SUPERADMIN_EMAIL || 'superadmin2@vetintel.com';
const password = process.argv[3] || process.env.SUPERADMIN_PASSWORD || 'SuperAdmin123!';
const name = process.argv[4] || process.env.SUPERADMIN_NAME || 'Super Admin 2';

(async () => {
  try {
    const existing = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('User already exists:', existing.rows[0]);
      process.exit(0);
    }

    // Find or create the super_admin role
    let roleId = null;
    const roleRes = await db.query('SELECT id FROM roles WHERE lower(name) = lower($1) LIMIT 1', ['super_admin']);
    if (roleRes.rows.length > 0) {
      roleId = roleRes.rows[0].id;
    } else {
      const createdRole = await db.query('INSERT INTO roles (name) VALUES ($1) RETURNING id', ['super_admin']);
      roleId = createdRole.rows[0].id;
      console.log('Created role super_admin with id', roleId);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, is_active, created_at, updated_at, role_id)
       VALUES ($1, $2, $3, true, now(), now(), $4)
       RETURNING id, name, email, is_active`,
      [name, email, passwordHash, roleId]
    );

    console.log('Created super-admin user:');
    console.log(result.rows[0]);
    console.log('Use these credentials to log in:');
    console.log(`  email: ${email}`);
    console.log(`  password: ${password}`);
  } catch (err) {
    console.error('Failed to create super-admin:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
