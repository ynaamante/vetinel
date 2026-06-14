const bcrypt = require('bcryptjs');
const db = require('../config/db');
const userModel = require('../models/userModel');

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
      const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', [role_name]);
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
    res.status(201).json(user);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'email already exists' });
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await userModel.getByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isValid = user.password_hash && await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: process.env.API_TOKEN || null,
    });
  } catch (e) {
    next(e);
  }
};
