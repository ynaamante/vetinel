const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
const db = require('./config/db');
const userModel = require('./models/userModel');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const bodyPreview = ['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length
      ? ` body=${JSON.stringify(req.body)}`
      : '';
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms${bodyPreview}`);
  });
  next();
});
// Simple CORS allowing local frontends to connect. Replace with stricter policy in production.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
    return res.sendStatus(204);
  }
  next();
});

async function runMigrations() {
  const schemaPath = path.join(__dirname, 'models', 'schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');
  if (!sql.trim()) return;
  await db.query(sql);
}

async function runOptionalRoleNormalizer() {
  try {
    if (process.env.RUN_ROLE_NORMALIZER === 'true') {
      console.log('RUN_ROLE_NORMALIZER enabled — running role normalization script');
      const { execSync } = require('child_process');
      execSync('node ./scripts/normalize_roles.js', { stdio: 'inherit' });
      console.log('Role normalization completed');
    }
  } catch (e) {
    console.error('Role normalizer failed', e);
    throw e;
  }
}

async function ensureClinicOwnerColumn() {
  const result = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'clinics' AND column_name = 'owner'
  `);

  if (result.rows.length === 0) {
    await db.query('ALTER TABLE clinics ADD COLUMN owner TEXT');
    console.log('Added missing clinics.owner column');
  }
}

async function ensureRolesSchema() {
  const result = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'roles' AND column_name = 'is_system_role'
  `);

  if (result.rows.length === 0) {
    await db.query('ALTER TABLE roles ADD COLUMN is_system_role BOOLEAN DEFAULT false');
    console.log('Added missing roles.is_system_role column');
    
    // Mark system roles
    await db.query(`
      UPDATE roles SET is_system_role = true 
      WHERE name IN ('clinic_owner', 'doctor', 'receptionist')
    `);
  }

  const duplicateRoleCheck = await db.query(`
    SELECT lower(name) AS lower_name, COUNT(*)
    FROM roles
    GROUP BY lower(name)
    HAVING COUNT(*) > 1
  `);
  if (duplicateRoleCheck.rows.length === 0) {
    await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS roles_lower_name_unique ON roles (lower(name))`);
    console.log('Added unique index on lower(roles.name)');
  } else {
    console.log('Skipping lower(name) unique index until duplicate role rows are cleaned up.');
  }
}

async function ensureSettingsSchema() {
  const result = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'settings'
  `);

  const columns = result.rows.map((row) => row.column_name);

  if (!columns.includes('id')) {
    await db.query('ALTER TABLE settings ADD COLUMN id INTEGER');
    await db.query('CREATE SEQUENCE IF NOT EXISTS settings_id_seq');
    await db.query("SELECT setval('settings_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM settings), 0), 1), false)");
    await db.query("UPDATE settings SET id = nextval('settings_id_seq') WHERE id IS NULL");
    await db.query('ALTER SEQUENCE settings_id_seq OWNED BY settings.id');
    await db.query("ALTER TABLE settings ALTER COLUMN id SET DEFAULT nextval('settings_id_seq')");
    await db.query('ALTER TABLE settings ALTER COLUMN id SET NOT NULL');
  }

  if (!columns.includes('clinic_id')) {
    await db.query('ALTER TABLE settings ADD COLUMN clinic_id INTEGER');
  }

  if (!columns.includes('updated_at')) {
    await db.query('ALTER TABLE settings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now()');
  }

  const pk = await db.query(`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'settings' AND constraint_type = 'PRIMARY KEY'
  `);
  if (pk.rows.length === 0) {
    await db.query('ALTER TABLE settings ADD PRIMARY KEY (id)');
  }

  const fk = await db.query(`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'settings' AND constraint_type = 'FOREIGN KEY'
  `);
  if (fk.rows.every((row) => row.constraint_name !== 'settings_clinic_id_fkey')) {
    await db.query('ALTER TABLE settings ADD CONSTRAINT settings_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE');
  }

  const uniqueConstraint = await db.query(`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'settings' AND constraint_type = 'UNIQUE'
  `);
  if (uniqueConstraint.rows.every((row) => row.constraint_name !== 'settings_clinic_key_unique')) {
    try {
      await db.query('ALTER TABLE settings ADD CONSTRAINT settings_clinic_key_unique UNIQUE (clinic_id, key)');
    } catch (e) {
      if (e.code !== '23505') throw e;
    }
  }
}

async function ensureAnnouncementSchema() {
  const result = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'system_announcements'
  `);

  const columns = result.rows.map((row) => row.column_name);

  if (!columns.includes('target_audience')) {
    await db.query('ALTER TABLE system_announcements ADD COLUMN target_audience TEXT DEFAULT \'All\'');
  }

  if (!columns.includes('created_by')) {
    await db.query('ALTER TABLE system_announcements ADD COLUMN created_by INTEGER');
  }
}

async function ensureAuditSchema() {
  const result = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'audit_trail'
  `);

  const columns = result.rows.map((r) => r.column_name);
  if (!columns.includes('archived')) {
    await db.query("ALTER TABLE audit_trail ADD COLUMN archived BOOLEAN DEFAULT false");
    console.log('Added audit_trail.archived column');
  }
}

async function ensureClinicsSchema() {
  const result = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'clinics'
  `);

  const columns = result.rows.map((r) => r.column_name);
  if (!columns.includes('archived')) {
    await db.query("ALTER TABLE clinics ADD COLUMN archived BOOLEAN DEFAULT false");
    console.log('Added clinics.archived column');
  }
}

async function seedSuperAdmin() {
  const adminEmail = process.env.SUPERADMIN_EMAIL;
  const adminPassword = process.env.SUPERADMIN_PASSWORD;
  const adminName = process.env.SUPERADMIN_NAME || 'Super Admin';

  if (!adminEmail || !adminPassword) {
    console.warn('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are required to seed the superadmin account. Skipping seeding.');
    return;
  }

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
  if (existing.rows.length === 0) {
    await userModel.create({ name: adminName, email: adminEmail, password: adminPassword });
    console.log(`Created superadmin account: ${adminEmail}`);
  } else {
    console.log(`Superadmin account already exists: ${adminEmail}`);
  }
}

app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 3000;
(async () => {
  try {
    await runMigrations();
    await ensureClinicOwnerColumn();
    await ensureRolesSchema();
    await ensureSettingsSchema();
    await ensureAnnouncementSchema();
    await ensureAuditSchema();
    await ensureClinicsSchema();
    // Optionally run a one-time normalizer to dedupe roles if explicitly requested via env var.
    await runOptionalRoleNormalizer();
    await seedSuperAdmin();
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (e) {
    console.error('Failed to start server', e);
    process.exit(1);
  }
})();
