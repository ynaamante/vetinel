const db = require('../config/db');

(async () => {
  try {
    const r = await db.query("SELECT id, name, lower(name) as lower_name, description FROM roles ORDER BY lower(name), id");
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) {
    console.error('Query failed:', e);
    process.exit(1);
  } finally {
    setTimeout(()=>process.exit(),200);
  }
})();
