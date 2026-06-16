const db = require('../config/db');
(async()=>{
  try{
    const now = new Date();
    const rows = [
      { user_id: null, action: 'Created demo clinic', table_name: 'clinics', record_id: 1001, old_data: null, new_data: { name: 'Demo Clinic' }, created_at: now },
      { user_id: null, action: 'Updated demo user', table_name: 'users', record_id: 2001, old_data: { name: 'Old' }, new_data: { name: 'New' }, created_at: new Date(now - 1000*60*60) },
      { user_id: null, action: 'Deleted demo invoice', table_name: 'invoices', record_id: 3001, old_data: { total: 123 }, new_data: null, created_at: new Date(now - 1000*60*60*2) }
    ];

    for(const r of rows){
      await db.query(
        `INSERT INTO audit_trail (user_id, action, table_name, record_id, old_data, new_data, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [r.user_id, r.action, r.table_name, r.record_id, r.old_data ? JSON.stringify(r.old_data) : null, r.new_data ? JSON.stringify(r.new_data) : null, r.created_at]
      );
    }
    console.log('Inserted demo audit_trail rows');
  }catch(e){ console.error('Insert failed',e); process.exit(1);} finally{ setTimeout(()=>process.exit(),200); }
})();
