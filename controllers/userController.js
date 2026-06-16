const bcrypt = require('bcryptjs');
const db = require('../config/db');
const userModel = require('../models/userModel');
const audit = require('../utils/audit');

exports.list = async (req, res, next) => {
  try {
    const users = await userModel.getAll();
    res.json(users);
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, password, clinic_id, clinic_name, role_id, role_name } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password required' });
    }

    let resolvedClinicId = clinic_id;
    if (!resolvedClinicId) {
      if (!clinic_name) {
        return res.status(400).json({ error: 'clinic_id or clinic_name is required' });
      }
      const clinicResult = await db.query('SELECT id FROM clinics WHERE name = $1', [clinic_name]);
      if (clinicResult.rows.length === 0) {
        return res.status(400).json({ error: 'Clinic must be created first before assigning a role to the user' });
      }
      resolvedClinicId = clinicResult.rows[0].id;
    } else {
      const clinicResult = await db.query('SELECT id FROM clinics WHERE id = $1', [resolvedClinicId]);
      if (clinicResult.rows.length === 0) {
        return res.status(400).json({ error: 'Clinic not found. Create the clinic first before assigning a user to it.' });
      }
    }

    let resolvedRoleId = role_id;
    if (!resolvedRoleId) {
      if (!role_name) {
        return res.status(400).json({ error: 'role_id or role_name is required' });
      }
      const roleResult = await db.query('SELECT id FROM roles WHERE lower(name) = lower($1) LIMIT 1', [role_name]);
      if (roleResult.rows.length === 0) {
        return res.status(400).json({ error: 'Role does not exist. Please create the role before assigning it.' });
      }
      resolvedRoleId = roleResult.rows[0].id;
    } else {
      const roleResult = await db.query('SELECT id FROM roles WHERE id = $1', [resolvedRoleId]);
      if (roleResult.rows.length === 0) {
        return res.status(400).json({ error: 'Role not found. Create the role first before assigning it.' });
      }
    }

    const user = await userModel.create({
      name,
      email,
      password,
      clinic_id: resolvedClinicId,
      role_id: resolvedRoleId,
    });
    // log audit (fire-and-forget)
    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    audit.logAudit({
      user_id: auditUserId,
      action: 'Created user',
      table_name: 'users',
      record_id: user.id,
      new_data: user,
      ip_address: req.ip || req.connection.remoteAddress,
    });
    res.status(201).json(user);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'email already exists' });
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) return res.status(400).json({ error: 'invalid user id' });
    const { name, email, clinic_id, clinic_name, role_id, role_name, is_active, password } = req.body;

    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [numericId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    let resolvedClinicId = clinic_id;
    if (!resolvedClinicId && clinic_name) {
      const clinicResult = await db.query('SELECT id FROM clinics WHERE name = $1', [clinic_name]);
      if (clinicResult.rows.length === 0) {
        return res.status(400).json({ error: 'Clinic must be created first before assigning a role to the user' });
      }
      resolvedClinicId = clinicResult.rows[0].id;
    }

    let resolvedRoleId = role_id;
    if (!resolvedRoleId && role_name) {
      const roleResult = await db.query('SELECT id FROM roles WHERE lower(name) = lower($1) LIMIT 1', [role_name]);
      if (roleResult.rows.length === 0) {
        return res.status(400).json({ error: 'Role does not exist. Please create the role before assigning it.' });
      }
      resolvedRoleId = roleResult.rows[0].id;
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const result = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           clinic_id = COALESCE($3, clinic_id),
           role_id = COALESCE($4, role_id),
           is_active = COALESCE($5, is_active),
           password_hash = COALESCE($6, password_hash),
           updated_at = now()
       WHERE id = $7
       RETURNING id`,
      [name, email, resolvedClinicId, resolvedRoleId, is_active, passwordHash, numericId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await db.query(
      `SELECT u.id,
              u.name,
              u.email,
              u.is_active,
              u.created_at,
              u.updated_at,
              c.name AS clinic,
              r.name AS role
       FROM users u
       LEFT JOIN clinics c ON u.clinic_id = c.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [numericId]
    );

    // audit: record change
    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    audit.logAudit({
      user_id: auditUserId,
      action: 'Updated user',
      table_name: 'users',
      record_id: numericId,
      old_data: userResult.rows[0],
      new_data: updatedUser.rows[0],
      ip_address: req.ip || req.connection.remoteAddress,
    });

    res.json(updatedUser.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'email already exists' });
    next(e);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) return res.status(400).json({ error: 'invalid user id' });
    const before = await db.query('SELECT * FROM users WHERE id = $1', [numericId]);
    const result = await db.query(
      `UPDATE users
       SET is_active = false,
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('deleted_at', now()::text),
           updated_at = now()
       WHERE id = $1
       RETURNING id`,
      [numericId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    audit.logAudit({
      user_id: auditUserId,
      action: 'Soft deleted user',
      table_name: 'users',
      record_id: numericId,
      old_data: before.rows[0] || null,
      new_data: { is_active: false },
      ip_address: req.ip || req.connection.remoteAddress,
    });

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};

exports.restore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) return res.status(400).json({ error: 'invalid user id' });
    const before = await db.query('SELECT * FROM users WHERE id = $1', [numericId]);
    const result = await db.query(
      `UPDATE users
       SET is_active = true,
           metadata = coalesce(metadata, '{}'::jsonb) - 'deleted_at',
           updated_at = now()
       WHERE id = $1
       RETURNING id`,
      [numericId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await db.query(
      `SELECT u.id,
              u.name,
              u.email,
              u.is_active,
              u.created_at,
              u.updated_at,
              c.name AS clinic,
              r.name AS role
       FROM users u
       LEFT JOIN clinics c ON u.clinic_id = c.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [numericId]
    );

    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    audit.logAudit({
      user_id: auditUserId,
      action: 'Restored user',
      table_name: 'users',
      record_id: numericId,
      old_data: before.rows[0] || null,
      new_data: updatedUser.rows[0],
      ip_address: req.ip || req.connection.remoteAddress,
    });

    res.json(updatedUser.rows[0]);
  } catch (e) {
    next(e);
  }
};

exports.permanentDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) return res.status(400).json({ error: 'invalid user id' });
    const before = await db.query('SELECT * FROM users WHERE id = $1', [numericId]);
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [numericId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const auditUserId = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    audit.logAudit({
      user_id: auditUserId,
      action: 'Permanently deleted user',
      table_name: 'users',
      record_id: numericId,
      old_data: before.rows[0] || null,
      new_data: null,
      ip_address: req.ip || req.connection.remoteAddress,
    });

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};

const auth = require('../middleware/auth');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await userModel.getByEmail(email);
    if (!user || user.is_active === false) return res.status(401).json({ error: 'Invalid email or password' });

    const isValid = user.password_hash && await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = auth.signUserToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name || user.role,
      clinic_id: user.clinic_id,
      clinic_name: user.clinic_name,
      exp: Date.now() + 1000 * 60 * 60 * 24,
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name || user.role,
      clinic_id: user.clinic_id,
      clinic_name: user.clinic_name,
      token,
    });
  } catch (e) {
    next(e);
  }
};
