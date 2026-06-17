const db = require('../config/db');

const normalizeClinicId = (value) => {
  if (value === undefined || value === null) return null;
  const clinicId = parseInt(value, 10);
  return Number.isNaN(clinicId) ? null : clinicId;
};

const getClinicIdFromRequest = (req) => {
  const explicitClinicId = normalizeClinicId(req.query.clinic_id);
  const userClinicId = normalizeClinicId(req.user && req.user.clinic_id);

  if (explicitClinicId) {
    if (req.user && req.user.role === 'super_admin') return explicitClinicId;
    if (userClinicId && explicitClinicId === userClinicId) return explicitClinicId;
  }

  return userClinicId;
};

const requireClinicId = (req, res) => {
  const clinicId = getClinicIdFromRequest(req);
  if (!clinicId) {
    res.status(400).json({ error: 'Clinic id required for this resource' });
    return null;
  }
  return clinicId;
};

exports.listClients = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;

    const result = await db.query(
      `SELECT c.id,
              c.name,
              c.email,
              c.phone,
              c.address,
              COALESCE((SELECT COUNT(*) FROM pets p WHERE p.client_id = c.id), 0) AS pets,
              c.created_at,
              c.updated_at
       FROM clients c
       WHERE c.clinic_id = $1
       ORDER BY c.name ASC`,
      [clinicId]
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.listPets = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;

    const result = await db.query(
      `SELECT p.id,
              p.name,
              p.species,
              p.breed,
              p.sex,
              p.birth_date,
              p.color,
              p.microchip,
              p.notes,
              p.client_id,
              c.name AS owner,
              p.created_at,
              p.updated_at
       FROM pets p
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE p.clinic_id = $1
       ORDER BY p.name ASC`,
      [clinicId]
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.listAppointments = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;

    const result = await db.query(
      `SELECT a.id,
              a.status,
              a.start_time,
              a.end_time,
              a.reason,
              a.notes,
              p.name AS pet,
              c.name AS owner,
              u.name AS practitioner,
              a.created_at,
              a.updated_at
       FROM appointments a
       LEFT JOIN pets p ON a.pet_id = p.id
       LEFT JOIN clients c ON a.client_id = c.id
       LEFT JOIN users u ON a.practitioner_id = u.id
       WHERE a.clinic_id = $1
       ORDER BY a.start_time DESC`,
      [clinicId]
    );

    res.json(result.rows.map((row) => ({
      ...row,
      notes: row.notes ? (typeof row.notes === 'string' ? row.notes : JSON.stringify(row.notes)) : '',
    })));
  } catch (e) {
    next(e);
  }
};

exports.listVaccinations = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;

    const result = await db.query(
      `SELECT v.id,
              v.vaccine_name,
              v.date_given,
              v.next_due,
              v.batch_number,
              v.notes,
              p.name AS pet,
              u.name AS administered_by,
              v.created_at
       FROM vaccinations v
       LEFT JOIN pets p ON v.pet_id = p.id
       LEFT JOIN users u ON v.administered_by = u.id
       WHERE v.clinic_id = $1
       ORDER BY v.date_given DESC`,
      [clinicId]
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.listPrescriptions = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;

    const result = await db.query(
      `SELECT pr.id,
              pr.medication,
              pr.dosage,
              pr.quantity,
              pr.instructions,
              pr.status,
              pr.issued_at,
              p.name AS pet,
              u.name AS issued_by
       FROM prescriptions pr
       LEFT JOIN pets p ON pr.pet_id = p.id
       LEFT JOIN users u ON pr.issued_by = u.id
       WHERE pr.clinic_id = $1
       ORDER BY pr.issued_at DESC`,
      [clinicId]
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.listPatientQueue = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;

    const result = await db.query(
      `SELECT q.id,
              q.position,
              q.status,
              q.checkin_at,
              q.updated_at,
              a.start_time AS appointment_start,
              p.name AS pet,
              c.name AS owner,
              u.name AS practitioner
       FROM patient_queue q
       LEFT JOIN appointments a ON q.appointment_id = a.id
       LEFT JOIN pets p ON q.pet_id = p.id
       LEFT JOIN clients c ON q.client_id = c.id
       LEFT JOIN users u ON a.practitioner_id = u.id
       WHERE q.clinic_id = $1
       ORDER BY q.position ASC`,
      [clinicId]
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.listInvoices = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;

    const result = await db.query(
      `SELECT i.id,
              i.status,
              i.currency,
              i.subtotal,
              i.tax,
              i.total,
              i.issued_at,
              i.paid_at,
              i.appointment_id,
              c.name AS owner,
              p.name AS pet
       FROM invoices i
       LEFT JOIN clients c ON i.client_id = c.id
       LEFT JOIN appointments a ON i.appointment_id = a.id
       LEFT JOIN pets p ON a.pet_id = p.id
       WHERE i.clinic_id = $1
       ORDER BY i.issued_at DESC`,
      [clinicId]
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.listPayments = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;

    const result = await db.query(
      `SELECT pay.id,
              pay.invoice_id,
              pay.amount,
              pay.method,
              pay.reference,
              pay.paid_at,
              i.status AS invoice_status,
              c.name AS owner,
              p.name AS pet
       FROM payments pay
       LEFT JOIN invoices i ON pay.invoice_id = i.id
       LEFT JOIN appointments a ON i.appointment_id = a.id
       LEFT JOIN pets p ON a.pet_id = p.id
       LEFT JOIN clients c ON i.client_id = c.id
       WHERE pay.clinic_id = $1
       ORDER BY pay.paid_at DESC`,
      [clinicId]
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.listReminders = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;

    const result = await db.query(
      `SELECT r.id,
              r.type,
              r.channel,
              r.message,
              r.scheduled_at,
              r.sent_at,
              r.delivered,
              p.name AS pet,
              c.name AS owner,
              c.email,
              c.phone
       FROM reminders r
       LEFT JOIN pets p ON r.pet_id = p.id
       LEFT JOIN clients c ON r.client_id = c.id
       WHERE r.clinic_id = $1
       ORDER BY r.scheduled_at DESC`,
      [clinicId]
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};
