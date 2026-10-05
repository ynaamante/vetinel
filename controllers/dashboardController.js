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

    res.json({
      clinicSummary: {
        totalRegisteredClinics: Number(stats.total_clinics) || 0,
        newClinicsLast30Days: Number(stats.new_clinics_last_30d) || 0,
        activeClinics: Number(stats.active_clinics) || 0,
        pendingApprovals: Number(stats.pending_approvals) || 0,
        suspendedClinics: Number(stats.suspended_clinics) || 0,
      },
      roleCounts: {
        doctors: Number(stats.doctors) || 0,
        newDoctorsLast30Days: Number(stats.new_doctors_last_30d) || 0,
        receptionists: Number(stats.receptionists) || 0,
        newReceptionistsLast30Days: Number(stats.new_receptionists_last_30d) || 0,
        totalUsers: Number(stats.total_users) || 0,
        newUsersLast30Days: Number(stats.new_users_last_30d) || 0,
      },
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

exports.getRecentClinicApplications = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        c.id,
        c.name,
        c.owner,
        c.created_at,
        COALESCE(c.metadata->'application'->>'staffCount', '0') AS staff_count,
        COALESCE(c.metadata->'application'->>'plan', 'Starter') AS plan,
        COALESCE(c.metadata->>'status', 'active') AS status
      FROM clinics c
      WHERE COALESCE(c.archived, false) = false
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    res.json({ applications: result.rows });
  } catch (e) {
    next(e);
  }
};

exports.clearRecentActivity = async (req, res, next) => {
  try {
    await db.query(
      "UPDATE audit_trail SET archived = true WHERE COALESCE(archived, false) = false"
    );

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};

exports.getRoleBreakdown = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT lower(COALESCE(r.name, 'unknown')) AS role, COUNT(*)::int AS count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      GROUP BY lower(COALESCE(r.name, 'unknown'))
      ORDER BY role
    `);

    const roles = {};
    for (const row of result.rows) {
      roles[row.role] = Number(row.count) || 0;
    }

    res.json({ roles });
  } catch (e) {
    next(e);
  }
};

exports.getPlatformReports = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM clinics WHERE created_at >= now() - interval '30 days')::int AS new_clinics_30d,
        (SELECT COUNT(*) FROM clinics WHERE lower(COALESCE(metadata->>'status', 'active')) = 'active')::int AS active_clinics,
        (SELECT COUNT(*) FROM clinics WHERE lower(COALESCE(metadata->>'status', 'active')) <> 'active')::int AS inactive_clinics,
        (SELECT COUNT(*) FROM clinics)::int AS total_clinics,
        (SELECT COUNT(*) FROM demo_requests WHERE lower(status) NOT IN ('completed', 'cancelled'))::int AS open_demo_requests,
        (SELECT COUNT(*) FROM users)::int AS total_users,
        (SELECT COUNT(*) FROM role_requests WHERE lower(status) = 'approved')::int AS approved_role_requests,
        (SELECT COUNT(*) FROM role_requests)::int AS total_role_requests,
        (SELECT COUNT(*) FROM subscription_plans WHERE active = true)::int AS active_plans
    `);

    const row = result.rows[0];
    const totalClinics = Number(row.total_clinics) || 0;
    const totalRoleRequests = Number(row.total_role_requests) || 0;

    res.json({
      reports: [
        { key: 'clinic-growth', label: 'CLINIC REGISTRATION GROWTH', value: `+${row.new_clinics_30d}`, description: 'clinics this month' },
        { key: 'clinic-status', label: 'ACTIVE VS INACTIVE', value: `${row.active_clinics} / ${row.inactive_clinics}`, description: 'active vs inactive' },
        { key: 'plans', label: 'SUBSCRIPTION DISTRIBUTION', value: String(row.active_plans), description: 'active plans' },
        { key: 'approval-rate', label: 'APPLICATION APPROVAL RATE', value: `${totalRoleRequests ? Math.round((Number(row.approved_role_requests) / totalRoleRequests) * 100) : 0}%`, description: 'approved role requests' },
        { key: 'demo-trends', label: 'DEMO REQUEST TRENDS', value: String(row.open_demo_requests), description: 'open requests' },
        { key: 'staff-roles', label: 'STAFF ROLE DISTRIBUTION', value: String(row.total_users), description: 'provisioned users' },
      ],
      totals: {
        clinics: totalClinics,
        activeClinics: Number(row.active_clinics) || 0,
        inactiveClinics: Number(row.inactive_clinics) || 0,
        users: Number(row.total_users) || 0,
      },
    });
  } catch (e) {
    next(e);
  }
};