const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, name, email, phone, address, timezone, created_at, updated_at
      FROM clinics
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT id, name, email, phone, address, timezone, created_at, updated_at
       FROM clinics WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Clinic not found' });
    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, phone, address, timezone } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const result = await db.query(
      `INSERT INTO clinics (name, email, phone, address, timezone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, address, timezone, created_at`,
      [name, email, phone, address, timezone || 'UTC']
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Clinic already exists' });
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, timezone } = req.body;
    const result = await db.query(
      `UPDATE clinics
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           timezone = COALESCE($5, timezone),
           updated_at = now()
       WHERE id = $6
       RETURNING id, name, email, phone, address, timezone, created_at, updated_at`,
      [name, email, phone, address, timezone, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Clinic not found' });
    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};
