const db = require('./config/db');
const bcrypt = require('bcryptjs');
(async () => {
  try {
    const emails = ['admin@vetintel.com', 'iambtchybest@gmail.com'];
    for (const email of emails) {
      console.log('--- QUERY FOR', email);
      const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      console.log(JSON.stringify(res.rows, null, 2));
      if (res.rows.length) {
        const user = res.rows[0];
        console.log('hash exists', !!user.password_hash);
        if (user.password_hash) {
          console.log('admin123 valid', await bcrypt.compare('admin123', user.password_hash));
          console.log('Alexis123 valid', await bcrypt.compare('Alexis123', user.password_hash));
        }
      }
    }
    const columns = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
    console.log('USERS COLUMNS', columns.rows.map(r => r.column_name));
    const all = await db.query('SELECT id, email, is_active, password_hash FROM users ORDER BY id LIMIT 20');
    console.log('ALL USERS', JSON.stringify(all.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
