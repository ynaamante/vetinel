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
    await seedSuperAdmin();
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (e) {
    console.error('Failed to start server', e);
    process.exit(1);
  }
})();
