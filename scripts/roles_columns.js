const db = require('../config/db');
(async()=>{
  try{
    const r=await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='roles'");
    console.log(JSON.stringify(r.rows.map(r=>r.column_name),null,2));
  }catch(e){console.error('Query failed:',e);process.exit(1)}finally{setTimeout(()=>process.exit(),200)}
})();
