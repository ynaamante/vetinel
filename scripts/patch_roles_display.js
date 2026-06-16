const db = require('../config/db');

(async function(){
  try {
    const features = [
      'Intelligence Dashboard','Disease Monitoring','Risk Monitoring','Community Analytics','Reports','Data Sync Status',
      'Clinic Overview','User & Role Management','Financial Monitoring','Audit Trail',
      'Appointment Management','Patient Queue','Billing & Payments','Client Management','Due Dates & Reminders',
      'Pet Profiles','Medical Records','Vaccination Records','Treatment Records'
    ];
    const perms = {};
    features.forEach(f => perms[f] = { view: true, create: true, edit: true, delete: true, export: true });

    const upd = await db.query('UPDATE roles SET permissions = $1 WHERE lower(name) = $2 RETURNING id, name', [perms, 'clinic owner']);
    console.log('Clinic Owner update:', upd.rowCount, upd.rows);

    const ren = await db.query("UPDATE roles SET name = 'Super Admin' WHERE lower(name) = $1 RETURNING id, name", ['super_admin']);
    console.log('Renamed super_admin rows:', ren.rowCount, ren.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error patching roles:', err);
    process.exit(1);
  }
})();
