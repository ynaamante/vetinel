const db = require('./config/db');
const bcrypt = require('bcryptjs');
(async () => {
  try {
    const emails = ['admin@vetintel.com', 'iambtchybest@gmail.com'];
    for (const email of emails) {
      const res = await db.query('SELECT id, name, email, role_name, role_id, is_active, password_hash FROM users WHERE email = $1', [email]);
      console.log('EMAIL:', email);
      console.log(JSON.stringify(res.rows, null, 2));
      if (res.rows.length && res.rows[0].password_hash) {
        const okAdmin = await bcrypt.compare('admin123', res.rows[0].password_hash);
        const okProvided = await bcrypt.compare('Alexis123', res.rows[0].password_hash);
        console.log('admin123 valid for', email, okAdmin);
        console.log('Alexis123 valid for', email, okProvided);
      }
    }
    const all = await db.query('SELECT id, email, role_name, role_id, is_active FROM users ORDER BY id LIMIT 20');
    console.log('ALL USERS:', JSON.stringify(all.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
