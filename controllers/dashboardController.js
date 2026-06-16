const db = require('../config/db');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= now() - interval '30 days') as new_users_last_30d,
        (SELECT COUNT(*) FROM clinics) as total_clinics,
        (SELECT COUNT(*) FROM clinics WHERE created_at >= now() - interval '30 days') as new_clinics_last_30d,
        (SELECT COUNT(*) FROM clinics WHERE lower(COALESCE(metadata->>'status', 'active')) = 'active') as active_clinics,
        (SELECT COUNT(*) FROM clinics WHERE lower(COALESCE(metadata->>'status', 'active')) = 'pending') as pending_approvals,
        (SELECT COUNT(*) FROM clinics WHERE lower(COALESCE(metadata->>'status', 'active')) = 'suspended') as suspended_clinics,
        (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status = 'paid') as revenue,
        (SELECT COUNT(*) FROM audit_trail WHERE created_at > now() - interval '24 hours') as activities_24h,
        (SELECT COUNT(*) FROM system_announcements WHERE active = true) as active_announcements,
        (SELECT COUNT(*) FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE lower(r.name) = 'doctor') AS doctors,
        (SELECT COUNT(*) FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE lower(r.name) = 'receptionist') AS receptionists,
        (SELECT COUNT(*) FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE lower(r.name) = 'doctor' AND u.created_at >= now() - interval '30 days') AS new_doctors_last_30d,
        (SELECT COUNT(*) FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE lower(r.name) = 'receptionist' AND u.created_at >= now() - interval '30 days') AS new_receptionists_last_30d
    `);

    const stats = result.rows[0];
    const roleCounts = {
      doctors: Number(stats.doctors) || 0,
      receptionists: Number(stats.receptionists) || 0,
    };

    res.json({
      clinicSummary: {
        totalRegisteredClinics: Number(stats.total_clinics) || 0,
        newClinicsLast30Days: Number(stats.new_clinics_last_30d) || 0,
        activeClinics: Number(stats.active_clinics) || 0,
        pendingApprovals: Number(stats.pending_approvals) || 0,
        suspendedClinics: Number(stats.suspended_clinics) || 0,
      },
      roleCounts: {
        doctors: Number(roleCounts.doctors) || 0,
        newDoctorsLast30Days: Number(stats.new_doctors_last_30d) || 0,
        receptionists: Number(roleCounts.receptionists) || 0,
        newReceptionistsLast30Days: Number(stats.new_receptionists_last_30d) || 0,
        totalUsers: Number(stats.total_users) || 0,
        newUsersLast30Days: Number(stats.new_users_last_30d) || 0,
      },
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
      WHERE COALESCE(archived, false) = false
      ORDER BY created_at DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.clearRecentActivity = async (req, res, next) => {
  try {
    // Mark recent audit entries as archived instead of deleting
    await db.query("UPDATE audit_trail SET archived = true WHERE COALESCE(archived, false) = false");
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};

exports.getRoleBreakdown = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT lower(COALESCE(r.name,'unknown')) AS role, COUNT(*)::int AS count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      GROUP BY lower(COALESCE(r.name,'unknown'))
      ORDER BY role
    `);
    const map = {};
    for (const row of result.rows) {
      map[row.role] = Number(row.count) || 0;
    }
    res.json({ roles: map });
  } catch (e) {
    next(e);
  }
};
