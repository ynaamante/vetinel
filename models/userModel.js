const db = require('../config/db');
const bcrypt = require('bcryptjs');

module.exports = {
  async getAll() {
    const res = await db.query(
      `SELECT u.id,
              u.name,
              u.email,
              u.is_active,
              u.created_at,
              c.name AS clinic,
              r.name AS role
       FROM users u
       LEFT JOIN clinics c ON u.clinic_id = c.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE COALESCE(u.is_active, true) = true
       ORDER BY u.id DESC`
    );
    return res.rows;
  },
  async getByEmail(email) {
    const res = await db.query(
      `SELECT u.id,
              u.name,
              u.email,
              u.password_hash,
              u.is_active,
              u.clinic_id,
              u.role_id,
              c.name AS clinic_name,
              r.name AS role_name
       FROM users u
       LEFT JOIN clinics c ON u.clinic_id = c.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );
    return res.rows[0];
  },
  async create({ name, email, password, clinic_id, role_id }) {
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const res = await db.query(
      'INSERT INTO users (name, email, password_hash, clinic_id, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, clinic_id, role_id, is_active, created_at',
      [name, email, passwordHash, clinic_id, role_id]
    );
    return res.rows[0];
  },
};
