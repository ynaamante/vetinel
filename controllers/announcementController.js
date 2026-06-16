const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const { active } = req.query;
    const whereClause = active === 'true' ? 'WHERE active = true' : '';
    const result = await db.query(`
      SELECT id, title, description, priority, target_audience, created_by, active, created_at, updated_at
      FROM system_announcements
      ${whereClause}
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, priority, active, target_audience, created_by } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    console.log('announcement.create body', req.body);
    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    const createdByDb = created_by ? (parseInt(created_by, 10) || auditUserId) : auditUserId;
    const result = await db.query(
      `INSERT INTO system_announcements (title, description, priority, target_audience, created_by, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, priority, target_audience, created_by, active, created_at, updated_at`,
      [
        title,
        description || '',
        priority || 'normal',
        target_audience || 'All Clinics',
        createdByDb,
        active === false ? false : true,
      ]
    );
    const row = result.rows[0];
    const audit = require('../utils/audit');
    audit.logAudit({
      user_id: auditUserId,
      action: 'Created announcement',
      table_name: 'system_announcements',
      record_id: row.id,
      new_data: row,
      ip_address: req.ip || req.connection.remoteAddress,
    });
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, priority, active, target_audience, created_by } = req.body;
    
    const result = await db.query(
      `UPDATE system_announcements
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           priority = COALESCE($3, priority),
           target_audience = COALESCE($4, target_audience),
           created_by = COALESCE($5, created_by),
           active = COALESCE($6, active),
           updated_at = now()
       WHERE id = $7
       RETURNING id, title, description, priority, target_audience, created_by, active, created_at, updated_at`,
      [title, description, priority, target_audience, created_by, active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Announcement not found' });
    const row = result.rows[0];
    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    const audit = require('../utils/audit');
    audit.logAudit({
      user_id: auditUserId,
      action: 'Updated announcement',
      table_name: 'system_announcements',
      record_id: row.id,
      new_data: row,
      ip_address: req.ip || req.connection.remoteAddress,
    });
    res.json(row);
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
    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    const audit = require('../utils/audit');
    audit.logAudit({
      user_id: auditUserId,
      action: 'Deleted announcement',
      table_name: 'system_announcements',
      record_id: id,
      new_data: null,
      ip_address: req.ip || req.connection.remoteAddress,
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};
