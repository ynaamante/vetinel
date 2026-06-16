const db = require('../config/db');
(async () => {
  const name = undefined, owner = undefined, email = undefined, phone = undefined, address = undefined, timezone = undefined, status = 'suspended', id = 12;
  let query = `UPDATE clinics
       SET name = COALESCE($1, name),
           owner = COALESCE($2, owner),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           timezone = COALESCE($6, timezone),
           updated_at = now()`;
  const params = [name, owner, email, phone, address, timezone];
  if (status !== undefined) {
    query += `, metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('status', $7)`;
    params.push(status);
  }
  query += ` WHERE id = $${params.length + 1}
       RETURNING id, name, owner, email, phone, address, timezone, metadata, created_at, updated_at`;
  params.push(id);
  console.log('query:', query);
  console.log('params:', params);
  try {
    const r = await db.query(query, params);
    console.log('result:', r.rows);
  } catch (e) {
    console.error('error:', e);
  }
  process.exit();
})();
