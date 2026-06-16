const db = require('../config/db');

async function logAudit({ user_id = null, action, table_name = null, record_id = null, old_data = null, new_data = null, ip_address = null }) {
  if (!action) return;
  try {
    console.log('Audit.logAudit called:', { user_id, action, table_name, record_id });
    await db.query(
      `INSERT INTO audit_trail (user_id, action, table_name, record_id, old_data, new_data, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [user_id, action, table_name, record_id, old_data ? JSON.stringify(old_data) : null, new_data ? JSON.stringify(new_data) : null, ip_address]
    );
  } catch (e) {
    // Don't throw - audit failures shouldn't break main flow
    console.error('Audit log failed', e && e.message);
  }
}

module.exports = { logAudit };
