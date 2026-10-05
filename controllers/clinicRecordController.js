const db = require('../config/db');
const dns = require('dns').promises;
const crypto = require('crypto');
const { validateOwnerFields, validateClinicalDates, validateOverrideReason } = require('../validation');
const { logAudit } = require('../utils/audit');

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
              COALESCE((c.metadata->>'archived')::boolean, false) AS archived,
              COALESCE((SELECT COUNT(*) FROM pets p WHERE p.client_id = c.id), 0) AS pets,
              COALESCE((SELECT json_agg(p.name ORDER BY p.name) FROM pets p WHERE p.client_id = c.id), '[]'::json) AS pet_names,
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

exports.createClient = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;

    const { errors, normalized } = validateOwnerFields(req.body);
    const { name, email, phone } = normalized;
    const address = String(req.body.address || '').trim();

    if (Object.keys(errors).length) return res.status(422).json({ error: 'Validation failed', fields: errors });

    const emailDomain = email.split('@')[1];
    let emailDomainVerified = false;
    try {
      emailDomainVerified = (await dns.resolveMx(emailDomain)).length > 0;
    } catch {
      // DNS availability is not a reliable reason to block local clinic records.
      emailDomainVerified = false;
    }

    const duplicate = await db.query(
      `SELECT id, name, email, phone
       FROM clients
       WHERE clinic_id = $1
         AND (
           LOWER(TRIM(email)) = LOWER($2)
           OR right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = right($3, 10)
         )
       LIMIT 1`,
      [clinicId, email, phone]
    );
    if (duplicate.rows.length) {
      const existing = duplicate.rows[0];
      const sameEmail = String(existing.email || '').trim().toLowerCase() === email;
      return res.status(409).json({
        error: sameEmail
          ? 'This email address is already registered to another owner.'
          : 'This contact number is already registered to another owner.',
        fields: { [sameEmail ? 'email' : 'phone']: sameEmail ? 'Use a different email address.' : 'Use a different contact number.' },
      });
    }

    const result = await db.query(
      `INSERT INTO clients (clinic_id, name, email, phone, address, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, clinic_id, name, email, phone, address, metadata, created_at, updated_at`,
      [clinicId, name, email, phone, address || null, JSON.stringify({
        verification: {
          email_domain_verified: emailDomainVerified,
          phone_verified: false,
          status: 'pending_phone_verification',
        },
      })]
    );
    const client = { ...result.rows[0], pets: 0, archived: false };

    await logAudit({
      user_id: req.user && req.user.id ? req.user.id : null,
      role: req.user && req.user.role,
      action: 'create',
      table_name: 'clients',
      record_id: client.id,
      new_data: client,
      reason: 'Owner record created.',
      ip_address: req.ip || req.connection.remoteAddress,
    });

    res.status(201).json(client);
  } catch (e) {
    next(e);
  }
};

exports.archiveClient = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const clientId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(clientId)) return res.status(400).json({ error: 'Invalid owner ID.' });

    const current = await db.query(
      `SELECT id, clinic_id, name, email, phone, address, metadata
       FROM clients WHERE id = $1 AND clinic_id = $2`,
      [clientId, clinicId]
    );
    if (!current.rows.length) return res.status(404).json({ error: 'Owner not found.' });

    const existing = current.rows[0];
    const archived = req.body.archived === true;
    const metadata = { ...(existing.metadata || {}), archived };
    const result = await db.query(
      `UPDATE clients SET metadata = $1, updated_at = now()
       WHERE id = $2 AND clinic_id = $3
       RETURNING id, clinic_id, name, email, phone, address, metadata, updated_at`,
      [JSON.stringify(metadata), clientId, clinicId]
    );
    const client = {
      ...result.rows[0],
      archived,
      pets: Number((await db.query('SELECT COUNT(*) FROM pets WHERE client_id = $1', [clientId])).rows[0].count),
    };

    await db.query(
      `INSERT INTO audit_trail (user_id, action, table_name, record_id, old_data, new_data, ip_address)
       VALUES ($1, $2, 'clients', $3, $4, $5, $6)`,
      [req.user && req.user.id ? req.user.id : null, archived ? 'archive' : 'restore', clientId, JSON.stringify(existing), JSON.stringify(client), req.ip || req.connection.remoteAddress]
    );

    res.json(client);
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
              p.metadata->>'age' AS age,
              p.metadata->>'weight' AS weight,
              p.metadata->>'weight_target' AS weight_target,
              COALESCE(p.metadata->>'allergies', 'Not recorded') AS allergies,
              COALESCE((p.metadata->>'archived')::boolean, false) AS archived,
              profile_photo.url AS photo_url,
              p.client_id,
              c.name AS owner,
              p.created_at,
              p.updated_at
       FROM pets p
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN LATERAL (
         SELECT a.url
         FROM attachments a
         WHERE a.clinic_id = p.clinic_id
           AND a.owner_table = 'pets'
           AND a.owner_id = p.id
           AND a.metadata->>'source' = 'pet_profile_photo'
         ORDER BY a.uploaded_at DESC, a.id DESC
         LIMIT 1
       ) profile_photo ON true
       WHERE p.clinic_id = $1
       ORDER BY p.name ASC`,
      [clinicId]
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
};

exports.uploadPetPhoto = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const petId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(petId) || petId < 1) return res.status(400).json({ error: 'Invalid pet ID.' });

    const petResult = await db.query(
      'SELECT id FROM pets WHERE id = $1 AND clinic_id = $2',
      [petId, clinicId]
    );
    if (!petResult.rows.length) return res.status(404).json({ error: 'Pet not found.' });

    const filename = String(req.body.filename || '').trim().slice(0, 255);
    const contentType = String(req.body.content_type || '').trim().toLowerCase();
    const data = String(req.body.data || '');
    const prefix = `data:${contentType};base64,`;
    if (!filename || !['image/jpeg', 'image/png', 'image/webp'].includes(contentType) || !data.startsWith(prefix)) {
      return res.status(422).json({ error: 'Choose a valid JPEG, PNG, or WEBP pet photo.' });
    }
    const encoded = data.slice(prefix.length);
    if (!encoded || encoded.length > 1_400_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
      return res.status(413).json({ error: 'Pet photos must be smaller than 1 MB.' });
    }
    const imageBytes = Buffer.from(encoded, 'base64');
    if (!imageBytes.length || imageBytes.length > 1_048_576) {
      return res.status(413).json({ error: 'Pet photos must be smaller than 1 MB.' });
    }

    const existing = await db.query(
      `SELECT id
       FROM attachments
       WHERE clinic_id = $1 AND owner_table = 'pets' AND owner_id = $2
         AND metadata->>'source' = 'pet_profile_photo'
       ORDER BY uploaded_at DESC, id DESC
       LIMIT 1`,
      [clinicId, petId]
    );
    const metadata = JSON.stringify({ source: 'pet_profile_photo', uploaded_by: req.user.id });
    const saved = existing.rows.length
      ? await db.query(
          `UPDATE attachments
           SET filename = $1, content_type = $2, url = $3, metadata = $4::jsonb, uploaded_at = now()
           WHERE id = $5 AND clinic_id = $6
           RETURNING id, filename, content_type, url, uploaded_at`,
          [filename, contentType, data, metadata, existing.rows[0].id, clinicId]
        )
      : await db.query(
          `INSERT INTO attachments (clinic_id, owner_table, owner_id, filename, content_type, url, metadata)
           VALUES ($1, 'pets', $2, $3, $4, $5, $6::jsonb)
           RETURNING id, filename, content_type, url, uploaded_at`,
          [clinicId, petId, filename, contentType, data, metadata]
        );

    await logAudit({
      user_id: req.user.id,
      role: req.user.role,
      action: 'upload_profile_photo',
      table_name: 'pets',
      record_id: petId,
      reason: 'Pet profile photo uploaded.',
      ip_address: req.ip || req.connection.remoteAddress,
    });
    return res.status(201).json({ photo_url: saved.rows[0].url });
  } catch (error) {
    return next(error);
  }
};

exports.createPet = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const name = String(req.body.name || '').trim();
    const species = String(req.body.species || '').trim();
    const breed = String(req.body.breed || '').trim();
    const notes = String(req.body.notes || '').trim();
    const age = String(req.body.age || '').trim();
    const allergies = String(req.body.allergies || '').trim();
    const sex = ['male', 'female'].includes(String(req.body.sex || '').toLowerCase()) ? String(req.body.sex).toLowerCase() : 'unknown';
    const birthDate = String(req.body.birth_date || '').trim() || null;
    const color = String(req.body.color || '').trim();
    const microchip = String(req.body.microchip || '').trim();
    const weight = String(req.body.weight || '').trim();
    const clientId = Number.parseInt(req.body.client_id, 10);
    const errors = {};
    if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(name)) errors.name = 'Enter a valid pet name.';
    if (!species) errors.species = 'Select a species.';
    if (!breed || breed.length > 80) errors.breed = 'Enter a valid breed.';
    if (!Number.isInteger(clientId)) errors.client_id = 'Select a registered owner.';
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) errors.birth_date = 'Enter a valid date of birth.';
    if (weight && (!Number.isFinite(Number(weight)) || Number(weight) <= 0)) errors.weight = 'Enter a valid weight.';
    if (Object.keys(errors).length) return res.status(422).json({ error: 'Validation failed', fields: errors });

    const owner = await db.query('SELECT id FROM clients WHERE id = $1 AND clinic_id = $2', [clientId, clinicId]);
    if (!owner.rows.length) return res.status(422).json({ error: 'Selected owner is not registered at this clinic.' });

    const result = await db.query(
      `INSERT INTO pets (clinic_id, client_id, name, species, breed, sex, birth_date, color, microchip, notes, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::sex_type, $7, NULLIF($8, ''), NULLIF($9, ''), NULLIF($10, ''),
         jsonb_build_object('allergies', NULLIF($11, ''), 'age', NULLIF($12, ''), 'weight', NULLIF($13, '')::numeric))
       RETURNING id, clinic_id, client_id, name, species, breed, sex, birth_date, color, microchip, notes, metadata, created_at, updated_at`,
      [clinicId, clientId, name, species, breed, sex, birthDate, color, microchip, notes, allergies, age, weight]
    );
    const pet = { ...result.rows[0], archived: false };
    await logAudit({
      user_id: req.user && req.user.id ? req.user.id : null,
      role: req.user && req.user.role,
      action: 'create',
      table_name: 'pets',
      record_id: pet.id,
      new_data: pet,
      reason: 'Patient record created.',
      ip_address: req.ip || req.connection.remoteAddress,
    });
    res.status(201).json(pet);
  } catch (e) {
    next(e);
  }
};

exports.updatePet = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const petId = Number.parseInt(req.params.id, 10);
    const clientId = Number.parseInt(req.body.client_id, 10);
    if (!Number.isInteger(petId)) return res.status(400).json({ error: 'Invalid pet ID.' });
    const current = await db.query('SELECT * FROM pets WHERE id = $1 AND clinic_id = $2', [petId, clinicId]);
    if (!current.rows.length) return res.status(404).json({ error: 'Pet not found.' });
    const existing = current.rows[0];
    const isTransfer = Number.isInteger(clientId) && clientId !== Number(existing.client_id);
    if (isTransfer || req.body.client_id != null) {
      if (!Number.isInteger(clientId)) return res.status(400).json({ error: 'Invalid owner ID.' });
      const owner = await db.query('SELECT id FROM clients WHERE id = $1 AND clinic_id = $2', [clientId, clinicId]);
      if (!owner.rows.length) return res.status(422).json({ error: 'Selected owner is not registered at this clinic.' });
    }
    const name = String(req.body.name ?? existing.name).trim();
    const species = String(req.body.species ?? existing.species ?? '').trim();
    const breed = String(req.body.breed ?? existing.breed ?? '').trim();
    const sexValue = String(req.body.sex ?? existing.sex ?? 'unknown').toLowerCase();
    const birthDate = req.body.birth_date === undefined ? existing.birth_date : (String(req.body.birth_date || '').trim() || null);
    const color = String(req.body.color ?? existing.color ?? '').trim();
    const microchip = String(req.body.microchip ?? existing.microchip ?? '').trim();
    const notes = String(req.body.notes ?? existing.notes ?? '').trim();
    if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(name)) return res.status(422).json({ error: 'Enter a valid pet name.' });
    if (!species) return res.status(422).json({ error: 'Select a species.' });
    if (!breed || breed.length > 80) return res.status(422).json({ error: 'Enter a valid breed.' });
    if (!['male', 'female', 'unknown'].includes(sexValue)) return res.status(422).json({ error: 'Select a valid gender.' });
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(birthDate).slice(0, 10))) return res.status(422).json({ error: 'Enter a valid date of birth.' });
    const previousMetadata = existing.metadata || {};
    const metadata = {
      ...previousMetadata,
      age: String(req.body.age ?? previousMetadata.age ?? ''),
      allergies: String(req.body.allergies ?? previousMetadata.allergies ?? ''),
      weight: req.body.weight === undefined ? previousMetadata.weight : String(req.body.weight || ''),
      weight_target: req.body.weight_target === undefined ? previousMetadata.weight_target : String(req.body.weight_target || ''),
      archived: req.body.archived === undefined ? previousMetadata.archived : req.body.archived === true,
    };
    if (metadata.weight && (!Number.isFinite(Number(metadata.weight)) || Number(metadata.weight) <= 0)) return res.status(422).json({ error: 'Enter a valid weight.' });
    const result = await db.query(
      `UPDATE pets SET client_id = $1, name = $2, species = $3, breed = $4, sex = $5::sex_type,
         birth_date = $6, color = NULLIF($7, ''), microchip = NULLIF($8, ''), notes = NULLIF($9, ''),
         metadata = $10::jsonb, updated_at = now()
      WHERE id = $11 AND clinic_id = $12
       RETURNING id, clinic_id, client_id, name, species, breed, sex, birth_date, color, microchip, notes, metadata, updated_at`,
      [Number.isInteger(clientId) ? clientId : existing.client_id, name, species, breed, sexValue, birthDate, color, microchip, notes, JSON.stringify(metadata), petId, clinicId]
    );
    const pet = result.rows[0];
    await db.query(
      `INSERT INTO audit_trail (user_id, action, table_name, record_id, old_data, new_data, ip_address)
      VALUES ($1, $2, 'pets', $3, $4, $5, $6)`,
      [req.user && req.user.id ? req.user.id : null, isTransfer ? 'transfer' : 'update', petId, JSON.stringify(existing), JSON.stringify(pet), req.ip || req.connection.remoteAddress]
    );
    res.json(pet);
  } catch (e) {
    next(e);
  }
};

exports.archivePet = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const petId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(petId)) return res.status(400).json({ error: 'Invalid pet ID.' });
    const current = await db.query('SELECT * FROM pets WHERE id = $1 AND clinic_id = $2', [petId, clinicId]);
    if (!current.rows.length) return res.status(404).json({ error: 'Pet not found.' });
    const archived = req.body.archived === true;
    const metadata = { ...(current.rows[0].metadata || {}), archived };
    const result = await db.query(
      `UPDATE pets SET metadata = $1, updated_at = now()
       WHERE id = $2 AND clinic_id = $3
       RETURNING id, clinic_id, client_id, name, species, breed, notes, metadata, updated_at`,
      [JSON.stringify(metadata), petId, clinicId]
    );
    const pet = { ...result.rows[0], archived };
    await logAudit({
      user_id: req.user && req.user.id ? req.user.id : null,
      role: req.user && req.user.role,
      action: archived ? 'archive' : 'restore',
      table_name: 'pets',
      record_id: petId,
      old_data: current.rows[0],
      new_data: pet,
      reason: String(req.body.reason || '').trim() || 'Pet record status updated.',
      ip_address: req.ip || req.connection.remoteAddress,
    });
    res.json(pet);
  } catch (e) {
    next(e);
  }
};

const archiveClinicRecord = async (req, res, next, tableName, recordLabel) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const recordId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(recordId)) return res.status(400).json({ error: `Invalid ${recordLabel} ID.` });
    const archived = req.body.archived === true;
    const reason = String(req.body.reason || '').trim();

    const current = await db.query(
      `SELECT * FROM ${tableName} WHERE id = $1 AND clinic_id = $2`,
      [recordId, clinicId]
    );
    if (!current.rows.length) return res.status(404).json({ error: `${recordLabel} not found.` });

    const result = await db.query(
      `UPDATE ${tableName}
       SET archived = $1
       WHERE id = $2 AND clinic_id = $3
       RETURNING *`,
      [archived, recordId, clinicId]
    );
    const record = { ...result.rows[0], archived };

    await logAudit({
      user_id: req.user && req.user.id ? req.user.id : null,
      role: req.user && req.user.role,
      action: archived ? 'archive' : 'restore',
      table_name: tableName,
      record_id: recordId,
      old_data: current.rows[0],
      new_data: record,
      reason: reason || 'Record restored.',
      ip_address: req.ip || req.connection.remoteAddress,
    });

    res.json(record);
  } catch (e) {
    next(e);
  }
};

exports.archiveAppointment = (req, res, next) => archiveClinicRecord(req, res, next, 'appointments', 'appointment');
exports.archiveVaccination = (req, res, next) => archiveClinicRecord(req, res, next, 'vaccinations', 'vaccination');
exports.archiveTreatment = (req, res, next) => archiveClinicRecord(req, res, next, 'prescriptions', 'treatment');

exports.finalizeTreatment = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const treatmentId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(treatmentId)) return res.status(400).json({ error: 'Invalid treatment ID.' });
    if (!['doctor', 'clinic_owner', 'super_admin'].includes(String(req.user.role || '').toLowerCase())) {
      return res.status(403).json({ error: 'Only an authorized clinical user can finalize treatment records.' });
    }

    const currentResult = await db.query(
      `SELECT pr.*, p.name AS pet, c.name AS owner, u.name AS issued_by
       FROM prescriptions pr
       LEFT JOIN pets p ON p.id = pr.pet_id
       LEFT JOIN clients c ON c.id = p.client_id
       LEFT JOIN users u ON u.id = pr.issued_by
       WHERE pr.id=$1 AND pr.clinic_id=$2`,
      [treatmentId, clinicId]
    );
    if (!currentResult.rows.length) return res.status(404).json({ error: 'Treatment not found.' });
    const current = currentResult.rows[0];
    if (current.status === 'finalized') return res.json(current);
    if (current.archived) return res.status(409).json({ error: 'Archived treatment records cannot be finalized.' });

    const activeDuplicate = await db.query(
      `SELECT id, medication, dosage, status
       FROM prescriptions
       WHERE clinic_id=$1 AND pet_id=$2 AND id<>$3
         AND LOWER(COALESCE(medication, ''))=LOWER(COALESCE($4, ''))
         AND status IN ('active', 'finalized') AND archived=false`,
      [clinicId, current.pet_id, treatmentId, current.medication]
    );
    if (activeDuplicate.rows.length && !String(req.body.override_reason || '').trim()) {
      return res.status(409).json({
        error: 'Potential duplicate active medication detected.',
        code: 'POTENTIAL_DUPLICATE_MEDICATION',
        potential_duplicates: activeDuplicate.rows,
        requires_override_reason: true,
      });
    }
    const overrideReason = String(req.body.override_reason || '').trim();
    if (activeDuplicate.rows.length && overrideReason.length < 15) {
      return res.status(422).json({ error: 'A clinical reason of at least 15 characters is required for this medication override.' });
    }

    const result = await db.query(
      `UPDATE prescriptions SET status='finalized', metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb
       WHERE id=$2 AND clinic_id=$3
       RETURNING *`,
      [JSON.stringify({ finalized_by: req.user.id, finalized_at: new Date().toISOString(), override_reason: overrideReason || null }), treatmentId, clinicId]
    );
    const saved = { ...result.rows[0], pet: current.pet, owner: current.owner, issued_by: current.issued_by };
    await logAudit({
      user_id: req.user.id,
      role: req.user.role,
      action: 'finalize',
      table_name: 'prescriptions',
      record_id: treatmentId,
      old_data: current,
      new_data: saved,
      reason: overrideReason || 'Treatment record finalized.',
      ip_address: req.ip || req.connection.remoteAddress,
    });
    return res.json(saved);
  } catch (e) {
    return next(e);
  }
};

exports.listAppointments = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;

    const result = await db.query(
      `SELECT a.id,
              a.pet_id,
              CASE
                WHEN LOWER(COALESCE(q.status, '')) = 'waiting' THEN 'checked_in'
                WHEN LOWER(COALESCE(q.status, '')) IN ('in-consultation', 'in_consultation') THEN 'in_consultation'
                ELSE a.status
              END AS status,
              a.start_time,
              a.end_time,
              a.reason,
              a.notes,
              a.parent_appointment_id,
              a.workflow_type,
              a.workflow_reason,
              a.original_start_time,
              COALESCE(a.archived, false) AS archived,
              p.name AS pet,
              COALESCE(p.metadata->>'allergies', 'Not recorded') AS known_allergies,
              c.name AS owner,
              u.name AS practitioner,
              related.id AS related_appointment_id,
              related.start_time AS related_start_time,
              related.end_time AS related_end_time,
              related.status AS related_status,
              a.created_at,
              a.updated_at
       FROM appointments a
       LEFT JOIN pets p ON a.pet_id = p.id
       LEFT JOIN clients c ON a.client_id = c.id
       LEFT JOIN users u ON a.practitioner_id = u.id
       LEFT JOIN patient_queue q ON q.appointment_id = a.id
       LEFT JOIN LATERAL (
         SELECT child.id, child.start_time, child.end_time, child.status
         FROM appointments child
         WHERE child.parent_appointment_id = a.id AND child.clinic_id = a.clinic_id
         ORDER BY child.created_at DESC, child.id DESC
         LIMIT 1
       ) related ON true
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

exports.createRelatedAppointment = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const parentId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(parentId) || parentId < 1) return res.status(400).json({ error: 'Invalid appointment ID.' });

    const { action, start_time: startTime, reason, visit_type: visitType } = req.body || {};
    if (!['follow_up', 'reschedule', 'rebook'].includes(action)) {
      return res.status(400).json({ error: 'Choose a valid follow-up, reschedule, or rebook action.' });
    }
    const startDate = new Date(startTime);
    if (!startTime || Number.isNaN(startDate.getTime()) || startDate.getTime() <= Date.now()) {
      return res.status(422).json({ error: 'Choose a future date and time for the new appointment.' });
    }
    if (action !== 'reschedule' && (typeof reason !== 'string' || !reason.trim())) {
      return res.status(422).json({ error: 'Enter a reason for the appointment.' });
    }
    if (typeof visitType !== 'string' || !visitType.trim()) {
      return res.status(422).json({ error: 'Choose an appointment type.' });
    }

    await client.query('BEGIN');
    const parentResult = await client.query(
      `SELECT id, clinic_id, pet_id, client_id, practitioner_id, status, start_time, end_time, reason, notes
       FROM appointments WHERE id=$1 AND clinic_id=$2 FOR UPDATE`,
      [parentId, clinicId]
    );
    const parent = parentResult.rows[0];
    if (!parent) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found in this clinic.' });
    }
    const parentStatus = String(parent.status || '').toLowerCase();
    const workflowReason = typeof reason === 'string' && reason.trim()
      ? reason.trim()
      : 'Rescheduled by clinic staff.';
    if (action === 'follow_up' && parentStatus !== 'completed') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Follow-up appointments can only be scheduled from a completed appointment.' });
    }
    if (action === 'reschedule' && !['scheduled', 'confirmed', 'pending', 'checked_in', 'no_show', 'rescheduled'].includes(parentStatus)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This appointment cannot be rescheduled from its current status.' });
    }
    if (action === 'rebook' && parentStatus !== 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Only a cancelled appointment can be rebooked.' });
    }

    const durationMs = parent.end_time && parent.start_time
      ? new Date(parent.end_time).getTime() - new Date(parent.start_time).getTime()
      : 30 * 60 * 1000;
    const endTime = new Date(startDate.getTime() + (durationMs > 0 ? durationMs : 30 * 60 * 1000));
    const savedResult = await client.query(
      `INSERT INTO appointments
         (clinic_id, pet_id, client_id, practitioner_id, status, start_time, end_time, reason, notes,
          parent_appointment_id, workflow_type, workflow_reason, original_start_time)
       VALUES ($1,$2,$3,$4,'scheduled',$5,$6,$7,$8::jsonb,$9,$10,$11,$12)
       RETURNING id, clinic_id, pet_id, client_id, practitioner_id, status, start_time, end_time, reason, notes,
                 parent_appointment_id, workflow_type, workflow_reason, original_start_time, created_at`,
      [
        clinicId, parent.pet_id, parent.client_id, parent.practitioner_id || req.user.id,
        startDate.toISOString(), endTime.toISOString(), visitType.trim(),
        JSON.stringify({}),
        parent.id, action, workflowReason, parent.start_time,
      ]
    );

    let updatedParent = parent;
    if (action === 'reschedule') {
      const parentUpdate = await client.query(
        `UPDATE appointments
         SET status='rescheduled', workflow_type='rescheduled', workflow_reason=$1, updated_at=now()
         WHERE id=$2 AND clinic_id=$3
         RETURNING id, status, start_time, end_time, reason, notes`,
        [workflowReason, parent.id, clinicId]
      );
      updatedParent = parentUpdate.rows[0];
    }

    await client.query('COMMIT');
    const saved = savedResult.rows[0];
    const appointmentResult = await db.query(
      `SELECT a.id, a.status, a.start_time, a.end_time, a.reason, a.notes,
              a.parent_appointment_id, a.workflow_type, a.workflow_reason, a.original_start_time,
              p.name AS pet, c.name AS owner, u.name AS practitioner
       FROM appointments a
       LEFT JOIN pets p ON p.id=a.pet_id
       LEFT JOIN clients c ON c.id=a.client_id
       LEFT JOIN users u ON u.id=a.practitioner_id
       WHERE a.id=$1 AND a.clinic_id=$2`,
      [saved.id, clinicId]
    );
    const appointment = appointmentResult.rows[0];
    await logAudit({
      user_id: req.user.id,
      role: req.user.role,
      action: action === 'reschedule' ? 'reschedule' : action === 'rebook' ? 'rebook' : 'schedule_follow_up',
      table_name: 'appointments',
      record_id: saved.id,
      old_data: { parent_appointment_id: parent.id, parent_status: parent.status, parent_start_time: parent.start_time },
      new_data: appointment,
      reason: workflowReason,
      ip_address: req.ip || req.connection.remoteAddress,
    });
    return res.status(201).json({ appointment, parent: updatedParent });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
};

const consultationQuery = `
  SELECT co.id, co.clinic_id, co.appointment_id, co.pet_id, co.doctor_id,
         co.status, co.notes, co.owner_visible, co.started_at, co.completed_at,
         co.completed_by, co.created_at, co.updated_at,
         p.name AS pet, c.name AS owner, u.name AS doctor
  FROM consultations co
  LEFT JOIN pets p ON p.id = co.pet_id
  LEFT JOIN clients c ON c.id = p.client_id
  LEFT JOIN users u ON u.id = co.doctor_id
`;

async function getAppointmentForClinic(appointmentId, clinicId) {
  const result = await db.query(
    `SELECT a.id, a.clinic_id, a.pet_id, a.practitioner_id, a.status,
            q.status AS queue_status
     FROM appointments a
     LEFT JOIN patient_queue q ON q.appointment_id = a.id
     WHERE a.id = $1 AND a.clinic_id = $2`,
    [appointmentId, clinicId]
  );
  return result.rows[0] || null;
}

exports.startConsultation = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const appointmentId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(appointmentId)) return res.status(400).json({ error: 'Invalid appointment ID.' });
    const appointment = await getAppointmentForClinic(appointmentId, clinicId);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(409).json({ error: 'This appointment cannot start a consultation from its current status.' });
    }
    if (appointment.practitioner_id && req.user.role === 'doctor' && appointment.practitioner_id !== req.user.id) {
      return res.status(403).json({ error: 'This appointment is assigned to another doctor.' });
    }

    await client.query('BEGIN');
    const consultation = await client.query(
      `INSERT INTO consultations (clinic_id, appointment_id, pet_id, doctor_id, status)
       VALUES ($1,$2,$3,$4,'in_progress')
       ON CONFLICT (appointment_id) DO UPDATE
       SET status='in_progress', doctor_id=EXCLUDED.doctor_id, updated_at=now()
       RETURNING id`,
      [clinicId, appointmentId, appointment.pet_id, req.user.id]
    );
    await client.query(
      `UPDATE appointments SET status='in_consultation', practitioner_id=COALESCE(practitioner_id,$1), updated_at=now()
       WHERE id=$2 AND clinic_id=$3`,
      [req.user.id, appointmentId, clinicId]
    );
    await client.query(
      `UPDATE patient_queue SET status='in_consultation', updated_at=now()
       WHERE appointment_id=$1 AND clinic_id=$2`,
      [appointmentId, clinicId]
    );
    await client.query('COMMIT');
    const saved = await db.query(`${consultationQuery} WHERE co.id = $1 AND co.clinic_id = $2`, [consultation.rows[0].id, clinicId]);
    await logAudit({
      user_id: req.user.id, role: req.user.role, action: 'start_consultation',
      table_name: 'consultations', record_id: consultation.rows[0].id,
      old_data: { appointment_status: appointment.status, queue_status: appointment.queue_status },
      new_data: saved.rows[0], reason: 'Consultation started.', ip_address: req.ip || req.connection.remoteAddress,
    });
    return res.status(201).json(saved.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    return next(e);
  } finally {
    client.release();
  }
};

exports.getConsultation = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const appointmentId = Number.parseInt(req.params.id, 10);
    const result = await db.query(`${consultationQuery} WHERE co.appointment_id = $1 AND co.clinic_id = $2`, [appointmentId, clinicId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Consultation not found.' });
    return res.json(result.rows[0]);
  } catch (e) {
    return next(e);
  }
};

exports.saveConsultation = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const appointmentId = Number.parseInt(req.params.id, 10);
    const appointment = await getAppointmentForClinic(appointmentId, clinicId);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
    const notes = req.body && typeof req.body.notes === 'object' && req.body.notes !== null ? req.body.notes : {};
    const ownerVisible = req.body.owner_visible === true;
    const current = await db.query(`${consultationQuery} WHERE co.appointment_id = $1 AND co.clinic_id = $2`, [appointmentId, clinicId]);
    if (!current.rows.length) return res.status(409).json({ error: 'Start the consultation before saving notes.' });
    const result = await db.query(
      `UPDATE consultations SET notes=$1, owner_visible=$2, updated_at=now()
       WHERE appointment_id=$3 AND clinic_id=$4 RETURNING id`,
      [JSON.stringify(notes), ownerVisible, appointmentId, clinicId]
    );
    const saved = await db.query(`${consultationQuery} WHERE co.id = $1 AND co.clinic_id = $2`, [result.rows[0].id, clinicId]);
    await logAudit({
      user_id: req.user.id, role: req.user.role, action: 'update',
      table_name: 'consultations', record_id: result.rows[0].id,
      old_data: current.rows[0], new_data: saved.rows[0], reason: 'Consultation notes saved.',
      ip_address: req.ip || req.connection.remoteAddress,
    });
    return res.json(saved.rows[0]);
  } catch (e) {
    return next(e);
  }
};

exports.completeConsultation = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const appointmentId = Number.parseInt(req.params.id, 10);
    const current = await getAppointmentForClinic(appointmentId, clinicId);
    if (!current) return res.status(404).json({ error: 'Appointment not found.' });
    const consultation = await db.query(`${consultationQuery} WHERE co.appointment_id = $1 AND co.clinic_id = $2`, [appointmentId, clinicId]);
    if (!consultation.rows.length) return res.status(409).json({ error: 'Start the consultation before completing it.' });
    await client.query('BEGIN');
    await client.query(
      `UPDATE consultations SET status='completed', completed_at=now(), completed_by=$1, updated_at=now()
       WHERE appointment_id=$2 AND clinic_id=$3`,
      [req.user.id, appointmentId, clinicId]
    );
    await client.query(`UPDATE appointments SET status='completed', updated_at=now() WHERE id=$1 AND clinic_id=$2`, [appointmentId, clinicId]);
    await client.query(
      `UPDATE patient_queue SET status='completed', updated_at=now()
       WHERE appointment_id=$1 AND clinic_id=$2`,
      [appointmentId, clinicId]
    );
    await client.query('COMMIT');
    const saved = await db.query(`${consultationQuery} WHERE co.appointment_id = $1 AND co.clinic_id = $2`, [appointmentId, clinicId]);
    await logAudit({
      user_id: req.user.id, role: req.user.role, action: 'complete_consultation',
      table_name: 'consultations', record_id: saved.rows[0].id,
      old_data: { appointment: current, consultation: consultation.rows[0] },
      new_data: { appointment_status: 'completed', consultation: saved.rows[0] },
      reason: String(req.body.reason || '').trim() || 'Consultation completed.',
      ip_address: req.ip || req.connection.remoteAddress,
    });
    return res.json(saved.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    return next(e);
  } finally {
    client.release();
  }
};

exports.transferAppointment = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const appointmentId = Number.parseInt(req.params.id, 10);
    const toDoctorId = Number.parseInt(req.body.to_doctor_id || req.body.toDoctorId, 10);
    const reason = String(req.body.reason || '').trim();
    const notes = String(req.body.notes || '').trim() || null;
    const urgency = String(req.body.urgency || 'Routine — no rush').trim();
    if (!Number.isInteger(appointmentId) || !Number.isInteger(toDoctorId)) {
      return res.status(422).json({ error: 'A valid appointment and receiving doctor are required.' });
    }
    if (reason.length < 15) return res.status(422).json({ error: 'Enter a clinical handoff reason of at least 15 characters.' });
    const appointment = await getAppointmentForClinic(appointmentId, clinicId);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
    if (['completed', 'cancelled'].includes(String(appointment.status))) {
      return res.status(409).json({ error: 'Completed or cancelled appointments cannot be transferred.' });
    }
    const doctor = await db.query(
      `SELECT u.id, u.name FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id=$1 AND u.clinic_id=$2
         AND LOWER(COALESCE(r.name, '')) IN ('doctor', 'veterinarian', 'assistant_doctor')`,
      [toDoctorId, clinicId]
    );
    if (!doctor.rows.length) return res.status(422).json({ error: 'The receiving doctor is not available at this clinic.' });
    if (Number.isInteger(req.user.id) && toDoctorId === req.user.id) {
      return res.status(422).json({ error: 'Select a different receiving doctor.' });
    }
    await client.query('BEGIN');
    const transfer = await client.query(
      `INSERT INTO appointment_transfers
       (clinic_id, appointment_id, pet_id, from_doctor_id, to_doctor_id, reason, urgency, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [clinicId, appointmentId, appointment.pet_id, appointment.practitioner_id || req.user.id, toDoctorId, reason, urgency, notes, req.user.id]
    );
    await client.query(
      `UPDATE appointments SET practitioner_id=$1, updated_at=now()
       WHERE id=$2 AND clinic_id=$3`,
      [toDoctorId, appointmentId, clinicId]
    );
    await client.query('COMMIT');
    const saved = await db.query(
      `SELECT t.*, fd.name AS from_doctor, td.name AS to_doctor
       FROM appointment_transfers t
       LEFT JOIN users fd ON fd.id=t.from_doctor_id
       LEFT JOIN users td ON td.id=t.to_doctor_id
       WHERE t.id=$1`,
      [transfer.rows[0].id]
    );
    await logAudit({
      user_id: req.user.id, role: req.user.role, action: 'transfer',
      table_name: 'appointments', record_id: appointmentId,
      old_data: appointment, new_data: { practitioner_id: toDoctorId, transfer: saved.rows[0] },
      reason, ip_address: req.ip || req.connection.remoteAddress,
    });
    return res.status(201).json(saved.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    return next(e);
  } finally {
    client.release();
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
              v.manufacturer,
              v.expiry_date,
              v.dose,
              v.verified,
              v.verified_by,
              v.verified_at,
              verifier.name AS verified_by_name,
              v.verification_reason,
              v.sticker_attachment_id,
              a.url AS sticker_url,
              a.filename AS sticker_filename,
              v.notes,
              COALESCE(v.archived, false) AS archived,
              p.name AS pet,
              p.metadata AS pet_metadata,
              c.name AS owner,
              c.email AS owner_email,
              u.name AS administered_by,
              v.created_at
       FROM vaccinations v
       LEFT JOIN pets p ON v.pet_id = p.id
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN users u ON v.administered_by = u.id
       LEFT JOIN users verifier ON v.verified_by = verifier.id
       LEFT JOIN attachments a ON a.id = v.sticker_attachment_id
       WHERE v.clinic_id = $1
       ORDER BY v.date_given DESC`,
      [clinicId]
    );

    res.json(result.rows.map(({ pet_metadata: petMetadata, ...row }) => {
      const share = (Array.isArray(petMetadata?.owner_shared_records) ? petMetadata.owner_shared_records : [])
        .find(item => Array.isArray(item.records) && item.records.some(record => record.id === `vaccine:${row.id}`));
      return { ...row, shared: Boolean(share), shared_by: share?.sharedBy || null, shared_at: share?.createdAt || null };
    }));
  } catch (e) {
    next(e);
  }
};

const getVaccinationInput = (body) => ({
  petId: Number.isInteger(Number.parseInt(body.pet_id || body.petId, 10))
    ? Number.parseInt(body.pet_id || body.petId, 10)
    : null,
  vaccineName: String(body.vaccine_name || body.vaccineName || body.type || '').trim(),
  dateGiven: body.date_given || body.dateGiven || null,
  nextDue: body.next_due || body.nextDue || null,
  batchNumber: String(body.batch_number || body.batchNumber || body.lotNumber || '').trim() || null,
  manufacturer: String(body.manufacturer || '').trim() || null,
  expiryDate: body.expiry_date || body.expiryDate || null,
  dose: String(body.dose || '').trim() || null,
  notes: String(body.notes || '').trim() || null,
  administeredBy: Number.isInteger(Number.parseInt(body.administered_by || body.administeredBy, 10))
    ? Number.parseInt(body.administered_by || body.administeredBy, 10)
    : null,
  administeredByName: String(body.administered_by_name || body.administeredByName || body.attendingDoctor || '').trim(),
  overrideReason: String(body.override_reason || body.overrideReason || '').trim(),
});

const vaccinationResponseQuery = `
  SELECT v.id, v.pet_id, v.clinic_id, v.vaccine_name, v.date_given, v.next_due,
         v.batch_number, v.manufacturer, v.expiry_date, v.dose, v.notes,
         v.administered_by, u.name AS administered_by_name, v.verified,
         v.verified_by, verifier.name AS verified_by_name, v.verified_at, v.verification_reason,
         v.sticker_attachment_id, a.url AS sticker_url, a.filename AS sticker_filename,
         COALESCE(v.archived, false) AS archived,
         v.created_at, p.name AS pet, c.name AS owner
  FROM vaccinations v
  LEFT JOIN users u ON v.administered_by = u.id
  LEFT JOIN users verifier ON v.verified_by = verifier.id
  LEFT JOIN pets p ON v.pet_id = p.id
  LEFT JOIN clients c ON p.client_id = c.id
  LEFT JOIN attachments a ON a.id = v.sticker_attachment_id
`;

async function resolveVaccinationAdministeredBy(input, clinicId) {
  if (Number.isInteger(input.administeredBy)) {
    const user = await db.query(
      'SELECT id, name FROM users WHERE id = $1 AND (clinic_id = $2 OR clinic_id IS NULL)',
      [input.administeredBy, clinicId]
    );
    if (!user.rows.length) return { error: 'The administering user is not assigned to this clinic.' };
    return { id: user.rows[0].id };
  }
  if (!input.administeredByName) return { error: 'Administered by is required.' };
  const user = await db.query(
    `SELECT id FROM users
     WHERE (clinic_id = $1 OR clinic_id IS NULL) AND LOWER(name) = LOWER($2)
     LIMIT 1`,
    [clinicId, input.administeredByName]
  );
  if (!user.rows.length) return { error: 'The administering user could not be found in this clinic.' };
  return { id: user.rows[0].id };
}

function vaccinationDateErrors(input) {
  const errors = validateClinicalDates({
    dateGiven: input.dateGiven,
    nextDue: input.nextDue,
    administrationDate: input.dateGiven,
    expiry: input.expiryDate,
  });
  if (!input.vaccineName) errors.vaccineName = 'Vaccine or product name is required.';
  if (!Number.isInteger(input.petId)) errors.petId = 'A valid pet is required.';
  return errors;
}

async function getVaccinationForClinic(id, clinicId) {
  const result = await db.query(`${vaccinationResponseQuery} WHERE v.id = $1 AND v.clinic_id = $2`, [id, clinicId]);
  return result.rows[0] || null;
}

exports.createVaccination = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const input = getVaccinationInput(req.body);
    const errors = vaccinationDateErrors(input);
    const pet = input.petId
      ? await db.query(
        `SELECT p.id, p.name, p.client_id FROM pets p
         JOIN clients c ON c.id = p.client_id AND c.clinic_id = $2
         WHERE p.id = $1 AND p.clinic_id = $2`,
        [input.petId, clinicId]
      )
      : { rows: [] };
    if (!pet.rows.length) errors.petId = 'The selected pet is not registered at this clinic.';
    const administrator = await resolveVaccinationAdministeredBy(input, clinicId);
    if (administrator.error) errors.administeredBy = administrator.error;
    if (Object.keys(errors).length) return res.status(422).json({ error: 'Validation failed', fields: errors });

    const duplicate = await db.query(
      `SELECT id, vaccine_name, date_given, batch_number
       FROM vaccinations
       WHERE clinic_id = $1 AND pet_id = $2 AND archived = false
         AND LOWER(vaccine_name) = LOWER($3)
         AND date_given = $4
         AND COALESCE(batch_number, '') = COALESCE($5, '')`,
      [clinicId, input.petId, input.vaccineName, input.dateGiven, input.batchNumber]
    );
    if (duplicate.rows.length && !input.overrideReason) {
      return res.status(409).json({
        error: 'Potential duplicate vaccination detected.',
        code: 'POTENTIAL_DUPLICATE',
        potential_duplicates: duplicate.rows,
        requires_override_reason: true,
      });
    }
    if (duplicate.rows.length) {
      const overrideError = validateOverrideReason(input.overrideReason);
      if (overrideError || !['doctor', 'clinic_owner', 'super_admin'].includes(req.user.role)) {
        return res.status(422).json({ error: overrideError || 'Only an authorized clinical user can override a duplicate warning.' });
      }
    }

    const result = await db.query(
      `INSERT INTO vaccinations
       (pet_id, clinic_id, vaccine_name, date_given, next_due, batch_number, manufacturer,
        expiry_date, dose, administered_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [input.petId, clinicId, input.vaccineName, input.dateGiven, input.nextDue, input.batchNumber,
        input.manufacturer, input.expiryDate, input.dose, administrator.id, input.notes]
    );
    const vaccination = await getVaccinationForClinic(result.rows[0].id, clinicId);
    await logAudit({
      user_id: req.user.id,
      role: req.user.role,
      action: 'create',
      table_name: 'vaccinations',
      record_id: vaccination.id,
      new_data: vaccination,
      reason: input.overrideReason || 'Vaccination record created.',
      ip_address: req.ip || req.connection.remoteAddress,
    });
    return res.status(201).json(vaccination);
  } catch (e) {
    return next(e);
  }
};

exports.updateVaccination = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid vaccination ID.' });
    const current = await getVaccinationForClinic(id, clinicId);
    if (!current) return res.status(404).json({ error: 'Vaccination not found.' });
    const input = getVaccinationInput({ ...current, ...req.body });
    const errors = vaccinationDateErrors(input);
    const pet = input.petId
      ? await db.query(
        `SELECT p.id FROM pets p JOIN clients c ON c.id = p.client_id AND c.clinic_id = $2
         WHERE p.id = $1 AND p.clinic_id = $2`,
        [input.petId, clinicId]
      )
      : { rows: [] };
    if (!pet.rows.length) errors.petId = 'The selected pet is not registered at this clinic.';
    const administrator = await resolveVaccinationAdministeredBy(input, clinicId);
    if (administrator.error) errors.administeredBy = administrator.error;
    if (Object.keys(errors).length) return res.status(422).json({ error: 'Validation failed', fields: errors });

    const changedVerifiedFields = ['vaccineName', 'dateGiven', 'batchNumber', 'expiryDate', 'dose']
      .some(field => String(input[field] || '') !== String(field === 'vaccineName' ? current.vaccine_name || '' : current[field === 'dateGiven' ? 'date_given' : field === 'batchNumber' ? 'batch_number' : field === 'expiryDate' ? 'expiry_date' : 'dose'] || ''));
    const verified = changedVerifiedFields ? false : Boolean(current.verified);
    const result = await db.query(
      `UPDATE vaccinations
       SET pet_id=$1, vaccine_name=$2, date_given=$3, next_due=$4, batch_number=$5,
           manufacturer=$6, expiry_date=$7, dose=$8, administered_by=$9, notes=$10,
           verified=$11, verified_by=CASE WHEN $11 THEN verified_by ELSE NULL END,
           verified_at=CASE WHEN $11 THEN verified_at ELSE NULL END,
           verification_reason=CASE WHEN $11 THEN verification_reason ELSE NULL END
       WHERE id=$12 AND clinic_id=$13
       RETURNING id`,
      [input.petId, input.vaccineName, input.dateGiven, input.nextDue, input.batchNumber, input.manufacturer,
        input.expiryDate, input.dose, administrator.id, input.notes, verified, id, clinicId]
    );
    const vaccination = await getVaccinationForClinic(result.rows[0].id, clinicId);
    await logAudit({
      user_id: req.user.id,
      role: req.user.role,
      action: 'update',
      table_name: 'vaccinations',
      record_id: id,
      old_data: current,
      new_data: vaccination,
      reason: input.overrideReason || (changedVerifiedFields ? 'Vaccination fields changed; verification removed.' : 'Vaccination record updated.'),
      ip_address: req.ip || req.connection.remoteAddress,
    });
    return res.json(vaccination);
  } catch (e) {
    return next(e);
  }
};

exports.updateVaccinationVerification = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const id = Number.parseInt(req.params.id, 10);
    const current = await getVaccinationForClinic(id, clinicId);
    if (!current) return res.status(404).json({ error: 'Vaccination not found.' });
    const verified = req.body.verified !== false;
    const reason = String(req.body.reason || '').trim();
    if (verified && req.body.attestation_confirmed !== true) {
      return res.status(422).json({ error: 'Confirm the physical sticker and clinic administration before verifying this record.' });
    }
    if (!verified && !reason) return res.status(422).json({ error: 'A reason is required to remove verification.' });
    const result = await db.query(
      `UPDATE vaccinations
       SET verified=$1, verified_by=$2, verified_at=CASE WHEN $1 THEN now() ELSE NULL END,
           verification_reason=$3
       WHERE id=$4 AND clinic_id=$5
       RETURNING id`,
      [verified, verified ? req.user.id : null, reason || 'Record verification removed.', id, clinicId]
    );
    const vaccination = await getVaccinationForClinic(result.rows[0].id, clinicId);
    await logAudit({
      user_id: req.user.id,
      role: req.user.role,
      action: verified ? 'verify' : 'unverify',
      table_name: 'vaccinations',
      record_id: id,
      old_data: current,
      new_data: vaccination,
      reason: reason || 'Vaccination record verified.',
      ip_address: req.ip || req.connection.remoteAddress,
    });
    return res.json(vaccination);
  } catch (e) {
    return next(e);
  }
};

exports.uploadVaccinationSticker = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    const id = Number.parseInt(req.params.id, 10);
    const current = await getVaccinationForClinic(id, clinicId);
    if (!current) return res.status(404).json({ error: 'Vaccination not found.' });
    const filename = String(req.body.filename || '').trim();
    const contentType = String(req.body.content_type || '').trim().toLowerCase();
    const data = String(req.body.data || '');
    if (!filename || !/^image\/(jpeg|png|webp|gif)$/.test(contentType) || !data.startsWith(`data:${contentType};base64,`)) {
      return res.status(422).json({ error: 'Upload a valid JPEG, PNG, WEBP, or GIF image.' });
    }
    const encoded = data.slice(data.indexOf(',') + 1);
    if (!encoded || encoded.length > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Sticker image must be smaller than 5 MB.' });
    }
    const attachment = await db.query(
      `INSERT INTO attachments (clinic_id, owner_table, owner_id, filename, content_type, url, metadata)
       VALUES ($1, 'vaccinations', $2, $3, $4, $5, $6)
       RETURNING id, filename, content_type, url, uploaded_at`,
      [clinicId, id, filename, contentType, data, JSON.stringify({ source: 'vaccination_sticker', uploaded_by: req.user.id })]
    );
    await db.query(
      'UPDATE vaccinations SET sticker_attachment_id = $1, verified = false, verified_by = NULL, verified_at = NULL, verification_reason = NULL WHERE id = $2 AND clinic_id = $3',
      [attachment.rows[0].id, id, clinicId]
    );
    const saved = await getVaccinationForClinic(id, clinicId);
    await logAudit({
      user_id: req.user.id,
      role: req.user.role,
      action: 'upload_sticker',
      table_name: 'vaccinations',
      record_id: id,
      old_data: current,
      new_data: saved,
      reason: 'Vaccination sticker image uploaded; verification removed.',
      ip_address: req.ip || req.connection.remoteAddress,
    });
    return res.status(201).json(saved);
  } catch (e) {
    return next(e);
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
              COALESCE(pr.archived, false) AS archived,
              pr.issued_at,
              p.name AS pet,
              c.name AS owner,
              u.name AS issued_by
       FROM prescriptions pr
       LEFT JOIN pets p ON pr.pet_id = p.id
       LEFT JOIN clients c ON p.client_id = c.id
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

const canShareOwnerRecords = (role) => [
  'doctor',
  'assistant_doctor',
  'veterinarian',
  'clinic_owner',
  'super_admin',
].includes(String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_'));

exports.listShareablePetRecords = async (req, res, next) => {
  try {
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    if (!canShareOwnerRecords(req.user && req.user.role)) {
      return res.status(403).json({ error: 'Only clinical staff can prepare records to share with an owner.' });
    }

    const petName = String(req.query.pet_name || '').trim();
    const ownerEmail = String(req.query.owner_email || '').trim().toLowerCase();
    if (!petName || !ownerEmail) {
      return res.status(422).json({ error: 'Pet name and owner email are required to find the clinic record.' });
    }

    const petResult = await db.query(
      `SELECT p.id, p.name, p.metadata, c.id AS client_id, c.name AS owner, c.email
       FROM pets p
       JOIN clients c ON c.id = p.client_id AND c.clinic_id = p.clinic_id
       WHERE p.clinic_id = $1
         AND LOWER(TRIM(p.name)) = LOWER($2)
         AND LOWER(TRIM(c.email)) = LOWER($3)
         AND COALESCE((p.metadata->>'archived')::boolean, false) = false
       ORDER BY p.id`,
      [clinicId, petName, ownerEmail]
    );
    if (!petResult.rows.length) {
      return res.status(404).json({ error: 'No clinic patient matches this pet name and owner email. Verify the patient and owner records first.' });
    }
    if (petResult.rows.length > 1) {
      return res.status(409).json({ error: 'More than one clinic patient matches these details. Update the patient record so the owner can be identified unambiguously.' });
    }

    const pet = petResult.rows[0];
    const [visits, vaccinations, medications] = await Promise.all([
      db.query(
        `SELECT id, reason, status, start_time, practitioner_id
         FROM appointments
         WHERE clinic_id = $1 AND pet_id = $2 AND COALESCE(archived, false) = false
           AND status = 'completed'
         ORDER BY start_time DESC NULLS LAST, id DESC`,
        [clinicId, pet.id]
      ),
      db.query(
        `SELECT v.id, v.vaccine_name, v.date_given, v.next_due, v.dose,
                v.manufacturer, v.batch_number, v.administered_by,
                v.verified, v.verified_at, verifier.name AS verified_by_name
         FROM vaccinations v
         LEFT JOIN users verifier ON verifier.id = v.verified_by
         WHERE v.clinic_id = $1 AND v.pet_id = $2 AND COALESCE(v.archived, false) = false
         ORDER BY v.date_given DESC NULLS LAST, v.id DESC`,
        [clinicId, pet.id]
      ),
      db.query(
        `SELECT id, medication, dosage, instructions, status, issued_at
         FROM prescriptions
         WHERE clinic_id = $1 AND pet_id = $2 AND COALESCE(archived, false) = false
         ORDER BY issued_at DESC NULLS LAST, id DESC`,
        [clinicId, pet.id]
      ),
    ]);

    const vaccinationShares = new Map(
      (Array.isArray(pet.metadata?.owner_shared_records) ? pet.metadata.owner_shared_records : [])
        .flatMap(share => (Array.isArray(share.records) ? share.records : [])
          .filter(item => item.type === 'vaccine')
          .map(item => [item.id, share]))
    );
    const records = [
      ...visits.rows.map((row) => ({
        id: `visit:${row.id}`,
        type: 'visit',
        category: 'Visit',
        title: row.reason || 'Clinic visit',
        detail: `Visit · ${row.status}`,
        date: row.start_time,
      })),
      ...vaccinations.rows.map((row) => ({
        id: `vaccine:${row.id}`,
        type: 'vaccine',
        category: 'Vaccine',
        title: row.vaccine_name,
        detail: [
          'Vaccination',
          row.dose,
          row.manufacturer,
          row.batch_number ? `Lot ${row.batch_number}` : null,
          row.next_due ? `Next due ${new Date(row.next_due).toLocaleDateString()}` : null,
        ].filter(Boolean).join(' · '),
        date: row.date_given,
        clinicVerified: row.verified === true,
        verifiedBy: row.verified_by_name || null,
        verifiedAt: row.verified_at || null,
        shared: vaccinationShares.has(`vaccine:${row.id}`),
        sharedBy: vaccinationShares.get(`vaccine:${row.id}`)?.sharedBy || null,
        sharedAt: vaccinationShares.get(`vaccine:${row.id}`)?.createdAt || null,
      })),
      ...medications.rows.map((row) => ({
        id: `medication:${row.id}`,
        type: 'medication',
        category: 'Medication',
        title: row.medication,
        detail: [row.dosage, row.instructions].filter(Boolean).join(' · ') || `Prescription · ${row.status}`,
        date: row.issued_at,
      })),
    ];
    return res.json({ pet: { id: pet.id, name: pet.name, owner: pet.owner, email: pet.email }, records });
  } catch (error) {
    return next(error);
  }
};

exports.sharePetRecordsWithOwner = async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    const clinicId = requireClinicId(req, res);
    if (!clinicId) return;
    if (!canShareOwnerRecords(req.user && req.user.role)) {
      return res.status(403).json({ error: 'Only clinical staff can share records with an owner.' });
    }

    const petId = Number.parseInt(req.body.pet_id, 10);
    const requestedRecords = Array.isArray(req.body.records) ? req.body.records : [];
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!Number.isInteger(petId) || petId < 1) return res.status(422).json({ error: 'A valid patient record is required.' });
    if (!requestedRecords.length || requestedRecords.length > 100) return res.status(422).json({ error: 'Select between 1 and 100 records to share.' });
    if (message.length > 600) return res.status(422).json({ error: 'The owner message must be 600 characters or fewer.' });

    await client.query('BEGIN');
    const petResult = await client.query(
      `SELECT p.id, p.name, p.metadata, c.name AS owner, c.email
       FROM pets p
       JOIN clients c ON c.id = p.client_id AND c.clinic_id = p.clinic_id
       WHERE p.id = $1 AND p.clinic_id = $2
         AND COALESCE((p.metadata->>'archived')::boolean, false) = false
       FOR UPDATE OF p`,
      [petId, clinicId]
    );
    if (!petResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Patient record not found in this clinic.' });
    }
    const pet = petResult.rows[0];
    if (!String(pet.email || '').trim()) {
      await client.query('ROLLBACK');
      return res.status(422).json({ error: 'Add the owner email to the clinic record before sharing records.' });
    }

    const selectedIds = [...new Set(requestedRecords.map(item => String(item && item.id || '').trim()))];
    const typedIds = { visit: [], vaccine: [], medication: [] };
    const doctorUpdates = [];
    for (const item of requestedRecords) {
      const id = String(item && item.id || '').trim();
      const separator = id.indexOf(':');
      const type = separator >= 0 ? id.slice(0, separator) : '';
      const sourceId = separator >= 0 ? Number.parseInt(id.slice(separator + 1), 10) : NaN;
      if (type === 'doctor-update' && id.startsWith('doctor-update:')) {
        const title = String(item.title || '').trim();
        const detail = String(item.detail || '').trim();
        const category = String(item.category || 'Doctor update').trim();
        if (!title || title.length > 160 || !detail || detail.length > 3000) {
          await client.query('ROLLBACK');
          return res.status(422).json({ error: 'Doctor updates need a title (up to 160 characters) and details (up to 3,000 characters).' });
        }
        doctorUpdates.push({
          id: `doctor-update:${crypto.randomUUID()}`,
          type: 'doctor-update',
          category,
          title,
          detail,
          date: new Date().toISOString(),
        });
      } else if (Object.prototype.hasOwnProperty.call(typedIds, type) && Number.isInteger(sourceId) && sourceId > 0) {
        typedIds[type].push(sourceId);
      } else {
        await client.query('ROLLBACK');
        return res.status(422).json({ error: 'One of the selected records is not valid.' });
      }
    }

    const [visits, vaccines, medications] = await Promise.all([
      typedIds.visit.length ? client.query(
        `SELECT id, reason, status, start_time
         FROM appointments
         WHERE clinic_id = $1 AND pet_id = $2 AND id = ANY($3::int[])
           AND status = 'completed' AND COALESCE(archived, false) = false`,
        [clinicId, petId, typedIds.visit]
      ) : { rows: [] },
      typedIds.vaccine.length ? client.query(
        `SELECT v.id, v.vaccine_name, v.date_given, v.next_due, v.dose,
                v.manufacturer, v.batch_number, v.verified,
                v.verified_at, verifier.name AS verified_by_name
         FROM vaccinations v
         LEFT JOIN users verifier ON verifier.id = v.verified_by
         WHERE v.clinic_id = $1 AND v.pet_id = $2 AND v.id = ANY($3::int[])
           AND COALESCE(v.archived, false) = false AND v.verified = true`,
        [clinicId, petId, typedIds.vaccine]
      ) : { rows: [] },
      typedIds.medication.length ? client.query(
        `SELECT id, medication, dosage, instructions, status, issued_at
         FROM prescriptions
         WHERE clinic_id = $1 AND pet_id = $2 AND id = ANY($3::int[])
           AND COALESCE(archived, false) = false`,
        [clinicId, petId, typedIds.medication]
      ) : { rows: [] },
    ]);
    if (visits.rows.length !== typedIds.visit.length || vaccines.rows.length !== typedIds.vaccine.length || medications.rows.length !== typedIds.medication.length) {
      await client.query('ROLLBACK');
      return res.status(422).json({ error: 'A selected record is no longer available for this patient. Refresh the list and try again.' });
    }

    const records = [
      ...visits.rows.map(row => ({ id: `visit:${row.id}`, type: 'visit', category: 'Visit', title: row.reason || 'Clinic visit', detail: `Visit · ${row.status}`, date: row.start_time })),
      ...vaccines.rows.map(row => ({
        id: `vaccine:${row.id}`,
        type: 'vaccine',
        category: 'Vaccine',
        title: row.vaccine_name,
        detail: [
          'Vaccination',
          row.dose,
          row.manufacturer,
          row.batch_number ? `Lot ${row.batch_number}` : null,
          row.next_due ? `Next due ${new Date(row.next_due).toLocaleDateString()}` : null,
        ].filter(Boolean).join(' · '),
        date: row.date_given,
        clinicVerified: true,
        verifiedBy: row.verified_by_name || null,
        verifiedAt: row.verified_at || null,
      })),
      ...medications.rows.map(row => ({ id: `medication:${row.id}`, type: 'medication', category: 'Medication', title: row.medication, detail: [row.dosage, row.instructions].filter(Boolean).join(' · ') || `Prescription · ${row.status}`, date: row.issued_at })),
      ...doctorUpdates,
    ];
    if (records.length !== selectedIds.length) {
      await client.query('ROLLBACK');
      return res.status(422).json({ error: 'Selected records must be unique.' });
    }

    const share = {
      id: `share:${crypto.randomUUID()}`,
      records,
      message,
      notificationRequested: req.body.notification_requested === true,
      createdAt: new Date().toISOString(),
      sharedBy: req.user.name || req.user.email,
    };
    const metadata = pet.metadata && typeof pet.metadata === 'object' ? pet.metadata : {};
    const previousShares = Array.isArray(metadata.owner_shared_records) ? metadata.owner_shared_records : [];
    const result = await client.query(
      `UPDATE pets
       SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('owner_shared_records', $1::jsonb),
           updated_at = now()
       WHERE id = $2 AND clinic_id = $3
       RETURNING id`,
      [JSON.stringify([...previousShares, share]), petId, clinicId]
    );
    await client.query(
      `INSERT INTO audit_trail (user_id, action, table_name, record_id, new_data, ip_address)
       VALUES ($1, 'share', 'pets', $2, $3, $4)`,
      [
        req.user.id || null,
        petId,
        JSON.stringify({
          pet: pet.name,
          owner: pet.owner,
          share_id: share.id,
          record_count: records.length,
          _audit: {
            role: req.user.role,
            recorded_at: share.createdAt,
            reason: 'Selected patient records shared to the linked owner account.',
          },
        }),
        req.ip || req.connection.remoteAddress,
      ]
    );
    await client.query('COMMIT');
    return res.status(201).json({ pet_id: result.rows[0].id, share });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Failed to roll back owner record share transaction', rollbackError);
      }
    }
    return next(error);
  } finally {
    if (client) client.release();
  }
};

exports.listOwnerSharedRecords = async (req, res, next) => {
  try {
    const ownerEmail = String(req.user && req.user.email || '').trim().toLowerCase();
    if (!ownerEmail) return res.status(403).json({ error: 'The signed-in account does not have an email address.' });

    const result = await db.query(
      `SELECT p.id AS pet_id, p.name AS pet_name, p.species, p.breed,
              c.name AS clinic_name,
              p.metadata->'owner_shared_records' AS shares
       FROM clients c
       JOIN pets p ON p.client_id = c.id AND p.clinic_id = c.clinic_id
       LEFT JOIN clinics cl ON cl.id = p.clinic_id
       WHERE LOWER(TRIM(c.email)) = $1
         AND COALESCE((p.metadata->>'archived')::boolean, false) = false
         AND jsonb_typeof(p.metadata->'owner_shared_records') = 'array'
       ORDER BY p.name ASC`,
      [ownerEmail]
    );
    const pets = result.rows.flatMap(row => {
      const shares = Array.isArray(row.shares) ? row.shares : [];
      return shares.filter(share => share && Array.isArray(share.records) && share.records.length).map(share => ({
        petId: row.pet_id,
        petName: row.pet_name,
        species: row.species,
        breed: row.breed,
        clinicName: row.clinic_name || 'Veterinary clinic',
        ...share,
      }));
    });
    return res.json(pets);
  } catch (error) {
    return next(error);
  }
};
