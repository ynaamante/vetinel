const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    // Join users to include a friendly user display name for the frontend
    const result = await db.query(`
      SELECT a.id, a.user_id, a.action, a.table_name, a.record_id, a.old_data, a.new_data, a.ip_address, a.created_at,
             u.name, u.email
      FROM audit_trail a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE COALESCE(a.archived, false) = false
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    const rows = result.rows.map((row) => {
      const newData = row.new_data || {};
      const oldData = row.old_data || {};
      const userDisplay = row.name || row.email || null;

      // Build friendly fields expected by frontend
      const details = newData.title || newData.name || newData.key || JSON.stringify(newData || {});
      const clinic = newData.clinic_id || oldData.clinic_id || null;

      return {
        id: row.id,
        user_id: row.user_id,
        user: userDisplay,
        action: row.action,
        details,
        clinic,
        category: row.table_name,
        timestamp: row.created_at,
        severity: 'info',
      };
    });

    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.getByFilter = async (req, res, next) => {
  try {
    const { user_id, action, table_name, days } = req.query;
        let query = `
          SELECT a.id, a.user_id, a.action, a.table_name, a.record_id, a.old_data, a.new_data, a.ip_address, a.created_at,
            u.name, u.email
          FROM audit_trail a
          LEFT JOIN users u ON u.id = a.user_id
          WHERE COALESCE(a.archived, false) = false`;
    const params = [];
    let paramCount = 0;

    if (user_id) {
      paramCount++;
      query += ` AND a.user_id = $${paramCount}`;
      params.push(user_id);
    }

    if (action) {
      paramCount++;
      query += ` AND a.action = $${paramCount}`;
      params.push(action);
    }

    if (table_name) {
      paramCount++;
      query += ` AND a.table_name = $${paramCount}`;
      params.push(table_name);
    }

    if (days) {
      query += ` AND a.created_at > now() - interval '${parseInt(days, 10)} days'`;
    }

    query += ' ORDER BY a.created_at DESC LIMIT 500';
    const result = await db.query(query, params);

    const rows = result.rows.map((row) => {
      const newData = row.new_data || {};
      const oldData = row.old_data || {};
      const userDisplay = row.name || row.email || null;
      const details = newData.title || newData.name || newData.key || JSON.stringify(newData || {});
      const clinic = newData.clinic_id || oldData.clinic_id || null;
      return {
        id: row.id,
        user_id: row.user_id,
        user: userDisplay,
        action: row.action,
        details,
        clinic,
        category: row.table_name,
        timestamp: row.created_at,
        severity: 'info',
      };
    });

    res.json(rows);
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
