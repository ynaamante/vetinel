const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, title, description, priority, active, created_at, updated_at
      FROM system_announcements
      WHERE active = true
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, priority } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    
    const result = await db.query(
      `INSERT INTO system_announcements (title, description, priority, active)
       VALUES ($1, $2, $3, true)
       RETURNING id, title, description, priority, active, created_at, updated_at`,
      [title, description || '', priority || 'normal']
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, priority, active } = req.body;
    
    const result = await db.query(
      `UPDATE system_announcements
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           priority = COALESCE($3, priority),
           active = COALESCE($4, active),
           updated_at = now()
       WHERE id = $5
       RETURNING id, title, description, priority, active, created_at, updated_at`,
      [title, description, priority, active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Announcement not found' });
    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE system_announcements SET active = false WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};
