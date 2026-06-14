const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const { clinic_id } = req.query;
    const params = [];
    let query = `SELECT id, clinic_id, key, value, updated_at FROM settings`;

    if (clinic_id) {
      params.push(clinic_id);
      query += ` WHERE clinic_id = $1`;
    }

    query += ` ORDER BY key ASC`;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT id, clinic_id, key, value, updated_at FROM settings WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Setting not found' });
    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { clinic_id, key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });

    const clinicId = clinic_id || null;
    const result = await db.query(
      `INSERT INTO settings (clinic_id, key, value)
       VALUES ($1, $2, $3)
       RETURNING id, clinic_id, key, value, updated_at`,
      [clinicId, key, JSON.stringify(value || {})]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Setting already exists for this clinic' });
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { key, value } = req.body;

    const result = await db.query(
      `UPDATE settings
       SET key = COALESCE($1, key),
           value = COALESCE($2, value),
           updated_at = now()
       WHERE id = $3
       RETURNING id, clinic_id, key, value, updated_at`,
      [key, value ? JSON.stringify(value) : null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Setting not found' });
    res.json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Setting already exists for this clinic' });
    next(e);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM settings WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Setting not found' });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};
