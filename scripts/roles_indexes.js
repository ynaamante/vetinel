const db = require('../config/db');
(async()=>{
  try{
    const r=await db.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename='roles'");
    console.log(JSON.stringify(r.rows,null,2));
  }catch(e){console.error('Query failed:',e);process.exit(1)}finally{setTimeout(()=>process.exit(),200)}
})();
