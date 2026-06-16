const db = require('../config/db');
const bcrypt = require('bcryptjs');

const email = process.argv[2] || 'superadmin2@vetintel.com';
const password = process.argv[3] || 'SuperAdmin123!';
const name = process.argv[4] || 'Super Admin 2';

(async () => {
  try {
    const existing = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('User already exists:', existing.rows[0]);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, true, now(), now())
       RETURNING id, name, email, is_active`,
      [name, email, passwordHash]
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
