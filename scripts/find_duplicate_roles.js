const db = require('../config/db');

(async () => {
  try {
    const res = await db.query("SELECT lower(name) AS lower_name, array_agg(id) AS ids, COUNT(*) FROM roles GROUP BY lower(name) HAVING COUNT(*)>1");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('Query failed:', e);
    process.exit(1);
  } finally {
    setTimeout(() => process.exit(), 200);
  }
})();
