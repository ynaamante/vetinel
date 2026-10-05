const db = require('../config/db');
const audit = require('../utils/audit');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendOwnerCredentials } = require('../utils/mailer');

const serializeClinic = (row) => ({
  ...row,
  owner: row.owner,
  doctors: row.doctors || 0,
  receptionists: row.receptionists || 0,
  total_users: row.total_users || 0,
  totalStaff: row.total_users || 0,
  status: row.status || row.metadata?.status || 'active',
});

exports.list = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT c.id,
             c.name,
             c.owner,
             c.email,
             c.phone,
             c.address,
             c.timezone,
             c.metadata,
             c.created_at,
             c.updated_at,
             (SELECT COUNT(*) FROM users u WHERE u.clinic_id = c.id) AS total_users,
             (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE u.clinic_id = c.id AND lower(r.name) = 'doctor') AS doctors,
             (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE u.clinic_id = c.id AND lower(r.name) = 'receptionist') AS receptionists
      FROM clinics c
      WHERE COALESCE(c.archived, false) = false
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows.map(serializeClinic));
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT c.id, c.name, c.owner, c.email, c.phone, c.address, c.timezone, c.metadata, c.created_at, c.updated_at,
              (SELECT COUNT(*) FROM users u WHERE u.clinic_id = c.id) AS total_users,
              (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE u.clinic_id = c.id AND lower(r.name) = 'doctor') AS doctors,
              (SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE u.clinic_id = c.id AND lower(r.name) = 'receptionist') AS receptionists
       FROM clinics c WHERE c.id = $1 AND COALESCE(c.archived, false) = false`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Clinic not found' });
    res.json(serializeClinic(result.rows[0]));
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, owner, email, phone, address, timezone, status } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const metadata = status ? { status } : {};
    const result = await db.query(
      `INSERT INTO clinics (name, owner, email, phone, address, timezone, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, owner, email, phone, address, timezone, metadata, created_at, updated_at`,
      [name, owner, email, phone, address, timezone || 'UTC', metadata]
    );

    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    audit.logAudit({
      user_id: auditUserId,
      action: 'Created clinic',
      table_name: 'clinics',
      record_id: result.rows[0].id,
      new_data: result.rows[0],
      ip_address: req.ip || req.connection.remoteAddress,
    });

    res.status(201).json(serializeClinic(result.rows[0]));
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Clinic already exists' });
    next(e);
  }
};

exports.createApplication = async (req, res, next) => {
  try {
    const {
      name,
      clinicEmail,
      ownerName,
      ownerEmail,
      ownerPhone,
      phone,
      address,
      staffCount,
      requestedRoles,
      plan,
    } = req.body;

    if (!name || !clinicEmail || !ownerName || !ownerEmail || !phone || !address) {
      return res.status(400).json({ error: 'Clinic, owner, contact, and address information are required' });
    }

    const metadata = {
      status: 'pending',
      application: {
        clinicEmail,
        ownerName,
        ownerEmail,
        ownerPhone: ownerPhone || null,
        staffCount: staffCount || null,
        requestedRoles: Array.isArray(requestedRoles) ? requestedRoles : [],
        plan: plan || 'Starter',
      },
    };

    const result = await db.query(
      `INSERT INTO clinics (name, owner, email, phone, address, timezone, metadata)
       VALUES ($1, $2, $3, $4, $5, 'UTC', $6)
       RETURNING id, name, owner, email, phone, address, timezone, metadata, created_at, updated_at`,
      [name, ownerName, clinicEmail, phone, address, metadata]
    );

    res.status(201).json({ ...serializeClinic(result.rows[0]), message: 'Application submitted for review' });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'A clinic with this information already exists' });
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, owner, email, phone, address, timezone, status, temporaryPassword } = req.body;

    const before = await db.query('SELECT * FROM clinics WHERE id = $1', [id]);

    // A single owner email belongs to one clinic account. Prevent a second
    // clinic from being marked active without a usable owner login.
    if (status === 'active' && before.rows.length > 0) {
      const clinic = before.rows[0];
      const application = clinic.metadata?.application || {};
      const ownerEmail = application.ownerEmail || clinic.email;

      if (ownerEmail) {
        const existingUser = await db.query(
          'SELECT clinic_id FROM users WHERE lower(email) = lower($1)',
          [ownerEmail]
        );

        if (
          existingUser.rows.length > 0 &&
          Number(existingUser.rows[0].clinic_id) !== Number(id)
        ) {
          return res.status(409).json({
            error: 'The clinic owner email already belongs to another clinic account',
          });
        }
      }
    }

    let query = `UPDATE clinics
       SET name = COALESCE($1, name),
           owner = COALESCE($2, owner),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           timezone = COALESCE($6, timezone),
           updated_at = now()`;

    const params = [name, owner, email, phone, address, timezone];

    if (status !== undefined) {
      query += `, metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('status', $7::text)`;
      params.push(status);
    }

    query += ` WHERE id = $${params.length + 1}
       RETURNING id, name, owner, email, phone, address, timezone, metadata, created_at, updated_at`;

    params.push(id);

    const result = await db.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Clinic not found' });

    let ownerCredentials = null;

    if (status === 'active') {
      const clinic = result.rows[0];
      const application = clinic.metadata?.application || {};
      const ownerEmail = application.ownerEmail || clinic.email;
      const ownerName = application.ownerName || clinic.owner;

      if (ownerEmail && ownerName) {
        const roleResult = await db.query(
          "SELECT id FROM roles WHERE lower(name) IN ('clinic_owner', 'owner') ORDER BY CASE WHEN lower(name) = 'clinic_owner' THEN 0 ELSE 1 END LIMIT 1"
        );

        if (roleResult.rows.length > 0) {
          const existingUser = await db.query(
            'SELECT id FROM users WHERE lower(email) = lower($1)',
            [ownerEmail]
          );

          if (existingUser.rows.length === 0) {
            const generatedPassword = temporaryPassword || crypto.randomBytes(9).toString('base64url');
            const passwordHash = await bcrypt.hash(generatedPassword, 10);

            await db.query(
              `INSERT INTO users (clinic_id, role_id, name, email, password_hash, phone, is_active, must_change_password)
               VALUES ($1, $2, $3, $4, $5, $6, true, true)`,
              [
                clinic.id,
                roleResult.rows[0].id,
                ownerName,
                ownerEmail,
                passwordHash,
                application.ownerPhone || clinic.phone,
              ]
            );

            ownerCredentials = {
              email: ownerEmail,
              temporaryPassword: generatedPassword,
            };

            let delivery;
            try {
              delivery = await sendOwnerCredentials({
                email: ownerEmail,
                ownerName,
                clinicName: clinic.name,
                temporaryPassword: generatedPassword,
              });
            } catch (emailError) {
              console.error('Owner credential email failed', emailError);
              delivery = {
                sent: false,
                reason: 'Email delivery failed; configure SMTP and retry.',
              };
            }

            await db.query(
              'UPDATE users SET temporary_password_sent_at = CASE WHEN $1 THEN now() ELSE temporary_password_sent_at END WHERE lower(email) = lower($2)',
              [delivery.sent, ownerEmail]
            );

            ownerCredentials.emailSent = delivery.sent;
            if (!delivery.sent) ownerCredentials.emailDeliveryWarning = delivery.reason;
          }
        }
      }
    }

    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    audit.logAudit({
      user_id: auditUserId,
      action: 'Updated clinic',
      table_name: 'clinics',
      record_id: id,
      old_data: before.rows[0] || null,
      new_data: result.rows[0],
      ip_address: req.ip || req.connection.remoteAddress,
    });

    res.json({ ...serializeClinic(result.rows[0]), ownerCredentials });
  } catch (e) {
    next(e);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    if (Number.isNaN(numericId)) {
      return res.status(400).json({ error: 'invalid clinic id' });
    }

    const before = await db.query('SELECT * FROM clinics WHERE id = $1', [numericId]);
    const result = await db.query(
      'UPDATE clinics SET archived = true, updated_at = now() WHERE id = $1 RETURNING id',
      [numericId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Clinic not found' });

    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    audit.logAudit({
      user_id: auditUserId,
      action: 'Archived clinic',
      table_name: 'clinics',
      record_id: numericId,
      old_data: before.rows[0] || null,
      new_data: { ...before.rows[0], archived: true },
      ip_address: req.ip || req.connection.remoteAddress,
    });

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};

exports.getStaffByClinic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, status } = req.query;

    const conditions = ['u.clinic_id = $1'];
    const params = [id];

    if (role) {
      params.push(role);
      conditions.push(`r.name = $${params.length}`);
    }

    if (status) {
      const isActive = status.toLowerCase() === 'active';
      params.push(isActive);
      conditions.push(`u.is_active = $${params.length}`);
    }

    const result = await db.query(
      `SELECT u.id,
              u.name,
              u.email,
              u.is_active,
              u.updated_at,
              r.name AS role,
              u.clinic_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY u.name ASC`,
      params
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.logExport = async (req, res, next) => {
  try {
    const { format } = req.body;
    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;

    audit.logAudit({
      user_id: auditUserId,
      action: `Exported clinics to ${format || 'PDF'}`,
      table_name: 'clinics',
      record_id: null,
      new_data: { format: format || 'PDF', export_type: 'report' },
      ip_address: req.ip || req.connection.remoteAddress,
    });

    res.json({ success: true, message: 'Export logged' });
  } catch (e) {
    next(e);
  }
};