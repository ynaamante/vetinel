const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, user_id, action, table_name, record_id, old_data, new_data, ip_address, created_at
      FROM audit_trail
      ORDER BY created_at DESC
      LIMIT 100
    `);
    res.json(result.rows.map((row) => ({
      ...row,
      old_data: row.old_data || {},
      new_data: row.new_data || {},
    })));
  } catch (e) {
    next(e);
  }
};

exports.getByFilter = async (req, res, next) => {
  try {
    const { user_id, action, table_name, days } = req.query;
    let query = 'SELECT id, user_id, action, table_name, record_id, old_data, new_data, ip_address, created_at FROM audit_trail WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (user_id) {
      paramCount++;
      query += ` AND user_id = $${paramCount}`;
      params.push(user_id);
    }

    if (action) {
      paramCount++;
      query += ` AND action = $${paramCount}`;
      params.push(action);
    }

    if (table_name) {
      paramCount++;
      query += ` AND table_name = $${paramCount}`;
      params.push(table_name);
    }

    if (days) {
      query += ` AND created_at > now() - interval '${parseInt(days, 10)} days'`;
    }

    query += ' ORDER BY created_at DESC LIMIT 500';
    const result = await db.query(query, params);
    res.json(result.rows.map((row) => ({
      ...row,
      old_data: row.old_data || {},
      new_data: row.new_data || {},
    })));
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { user_id, action, table_name, record_id, old_data, new_data } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;

    const result = await db.query(
      `INSERT INTO audit_trail (user_id, action, table_name, record_id, old_data, new_data, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, action, table_name, record_id, old_data, new_data, ip_address, created_at`,
      [user_id, action, table_name, record_id, JSON.stringify(old_data || {}), JSON.stringify(new_data || {}), ip_address]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    next(e);
  }
};
