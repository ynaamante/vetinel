const db = require('../config/db');
const fs = require('fs');

async function mergeRoles(sourceId, targetId) {
  console.log('Starting merge', sourceId, '->', targetId);
  // Backup affected rows
  const rolesRes = await db.query('SELECT * FROM roles WHERE id IN ($1,$2)', [sourceId, targetId]);
  fs.writeFileSync(`roles_merge_backup_${Date.now()}.json`, JSON.stringify(rolesRes.rows, null, 2));

  // Move users
  const usersRes = await db.query('SELECT id FROM users WHERE role_id = $1', [sourceId]);
  if (usersRes.rows.length > 0) {
    await db.query('UPDATE users SET role_id = $1 WHERE role_id = $2', [targetId, sourceId]);
    console.log('Moved', usersRes.rows.length, 'users to', targetId);
  } else {
    console.log('No users to move');
  }

  // Move role_permissions, avoiding duplicates
  const perms = await db.query('SELECT permission_id FROM role_permissions WHERE role_id = $1', [sourceId]);
  for (const row of perms.rows) {
    try {
      await db.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2)', [targetId, row.permission_id]);
      console.log('Added permission', row.permission_id, 'to role', targetId);
    } catch (e) {
      if (e.code === '23505') {
        console.log('Permission', row.permission_id, 'already present for', targetId);
      } else throw e;
    }
  }

  // Delete source role
  const del = await db.query('DELETE FROM roles WHERE id = $1 RETURNING id', [sourceId]);
  if (del.rows.length) console.log('Deleted source role', sourceId);
  else console.log('Source role not found, nothing deleted');
}

(async()=>{
  const src = Number(process.argv[2]);
  const tgt = Number(process.argv[3]);
  if (!src || !tgt) {
    console.error('Usage: node merge_roles.js <sourceId> <targetId>');
    process.exit(1);
  }
  try{
    await mergeRoles(src,tgt);
    console.log('Merge complete');
  }catch(e){
    console.error('Merge failed',e);
    process.exit(1);
  }finally{ setTimeout(()=>process.exit(),200); }
})();
