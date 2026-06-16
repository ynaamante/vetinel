const dotenv = require('dotenv');
dotenv.config();
const db = require('./config/db');
(async () => {
  try {
    const info = await db.query("SELECT current_database() AS db, current_schema() AS schema, current_setting('search_path') AS search_path");
    console.log('CONN', JSON.stringify(info.rows, null, 2));
    const tables = await db.query("SELECT tablename FROM pg_tables WHERE tablename IN ('settings','system_announcements') ORDER BY tablename");
    console.log('TABLES', JSON.stringify(tables.rows, null, 2));
    const cols = await db.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='settings' ORDER BY ordinal_position");
    console.log('COLS', JSON.stringify(cols.rows, null, 2));
  } catch (err) {
    console.error('ERR', err);
  } finally {
    process.exit(0);
  }
})();
