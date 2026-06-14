const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const colRes = await db.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='roles' AND column_name='description'`
    );
    const hasDescription = colRes.rows.length > 0;
    const selectFields = hasDescription ? 'r.id, r.name, r.description, r.permissions' : 'r.id, r.name, r.permissions';

    const result = await db.query(`
      SELECT ${selectFields}
      FROM roles r
      ORDER BY r.name ASC
    `);
    
    // Parse permissions JSON if stored as string
    const roles = result.rows.map(role => ({
      ...role,
      permissions: typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions
    }));
    
    res.json(roles);
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const colRes = await db.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='roles' AND column_name='description'`
    );
    const hasDescription = colRes.rows.length > 0;
    const fields = hasDescription ? 'id, name, description, permissions' : 'id, name, permissions';

    const result = await db.query(`SELECT ${fields} FROM roles WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Role not found' });
    
    const role = result.rows[0];
    role.permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
    res.json(role);
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const colRes = await db.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='roles' AND column_name='description'`
    );
    const hasDescription = colRes.rows.length > 0;

    let result;
    if (hasDescription) {
      result = await db.query(
        `INSERT INTO roles (name, description, permissions)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, permissions`,
        [name, description || '', JSON.stringify(permissions || {})]
      );
    } else {
      result = await db.query(
        `INSERT INTO roles (name, permissions)
         VALUES ($1, $2)
         RETURNING id, name, permissions`,
        [name, JSON.stringify(permissions || {})]
      );
    }
    
    const role = result.rows[0];
    role.permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
    res.status(201).json(role);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Role already exists' });
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    const colRes = await db.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='roles' AND column_name='description'`
    );
    const hasDescription = colRes.rows.length > 0;

    let result;
    if (hasDescription) {
      result = await db.query(
        `UPDATE roles
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             permissions = COALESCE($3, permissions)
         WHERE id = $4
         RETURNING id, name, description, permissions`,
        [name, description, permissions ? JSON.stringify(permissions) : null, id]
      );
    } else {
      result = await db.query(
        `UPDATE roles
         SET name = COALESCE($1, name),
             permissions = COALESCE($2, permissions)
         WHERE id = $3
         RETURNING id, name, permissions`,
        [name, permissions ? JSON.stringify(permissions) : null, id]
      );
    }
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Role not found' });
    
    const role = result.rows[0];
    role.permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
    res.json(role);
  } catch (e) {
    next(e);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(`DELETE FROM roles WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Role not found' });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};
