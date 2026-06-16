const db = require('../config/db');
const fs = require('fs');
(async()=>{
  try{
    const data = JSON.parse(fs.readFileSync('roles_backup.json','utf8'));
    const colRes = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='roles'");
    const cols = colRes.rows.map(r=>r.column_name);
    for(const role of data){
      const existing = await db.query('SELECT id FROM roles WHERE id = $1', [role.id]);
      if(existing.rows.length){
        console.log('Role exists, skipping id', role.id);
        continue;
      }
      // Build insert dynamically depending on available columns
      const insertCols = [];
      const values = [];
      const params = [];
      let idx = 1;
      if(cols.includes('id')){ insertCols.push('id'); values.push('$'+(idx++)); params.push(role.id); }
      if(cols.includes('name')){ insertCols.push('name'); values.push('$'+(idx++)); params.push(role.name); }
      if(cols.includes('description') && role.description !== undefined){ insertCols.push('description'); values.push('$'+(idx++)); params.push(role.description); }
      if(cols.includes('permissions') && role.permissions !== undefined){ insertCols.push('permissions'); values.push('$'+(idx++)); params.push(JSON.stringify(role.permissions)); }
      if(cols.includes('created_at') && role.created_at !== undefined){ insertCols.push('created_at'); values.push('$'+(idx++)); params.push(role.created_at); }
      if(cols.includes('is_system_role') && role.is_system_role !== undefined){ insertCols.push('is_system_role'); values.push('$'+(idx++)); params.push(role.is_system_role); }

      const sql = `INSERT INTO roles (${insertCols.join(',')}) VALUES (${values.join(',')})`;
      await db.query(sql, params);
      console.log('Restored role id', role.id);
    }
  }catch(e){ console.error('Restore failed',e); process.exit(1);} finally{ setTimeout(()=>process.exit(),200);} 
})();
