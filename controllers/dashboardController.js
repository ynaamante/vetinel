const db = require('../config/db');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM clinics) as total_clinics,
        (SELECT COUNT(*) FROM appointments) as total_appointments,
        (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status = 'paid') as revenue,
        (SELECT COUNT(*) FROM audit_trail WHERE created_at > now() - interval '24 hours') as activities_24h,
        (SELECT COUNT(*) FROM system_announcements WHERE active = true) as active_announcements
    `);
    
    const stats = result.rows[0];
    res.json({
      kpis: [
        { label: 'Total Users', value: stats.total_users, change: 0, trend: 'up' },
        { label: 'Total Clinics', value: stats.total_clinics, change: 0, trend: 'up' },
        { label: 'Appointments', value: stats.total_appointments, change: 0, trend: 'up' },
        { label: 'Revenue', value: `$${stats.revenue}`, change: 0, trend: 'up' },
        { label: 'Activities (24h)', value: stats.activities_24h, change: 0, trend: 'neutral' },
        { label: 'Announcements', value: stats.active_announcements, change: 0, trend: 'neutral' }
      ]
    });
  } catch (e) {
    next(e);
  }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        user_id,
        action,
        table_name AS entity_type,
        record_id AS entity_id,
        COALESCE(old_data, '{}'::jsonb) || COALESCE(new_data, '{}'::jsonb) AS changes,
        created_at
      FROM audit_trail
      ORDER BY created_at DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};
