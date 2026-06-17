const express = require('express');
const router = express.Router();
const users = require('../controllers/userController');
const clinics = require('../controllers/clinicController');
const clinicRecords = require('../controllers/clinicRecordController');
const audit = require('../controllers/auditController');
const announcements = require('../controllers/announcementController');
const dashboard = require('../controllers/dashboardController');
const roles = require('../controllers/roleController');
const permissions = require('../controllers/permissionController');
const settings = require('../controllers/settingsController');
const auth = require('../middleware/auth');

// Auth endpoints
router.post('/login', users.login);
router.get('/me', auth.required, users.me);

// User endpoints
router.get('/users', auth.optional, users.list);
router.post('/users', users.create);
router.put('/users/:id', auth.required, users.update);
router.delete('/users/:id', auth.required, users.delete);
router.put('/users/:id/restore', auth.required, users.restore);
router.delete('/users/:id/permanent', auth.required, users.permanentDelete);

// Clinic endpoints
router.get('/clinics', auth.optional, clinics.list);
router.get('/clinics/:id', auth.optional, clinics.getById);
router.get('/clinics/:id/staff', auth.optional, clinics.getStaffByClinic);
router.post('/clinics', auth.required, clinics.create);
router.put('/clinics/:id', auth.required, clinics.update);
router.delete('/clinics/:id', auth.required, auth.superAdmin, clinics.delete);
router.post('/clinics/export/log', auth.required, clinics.logExport);

// Clinic records endpoints
router.get('/clinic-records/clients', auth.required, clinicRecords.listClients);
router.get('/clinic-records/pets', auth.required, clinicRecords.listPets);
router.get('/clinic-records/appointments', auth.required, clinicRecords.listAppointments);
router.get('/clinic-records/patient-queue', auth.required, clinicRecords.listPatientQueue);
router.get('/clinic-records/invoices', auth.required, clinicRecords.listInvoices);
router.get('/clinic-records/payments', auth.required, clinicRecords.listPayments);
router.get('/clinic-records/reminders', auth.required, clinicRecords.listReminders);
router.get('/clinic-records/vaccinations', auth.required, clinicRecords.listVaccinations);
router.get('/clinic-records/treatments', auth.required, clinicRecords.listPrescriptions);

// Audit Trail endpoints
router.get('/audit-trail', auth.optional, audit.list);
router.get('/audit-trail/filter', auth.optional, audit.getByFilter);
router.post('/audit-trail', auth.required, audit.create);

// Announcements endpoints
router.get('/announcements', auth.optional, announcements.list);
router.post('/announcements', auth.required, announcements.create);
router.put('/announcements/:id', auth.required, announcements.update);
router.delete('/announcements/:id', auth.required, announcements.delete);

// Dashboard endpoints
router.get('/dashboard/stats', auth.optional, dashboard.getDashboardStats);
router.get('/dashboard/activity', auth.optional, dashboard.getRecentActivity);
router.delete('/dashboard/activity', auth.required, auth.superAdmin, dashboard.clearRecentActivity);
router.get('/dashboard/roles', auth.optional, dashboard.getRoleBreakdown);

// Roles endpoints
router.get('/roles', auth.optional, roles.list);
router.get('/roles/:id', auth.optional, roles.getById);
router.post('/roles', auth.required, roles.create);
router.put('/roles/:id', auth.required, roles.update);
router.delete('/roles/:id', auth.required, roles.delete);

// Permissions endpoints
router.get('/permissions', auth.optional, permissions.list);
router.get('/permissions/:id', auth.optional, permissions.getById);
router.post('/permissions', auth.required, permissions.create);
router.put('/permissions/:id', auth.required, permissions.update);
router.delete('/permissions/:id', auth.required, permissions.delete);

// Role permissions mapping
router.get('/role-permissions', auth.optional, permissions.listRolePermissions);
router.post('/role-permissions', auth.required, permissions.createRolePermission);
router.delete('/role-permissions/:id', auth.required, permissions.deleteRolePermission);

// Settings endpoints
router.get('/settings', auth.optional, settings.list);
router.get('/settings/:id', auth.optional, settings.getById);
router.post('/settings', auth.required, settings.create);
router.put('/settings/:id', auth.required, settings.update);
router.delete('/settings/:id', auth.required, settings.delete);

module.exports = router;
