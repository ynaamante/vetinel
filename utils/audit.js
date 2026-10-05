const db = require('../config/db');

async function logAudit({
  user_id = null,
  role = null,
  action,
  table_name = null,
  record_id = null,
  old_data = null,
  new_data = null,
  reason = null,
  ip_address = null,
}) {
  if (!action) return;
  const auditMetadata = {
    user_id,
    role,
    recorded_at: new Date().toISOString(),
    ...(reason ? { reason } : {}),
  };
  const nextData = new_data
    ? { ...new_data, _audit: auditMetadata }
    : { _audit: auditMetadata };
  await db.query(
    `INSERT INTO audit_trail (user_id, action, table_name, record_id, old_data, new_data, ip_address)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [user_id, action, table_name, record_id, old_data ? JSON.stringify(old_data) : null, JSON.stringify(nextData), ip_address]
  );
}

module.exports = { logAudit };
