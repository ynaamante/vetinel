const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, name, description, resource, action, created_at
      FROM permissions
      ORDER BY name ASC
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
      `SELECT id, name, description, resource, action, created_at FROM permissions WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Permission not found' });
    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, resource, action } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    const result = await db.query(
      `INSERT INTO permissions (name, description, resource, action)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, resource, action, created_at`,
      [name, description || '', resource || '', action || '']
    );
    const row = result.rows[0];
    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    const audit = require('../utils/audit');
    audit.logAudit({
      user_id: auditUserId,
      action: 'Created permission',
      table_name: 'permissions',
      record_id: row.id,
      new_data: row,
      ip_address: req.ip || req.connection.remoteAddress,
    });
    res.status(201).json(row);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Permission already exists' });
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, resource, action } = req.body;

    const result = await db.query(
      `UPDATE permissions
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           resource = COALESCE($3, resource),
           action = COALESCE($4, action)
       WHERE id = $5
       RETURNING id, name, description, resource, action, created_at`,
      [name, description, resource, action, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Permission not found' });
    const row = result.rows[0];
    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    const audit = require('../utils/audit');
    audit.logAudit({
      user_id: auditUserId,
      action: 'Updated permission',
      table_name: 'permissions',
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
      `DELETE FROM permissions WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Permission not found' });
    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    const audit = require('../utils/audit');
    audit.logAudit({
      user_id: auditUserId,
      action: 'Deleted permission',
      table_name: 'permissions',
      record_id: id,
      new_data: null,
      ip_address: req.ip || req.connection.remoteAddress,
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};

exports.listRolePermissions = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT rp.id,
             rp.role_id,
             rp.permission_id,
             r.name AS role_name,
             p.name AS permission_name,
             p.resource,
             p.action
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      ORDER BY rp.id ASC
    `);
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.createRolePermission = async (req, res, next) => {
  try {
    const { role_id, permission_id } = req.body;
    if (!role_id || !permission_id) return res.status(400).json({ error: 'role_id and permission_id required' });

    const result = await db.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       VALUES ($1, $2)
       RETURNING id, role_id, permission_id`,
      [role_id, permission_id]
    );
    const row = result.rows[0];
    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    const audit = require('../utils/audit');
    audit.logAudit({
      user_id: auditUserId,
      action: 'Created role_permission',
      table_name: 'role_permissions',
      record_id: row.id,
      new_data: row,
      ip_address: req.ip || req.connection.remoteAddress,
    });
    res.status(201).json(row);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Role permission mapping already exists' });
    next(e);
  }
};

exports.deleteRolePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM role_permissions WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Role permission mapping not found' });
    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    const audit = require('../utils/audit');
    audit.logAudit({
      user_id: auditUserId,
      action: 'Deleted role_permission',
      table_name: 'role_permissions',
      record_id: id,
      new_data: null,
      ip_address: req.ip || req.connection.remoteAddress,
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};
