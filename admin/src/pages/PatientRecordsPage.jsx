import { useEffect, useMemo, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import Topbar from '../components/Topbar';
import StatusIndicator from '../components/StatusIndicator';
import VaccinationRecordDrawer, { VaccinationVerificationDialog } from '../components/VaccinationRecordDrawer';
import { LabResultsTab, TreatmentPlansTab } from './clinic/ClinicLayout';
import { Icons } from '../icons';
import { notifySuccess } from '../utils/notifications';

const RECORDS = [
  { id: 'PAT-INT-003', name: 'Nala', species: 'Dog', breed: 'Golden Retriever', age: '5 yr 3 mo', birthDate: '30 Jun 2021', weight: '27 kg', owner: 'Grace Villanueva', lastVisit: '8 Sep 2026', nextAppointment: 'None scheduled', alert: '', status: 'Active', avatar: '🐕', color: '#f4e8dd', gender: 'Female', colorName: 'Golden', phone: '+63 917 555 0133', email: 'grace.villanueva@email.com', address: 'Santa Maria, Bulacan', microchip: 'Not recorded', vaccination: 'Up to date', vaccinationDue: '12 Dec 2026', weightTarget: '27 kg', lastVisitAgo: '22 days ago', veterinarian: 'Dr. Santos', recentVisits: [{ date: '8 Sep 2026', title: 'Annual wellness check', doctor: 'Dr. Santos' }, { date: '12 Dec 2025', title: 'Rabies vaccination', doctor: 'Dr. Torres' }, { date: '10 Jun 2025', title: 'Dental check-up', doctor: 'Dr. Santos' }], notes: 'Friendly during examinations. Continue routine wellness checks.', vaccinations: [{ date: '12 Dec 2025', title: 'Rabies vaccination', doctor: 'Dr. Torres', status: 'Completed' }, { date: '10 Jun 2025', title: 'DHPP booster', doctor: 'Dr. Santos', status: 'Completed' }], medications: [{ date: 'Current', title: 'No active prescriptions', doctor: 'Medication review', status: 'Reviewed' }], medicalHistory: [{ date: '8 Sep 2026', title: 'Annual wellness examination', doctor: 'Dr. Santos', status: 'Normal' }, { date: '10 Jun 2025', title: 'Dental check-up', doctor: 'Dr. Santos', status: 'Completed' }], treatmentPlans: [{ date: '8 Sep 2026', title: 'Routine preventive wellness', doctor: 'Dr. Santos', status: 'Active' }], files: [{ date: '8 Sep 2026', title: 'Annual wellness summary.pdf', doctor: 'Dr. Santos', status: 'Available' }, { date: '12 Dec 2025', title: 'Rabies vaccination record.pdf', doctor: 'Dr. Torres', status: 'Available' }], labResults: [{ date: '8 Sep 2026', title: 'Wellness Blood Panel', doctor: 'Dr. Santos', status: 'Normal' }], inpatientHistory: [] },
  { id: 'PAT-001', name: 'Buddy', species: 'Dog', breed: 'Golden Retriever', age: '4 yr 6 mo', weight: '28 kg', owner: 'John Smith', lastVisit: '15 Mar 2022', nextAppointment: '5 Oct 2026', alert: 'Penicillin allergy', status: 'Active', avatar: '🐕', color: '#efe4d7', gender: 'Male', phone: '+63 917 123 4567', email: 'john.smith@email.com', address: '123 Maple St., Santa Maria, Bulacan', microchip: 'Not recorded', vaccination: 'Up to date', vaccinationDue: '1 Jun 2027', weightTarget: '≤ 27 kg', lastVisitAgo: '2 yr ago', appointmentType: 'Hip follow-up', veterinarian: 'Dr. Torres', medicalAlerts: ['Penicillin allergy', 'Certain flea-control topicals'], recentVisits: [{ date: '15 Mar 2022', title: 'Annual check-up', doctor: 'Dr. Torres' }, { date: '10 Jan 2022', title: 'Vaccination (Rabies)', doctor: 'Dr. Torres' }, { date: '05 Oct 2021', title: 'Skin issue', doctor: 'Dr. Santos' }] },
  { id: 'PAT-002', name: 'Luna', species: 'Cat', breed: 'Persian', age: '3 yr 2 mo', birthDate: '30 Jul 2023', weight: '4.2 kg', owner: 'Sarah Johnson', lastVisit: '2 Jul 2023', nextAppointment: 'None scheduled', alert: '', status: 'Active', avatar: '🐈', color: '#e7e6e3', gender: 'Female', colorName: 'Silver', phone: '+63 917 555 0168', email: 'sarah.johnson@email.com', address: 'Meycauayan, Bulacan', microchip: '985141000482116', vaccination: 'Due soon', vaccinationDue: '15 Oct 2026', weightTarget: '4.0 kg', lastVisitAgo: '3 yr ago', veterinarian: 'Dr. Reyes', recentVisits: [{ date: '2 Jul 2023', title: 'Initial wellness check', doctor: 'Dr. Reyes' }, { date: '2 Jul 2023', title: 'Core vaccination', doctor: 'Dr. Reyes' }], notes: 'Indoor cat. Owner reports a healthy appetite.' },
  { id: 'PAT-003', name: 'Max', species: 'Dog', breed: 'Labrador', age: '4 yr 10 mo', birthDate: '30 Nov 2021', weight: '32 kg', owner: 'Mike Davis', lastVisit: '28 Aug 2026', nextAppointment: 'None scheduled', alert: '', status: 'Active', avatar: '🐈‍⬛', color: '#e9e4dc', gender: 'Male', colorName: 'Black', phone: '+63 917 555 0124', email: 'mike.davis@email.com', address: 'Quezon City, Metro Manila', microchip: '985141000378421', vaccination: 'Up to date', vaccinationDue: '28 Aug 2027', weightTarget: '30 kg', lastVisitAgo: '1 month ago', veterinarian: 'Dr. Torres', recentVisits: [{ date: '28 Aug 2026', title: 'Weight and wellness review', doctor: 'Dr. Torres' }, { date: '12 Feb 2026', title: 'Annual vaccination', doctor: 'Dr. Torres' }], notes: 'Gradual weight management plan discussed with owner.' },
  { id: 'PAT-004', name: 'Mochi', species: 'Cat', breed: 'Domestic Shorthair', age: '3 yr 8 mo', birthDate: '30 Jan 2023', weight: '3.8 kg', owner: 'Emma Wilson', lastVisit: '20 Aug 2026', nextAppointment: 'None scheduled', alert: '', status: 'Active', avatar: '🐈', color: '#f0e5db', gender: 'Female', colorName: 'Calico', phone: '+63 917 555 0190', email: 'emma.wilson@email.com', address: 'Malolos, Bulacan', microchip: 'Not recorded', vaccination: 'Up to date', vaccinationDue: '20 Aug 2027', weightTarget: '3.8 kg', lastVisitAgo: '1 month ago', veterinarian: 'Dr. Santos', recentVisits: [{ date: '20 Aug 2026', title: 'Routine wellness check', doctor: 'Dr. Santos' }, { date: '20 Aug 2025', title: 'Vaccination (Rabies)', doctor: 'Dr. Santos' }], notes: 'No current concerns reported.' },
  { id: 'PAT-005', name: 'Rocky', species: 'Dog', breed: 'Dog (Aspin)', age: '6 yr 4 mo', birthDate: '30 May 2020', weight: '18 kg', owner: 'David Brown', lastVisit: '10 Jun 2026', nextAppointment: 'None scheduled', alert: '', status: 'Archived', avatar: '🐕', color: '#efe6d9', gender: 'Male', colorName: 'Brown and white', phone: '+63 917 555 0116', email: 'david.brown@email.com', address: 'San Jose del Monte, Bulacan', microchip: '985141000294518', vaccination: 'Review needed', vaccinationDue: '10 Jun 2026', weightTarget: '18 kg', lastVisitAgo: '3 months ago', veterinarian: 'Dr. Reyes', recentVisits: [{ date: '10 Jun 2026', title: 'Skin irritation review', doctor: 'Dr. Reyes' }, { date: '14 Nov 2025', title: 'General check-up', doctor: 'Dr. Reyes' }], notes: 'Archived patient profile. Contact owner before reactivation.' },
];

const PATIENT_VACCINATION_MOCKS = [
  {
    id: 'mock-vaccine-rabies',
    vaccine_name: 'Rabies (IMRAB 3TF)',
    title: 'Rabies (IMRAB 3TF)',
    date_given: '2025-12-12',
    date: '2025-12-12',
    next_due: '2026-12-12',
    nextDue: '2026-12-12',
    dose: '1 mL IM',
    manufacturer: 'Boehringer Ingelheim',
    batch_number: 'RAB-2025-F6',
    lotNumber: 'RAB-2025-F6',
    expiry_date: '2027-11-30',
    administered_by: 'Dr. Torres',
    administeredBy: 'Dr. Torres',
    pet: 'Nala',
    verified: true,
    clinicVerified: true,
    verified_by_name: 'Yna Amante',
    verified_at: '2025-12-12T18:52:00',
    shared: true,
    shared_by: 'Dr. Torres',
    shared_at: '2025-12-12T19:15:00',
    notes: 'Routine rabies vaccination.',
    isMock: true,
    auditLog: [
      { event: 'Vaccination recorded', actor: 'Dr. Torres', date: '2025-12-12T10:12:00' },
      { event: 'Clinic verification completed', actor: 'Yna Amante', date: '2025-12-12T18:52:00' },
      { event: 'Shared with owner', actor: 'Dr. Torres', date: '2025-12-12T19:15:00' },
    ],
  },
  {
    id: 'mock-vaccine-dhpp',
    vaccine_name: 'DHPP Booster',
    title: 'DHPP Booster',
    date_given: '2025-06-10',
    date: '2025-06-10',
    next_due: '2026-06-10',
    nextDue: '2026-06-10',
    dose: '1 mL SC',
    manufacturer: 'Zoetis',
    batch_number: 'DHPP-2025-B2',
    lotNumber: 'DHPP-2025-B2',
    expiry_date: '2026-06-30',
    administered_by: 'Dr. Santos',
    administeredBy: 'Dr. Santos',
    pet: 'Nala',
    verified: false,
    clinicVerified: false,
    shared: false,
    notes: 'Pending physical sticker review.',
    isMock: true,
    auditLog: [{ event: 'Vaccination recorded', actor: 'Dr. Santos', date: '2025-06-10T11:30:00' }],
  },
  {
    id: 'mock-vaccine-bordetella',
    vaccine_name: 'Bordetella',
    title: 'Bordetella',
    date_given: '2024-03-15',
    date: '2024-03-15',
    next_due: '2025-03-15',
    nextDue: '2025-03-15',
    dose: '0.5 mL IN',
    manufacturer: 'Zoetis',
    batch_number: 'BC-2024-A1',
    lotNumber: 'BC-2024-A1',
    administered_by: 'Dr. Santos',
    administeredBy: 'Dr. Santos',
    pet: 'Nala',
    verified: true,
    clinicVerified: true,
    verified_by_name: 'Dr. Santos',
    verified_at: '2024-03-15T15:20:00',
    shared: true,
    shared_by: 'Dr. Santos',
    shared_at: '2024-03-15T15:30:00',
    notes: 'Intranasal dose.',
    isMock: true,
    auditLog: [
      { event: 'Vaccination recorded', actor: 'Dr. Santos', date: '2024-03-15T14:50:00' },
      { event: 'Clinic verification completed', actor: 'Dr. Santos', date: '2024-03-15T15:20:00' },
      { event: 'Shared with owner', actor: 'Dr. Santos', date: '2024-03-15T15:30:00' },
    ],
  },
  {
    id: 'mock-vaccine-dhpp-2023',
    vaccine_name: 'DHPP',
    title: 'DHPP',
    date_given: '2023-06-10',
    date: '2023-06-10',
    next_due: '2024-06-10',
    nextDue: '2024-06-10',
    dose: '1 mL SC',
    manufacturer: 'Zoetis',
    batch_number: 'DHPP-2023-77',
    lotNumber: 'DHPP-2023-77',
    administered_by: 'Dr. Santos',
    administeredBy: 'Dr. Santos',
    pet: 'Nala',
    verified: true,
    clinicVerified: true,
    verified_by_name: 'Dr. Santos',
    verified_at: '2023-06-10T12:10:00',
    shared: false,
    notes: 'Booster dose.',
    isMock: true,
    auditLog: [
      { event: 'Vaccination recorded', actor: 'Dr. Santos', date: '2023-06-10T11:45:00' },
      { event: 'Clinic verification completed', actor: 'Dr. Santos', date: '2023-06-10T12:10:00' },
    ],
  },
];

function toDateInput(value) {
  if (!value || value === 'Not recorded') return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function formatBirthDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB');
}

function formatVaccinationTableDate(value) {
  if (!value || value === 'Not recorded' || value === '—') return '—';
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getVaccinationDueDate(value) {
  if (!value || value === 'Not recorded' || value === '—') return null;
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getVaccinationFamily(value) {
  return String(value || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/\bbooster\b/g, '').replace(/[^a-z0-9]/g, '');
}

function calculateAge(value) {
  const birthDate = new Date(`${value}T12:00:00`);
  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  if (now.getDate() < birthDate.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return years > 0 ? `${years} yr${years === 1 ? '' : 's'} ${months} mo` : `${Math.max(months, 0)} mo`;
}

const VISIT_DETAILS = {
  'PAT-INT-003': {
    '8 Sep 2026|Annual wellness check': {
      visitType: 'Check-up',
      reason: 'Annual wellness examination',
      chiefComplaint: 'Demo scenario: routine wellness check with no urgent concern.',
      vitals: [
        ['Weight', '27 kg'],
        ['Temperature', '38.5 °C'],
        ['Heart rate', '96 bpm'],
        ['Respiratory rate', '24/min'],
      ],
      assessment: ['Healthy overall', 'Early hip joint changes noted'],
      plan: [
        'Monitor mobility',
        'Follow up if stiffness or discomfort develops',
        'Consider further orthopedic evaluation if symptoms appear',
      ],
    },
    '12 Dec 2025|Rabies vaccination visit': {
      visitType: 'Vaccination',
      reason: 'Demo scenario: scheduled rabies vaccination.',
      chiefComplaint: 'Routine vaccine visit; no urgent concern reported.',
      vitals: [['Weight', '26.5 kg'], ['Temperature', '38.3 °C'], ['Heart rate', '90 bpm'], ['Respiratory rate', '22/min']],
      assessment: ['Demo only: patient appears well for routine vaccination.', 'Sticker evidence and vaccine record shown for UI preview.'],
      plan: ['Review the physical vaccine sticker before verification.', 'Record the next due date as shown on the actual vaccine label.'],
    },
    '10 Jun 2025|Dental check-up': {
      visitType: 'Dental',
      reason: 'Demo scenario: preventive oral health check.',
      chiefComplaint: 'Routine dental check requested by the owner.',
      vitals: [['Weight', '26.2 kg'], ['Temperature', '38.4 °C'], ['Heart rate', '96 bpm'], ['Respiratory rate', '24/min']],
      assessment: ['Demo only: mild visible tartar in this sample scenario.', 'No diagnosis is recorded by this prototype entry.'],
      plan: ['Show a sample preventive-care plan in this detail view.', 'Use real examination findings when recording a clinic visit.'],
    },
  },
};

const PATIENT_VISIT_MOCKS = [
  { date: '8 Sep 2026', title: 'Annual wellness check', doctor: 'Dr. Santos', visitType: 'Check-up', status: 'Completed', isMock: true },
  { date: '12 Dec 2025', title: 'Rabies vaccination visit', doctor: 'Dr. Torres', visitType: 'Vaccination', status: 'Completed', isMock: true },
  { date: '10 Jun 2025', title: 'Dental check-up', doctor: 'Dr. Santos', visitType: 'Dental', status: 'Completed', isMock: true },
];

const PATIENT_VISIT_MOCK_DETAILS = {
  '8 Sep 2026|Annual wellness check': {
    visitType: 'Check-up',
    reason: 'Sample annual wellness examination.',
    chiefComplaint: 'Routine wellness check with no urgent concern in this demo.',
    vitals: [['Weight', '4.8 kg'], ['Temperature', '38.4 °C'], ['Heart rate', '108 bpm'], ['Respiratory rate', '24/min']],
    assessment: ['Sample examination findings for layout preview.', 'Use actual clinician observations for real records.'],
    plan: ['Continue routine preventive care.', 'Schedule follow-up based on real examination findings.'],
  },
  '12 Dec 2025|Rabies vaccination visit': {
    visitType: 'Vaccination',
    reason: 'Sample scheduled rabies vaccination visit.',
    chiefComplaint: 'Routine vaccine visit shown for demonstration.',
    vitals: [['Weight', '4.6 kg'], ['Temperature', '38.3 °C'], ['Heart rate', '104 bpm'], ['Respiratory rate', '22/min']],
    assessment: ['Sample pre-vaccination examination; not a real clinical finding.'],
    plan: ['Compare vaccine details with the physical sticker before verification.'],
  },
  '10 Jun 2025|Dental check-up': {
    visitType: 'Dental',
    reason: 'Sample preventive dental examination.',
    chiefComplaint: 'Routine oral health check shown for demonstration.',
    vitals: [['Weight', '4.4 kg'], ['Temperature', '38.2 °C'], ['Heart rate', '110 bpm'], ['Respiratory rate', '24/min']],
    assessment: ['Sample dental notes for UI preview only.'],
    plan: ['Record real oral examination and home-care recommendations during an actual visit.'],
  },
};

const styles = `
  .patient-records-page { min-height: 100%; background: #f5f9fa; color: #174253; font-family: 'DM Sans', sans-serif; }
  .patient-records-page * { box-sizing: border-box; }
  .patient-records-page .records-topbar { min-height: 58px; padding: 7px 18px; background: #fff; }
  .patient-records-page .records-topbar h2 { margin: 0 !important; color: #064b50 !important; font-size: 24px !important; font-weight: 750 !important; line-height: 1.15 !important; }
  .patient-records-page .records-topbar p { margin: 4px 0 0 !important; color: #263238 !important; font-size: 14px !important; line-height: 1.3 !important; }
  .patient-records-page .records-topbar > div:last-child { gap: 10px; }
  .patient-records-page .records-topbar [style*="border-radius: 30px"] { background: #f3f8fa; border: 0 !important; }
  .patient-records-page .records-topbar h2 { font-size: 22px !important; }
  .patient-records-page .records-topbar p { font-size: 13px !important; }
  .patient-records-page .records-content { padding: 12px 13px 10px; }
  .patient-records-page .records-add { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 34px; padding: 0 14px; border: 0; border-radius: 7px; background: #007867; color: #fff; font: inherit; font-size: 12px; font-weight: 650; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 5px #00786722; }
  .patient-records-page .records-add svg { width: 13px; height: 13px; }
  .patient-records-page .records-stats { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 8px; margin-bottom: 10px; }
  .patient-records-page .records-stat { display: flex; align-items: center; gap: 10px; min-width: 0; min-height: 64px; padding: 8px 10px; border: 1px solid #e2edf1; border-radius: 9px; background: #fff; box-shadow: 0 2px 7px #173f4b06; }
  .patient-records-page .records-stat-icon { display: grid; flex: 0 0 37px; width: 37px; height: 37px; place-items: center; border-radius: 50%; }
  .patient-records-page .records-stat-icon svg { width: 18px; height: 18px; }
  .patient-records-page .stat-blue { background: #e1efff; color: #1970db; }
  .patient-records-page .stat-green { background: #d9f7eb; color: #009b67; }
  .patient-records-page .stat-amber { background: #fff0d4; color: #ed9300; }
  .patient-records-page .stat-purple { background: #f0e3ff; color: #8739df; }
  .patient-records-page .records-stat-label { overflow: hidden; color: #202a30; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
  .patient-records-page .records-stat-value { margin-top: 1px; color: #064b50; font-size: 19px; font-weight: 750; line-height: 1.2; }
  .patient-records-page .records-stat-note { margin-top: 2px; color: #3f4b52; font-size: 11px; white-space: nowrap; }
  .patient-records-page .records-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 13px; padding: 5px; border: 1px solid #e2edf1; border-radius: 9px; background: #fff; box-shadow: 0 2px 7px #173f4b06; }
  .patient-records-page .records-search { display: flex; align-items: center; gap: 8px; height: 36px; min-width: 220px; flex: 1; padding: 0 12px; border: 1px solid #e3edf1; border-radius: 7px; color: #536571; }
  .patient-records-page .records-search svg { flex: 0 0 16px; width: 16px; height: 16px; }
  .patient-records-page .records-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: #171d21; font: inherit; font-size: 13px; }
  .patient-records-page .records-search input::placeholder { color: #3f4b52; opacity: 1; }
  .patient-records-page .records-select { width: 118px; height: 36px; padding: 0 9px; border: 1px solid #e3edf1; border-radius: 7px; background: #fff; color: #171d21; font: inherit; font-size: 11px; }
  .patient-records-page .records-sort { width: 150px; }
  .patient-records-page .records-view-toggle { display: flex; gap: 3px; margin-left: auto; padding: 2px; border: 1px solid #e4edf0; border-radius: 6px; }
  .patient-records-page .records-view-toggle button { display: grid; width: 20px; height: 20px; place-items: center; padding: 0; border: 0; border-radius: 4px; background: #fff; color: #91a7b4; cursor: pointer; }
  .patient-records-page .records-view-toggle button[aria-pressed="true"] { background: #007b69; color: #fff; }
  .patient-records-page .records-view-toggle svg { width: 12px; height: 12px; }
  .patient-records-page .records-list-heading { margin: 0 2px 8px; color: #111820; font-size: 16px; font-weight: 750; }
  .patient-records-page .records-table-wrap { overflow-x: auto; border: 1px solid #dfebef; border-radius: 9px; background: #fff; box-shadow: 0 2px 7px #173f4b06; }
  .patient-records-page .records-table { width: 100%; min-width: 1320px; border-collapse: collapse; text-align: left; }
  .patient-records-page .records-table th { height: 40px; padding: 0 11px; border-bottom: 1px solid #e6eff2; background: #f6fafb; color: #171d21; font-size: 12px; font-weight: 650; white-space: nowrap; }
  .patient-records-page .records-table td { height: 68px; padding: 6px 11px; border-bottom: 1px solid #e9f0f2; color: #202a30; font-size: 13px; vertical-align: middle; }
  .patient-records-page .records-table tbody tr:last-child td { border-bottom: 0; }
  .patient-records-page .records-table th:nth-child(1) { width: 16%; }
  .patient-records-page .records-table th:nth-child(2) { width: 16%; }
  .patient-records-page .records-table th:nth-child(3) { width: 11%; }
  .patient-records-page .records-table th:nth-child(4) { width: 10%; }
  .patient-records-page .records-table th:nth-child(5) { width: 11%; }
  .patient-records-page .records-table th:nth-child(6) { width: 11%; }
  .patient-records-page .records-table th:nth-child(7) { width: 10%; }
  .patient-records-page .records-table th:nth-child(8) { width: 15%; }
  .patient-records-page .records-patient { display: flex; align-items: center; gap: 9px; min-width: 125px; }
  .patient-records-page .records-avatar { display: block; flex: 0 0 46px; width: 46px; height: 46px; overflow: hidden; border: 1px solid #e8eeeb; border-radius: 50%; object-fit: cover; }
  .patient-records-page .records-table tbody tr:nth-child(odd) .records-avatar[src*="healthy-pets"] { object-position: 28% 56%; }
  .patient-records-page .records-table tbody tr:nth-child(even) .records-avatar[src*="healthy-pets"] { object-position: 68% 55%; }
  .patient-records-page .records-patient-name { color: #111820; font-size: 15px; font-weight: 750; }
  .patient-records-page .records-patient-id { margin-top: 3px; color: #303a40; font-size: 11px; white-space: nowrap; }
  .patient-records-page .records-pet-info { display: grid; gap: 3px; }
  .patient-records-page .records-info-line { display: flex; align-items: center; gap: 6px; color: #202a30; font-size: 12px; line-height: 1.3; white-space: nowrap; }
  .patient-records-page .records-info-line svg { flex: 0 0 10px; width: 10px; height: 10px; color: #65839c; }
  .patient-records-page .records-owner { display: flex; align-items: flex-start; gap: 6px; color: #202a30; font-size: 12px; line-height: 1.35; }
  .patient-records-page .records-owner svg { flex: 0 0 10px; width: 10px; height: 10px; margin-top: 1px; color: #67869e; }
  .patient-records-page .records-date { display: flex; align-items: flex-start; gap: 6px; color: #202a30; font-size: 12px; line-height: 1.35; white-space: nowrap; }
  .patient-records-page .records-date svg { flex: 0 0 10px; width: 10px; height: 10px; color: #63819a; }
  .patient-records-page .records-appointment { color: #8197a5; }
  .patient-records-page .records-appointment.due { color: #da8500; }
  .patient-records-page .records-alert-none { display: flex; align-items: center; gap: 5px; color: #303a40; font-size: 11px; }
  .patient-records-page .records-alert-none svg { width: 10px; height: 10px; }
  .patient-records-page .records-alert { display: inline-flex; align-items: center; gap: 4px; padding: 5px 7px; border-radius: 12px; background: #fff0f1; color: #d94b59; font-size: 10px; white-space: nowrap; }
  .patient-records-page .records-alert svg { width: 9px; height: 9px; }
  .patient-records-page .records-view { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 104px; height: 34px; padding: 0 9px; border: 0; border-radius: 6px; background: #007967; color: #fff; font: inherit; font-size: 11px; font-weight: 650; cursor: pointer; white-space: nowrap; }
  .patient-records-page .records-view svg { width: 11px; height: 11px; }
  .patient-records-page .records-footer { display: flex; align-items: center; justify-content: space-between; min-height: 34px; padding: 0 9px; border-top: 1px solid #e9f0f2; color: #303a40; font-size: 10px; }
  .patient-records-page .records-pagination { display: flex; align-items: center; gap: 5px; }
  .patient-records-page .records-pagination button, .patient-records-page .records-pagination span { display: grid; min-width: 18px; height: 18px; place-items: center; padding: 0 4px; border: 1px solid #e2ebee; border-radius: 4px; background: #fff; color: #7992a0; font: inherit; }
  .patient-records-page .records-pagination button { cursor: pointer; }
  .patient-records-page .records-pagination span { border-color: #007967; background: #007967; color: #fff; }
  .patient-records-page .records-empty { padding: 30px !important; text-align: center; color: #8298a5 !important; }
  .patient-records-page .records-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(210px,1fr)); gap: 10px; padding: 10px; }
  .patient-records-page .records-grid-card { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 10px; border: 1px solid #e6eff2; border-radius: 8px; background: #fff; }
  .patient-records-page .records-grid-card > div:nth-child(2) { flex: 1; min-width: 0; }
  .patient-records-page .records-grid-meta { margin-top: 4px; color: #303a40; font-size: 14px; }
  .patient-records-page .detail-integrated-tab { min-width: 0; overflow-x: auto; }
  .patient-records-page .records-detail-topbar { min-height: 40px; padding: 4px 18px; }
  .patient-records-page .records-detail-topbar > div:first-child { display: block; }
  .patient-records-page .records-detail-topbar > div:last-child { margin-left: auto; }
  .patient-records-page .records-detail-topbar .records-back { margin: 0; }
  .patient-records-page .records-detail { padding: 10px 18px 20px; color: #173d4a; }
  .patient-records-page:has(.visit-detail-panel) .records-detail,
  .patient-records-page:has(.visit-detail-panel) .records-detail-topbar { width: calc(100% - 460px); }
  .patient-records-page .records-back { display: inline-flex; align-items: center; gap: 6px; margin: 0 0 12px; padding: 0; border: 0; background: transparent; color: #087f70; font: inherit; font-size: 14px; cursor: pointer; }
  .patient-records-page .records-back svg { width: 15px; height: 15px; transform: rotate(180deg); }
  .patient-records-page .detail-hero { display: flex; align-items: center; gap: 15px; min-width: 0; }
  .patient-records-page .detail-avatar { width: 88px; height: 88px; flex: 0 0 88px; border: 1px solid #e2ece9; border-radius: 50%; object-fit: cover; }
  .patient-records-page .detail-title { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
  .patient-records-page .detail-title h1 { margin: 0; color: #083f43; font-size: 28px; line-height: 1.15; }
  .patient-records-page .detail-meta { margin-top: 6px; color: #263238; font-size: 14px; }
  .patient-records-page .detail-meta-row { display: flex; flex-wrap: wrap; gap: 9px 18px; margin-top: 8px; color: #263238; font-size: 14px; }
  .patient-records-page .detail-meta-row span { display: inline-flex; align-items: center; gap: 6px; }
  .patient-records-page .detail-meta-row svg { width: 14px; height: 14px; color: #547386; }
  .patient-records-page .detail-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; margin-left: auto; }
  .patient-records-page .detail-action { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 34px; padding: 0 11px; border: 1px solid #dce8ec; border-radius: 7px; background: #fff; color: #263238; font: inherit; font-size: 12px; cursor: pointer; white-space: nowrap; }
  .patient-records-page .detail-action svg { width: 14px; height: 14px; }
  .patient-records-page .detail-action.primary { border-color: #007967; background: #007967; color: #fff; }
  .patient-records-page .detail-alert-banner { display: flex; align-items: flex-start; gap: 10px; margin: 2px 0 12px; padding: 10px 13px; border: 1px solid #ffd4d5; border-radius: 11px; background: #fff0f1; color: #c73742; font-size: 13px; }
  .patient-records-page .detail-alert-label { font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
  .patient-records-page .detail-summary { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; margin: 13px 0 11px; }
  .patient-records-page .detail-summary-card { min-height: 68px; padding: 12px; border: 1px solid #e1ebef; border-radius: 9px; background: #fff; }
  .patient-records-page .detail-summary-label { color: #4c6674; font-size: 12px; }
  .patient-records-page .detail-summary-value { margin-top: 4px; color: #152f3a; font-size: 15px; font-weight: 700; }
  .patient-records-page .detail-summary-note { margin-top: 3px; color: #40545e; font-size: 11px; }
  .patient-records-page .detail-tabs { display: flex; overflow-x: auto; gap: 0; margin: 0 0 12px; border: 1px solid #e1ebef; border-radius: 9px; background: #fff; }
  .patient-records-page .detail-tab { flex: 0 0 auto; padding: 11px 13px; border: 0; border-right: 1px solid #edf2f3; background: transparent; color: #263b45; font: inherit; font-size: 12px; cursor: pointer; white-space: nowrap; }
  .patient-records-page .detail-tab.active { background: #007967; color: #fff; }
  .patient-records-page .detail-columns { display: grid; grid-template-columns: 1.05fr 1fr; gap: 12px; }
  .patient-records-page .detail-column { display: grid; align-content: start; gap: 12px; min-width: 0; }
  .patient-records-page .detail-panel { padding: 13px; border: 1px solid #e1ebef; border-radius: 9px; background: #fff; }
  .patient-records-page .detail-panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; color: #152f3a; font-size: 15px; font-weight: 700; }
  .patient-records-page .detail-edit { display: inline-flex; align-items: center; gap: 5px; padding: 6px 8px; border: 1px solid #dce8ec; border-radius: 6px; background: #fff; color: #263b45; font: inherit; font-size: 11px; cursor: pointer; }
  .patient-records-page .detail-edit svg { width: 12px; height: 12px; }
  .patient-records-page .detail-information { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 13px 16px; }
  .patient-records-page .detail-field-label { color: #4b626e; font-size: 11px; }
  .patient-records-page .detail-field-value { margin-top: 3px; color: #172e39; font-size: 13px; font-weight: 600; }
  .patient-records-page .detail-alert-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 13px; padding: 9px; border: 1px solid #ffd8da; border-radius: 8px; background: #fff5f5; }
  .patient-records-page .detail-alert-pill { padding: 5px 8px; border: 1px solid #ffd8da; border-radius: 14px; background: #fff; color: #b52e38; font-size: 11px; }
  .patient-records-page .detail-owner { display: grid; grid-template-columns: 52px 1fr 1fr; align-items: center; gap: 12px; }
  .patient-records-page .detail-owner-avatar { display: grid; width: 48px; height: 48px; place-items: center; border-radius: 50%; background: #007967; color: #fff; }
  .patient-records-page .detail-owner-avatar svg { width: 22px; height: 22px; }
  .patient-records-page .detail-owner-info { display: grid; gap: 5px; color: #263b45; font-size: 12px; }
  .patient-records-page .detail-appointment { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px; border-radius: 8px; background: #effaf7; color: #263b45; }
  .patient-records-page .detail-appointment-date { padding: 8px; border-radius: 7px; background: #d9f7eb; color: #087f70; text-align: center; font-size: 12px; font-weight: 700; }
  .patient-records-page .detail-appointment-name { font-size: 13px; font-weight: 700; }
  .patient-records-page .detail-appointment-meta { margin-top: 4px; color: #40545e; font-size: 11px; }
  .patient-records-page .detail-visits { display: grid; }
  .patient-records-page .detail-visit { display: grid; grid-template-columns: 85px 1fr auto; align-items: center; gap: 10px; min-height: 49px; border-top: 1px solid #edf2f3; color: #263b45; font-size: 12px; }
  .patient-records-page .detail-visit-date { font-size: 11px; }
  .patient-records-page .detail-visit-doctor { margin-top: 3px; color: #4b626e; font-size: 11px; }
  .patient-records-page .detail-visit-status { padding: 0; border-radius: 0; background: transparent; color: #526663; font-size: 12px; font-weight: 600; }
  .patient-records-page .detail-visit-button { display: grid; width: 100%; grid-template-columns: 85px minmax(0, 1fr) auto auto 18px; align-items: center; gap: 10px; min-height: 62px; padding: 7px; border: 0; border-top: 1px solid #edf2f3; background: #fff; color: #263b45; text-align: left; font: inherit; font-size: 14px; cursor: pointer; }
  .patient-records-page .detail-visit-button:hover,
  .patient-records-page .detail-visit-button.selected { background: #eaf7f4; }
  .patient-records-page .detail-visit-button.selected { box-shadow: inset 3px 0 #078673; }
  .patient-records-page .detail-visit-button > span:first-child { color: #4b626e; font-size: 13px; }
  .patient-records-page .detail-visit-button > span:nth-child(2) { min-width: 0; }
  .patient-records-page .detail-visit-button > span:nth-child(2) strong { display: block; color: #173d4a; font-size: 14px; }
  .patient-records-page .detail-visit-button > span:nth-child(2) small { display: block; margin-top: 4px; color: #4b626e; font-size: 13px; }
  .patient-records-page .visit-sample-label { display: inline-block; width: fit-content; margin-top: 5px; padding: 2px 6px; border-radius: 5px; background: #fff4d6; color: #805b00; font-size: 10px !important; font-weight: 700; }
  .patient-records-page .visit-type-pill { justify-self: start; color: #4b626e; font-size: 13px; font-weight: 500; white-space: nowrap; }
  .patient-records-page .visit-list-status { gap: 7px; padding: 0; border-radius: 0; background: transparent; font-size: 13px; font-weight: 600; }
  .patient-records-page .visit-list-status .status-indicator-dot { width: 8px; height: 8px; flex-basis: 8px; }
  .patient-records-page .detail-visit-chevron { color: #758b91; font-size: 18px; }
  .patient-records-page .visit-detail-panel { position: fixed; z-index: 35; inset: 0 0 0 auto; display: flex; width: 460px; flex-direction: column; border-left: 1px solid #dce9e6; background: #fff; color: #173d4a; box-shadow: -8px 0 24px #18302412; }
  .patient-records-page .visit-detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px 19px 14px; border-bottom: 1px solid #e5eeeb; }
  .patient-records-page .visit-detail-back { display: inline-flex; min-height: 38px; align-items: center; gap: 7px; margin: -5px 0 9px; padding: 0; border: 0; background: transparent; color: #078673; font: inherit; font-size: 14px; cursor: pointer; }
  .patient-records-page .visit-detail-back svg { width: 16px; height: 16px; transform: rotate(180deg); }
  .patient-records-page .visit-detail-title-row { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }
  .patient-records-page .visit-detail-title-row h2 { margin: 0; color: #173d4a; font-size: 20px; line-height: 1.3; }
  .patient-records-page .visit-detail-meta { margin-top: 6px; color: #536d76; font-size: 13px; }
  .patient-records-page .visit-detail-status { gap: 7px; padding: 0; border-radius: 0; background: transparent; font-size: 14px; font-weight: 600; }
  .patient-records-page .visit-detail-status .status-indicator-dot { width: 8px; height: 8px; flex-basis: 8px; }
  .patient-records-page .visit-detail-close { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; border: 0; border-radius: 8px; background: transparent; color: #526b70; cursor: pointer; }
  .patient-records-page .visit-detail-close svg { width: 19px; height: 19px; }
  .patient-records-page .visit-detail-body { flex: 1; overflow-y: auto; padding: 17px 19px; }
  .patient-records-page .visit-detail-intro { display: grid; gap: 14px; padding-bottom: 15px; border-bottom: 1px solid #e9efed; }
  .patient-records-page .visit-detail-field { display: grid; gap: 5px; }
  .patient-records-page .visit-detail-field span { color: #536d76; font-size: 14px; font-weight: 600; }
  .patient-records-page .visit-detail-field strong { color: #173d4a; font-size: 15px; font-weight: 600; line-height: 1.45; }
  .patient-records-page .visit-detail-exam { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 15px 0; border-bottom: 1px solid #e9efed; }
  .patient-records-page .visit-detail-section h3 { margin: 0 0 9px; color: #23434b; font-size: 15px; }
  .patient-records-page .visit-detail-vitals { display: grid; gap: 9px; }
  .patient-records-page .visit-detail-vitals div { display: flex; justify-content: space-between; gap: 8px; color: #536d76; font-size: 14px; }
  .patient-records-page .visit-detail-vitals strong { color: #173d4a; font-size: 14px; font-weight: 600; white-space: nowrap; }
  .patient-records-page .visit-detail-list { display: grid; gap: 8px; margin: 0; padding-left: 19px; color: #425b62; font-size: 14px; line-height: 1.55; }
  .patient-records-page .visit-detail-section { padding: 15px 0; border-bottom: 1px solid #e9efed; }
  .patient-records-page .visit-attachment { display: flex; align-items: center; gap: 10px; min-height: 42px; color: #087f70; font-size: 14px; }
  .patient-records-page .visit-attachment svg { width: 18px; height: 18px; flex: 0 0 auto; }
  .patient-records-page .visit-attachment small { margin-left: auto; color: #789099; font-size: 12px; }
  .patient-records-page .visit-detail-empty { margin: 0; color: #61777d; font-size: 14px; line-height: 1.5; }
  .patient-records-page .vaccine-records-wrap { overflow-x: auto; border: 1px solid #e0ebe8; border-radius: 10px; background: #fff; }
  .patient-records-page .vaccine-records-table { width: 100%; min-width: 900px; border-collapse: collapse; text-align: left; }
  .patient-records-page .vaccine-records-table th { padding: 11px 12px; border-bottom: 1px solid #e1e8e6; background: #f6f8f8; color: #526762; font-size: 12px; font-weight: 650; white-space: nowrap; }
  .patient-records-page .vaccine-records-table td { padding: 12px; border-bottom: 1px solid #e5ebea; color: #263d39; font-size: 12px; white-space: nowrap; }
  .patient-records-page .vaccine-records-table tbody tr:last-child td { border-bottom: 0; }
  .patient-records-page .vaccine-records-table tbody tr { cursor: pointer; transition: background .15s ease; }
  .patient-records-page .vaccine-records-table tbody tr:hover,
  .patient-records-page .vaccine-records-table tbody tr.selected { background: #f2f9f6; }
  .patient-records-page .vaccine-records-table tbody tr:focus-visible { outline: 2px solid #078673; outline-offset: -2px; }
  .patient-records-page .vaccine-name { display: block; color: #183b36; font-size: 13px; font-weight: 700; }
  .patient-records-page .vaccine-secondary { display: block; margin-top: 4px; color: #758580; font-size: 11px; }
  .patient-records-page .vaccine-due-state,
  .patient-records-page .vaccine-verification-state { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
  .patient-records-page .vaccine-due-state.up-to-date,
  .patient-records-page .vaccine-verification-state.verified { color: #087b43; }
  .patient-records-page .vaccine-due-state.overdue,
  .patient-records-page .vaccine-verification-state.pending { color: #b42318; }
  .patient-records-page .vaccine-due-state.superseded,
  .patient-records-page .vaccine-due-state.unknown { color: #657670; }
  .patient-records-page .vaccine-status-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .patient-records-page .vaccine-row-arrow { color: #758b91; font-size: 19px; line-height: 1; transition: transform .15s ease, color .15s ease; }
  .patient-records-page .vaccine-records-table tr:hover .vaccine-row-arrow { transform: translateX(3px); color: #087967; }
  .patient-records-page .vaccine-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
  .patient-records-page .vaccine-filter-button { display: inline-flex; align-items: center; gap: 7px; min-height: 38px; padding: 0 13px; border: 1px solid #dce6e3; border-radius: 999px; background: #fff; color: #36544d; font: inherit; font-size: 13px; cursor: pointer; }
  .patient-records-page .vaccine-filter-button.active { border-color: #075e4d; background: #075e4d; color: #fff; }
  .patient-records-page .vaccine-filter-count { opacity: .8; font-size: 12px; }
  .patient-records-page .vaccine-overdue-notice { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 10px 0 12px; padding: 10px 13px; border: 1px solid #efd181; border-radius: 10px; background: #fff4c9; color: #86540a; font-size: 13px; line-height: 1.5; }
  .patient-records-page .vaccine-overdue-notice strong { font-weight: 750; }
  .patient-records-page .vaccine-overdue-action { flex: 0 0 auto; min-height: 36px; padding: 0 12px; border: 1px solid #e3d4aa; border-radius: 8px; background: #fff; color: #81500a; font: inherit; font-size: 12px; font-weight: 650; cursor: pointer; }
  @media (max-width: 640px) {
    .patient-records-page .vaccine-overdue-notice { align-items: flex-start; flex-direction: column; }
  }
  .patient-records-page .vaccine-mock-label { display: inline-flex; margin-left: 7px; padding: 2px 6px; border-radius: 999px; background: #fff4d6; color: #805b00; font-size: 10px; font-weight: 700; vertical-align: middle; }
  .patient-records-page .vaccine-share-state { display: inline-flex; align-items: center; gap: 5px; color: #62736f; font-size: 12px; font-weight: 600; }
  .patient-records-page .vaccine-share-state.shared { color: #087b43; }
  .patient-records-page .vaccine-detail-tabs { display: flex; gap: 5px; padding: 0 18px; border-bottom: 1px solid #e5eeeb; }
  .patient-records-page .vaccine-detail-tabs button { min-height: 42px; padding: 0 12px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #627779; font: inherit; font-size: 13px; cursor: pointer; }
  .patient-records-page .vaccine-detail-tabs button.active { border-bottom-color: #078673; color: #087568; font-weight: 700; }
  .patient-records-page .vaccine-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 18px; padding: 17px 19px; }
  .patient-records-page .vaccine-detail-field { display: grid; min-width: 0; gap: 5px; }
  .patient-records-page .vaccine-detail-field span { color: #647a7c; font-size: 12px; }
  .patient-records-page .vaccine-detail-field strong { overflow-wrap: anywhere; color: #23434b; font-size: 14px; font-weight: 650; }
  .patient-records-page .vaccine-review-warning { display: flex; align-items: flex-start; gap: 9px; margin: 0 18px 14px; padding: 11px 12px; border: 1px solid #f2d483; border-radius: 9px; background: #fffbeb; color: #9a5a06; font-size: 13px; line-height: 1.45; }
  .patient-records-page .vaccine-review-warning svg { width: 17px; height: 17px; flex: 0 0 auto; }
  .patient-records-page .vaccine-detail-actions { display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 18px; border-top: 1px solid #e9efed; }
  .patient-records-page .vaccine-detail-actions button { min-height: 40px; padding: 0 13px; border: 1px solid #cfe3dd; border-radius: 7px; background: #fff; color: #087568; font: inherit; font-size: 13px; font-weight: 650; cursor: pointer; }
  .patient-records-page .vaccine-detail-actions button.primary { border-color: #078673; background: #078673; color: #fff; }
  .patient-records-page .vaccine-detail-actions button:disabled { opacity: .55; cursor: not-allowed; }
  .patient-records-page .vaccine-audit-list { display: grid; gap: 9px; padding: 16px 18px; }
  .patient-records-page .vaccine-audit-item { display: flex; justify-content: space-between; gap: 12px; padding: 11px 12px; border: 1px solid #e5eeeb; border-radius: 8px; background: #f8fbfa; color: #38555a; font-size: 13px; }
  .patient-records-page .vaccine-audit-item time { color: #74898c; text-align: right; white-space: nowrap; }
  .patient-records-page .vaccine-upload-input { display: block; max-width: 100%; margin-top: 9px; color: #526b70; font-size: 13px; }
  .patient-records-page .vaccine-verify-note { margin: 0 0 14px; color: #61777d; font-size: 13px; line-height: 1.5; }
  .patient-records-page .vaccine-verify-attestation { display: flex; align-items: flex-start; gap: 10px; margin-top: 15px; padding: 12px; border: 1px solid #dce9e6; border-radius: 9px; background: #f8fbfa; color: #38555a; font-size: 13px; line-height: 1.5; cursor: pointer; }
  .patient-records-page .vaccine-verify-attestation input { width: 18px; height: 18px; flex: 0 0 18px; margin: 1px 0 0; accent-color: #087f70; }
  .patient-records-page .vaccine-verify-meaning { margin-top: 13px; padding: 11px 12px; border: 1px solid #b7d5ff; border-radius: 9px; background: #eff6ff; color: #1d4ed8; font-size: 12px; line-height: 1.5; }
  .patient-records-page .vaccine-verify-meaning strong { display: block; margin-bottom: 4px; }
  .patient-records-page .vaccine-verify-error { margin-top: 11px; color: #b42318; font-size: 13px; }
  .patient-records-page .visit-owner-sharing { display: flex; align-items: flex-start; gap: 11px; margin-top: 14px; padding: 13px; border: 1px solid #d7eee7; border-radius: 10px; background: #eff9f6; }
  .patient-records-page .visit-owner-sharing > span { display: grid; width: 32px; height: 32px; flex: 0 0 32px; place-items: center; border-radius: 50%; background: #d8f1e9; color: #078673; }
  .patient-records-page .visit-owner-sharing > span svg { width: 17px; height: 17px; }
  .patient-records-page .visit-owner-sharing-copy { flex: 1; min-width: 0; }
  .patient-records-page .visit-owner-sharing-copy strong { display: block; color: #087568; font-size: 14px; }
  .patient-records-page .visit-owner-sharing-copy p { margin: 4px 0 0; color: #56716c; font-size: 13px; line-height: 1.5; }
  .patient-records-page .visit-owner-sharing button { min-height: 40px; padding: 0 11px; border: 1px solid #d1e9e1; border-radius: 7px; background: #fff; color: #087568; font: inherit; font-size: 12px; font-weight: 650; cursor: pointer; white-space: nowrap; }
  @media (max-width: 900px) {
    .patient-records-page:has(.visit-detail-panel) .records-detail,
    .patient-records-page:has(.visit-detail-panel) .records-detail-topbar,
    .patient-records-page:has(.vaccine-detail-panel) .records-detail,
    .patient-records-page:has(.vaccine-detail-panel) .records-detail-topbar { width: 100%; }
    .patient-records-page .visit-detail-panel { width: min(460px, 100vw); box-shadow: -8px 0 25px #18302424; }
    .patient-records-page .vaccine-detail-panel { width: min(460px, 100vw); box-shadow: -8px 0 25px #18302424; }
  }
  @media (max-width: 480px) {
    .patient-records-page .detail-visit-button { grid-template-columns: 70px minmax(0, 1fr) auto 16px; }
    .patient-records-page .detail-visit-button .visit-type-pill { display: none; }
    .patient-records-page .visit-detail-exam { grid-template-columns: 1fr; }
    .patient-records-page .vaccine-detail-grid { grid-template-columns: 1fr; }
  }
  .patient-records-page .detail-quick-actions { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 8px; }
  .patient-records-page .detail-quick-actions button { display: grid; justify-items: center; gap: 7px; min-height: 66px; padding: 9px 5px; border: 1px solid #e1ebef; border-radius: 8px; background: #fff; color: #254652; font: inherit; font-size: 11px; cursor: pointer; }
  .patient-records-page .detail-quick-actions svg { width: 18px; height: 18px; color: #087f70; }
  .patient-records-page .records-status-system { gap: 6px; padding: 0; border-radius: 0; background: transparent; font-size: 12px; font-weight: 600; line-height: 1.2; }
  .patient-records-page .records-status-system .status-indicator-dot { width: 8px; height: 8px; flex-basis: 8px; }
  .patient-records-page .patient-edit-backdrop { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; overflow-y: auto; padding: 20px; background: rgba(12,30,36,.36); }
  .patient-records-page .patient-edit-dialog { display: flex; flex-direction: column; width: min(670px,100%); max-height: calc(100vh - 40px); overflow: hidden; border: 1px solid #dfe9ed; border-radius: 11px; background: #fff; box-shadow: 0 20px 60px rgba(14,43,53,.22); color: #193a47; }
  .patient-records-page .patient-edit-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 15px 20px 12px; border-bottom: 1px solid #e6eef1; }
  .patient-records-page .patient-edit-header h2 { margin: 0; color: #193a47; font-size: 20px; }
  .patient-records-page .patient-edit-header p { margin: 4px 0 0; color: #526c79; font-size: 12px; }
  .patient-records-page .patient-edit-close { display: grid; width: 30px; height: 30px; flex: 0 0 auto; place-items: center; border: 0; border-radius: 6px; background: transparent; color: #45616d; cursor: pointer; }
  .patient-records-page .patient-edit-close svg { width: 17px; height: 17px; }
  .patient-records-page .patient-edit-body { overflow-y: auto; padding: 12px 18px; }
  .patient-records-page .patient-edit-summary { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 9px; border: 1px solid #e5eeef; border-radius: 8px; background: #f3f8f7; }
  .patient-records-page .patient-edit-summary img { width: 52px; height: 52px; flex: 0 0 52px; border-radius: 50%; object-fit: cover; }
  .patient-records-page .patient-edit-summary-name { color: #1c414d; font-size: 15px; font-weight: 700; }
  .patient-records-page .patient-edit-summary-meta { margin-top: 3px; color: #425f6c; font-size: 11px; }
  .patient-records-page .patient-edit-summary-meta span { padding: 0 5px; color: #087f70; }
  .patient-records-page .patient-edit-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px 13px; }
  .patient-records-page .patient-edit-field { display: grid; gap: 5px; min-width: 0; color: #294956; font-size: 11px; font-weight: 650; }
  .patient-records-page .patient-edit-field.wide { grid-column: 1 / -1; }
  .patient-records-page .patient-edit-field input, .patient-records-page .patient-edit-field select, .patient-records-page .patient-edit-field textarea { width: 100%; min-width: 0; min-height: 34px; padding: 7px 10px; border: 1px solid #cfdee5; border-radius: 6px; outline: none; background: #fff; color: #243f4b; font: inherit; font-size: 12px; font-weight: 400; }
  .patient-records-page .patient-edit-field input:focus, .patient-records-page .patient-edit-field select:focus, .patient-records-page .patient-edit-field textarea:focus { border-color: #129780; box-shadow: 0 0 0 2px #12978020; }
  .patient-records-page .patient-edit-field textarea { min-height: 48px; resize: vertical; }
  .patient-records-page .patient-edit-field input:disabled { background: #f0f3f4; color: #6b818b; }
  .patient-records-page .patient-edit-required { color: #d83740; }
  .patient-records-page .patient-edit-error { grid-column: 1 / -1; color: #bd2632; font-size: 12px; }
  .patient-records-page .patient-edit-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 10px 18px; border-top: 1px solid #e6eef1; }
  .patient-records-page .patient-edit-footer button { min-height: 34px; padding: 0 14px; border: 1px solid #d2e0e5; border-radius: 6px; background: #fff; color: #365663; font: inherit; font-size: 12px; font-weight: 650; cursor: pointer; }
  .patient-records-page .patient-edit-footer button[type="submit"] { border-color: #087f70; background: #087f70; color: #fff; }
  .patient-records-page .owner-edit-dialog { width: min(680px,100%); }
  .patient-records-page .owner-edit-header h2 { font-size: 22px; }
  .patient-records-page .owner-edit-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 13px 18px; }
  .patient-records-page .owner-edit-field { display: grid; gap: 6px; min-width: 0; color: #213d47; font-size: 13px; font-weight: 650; }
  .patient-records-page .owner-edit-field.wide { grid-column: 1 / -1; }
  .patient-records-page .owner-edit-field input,
  .patient-records-page .owner-edit-field select,
  .patient-records-page .owner-edit-field textarea { width: 100%; min-width: 0; min-height: 39px; padding: 8px 11px; border: 1px solid #cfdee5; border-radius: 7px; outline: none; background: #fff; color: #294956; font: inherit; font-size: 13px; font-weight: 400; }
  .patient-records-page .owner-edit-field textarea { min-height: 56px; resize: vertical; }
  .patient-records-page .owner-edit-field input:focus,
  .patient-records-page .owner-edit-field select:focus,
  .patient-records-page .owner-edit-field textarea:focus { border-color: #129780; box-shadow: 0 0 0 2px #12978020; }
  .patient-records-page .owner-edit-required { color: #d83740; }
  .patient-records-page .owner-edit-phone { display: grid; grid-template-columns: 78px minmax(0,1fr); gap: 7px; }
  .patient-records-page .owner-edit-app { display: flex; grid-column: 1 / -1; align-items: center; width: 100%; gap: 12px; padding: 12px; border: 1px solid #e0efeb; border-radius: 8px; background: #f1f8f6; color: #294956; }
  .patient-records-page .owner-edit-app-icon { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 8px; background: #087f70; color: #fff; }
  .patient-records-page .owner-edit-app-icon svg { width: 18px; height: 18px; }
  .patient-records-page .owner-edit-app strong,
  .patient-records-page .owner-edit-app span { display: block; }
  .patient-records-page .owner-edit-app strong { font-size: 13px; }
  .patient-records-page .owner-edit-app span { margin-top: 4px; color: #0a8a6d; font-size: 11px; }
  .patient-records-page .owner-edit-app p { margin-top: 4px; color: #617985; font-size: 11px; }
  .patient-records-page .owner-edit-app-arrow { margin-left: auto; color: #718892; font-size: 22px; }
  .patient-records-page .owner-profile-dialog { width: min(680px,100%); }
  .patient-records-page .owner-profile-header h2 { font-size: 22px; }
  .patient-records-page .owner-profile-header p { font-size: 14px; }
  .patient-records-page .owner-profile-body { padding: 16px 22px; }
  .patient-records-page .owner-profile-summary { display: flex; align-items: center; gap: 13px; padding: 14px; border: 1px solid #dce8e8; border-radius: 11px; background: #f8fbfa; }
  .patient-records-page .owner-profile-avatar { display: grid; width: 60px; height: 60px; flex: 0 0 60px; place-items: center; border-radius: 50%; background: #087f70; color: #fff; }
  .patient-records-page .owner-profile-avatar svg { width: 27px; height: 27px; }
  .patient-records-page .owner-profile-summary > div { display: grid; gap: 4px; }
  .patient-records-page .owner-profile-summary > div strong { color: #193a47; font-size: 18px; }
  .patient-records-page .owner-profile-summary > div span { color: #647980; font-size: 14px; }
  .patient-records-page .owner-profile-linked { margin-left: auto; padding: 6px 11px; border-radius: 18px; background: #dcfce7; color: #078442; font-size: 12px; font-weight: 650; white-space: nowrap; }
  .patient-records-page .owner-profile-fields { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 15px 24px; padding: 17px 0; }
  .patient-records-page .owner-profile-fields > div { display: grid; gap: 4px; min-width: 0; }
  .patient-records-page .owner-profile-fields > div > span { color: #71858a; font-size: 13px; }
  .patient-records-page .owner-profile-fields > div > strong { overflow-wrap: anywhere; color: #193a40; font-size: 14px; font-weight: 600; }
  .patient-records-page .owner-profile-pets-heading { padding: 0 0 7px; border-bottom: 1px solid #dfe8e9; color: #193a40; font-size: 14px; font-weight: 700; }
  .patient-records-page .owner-profile-pet { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
  .patient-records-page .owner-profile-pet-avatar { display: grid; width: 44px; height: 44px; flex: 0 0 44px; place-items: center; border-radius: 50%; background: #bd8b45; color: #fff; font-size: 16px; }
  .patient-records-page .owner-profile-pet > div { display: grid; flex: 1; gap: 4px; }
  .patient-records-page .owner-profile-pet > div strong { color: #193a40; font-size: 14px; }
  .patient-records-page .owner-profile-pet > div span { color: #647980; font-size: 12px; }
  .patient-records-page .owner-profile-footer { padding: 12px 18px; }
  .patient-records-page .owner-profile-footer button:last-child { border-color: #087f70; background: #087f70; color: #fff; }
  .patient-records-page .import-image-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 18px; }
  .patient-records-page .export-report-dialog { width: min(760px, 100%); max-height: calc(100vh - 24px); border-radius: 16px; }
  .patient-records-page .export-report-body { display: grid; gap: 14px; overflow-y: auto; padding: 16px 20px; }
  .patient-records-page .export-report-section { overflow: hidden; border: 1px solid #e0e9e6; border-radius: 11px; }
  .patient-records-page .export-report-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 14px; background: #edf6f3; }
  .patient-records-page .export-report-section-heading h3 { margin: 0; color: #173d37; font-size: 15px; }
  .patient-records-page .export-report-section-heading p { margin: 3px 0 0; color: #607873; font-size: 12px; }
  .patient-records-page .export-report-check-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; padding: 10px; }
  .patient-records-page .export-report-check { display: flex; min-height: 44px; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid #dfe8e5; border-radius: 9px; color: #173d37; font-size: 13px; cursor: pointer; }
  .patient-records-page .export-report-check input, .patient-records-page .export-report-select-all input, .patient-records-page .export-report-notes input { width: 20px; height: 20px; flex: 0 0 20px; accent-color: #087f70; }
  .patient-records-page .export-report-options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 12px; }
  .patient-records-page .export-report-option-label { display: grid; gap: 7px; color: #173d37; font-size: 13px; font-weight: 650; }
  .patient-records-page .export-report-option-label select { width: 100%; min-width: 0; min-height: 46px; padding: 0 12px; border: 1px solid #d6e3df; border-radius: 9px; background: #fff; color: #173d37; font: inherit; font-size: 14px; }
  .patient-records-page .export-report-format-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .patient-records-page .export-report-format-buttons button { min-height: 46px; border: 1px solid #d6e3df; border-radius: 9px; background: #fff; color: #36534c; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
  .patient-records-page .export-report-format-buttons button[aria-pressed="true"] { border-color: #087f70; background: #e7f4f0; color: #075f54; box-shadow: inset 0 0 0 1px #087f70; }
  .patient-records-page .export-report-notes { display: flex; min-height: 48px; align-items: center; gap: 11px; padding: 9px 12px; border: 1px solid #dfe8e5; border-radius: 9px; background: #f5f9f7; color: #173d37; cursor: pointer; }
  .patient-records-page .export-report-notes span { display: grid; gap: 3px; }
  .patient-records-page .export-report-notes strong { font-size: 13px; font-weight: 550; }
  .patient-records-page .export-report-notes small { color: #607873; font-size: 12px; line-height: 1.35; }
  .patient-records-page .export-report-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 20px; border-top: 1px solid #e0e8e6; }
  .patient-records-page .export-report-footer button { min-height: 46px; padding: 0 17px; border: 1px solid #d6e3df; border-radius: 9px; background: #fff; color: #173d37; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
  .patient-records-page .export-report-footer button[type="submit"] { border-color: #087f70; background: #087f70; color: #fff; }
  .patient-records-page .share-owner-dialog { width: min(620px, 100%); max-height: calc(100vh - 32px); border-radius: 14px; }
  .patient-records-page .share-owner-body { display: grid; gap: 9px; overflow-y: auto; padding: 11px 14px; }
  .patient-records-page .share-owner-link-status { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1px solid #d8e9e3; border-radius: 10px; background: #eef7f4; color: #0a6b5d; }
  .patient-records-page .share-owner-link-status strong { display: block; font-size: 13px; }
  .patient-records-page .share-owner-link-status p { margin: 3px 0 0; color: #526b64; font-size: 12px; line-height: 1.4; }
  .patient-records-page .share-owner-record-section { overflow: hidden; border: 1px solid #dfe9e5; border-radius: 10px; }
  .patient-records-page .share-owner-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; }
  .patient-records-page .share-owner-section-heading h3 { margin: 0; color: #173d37; font-size: 14px; }
  .patient-records-page .share-owner-section-actions { display: flex; align-items: center; gap: 9px; }
  .patient-records-page .share-owner-section-actions button { min-height: 34px; padding: 0 9px; border: 1px solid #cddfd9; border-radius: 7px; background: #fff; color: #087f70; font: inherit; font-size: 11px; font-weight: 650; cursor: pointer; white-space: nowrap; }
  .patient-records-page .share-owner-section-actions button:disabled { color: #9aa8a2; cursor: not-allowed; }
  .patient-records-page .share-owner-instructions { margin: 0; padding: 0 10px 8px; color: #607873; font-size: 11px; line-height: 1.4; }
  .patient-records-page .share-owner-record-list { display: grid; gap: 5px; max-height: 210px; overflow-y: auto; padding: 0 8px 8px; }
  .patient-records-page .share-owner-record { display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; align-items: center; gap: 9px; min-height: 50px; padding: 7px 9px; border: 1px solid #dce9e5; border-radius: 9px; background: #f0f8f5; color: #173d37; cursor: pointer; }
  .patient-records-page .share-owner-record input, .patient-records-page .share-owner-private-note input, .patient-records-page .share-owner-notify input { width: 19px; height: 19px; accent-color: #087f70; }
  .patient-records-page .share-owner-record-info { display: grid; min-width: 0; gap: 3px; }
  .patient-records-page .share-owner-record-info strong { overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
  .patient-records-page .share-owner-record-info small { overflow: hidden; color: #607873; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .patient-records-page .share-owner-record time { color: #607873; font-size: 11px; white-space: nowrap; }
  .patient-records-page .share-owner-add-update { margin: 0 8px 9px; padding: 10px; border: 1px dashed #b9d4ce; border-radius: 9px; background: #f8fbfa; }
  .patient-records-page .share-owner-add-update > button { min-height: 38px; padding: 0 11px; border: 1px solid #cddfd9; border-radius: 8px; background: #fff; color: #087f70; font: inherit; font-size: 12px; font-weight: 650; cursor: pointer; }
  .patient-records-page .share-owner-add-update-form { display: grid; gap: 9px; }
  .patient-records-page .share-owner-add-update-form select, .patient-records-page .share-owner-add-update-form input, .patient-records-page .share-owner-add-update-form textarea { width: 100%; min-height: 40px; padding: 8px 10px; border: 1px solid #d6e3df; border-radius: 8px; background: #fff; color: #173d37; font: inherit; font-size: 13px; }
  .patient-records-page .share-owner-add-update-form textarea { min-height: 64px; resize: vertical; }
  .patient-records-page .share-owner-add-update-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .patient-records-page .share-owner-add-update-actions button { min-height: 38px; padding: 0 11px; border: 1px solid #d6e3df; border-radius: 8px; background: #fff; color: #36534c; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
  .patient-records-page .share-owner-add-update-actions button[type="submit"] { border-color: #087f70; background: #087f70; color: #fff; }
  .patient-records-page .share-owner-message { display: grid; gap: 6px; color: #087f70; font-size: 13px; font-weight: 650; }
  .patient-records-page .share-owner-message textarea { width: 100%; min-height: 66px; resize: vertical; padding: 10px 12px; border: 1px solid #d6e3df; border-radius: 9px; color: #173d37; font: inherit; font-size: 13px; line-height: 1.4; }
  .patient-records-page .share-owner-notify { display: flex; align-items: center; gap: 10px; min-height: 46px; padding: 8px 11px; border: 1px solid #dce9e5; border-radius: 9px; background: #eff8f5; color: #087f70; cursor: pointer; }
  .patient-records-page .share-owner-notify span { display: grid; gap: 2px; }
  .patient-records-page .share-owner-notify strong { font-size: 12px; }
  .patient-records-page .share-owner-notify small { color: #607873; font-size: 11px; }
  .patient-records-page .share-owner-footer { display: flex; justify-content: flex-end; gap: 9px; padding: 9px 14px; border-top: 1px solid #e0e8e6; }
  .patient-records-page .share-owner-footer button { min-height: 44px; padding: 0 15px; border: 1px solid #d6e3df; border-radius: 9px; background: #fff; color: #173d37; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
  .patient-records-page .share-owner-footer button[type="submit"] { border-color: #087f70; background: #087f70; color: #fff; }
  @media (max-width: 900px) {
    .patient-records-page .detail-columns { grid-template-columns: 1fr; }
    .patient-records-page .detail-actions { justify-content: flex-start; width: 100%; margin-left: 0; }
  }
  @media (max-width: 600px) {
    .patient-records-page .patient-edit-backdrop { padding: 10px; }
    .patient-records-page .patient-edit-grid { grid-template-columns: 1fr; }
    .patient-records-page .patient-edit-field.wide { grid-column: auto; }
    .patient-records-page .import-image-fields { grid-template-columns: 1fr; gap: 12px; }
    .patient-records-page .export-report-check-grid, .patient-records-page .export-report-options-grid { grid-template-columns: 1fr; }
    .patient-records-page .export-report-body { padding: 12px; }
    .patient-records-page .export-report-footer { padding: 10px 12px; }
    .patient-records-page .share-owner-body { padding: 11px; }
    .patient-records-page .share-owner-record { grid-template-columns: 20px minmax(0, 1fr); }
    .patient-records-page .share-owner-record time { grid-column: 2; margin-top: -4px; }
    .patient-records-page .share-owner-footer { padding: 10px 12px; }
    .patient-records-page .detail-summary { grid-template-columns: repeat(2,minmax(0,1fr)); }
    .patient-records-page .detail-hero { flex-wrap: wrap; }
    .patient-records-page .detail-information { gap: 12px; }
    .patient-records-page .detail-owner { grid-template-columns: 48px 1fr; }
    .patient-records-page .detail-owner-info:last-child { grid-column: 2; }
    .patient-records-page .detail-quick-actions { grid-template-columns: repeat(2,minmax(0,1fr)); }
    .patient-records-page .owner-edit-grid { grid-template-columns: 1fr; }
    .patient-records-page .owner-edit-field.wide { grid-column: auto; }
    .patient-records-page .owner-profile-fields { gap: 12px; }
    .patient-records-page .owner-profile-body { padding: 12px; }
  }
  @media (min-width: 1200px) {
    .patient-records-page .records-content { padding: 16px 20px 14px; }
    .patient-records-page .records-table { min-width: 1320px; }
    .patient-records-page .records-table th { padding: 0 13px; font-size: 12px; }
    .patient-records-page .records-table td { padding: 6px 13px; font-size: 13px; }
    .patient-records-page .records-avatar { width: 46px; height: 46px; flex-basis: 46px; }
  }
  @media (max-width: 760px) {
    .patient-records-page .records-content { padding: 12px 9px; }
    .patient-records-page .records-stats { grid-template-columns: repeat(2,minmax(0,1fr)); }
    .patient-records-page .records-toolbar { flex-wrap: wrap; }
    .patient-records-page .records-search { flex-basis: 100%; }
    .patient-records-page .records-select { flex: 1; width: auto; }
    .patient-records-page .records-sort { min-width: 94px; }
    .patient-records-page .records-view-toggle { margin-left: 0; }
    .patient-records-page .records-topbar { min-height: 58px; padding: 7px 10px; }
    .patient-records-page .records-topbar h2 { font-size: 19px !important; }
    .patient-records-page .records-topbar p { font-size: 11px !important; }
  }
`;

export default function PatientRecordsPage({ user, onNavigate, initialPatient }) {
  const matchesInitialPatient = initialPatient && RECORDS.find(record => (
    record.name.trim().toLowerCase() === initialPatient.pet.trim().toLowerCase()
    && record.owner.trim().toLowerCase() === initialPatient.name.trim().toLowerCase()
  ));
  const initialRecord = initialPatient
    ? matchesInitialPatient || {
      id: `INBOX-${initialPatient.id}`,
      name: initialPatient.pet,
      species: initialPatient.species || 'Dog',
      breed: initialPatient.breed,
      age: initialPatient.age,
      weight: initialPatient.weight,
      owner: initialPatient.name,
      lastVisit: 'No visit recorded',
      nextAppointment: initialPatient.nextAppointment || 'None scheduled',
      alert: '',
      status: 'Active',
      gender: initialPatient.sex || 'Not recorded',
      phone: initialPatient.phone,
      vaccination: 'Not recorded',
      vaccinationDue: '',
      weightTarget: initialPatient.weight || '',
      lastVisitAgo: 'No visit history',
      veterinarian: initialPatient.assignedTo || initialPatient.staff || 'Clinic team',
      recentVisits: [],
      notes: 'No additional medical notes are available yet.',
    }
    : null;
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [alertsFilter, setAlertsFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Last visit (newest)');
  const [viewMode, setViewMode] = useState('list');
  const [selectedRecordId, setSelectedRecordId] = useState(initialRecord?.id || null);
  const [activeDetailTab, setActiveDetailTab] = useState('Overview');
  const [recordOverrides, setRecordOverrides] = useState({});
  const [patientRecords, setPatientRecords] = useState(RECORDS);
  const [patientRecordsError, setPatientRecordsError] = useState('');

  useEffect(() => {
    if (!user?.clinic_id || !user?.token) return undefined;
    const controller = new AbortController();
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
    const query = `?clinic_id=${encodeURIComponent(user.clinic_id)}`;
    const headers = { Authorization: `Bearer ${user.token}` };
    Promise.all([
      fetch(`${apiUrl}/clinic-records/pets${query}`, { headers, signal: controller.signal }),
      fetch(`${apiUrl}/clinic-records/clients${query}`, { headers, signal: controller.signal }),
    ]).then(async ([petsResponse, clientsResponse]) => {
      if (!petsResponse.ok || !clientsResponse.ok) throw new Error('Unable to load clinic patient records.');
      const [pets, clients] = await Promise.all([petsResponse.json(), clientsResponse.json()]);
      if (!Array.isArray(pets) || !Array.isArray(clients)) throw new Error('Clinic patient records response was invalid.');
      const ownersById = new Map(clients.map(owner => [String(owner.id), owner]));
      setPatientRecordsError('');
      setPatientRecords(pets.map(pet => {
        const owner = ownersById.get(String(pet.client_id)) || {};
        const birthDate = pet.birth_date ? String(pet.birth_date).slice(0, 10) : '';
        return {
          id: pet.id,
          databasePetId: pet.id,
          name: pet.name,
          photo_url: pet.photo_url || pet.photoUrl || '',
          species: pet.species || 'Other',
          breed: pet.breed || 'Not recorded',
          age: pet.age || (birthDate ? calculateAge(birthDate) : 'Not recorded'),
          birthDate,
          weight: pet.weight ? `${pet.weight} kg` : pet.metadata?.weight ? `${pet.metadata.weight} kg` : 'Not recorded',
          weightTarget: pet.metadata?.weight_target ? `${pet.metadata.weight_target} kg` : '',
          owner: pet.owner || owner.name || 'Unknown owner',
          lastVisit: 'No visit recorded',
          nextAppointment: 'None scheduled',
          alert: pet.allergies && pet.allergies !== 'Not recorded' ? pet.allergies : '',
          status: pet.archived ? 'Archived' : 'Active',
          gender: pet.sex && pet.sex !== 'unknown' ? pet.sex : 'Not recorded',
          client_id: pet.client_id,
          colorName: pet.color || 'Not recorded',
          allergies: pet.allergies || 'Not recorded',
          phone: owner.phone || '',
          email: owner.email || '',
          address: owner.address || '',
          microchip: pet.microchip || 'Not recorded',
          vaccination: 'Not recorded',
          vaccinationDue: '',
          veterinarian: 'Clinic team',
          notes: pet.notes || 'No additional medical notes are available yet.',
          recentVisits: [],
        };
      }));
    }).catch(error => {
      if (error.name !== 'AbortError') {
        console.error('Unable to load clinic patient records:', error);
        setPatientRecordsError('Unable to load saved clinic patients. Showing the available patient list.');
      }
    });
    return () => controller.abort();
  }, [user?.clinic_id, user?.token]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return patientRecords.map(record => ({ ...record, ...recordOverrides[record.id] })).filter(record => {
      const matchesSearch = !query || [record.id, record.name, record.species, record.breed, record.owner]
        .some(value => value.toLowerCase().includes(query));
      const matchesSpecies = speciesFilter === 'All' || record.species === speciesFilter;
      const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
      const matchesAlerts = alertsFilter === 'All' || (alertsFilter === 'With alerts' ? Boolean(record.alert) : !record.alert);
      return matchesSearch && matchesSpecies && matchesStatus && matchesAlerts;
    }).sort((a, b) => {
      if (sortBy === 'Name (A-Z)') return a.name.localeCompare(b.name);
      if (sortBy === 'Name (Z-A)') return b.name.localeCompare(a.name);
      return patientRecords.indexOf(a) - patientRecords.indexOf(b);
    });
  }, [search, speciesFilter, statusFilter, alertsFilter, sortBy, recordOverrides, patientRecords]);
  const activePatientCount = patientRecords.filter(record => record.status !== 'Archived').length;
  const alertPatientCount = patientRecords.filter(record => Boolean(record.alert)).length;

  function openRecord(record) {
    setSelectedRecordId(record.id);
    setActiveDetailTab('Overview');
  }

  const selectedRecord = patientRecords.find(record => record.id === selectedRecordId)
    || (initialRecord?.id === selectedRecordId ? initialRecord : null);
  const currentSelectedRecord = selectedRecord ? { ...selectedRecord, ...recordOverrides[selectedRecord.id] } : null;

  if (currentSelectedRecord) {
    return (
      <div className="patient-records-page">
        <style>{styles}</style>
        <Topbar
          user={user}
          title=""
          subtitle=""
          className="records-topbar records-detail-topbar"
          headerContent={<button type="button" className="records-back" onClick={() => setSelectedRecordId(null)}>{Icons.arrowRight} Back to Patient Records</button>}
        />
        <PatientRecordDetail
          record={currentSelectedRecord}
          user={user}
          activeTab={activeDetailTab}
          setActiveTab={setActiveDetailTab}
          onNavigate={onNavigate}
          onBack={() => setSelectedRecordId(null)}
          onSave={updatedRecord => {
            setRecordOverrides(previous => ({
              ...previous,
              [updatedRecord.id]: { ...previous[updatedRecord.id], ...updatedRecord },
            }));
            setPatientRecords(previous => previous.map(item => item.id === updatedRecord.id ? { ...item, ...updatedRecord } : item));
          }}
        />
      </div>
    );
  }

  function PatientRecordDetail({ record, user: currentUser, activeTab, setActiveTab, onNavigate, onBack, onSave }) {
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [vaccinationRecords, setVaccinationRecords] = useState([]);
    const [vaccinationsLoading, setVaccinationsLoading] = useState(false);
    const [vaccinationsError, setVaccinationsError] = useState('');
    const [vaccinationFilter, setVaccinationFilter] = useState('All');
    const [selectedVaccinationId, setSelectedVaccinationId] = useState(null);
    const [verifyVaccinationId, setVerifyVaccinationId] = useState(null);
    const [shareTargetId, setShareTargetId] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [editError, setEditError] = useState('');
    const [editForm, setEditForm] = useState(null);
    const [ownerEditOpen, setOwnerEditOpen] = useState(false);
    const [ownerProfileOpen, setOwnerProfileOpen] = useState(false);
    const [ownerForm, setOwnerForm] = useState(null);
    const [importImageOpen, setImportImageOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importType, setImportType] = useState('Vaccine card');
    const [importLink, setImportLink] = useState('Patient record');
    const [importDescription, setImportDescription] = useState('');
    const [shareImportedFile, setShareImportedFile] = useState(false);
    const [importError, setImportError] = useState('');
    const [exportReportOpen, setExportReportOpen] = useState(false);
    const [shareOwnerOpen, setShareOwnerOpen] = useState(false);
    const [shareableOwnerRecords, setShareableOwnerRecords] = useState([]);
    const [databasePetId, setDatabasePetId] = useState(null);
    const [shareRecordsLoading, setShareRecordsLoading] = useState(false);
    const [shareRecordsError, setShareRecordsError] = useState('');
    const [shareSaving, setShareSaving] = useState(false);
    const [selectedOwnerRecordIds, setSelectedOwnerRecordIds] = useState([]);
    const [ownerShareMessage, setOwnerShareMessage] = useState('');
    const [ownerShareNotify, setOwnerShareNotify] = useState(true);
    const [addDoctorUpdateOpen, setAddDoctorUpdateOpen] = useState(false);
    const [doctorShareUpdateForm, setDoctorShareUpdateForm] = useState({ category: 'Visit update', title: '', detail: '' });
    const [reportSections, setReportSections] = useState({
      'Patient and owner information': true,
      'Medical history': true,
      'Visits and check-ups': true,
      'Lab results': true,
      Vaccinations: true,
      'Treatment plans': true,
      Medications: true,
    });
    const [reportDateRange, setReportDateRange] = useState('All records');
    const [reportFormat, setReportFormat] = useState('PDF');
    const [includeInternalNotes, setIncludeInternalNotes] = useState(false);
    const filePickerRef = useRef(null);
    const cameraPickerRef = useRef(null);
    useEffect(() => {
      if (!currentUser?.clinic_id || !currentUser?.token) {
        if (record.id === 'PAT-INT-003') {
          setVaccinationsError('');
          setVaccinationRecords(PATIENT_VACCINATION_MOCKS);
        } else {
          setVaccinationsError('Sign in to your clinic account to view saved vaccination records.');
          setVaccinationRecords([]);
        }
        return undefined;
      }
      const controller = new AbortController();
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
      setVaccinationsLoading(true);
      setVaccinationsError('');
      fetch(`${apiUrl}/clinic-records/vaccinations?clinic_id=${encodeURIComponent(currentUser.clinic_id)}`, {
        headers: { Authorization: 'Bearer ' + currentUser.token },
        signal: controller.signal,
      }).then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Unable to load vaccination records (HTTP ${response.status}).`);
        if (!Array.isArray(body)) throw new Error('The vaccination records response was not valid.');
        const matching = body.filter(item => (
          item.pet?.trim().toLowerCase() === record.name.trim().toLowerCase()
          && item.owner?.trim().toLowerCase() === record.owner.trim().toLowerCase()
        ));
        const mapped = matching.map(item => ({
          ...item,
          title: item.vaccine_name || 'Vaccination',
          date: item.date_given || '',
          nextDue: item.next_due || 'Not recorded',
          lotNumber: item.batch_number || 'Not recorded',
          administeredBy: item.administered_by || record.veterinarian || 'Clinic team',
          attendingDoctor: item.administered_by || record.veterinarian || 'Clinic team',
          clinicVerified: item.verified === true,
          stickerUrl: item.sticker_url || '',
          stickerFilename: item.sticker_filename || '',
          shared: item.shared === true,
          sharedBy: item.shared_by || '',
          sharedAt: item.shared_at || '',
          auditLog: [
            { event: 'Vaccination recorded', actor: item.administered_by || record.veterinarian || 'Clinic staff', date: item.created_at },
            ...(item.verified ? [{ event: 'Clinic verification completed', actor: item.verified_by_name || 'Clinic staff', date: item.verified_at }] : []),
          ],
        }));
        setVaccinationRecords(mapped.length ? mapped : record.id === 'PAT-INT-003' ? PATIENT_VACCINATION_MOCKS : []);
      }).catch(error => {
        if (error.name !== 'AbortError') setVaccinationsError(error.message || 'Unable to load vaccination records.');
      }).finally(() => {
        if (!controller.signal.aborted) setVaccinationsLoading(false);
      });
      setSelectedVaccinationId(null);
      return () => controller.abort();
    }, [record.id, record.name, record.owner, record.veterinarian, currentUser?.clinic_id, currentUser?.token]);
    useEffect(() => {
      if (!shareOwnerOpen) return;
      if (!currentUser?.clinic_id || !currentUser?.token || !record.name || !record.email) {
        setShareRecordsLoading(false);
        setShareRecordsError('This patient needs a saved clinic record and owner email, and a clinic account must be signed in, before records can be shared.');
        return;
      }
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
      const params = new URLSearchParams({
        clinic_id: currentUser.clinic_id,
        pet_name: record.name,
        owner_email: record.email,
      });
      const controller = new AbortController();
      setShareRecordsLoading(true);
      setShareRecordsError('');
      fetch(`${apiUrl}/clinic-records/shareable-records?${params.toString()}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
        signal: controller.signal,
      }).then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Unable to load patient records (HTTP ${response.status}).`);
        setDatabasePetId(body.pet?.id || null);
        const availableRecords = Array.isArray(body.records) ? body.records : [];
        setShareableOwnerRecords(availableRecords);
        setSelectedOwnerRecordIds(shareTargetId && availableRecords.some(item => item.id === shareTargetId && (item.type !== 'vaccine' || item.clinicVerified) && !item.shared) ? [shareTargetId] : []);
      }).catch(error => {
        if (error.name !== 'AbortError') setShareRecordsError(error.message || 'Unable to load patient records.');
      }).finally(() => {
        if (!controller.signal.aborted) setShareRecordsLoading(false);
      });
      return () => controller.abort();
    }, [shareOwnerOpen, currentUser?.clinic_id, currentUser?.token, record.email, record.name, shareTargetId]);
    useEffect(() => {
      if (activeTab !== 'Visits & Check-ups') setSelectedVisit(null);
    }, [activeTab]);
    useEffect(() => {
      if (activeTab !== 'Vaccinations') setSelectedVaccinationId(null);
    }, [activeTab]);
    const tabs = ['Overview', 'Visits & Check-ups', 'Vaccinations', 'Medications', 'Medical History', 'Treatment Plans', 'Files & Documents', 'Lab Results', 'Inpatient'];
    const alerts = record.medicalAlerts || (record.alert ? [record.alert] : []);
    const hasSasadDemoVisits = record.name.trim().toLowerCase() === 'sasad';
    const visits = hasSasadDemoVisits ? PATIENT_VISIT_MOCKS : record.recentVisits || [];
    const hasMockVisits = visits.length > 0 && visits.every(visit => visit.isMock);
    const tabCounts = {
      'Visits & Check-ups': visits.length,
      Vaccinations: vaccinationRecords.length,
      'Treatment Plans': record.treatmentPlans?.length,
      'Lab Results': record.labResults?.length,
    };
    const detailRows = {
      'Visits & Check-ups': visits.map(visit => ({ ...visit, status: visit.status || 'Completed' })),
      Vaccinations: record.vaccinations || [{ date: record.vaccinationDue || 'Schedule review', title: `${record.species} vaccination record`, doctor: record.veterinarian || 'Clinic team', status: record.vaccination || 'Review' }],
      Medications: record.medications || [{ date: 'Current', title: alerts.length ? `Review allergy: ${alerts[0]}` : 'No active prescriptions on file', doctor: 'Medication review', status: 'Reviewed' }],
      'Medical History': record.medicalHistory || (alerts.length
        ? alerts.map(alert => ({ date: 'On file', title: alert, doctor: 'Medical alert', status: 'Active' }))
        : [{ date: record.lastVisit, title: 'Routine wellness examination', doctor: record.veterinarian || 'Clinic team', status: 'Reviewed' }]),
      'Treatment Plans': record.treatmentPlans || [{ date: record.lastVisit, title: 'Routine preventive wellness', doctor: record.veterinarian || 'Clinic team', status: 'Active' }],
      'Files & Documents': record.files || [{ date: record.lastVisit, title: 'Patient record summary', doctor: 'Clinic records', status: 'Available' }],
      'Lab Results': record.labResults || [{ date: record.lastVisit, title: 'No lab results recorded', doctor: 'Laboratory', status: 'Reviewed' }],
      Inpatient: record.inpatientHistory || [],
    }[activeTab] || [];
    const openVisit = visit => {
      setSelectedVisit(visit);
      if (activeTab !== 'Visits & Check-ups') setActiveTab('Visits & Check-ups');
    };
    const selectedVisitDetails = selectedVisit
      ? (selectedVisit.isMock ? PATIENT_VISIT_MOCK_DETAILS[`${selectedVisit.date}|${selectedVisit.title}`] : null)
        || VISIT_DETAILS[record.id]?.[`${selectedVisit.date}|${selectedVisit.title}`]
        || selectedVisit
      : null;
    const selectedVaccination = vaccinationRecords.find(item => item.id === selectedVaccinationId) || null;
    const verificationVaccination = vaccinationRecords.find(item => item.id === verifyVaccinationId) || null;
    const vaccinationRows = vaccinationRecords.map(item => {
      const family = getVaccinationFamily(item.title || item.vaccine_name);
      const dateGiven = getVaccinationDueDate(item.date || item.date_given);
      const isSuperseded = vaccinationRecords.some(other => {
        if (other.id === item.id || getVaccinationFamily(other.title || other.vaccine_name) !== family) return false;
        const otherDate = getVaccinationDueDate(other.date || other.date_given);
        return Boolean(dateGiven && otherDate && otherDate > dateGiven);
      });
      const dueDate = getVaccinationDueDate(item.nextDue || item.next_due);
      const overdue = !isSuperseded && Boolean(dueDate && dueDate < new Date(new Date().setHours(0, 0, 0, 0)));
      return { ...item, isSuperseded, isOverdue: overdue, isUpToDate: !isSuperseded && Boolean(dueDate && !overdue) };
    });
    const overdueVaccinationRows = vaccinationRows.filter(item => item.isOverdue);
    const filteredVaccinationRows = vaccinationRows.filter(item => (
      vaccinationFilter === 'All'
      || (vaccinationFilter === 'Overdue' && item.isOverdue)
      || (vaccinationFilter === 'Up to date' && item.isUpToDate)
      || (vaccinationFilter === 'Completed' && Boolean(getVaccinationDueDate(item.date || item.date_given)))
    ));
    const applyVerifiedVaccination = payload => {
      if (!verificationVaccination) return;
      setVaccinationRecords(previous => previous.map(item => Number(item.id) === Number(payload.id) ? {
        ...item,
        ...payload,
        clinicVerified: payload.verified === true,
        verifiedBy: payload.verified_by_name || currentUser.name || 'Clinic staff',
        verifiedAt: payload.verified_at,
        stickerUrl: payload.sticker_url || item.stickerUrl,
        stickerFilename: payload.sticker_filename || item.stickerFilename,
        shared: item.shared,
        title: payload.vaccine_name || item.title,
        date: payload.date_given || item.date,
        nextDue: payload.next_due || item.nextDue,
        administeredBy: payload.administered_by || item.administeredBy,
        auditLog: [...item.auditLog, { event: 'Clinic verification completed', actor: payload.verified_by_name || currentUser.name || 'Clinic staff', date: payload.verified_at }],
      } : item));
      setVerifyVaccinationId(null);
      setSelectedVaccinationId(null);
      notifySuccess('Vaccination verified', 'The clinic record has been updated and can now be shared with the owner.');
    };
    const selectedVisitType = selectedVisit
      ? selectedVisitDetails.visitType
        || (/vaccin|rabies/i.test(selectedVisit.title) ? 'Vaccination' : /follow/i.test(selectedVisit.title) ? 'Follow-up' : 'Check-up')
      : '';
    const selectedVisitAttachments = selectedVisit
      ? selectedVisitDetails.attachments || (record.files || []).filter(file => file.date === selectedVisit.date)
      : [];
    const detailAction = label => notifySuccess(label, `${label} for ${record.name} is not connected yet.`);
    const exportSectionNames = Object.keys(reportSections);
    const selectedReportSections = exportSectionNames.filter(section => reportSections[section]);
    const allReportSectionsSelected = selectedReportSections.length === exportSectionNames.length;
    const openExportReport = () => {
      setReportSections(Object.fromEntries(exportSectionNames.map(section => [section, true])));
      setReportDateRange('All records');
      setReportFormat('PDF');
      setIncludeInternalNotes(false);
      setExportReportOpen(true);
    };
    const reportData = () => {
      const inDateRange = entry => {
        if (reportDateRange === 'All records') return true;
        const parsed = new Date(entry.date || '');
        if (Number.isNaN(parsed.getTime())) return true;
        const rangeStart = new Date();
        rangeStart.setHours(0, 0, 0, 0);
        rangeStart.setDate(rangeStart.getDate() - (reportDateRange === 'Past 30 days' ? 30 : 365));
        return parsed >= rangeStart;
      };
      const filteredRows = rows => (rows || []).filter(inDateRange);
      const sections = {
        'Patient and owner information': [
          ['Patient', record.name],
          ['Patient ID', record.id],
          ['Species / breed', `${record.species} · ${record.breed}`],
          ['Age / date of birth', `${record.age || 'Not recorded'}${record.birthDate ? ` · ${record.birthDate}` : ''}`],
          ['Weight', record.weight || 'Not recorded'],
          ['Owner', record.owner || 'Not recorded'],
          ['Phone', record.phone || 'Not recorded'],
          ['Email', record.email || 'Not recorded'],
          ['Address', record.address || 'Not recorded'],
          ['Status', record.status || 'Not recorded'],
          ...(alerts.length ? [['Medical alerts', alerts.join(', ')]] : []),
        ],
        'Medical history': filteredRows(record.medicalHistory || (alerts.length
          ? alerts.map(alert => ({ date: 'On file', title: alert, doctor: 'Medical alert', status: 'Active' }))
          : [])),
        'Visits and check-ups': filteredRows(visits),
        'Lab results': filteredRows(record.labResults || []),
        Vaccinations: filteredRows(record.vaccinations || []),
        'Treatment plans': filteredRows(record.treatmentPlans || []),
        Medications: filteredRows(record.medications || []),
      };
      if (includeInternalNotes && record.notes) {
        sections['Internal notes'] = [[record.notes]];
      }
      return selectedReportSections
        .filter(section => sections[section])
        .map(section => ({ title: section, entries: sections[section] }))
        .concat(includeInternalNotes && record.notes ? [{ title: 'Internal notes', entries: [[record.notes]] }] : []);
    };
    const generatePatientReport = event => {
      event.preventDefault();
      if (!selectedReportSections.length) return;
      const sections = reportData();
      if (reportFormat === 'Print') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          notifySuccess('Allow pop-ups to print', 'Enable pop-ups for this site, then try printing the report again.');
          return;
        }
        const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        })[character]);
        const printableSections = sections.map(section => {
          const rows = section.entries.map(entry => Array.isArray(entry)
            ? `<tr>${entry.map(value => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`
            : `<tr><td>${escapeHtml(entry.date || '—')}</td><td>${escapeHtml(entry.title || '—')}</td><td>${escapeHtml(entry.doctor || '—')}</td><td>${escapeHtml(entry.status || '—')}</td></tr>`).join('');
          const headings = Array.isArray(section.entries[0])
            ? ''
            : '<thead><tr><th>Date</th><th>Details</th><th>Recorded by</th><th>Status</th></tr></thead>';
          return `<section><h2>${escapeHtml(section.title)}</h2><table>${headings}<tbody>${rows || `<tr><td colspan="4">No records available for this date range.</td></tr>`}</tbody></table></section>`;
        }).join('');
        printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(record.name)} - Patient report</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:14px Arial,sans-serif;color:#183b35;margin:28px}h1{font-size:24px;margin:0 0 4px}p{color:#526b64;margin:0 0 22px}h2{font-size:17px;margin:22px 0 8px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{text-align:left;vertical-align:top;border:1px solid #d8e4df;padding:8px;overflow-wrap:anywhere}th{background:#edf6f3}@media print{body{margin:14mm}}</style></head><body><h1>${escapeHtml(record.name)} · Patient report</h1><p>Generated ${escapeHtml(new Date().toLocaleDateString())} · Date range: ${escapeHtml(reportDateRange)}</p>${printableSections}<script>window.onload=()=>window.print()</script></body></html>`);
        printWindow.document.close();
        setExportReportOpen(false);
        return;
      }
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let y = 18;
      pdf.setTextColor(23, 61, 55);
      pdf.setFontSize(19);
      pdf.text(`${record.name} · Patient report`, margin, y);
      y += 7;
      pdf.setFontSize(9);
      pdf.setTextColor(82, 107, 100);
      pdf.text(`Generated ${new Date().toLocaleDateString()} · Date range: ${reportDateRange}`, margin, y);
      y += 8;
      sections.forEach(section => {
        if (y > pageHeight - 25) {
          pdf.addPage();
          y = 18;
        }
        pdf.setFontSize(13);
        pdf.setTextColor(8, 102, 87);
        pdf.text(section.title, margin, y);
        y += 6;
        pdf.setFontSize(9);
        pdf.setTextColor(32, 47, 43);
        if (!section.entries.length) {
          pdf.text('No records available for this date range.', margin, y);
          y += 6;
        }
        section.entries.forEach(entry => {
          const values = Array.isArray(entry)
            ? entry
            : [entry.date || '—', entry.title || '—', entry.doctor || '—', entry.status || '—'];
          const line = values.map(value => String(value ?? '')).join(' · ');
          const wrapped = pdf.splitTextToSize(line, pageWidth - margin * 2);
          const blockHeight = wrapped.length * 4.5 + 2;
          if (y + blockHeight > pageHeight - 14) {
            pdf.addPage();
            y = 18;
          }
          pdf.text(wrapped, margin, y);
          y += blockHeight;
        });
        y += 4;
      });
      pdf.save(`${record.name.replace(/[^a-z0-9-_]/gi, '-')}-patient-report.pdf`);
      setExportReportOpen(false);
      notifySuccess('Report generated', `${record.name}'s patient report has been downloaded.`);
    };
    const contactOwner = () => {
      if (onNavigate) {
        onNavigate('inbox', {
          id: record.id,
          name: record.owner,
          phone: record.phone || '',
          pet: record.name,
          species: record.species,
          breed: record.breed,
          age: record.age,
          sex: record.gender || '',
          weight: record.weight || '',
          staff: record.veterinarian || 'Clinic team',
          assignedTo: record.veterinarian || 'Clinic team',
        });
        return;
      }
      detailAction('Contact owner');
    };
    const selectableOwnerRecords = shareableOwnerRecords.filter(item => item.type !== 'vaccine' || (item.clinicVerified && !item.shared));
    const allOwnerRecordsSelected = selectableOwnerRecords.length > 0
      && selectableOwnerRecords.every(item => selectedOwnerRecordIds.includes(item.id));
    const openShareOwner = (targetId = null) => {
      setShareableOwnerRecords([]);
      setDatabasePetId(null);
      setSelectedOwnerRecordIds([]);
      setShareTargetId(targetId);
      setShareRecordsError('');
      setOwnerShareMessage(`Here are the records we've selected for ${record.name}. Call us if you have any questions.`);
      setOwnerShareNotify(true);
      setAddDoctorUpdateOpen(false);
      setDoctorShareUpdateForm({ category: 'Visit update', title: '', detail: '' });
      setShareOwnerOpen(true);
    };
    const addDoctorShareUpdate = event => {
      event.preventDefault();
      const title = doctorShareUpdateForm.title.trim();
      const detail = doctorShareUpdateForm.detail.trim();
      if (!title || !detail) return;
      const update = {
        id: `doctor-update:${Date.now()}`,
        type: 'doctor-update',
        category: doctorShareUpdateForm.category,
        title,
        detail,
        date: new Date().toISOString(),
      };
      setShareableOwnerRecords(previous => [...previous, update]);
      setSelectedOwnerRecordIds(previous => [...previous, update.id]);
      setDoctorShareUpdateForm({ category: 'Visit update', title: '', detail: '' });
      setAddDoctorUpdateOpen(false);
    };
    const saveOwnerShareSelection = async event => {
      event.preventDefault();
      const selectedRecords = shareableOwnerRecords.filter(item => selectedOwnerRecordIds.includes(item.id));
      if (!selectedRecords.length) return;
      if (!currentUser?.clinic_id || !currentUser?.token || !databasePetId) {
        setShareRecordsError('This patient is not linked to a saved clinic record. Confirm the clinic, pet name, and owner email before sharing.');
        return;
      }
      setShareSaving(true);
      setShareRecordsError('');
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
        const response = await fetch(`${apiUrl}/clinic-records/shareable-records?clinic_id=${encodeURIComponent(currentUser.clinic_id)}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentUser.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pet_id: databasePetId,
            records: selectedRecords.map(({ id, type, category, title, detail }) => ({ id, type, category, title, detail })),
            message: ownerShareMessage.trim(),
            notification_requested: ownerShareNotify,
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Unable to share records (HTTP ${response.status}).`);
        onSave({
          ...record,
          ownerShareSelections: [...(record.ownerShareSelections || []), body.share],
        });
        const sharedVaccineIds = new Set(selectedRecords.filter(item => item.type === 'vaccine').map(item => Number(item.id.slice('vaccine:'.length))));
        setVaccinationRecords(previous => previous.map(item => sharedVaccineIds.has(Number(item.id)) ? { ...item, shared: true } : item));
        setShareOwnerOpen(false);
        setShareTargetId(null);
        notifySuccess('Records shared with owner', `${selectedRecords.length} selected record${selectedRecords.length === 1 ? '' : 's'} are now available in the linked PetWatch account. Push notifications are not connected yet.`);
      } catch (error) {
        setShareRecordsError(error.message || 'Unable to share records. Please try again.');
      } finally {
        setShareSaving(false);
      }
    };
    const openImportImage = () => {
      setImportFile(null);
      setImportType('Vaccine card');
      setImportLink('Patient record');
      setImportDescription('');
      setShareImportedFile(false);
      setImportError('');
      setImportImageOpen(true);
    };
    const selectImportFile = event => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setImportError('Choose a JPG, PNG, or PDF file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setImportError('The selected file must be 10 MB or smaller.');
        return;
      }
      setImportError('');
      setImportFile(file);
    };
    const saveImportedFile = async event => {
      event.preventDefault();
      if (!importFile) {
        setImportError('Choose a photo or document before importing.');
        return;
      }
      try {
        const fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject(new Error('The selected file could not be read.'));
          };
          reader.onerror = () => reject(reader.error || new Error('The selected file could not be read.'));
          reader.readAsDataURL(importFile);
        });
        const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const importedRecord = {
          date: today,
          title: importDescription.trim() || importFile.name,
          doctor: currentUser?.name || record.veterinarian || 'Clinic records',
          status: 'Available',
          fileName: importFile.name,
          fileType: importType,
          linkedTo: importLink,
          sharedWithOwner: shareImportedFile,
          data: fileData,
        };
        onSave({ ...record, files: [importedRecord, ...(record.files || [])] });
        setImportImageOpen(false);
        setActiveTab('Files & Documents');
        notifySuccess('Image imported', `${importFile.name} was added to ${record.name}'s record.`);
      } catch (error) {
        setImportError(error.message || 'Unable to read the selected file. Please try again.');
      }
    };
    const openPatientEdit = () => {
      setEditError('');
      setEditForm({
        name: record.name,
        status: record.status,
        species: record.species,
        breed: record.breed,
        colorName: record.colorName || '',
        gender: record.gender || '',
        birthDate: toDateInput(record.birthDate),
        weight: String(parseFloat(record.weight) || ''),
        weightTarget: String(parseFloat(record.weightTarget) || ''),
        microchip: record.microchip === 'Not recorded' ? '' : record.microchip || '',
        reproductiveStatus: record.reproductiveStatus || 'Not recorded',
        allergies: (record.medicalAlerts || (record.alert ? [record.alert] : [])).join(', '),
      });
      setEditOpen(true);
    };
    const savePatientEdit = async event => {
      event.preventDefault();
      if (!editForm.name.trim() || !editForm.species || !editForm.breed.trim() || !editForm.birthDate || !editForm.weight) {
        setEditError('Complete all required patient fields before saving.');
        return;
      }
      const allergies = editForm.allergies.split(',').map(value => value.trim()).filter(Boolean);
      const updatedRecord = {
        ...record,
        name: editForm.name.trim(),
        status: editForm.status,
        species: editForm.species,
        breed: editForm.breed.trim(),
        colorName: editForm.colorName.trim(),
        gender: editForm.gender,
        birthDate: formatBirthDate(editForm.birthDate),
        age: calculateAge(editForm.birthDate),
        weight: `${editForm.weight} kg`,
        weightTarget: editForm.weightTarget ? `${editForm.weightTarget} kg` : '',
        microchip: editForm.microchip.trim() || 'Not recorded',
        reproductiveStatus: editForm.reproductiveStatus,
        medicalAlerts: allergies,
        allergies: allergies.join(', ') || 'None reported',
        alert: allergies[0] || '',
      };
      try {
        let savedRecord = updatedRecord;
        if (record.databasePetId && currentUser?.clinic_id && currentUser?.token) {
          const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
          const response = await fetch(`${apiUrl}/clinic-records/pets/${record.databasePetId}?clinic_id=${encodeURIComponent(currentUser.clinic_id)}`, {
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + currentUser.token, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: record.client_id,
              name: updatedRecord.name,
              species: updatedRecord.species,
              breed: updatedRecord.breed,
              sex: ['male', 'female'].includes(updatedRecord.gender.toLowerCase()) ? updatedRecord.gender.toLowerCase() : 'unknown',
              birth_date: editForm.birthDate,
              color: updatedRecord.colorName,
              microchip: editForm.microchip.trim(),
              weight: editForm.weight,
              weight_target: editForm.weightTarget,
              allergies: allergies.join(', '),
              age: updatedRecord.age,
              archived: updatedRecord.status === 'Archived',
            }),
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || `Unable to save pet information (HTTP ${response.status}).`);
          savedRecord = {
            ...updatedRecord,
            ...payload,
            id: record.id,
            databasePetId: payload.id,
            birthDate: payload.birth_date ? String(payload.birth_date).slice(0, 10) : updatedRecord.birthDate,
            gender: payload.sex && payload.sex !== 'unknown' ? payload.sex : 'Not recorded',
            colorName: payload.color || 'Not recorded',
            microchip: payload.microchip || 'Not recorded',
            weight: payload.metadata?.weight ? `${payload.metadata.weight} kg` : updatedRecord.weight,
            weightTarget: payload.metadata?.weight_target ? `${payload.metadata.weight_target} kg` : updatedRecord.weightTarget,
            allergies: payload.metadata?.allergies || 'None reported',
            medicalAlerts: payload.metadata?.allergies ? String(payload.metadata.allergies).split(',').map(value => value.trim()).filter(Boolean) : [],
          };
        }
        await onSave(savedRecord);
        setEditOpen(false);
        notifySuccess('Patient updated', `${savedRecord.name}'s details were saved to the clinic record.`);
      } catch (saveError) {
        setEditError(saveError.message || 'Unable to save patient information.');
      }
    };
    const openOwnerEdit = () => {
      const phoneMatch = (record.phone || '').match(/^(\+\d{1,3})\s*(.*)$/);
      setOwnerForm({
        name: record.owner || '',
        countryCode: phoneMatch?.[1] || '+63',
        mobile: phoneMatch?.[2] || '',
        alternatePhone: record.alternatePhone || '',
        email: record.email || '',
        address: record.address || '',
      });
      setOwnerEditOpen(true);
    };
    const saveOwnerEdit = event => {
      event.preventDefault();
      if (!ownerForm.name.trim() || !ownerForm.mobile.trim()) return;
      const updatedRecord = {
        ...record,
        owner: ownerForm.name.trim(),
        phone: `${ownerForm.countryCode} ${ownerForm.mobile.trim()}`.trim(),
        alternatePhone: ownerForm.alternatePhone.trim(),
        email: ownerForm.email.trim(),
        address: ownerForm.address.trim(),
      };
      onSave(updatedRecord);
      setOwnerEditOpen(false);
      notifySuccess('Owner information updated', `${updatedRecord.owner}'s contact details were updated.`);
    };

    return (
      <main className="records-detail">
        <div className="detail-hero">
          <img className="detail-avatar" src={record.photo_url || '/healthy-pets.png'} alt={`${record.name} profile`} />
          <div>
            <div className="detail-title">
              <h1>{record.name}</h1>
              <StatusIndicator status={record.status} className="records-status-system" />
            </div>
            <div className="detail-meta">{record.id} &nbsp;·&nbsp; {record.species} &nbsp;·&nbsp; {record.breed}</div>
            <div className="detail-meta-row">
              <span>{Icons.calendar} {record.age}{record.birthDate ? ` (born ${record.birthDate})` : ''}</span>
              <span>{Icons.clipboard} {record.weight}</span>
              <span>{Icons.user} {record.owner} &nbsp;·&nbsp; {record.phone || 'Contact not recorded'}</span>
            </div>
          </div>
          <div className="detail-actions">
            <button type="button" className="detail-action" onClick={contactOwner}>{Icons.mail} Contact owner</button>
            <button type="button" className="detail-action" onClick={openPatientEdit}>{Icons.edit} Edit</button>
            <button type="button" className="detail-action" onClick={openImportImage}>{Icons.download} Import image</button>
            <button type="button" className="detail-action primary" onClick={openShareOwner}>{Icons.send} Share with owner</button>
            <button type="button" className="detail-action" onClick={openExportReport}>{Icons.file} Export report</button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="detail-alert-banner">
            <div><div className="detail-alert-label">Medical Alerts</div><strong>{alerts.join('　·　')}</strong></div>
          </div>
        )}

        <section className="detail-summary" aria-label="Patient status overview">
          <div className="detail-summary-card"><div className="detail-summary-label">Last visit</div><div className="detail-summary-value">{record.lastVisit}</div><div className="detail-summary-note">{record.lastVisitAgo || 'Visit history'}</div></div>
          <div className="detail-summary-card"><div className="detail-summary-label">Next appointment</div><div className="detail-summary-value">{record.nextAppointment === 'None scheduled' ? 'None scheduled' : `${record.nextAppointment} · ${record.appointmentType || 'Follow-up'}`}</div><div className="detail-summary-note">{record.nextAppointment === 'None scheduled' ? 'No upcoming appointment' : record.veterinarian || 'Clinic team'}</div></div>
          <div className="detail-summary-card"><div className="detail-summary-label">Weight (target {record.weightTarget || 'not set'})</div><div className="detail-summary-value">{record.weight}</div><div className="detail-summary-note">Weight on file</div></div>
          <div className="detail-summary-card"><div className="detail-summary-label">Vaccination</div><div className="detail-summary-value">{record.vaccination || 'Not recorded'}</div><div className="detail-summary-note">{record.vaccinationDue ? `Next ${record.vaccinationDue}` : 'Review vaccination record'}</div></div>
        </section>

        <nav className="detail-tabs" aria-label="Patient record sections">
          {tabs.map(tab => <button key={tab} type="button" className={`detail-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}{tabCounts[tab] != null ? `　${tabCounts[tab]}` : tab === 'Visits & Check-ups' ? '　6' : tab === 'Vaccinations' ? '　4' : tab === 'Medications' ? '　3' : tab === 'Medical History' ? '　5' : tab === 'Files & Documents' ? '　3' : tab === 'Inpatient' ? '　0' : ''}</button>)}
        </nav>

        {activeTab === 'Treatment Plans' ? (
          <div className="detail-integrated-tab"><TreatmentPlansTab patientName={record.name} user={currentUser} /></div>
        ) : activeTab === 'Lab Results' ? (
          <div className="detail-integrated-tab"><LabResultsTab patientName={record.name} /></div>
        ) : activeTab === 'Overview' ? (
          <div className="detail-columns">
            <div className="detail-column">
              <section className="detail-panel">
                <div className="detail-panel-heading">Patient Information</div>
                <div className="detail-information">
                  <div><div className="detail-field-label">Pet name</div><div className="detail-field-value">{record.name}</div></div>
                  <div><div className="detail-field-label">Species</div><div className="detail-field-value">{record.species}</div></div>
                  <div><div className="detail-field-label">Gender</div><div className="detail-field-value">{record.gender || 'Not recorded'}</div></div>
                  <div><div className="detail-field-label">Breed</div><div className="detail-field-value">{record.breed}</div></div>
                  <div><div className="detail-field-label">Date of birth</div><div className="detail-field-value">{toDateInput(record.birthDate) || 'Not recorded'}</div></div>
                  <div><div className="detail-field-label">Weight</div><div className="detail-field-value">{record.weight || 'Not recorded'}</div></div>
                  <div><div className="detail-field-label">Color</div><div className="detail-field-value">{record.colorName || 'Not recorded'}</div></div>
                  <div><div className="detail-field-label">Known allergies</div><div className="detail-field-value">{record.medicalAlerts?.length ? record.medicalAlerts.join(', ') : record.allergies && record.allergies !== 'Not recorded' ? record.allergies : record.alert || 'None reported'}</div></div>
                  <div><div className="detail-field-label">Age</div><div className="detail-field-value">{record.age || 'Not recorded'}</div></div>
                  <div><div className="detail-field-label">Microchip ID</div><div className="detail-field-value">{record.microchip || 'Not recorded'}</div></div>
                  <div><div className="detail-field-label">Patient ID</div><div className="detail-field-value">{record.id}</div></div>
                </div>
                {alerts.length > 0 && <div className="detail-alert-list"><strong className="detail-alert-label">Medical Alerts</strong>{alerts.map(alert => <span key={alert} className="detail-alert-pill">{alert}</span>)}</div>}
              </section>
              <section className="detail-panel">
                <div className="detail-panel-heading">Owner Information<button type="button" className="detail-edit" onClick={openOwnerEdit}>{Icons.edit} Edit</button></div>
                <div className="detail-owner">
                  <span className="detail-owner-avatar">{Icons.user}</span>
                  <div className="detail-owner-info"><strong>{record.owner}</strong><span>{record.phone || 'Phone not recorded'}</span><span>{record.email || 'Email not recorded'}</span></div>
                  <div className="detail-owner-info"><span>{record.address || 'Address not recorded'}</span><button type="button" className="detail-edit" onClick={() => setOwnerProfileOpen(true)}>View owner profile {Icons.arrowRight}</button></div>
                </div>
              </section>
            </div>

            <div className="detail-column">
              <section className="detail-panel">
                <div className="detail-panel-heading">Upcoming Appointments<button type="button" className="detail-edit" onClick={() => detailAction('View appointments')}>View all</button></div>
                {record.nextAppointment !== 'None scheduled' ? <div className="detail-appointment"><div className="detail-appointment-date">{record.nextAppointment}<br />Sun</div><div><div className="detail-appointment-name">{record.appointmentType || 'Follow-up'}</div><div className="detail-appointment-meta">9:00 AM · Consultation</div><div className="detail-appointment-meta">{record.veterinarian || 'Clinic team'}</div></div><StatusIndicator status="Scheduled" /></div> : <div className="detail-summary-note">No upcoming appointments scheduled.</div>}
              </section>
              <section className="detail-panel">
                <div className="detail-panel-heading">Recent Visits<button type="button" className="detail-edit" onClick={() => setActiveTab('Visits & Check-ups')}>View all</button></div>
                <div className="detail-visits">{visits.map(visit => (
                  <button key={`${visit.date}-${visit.title}`} type="button" className={`detail-visit-button${selectedVisit?.date === visit.date && selectedVisit?.title === visit.title ? ' selected' : ''}`} aria-expanded={selectedVisit?.date === visit.date && selectedVisit?.title === visit.title} onClick={() => openVisit(visit)}>
                    <span>{visit.date}</span>
                    <span><strong>{visit.title}</strong><small>{visit.doctor}</small>{visit.isMock && <small className="visit-sample-label">Sample data</small>}</span>
                    <span className="visit-type-pill">{visit.visitType || (/vaccin|rabies/i.test(visit.title) ? 'Vaccination' : /follow/i.test(visit.title) ? 'Follow-up' : 'Check-up')}</span>
                    <StatusIndicator status={visit.status || 'Completed'} className="visit-list-status" />
                    <span className="detail-visit-chevron" aria-hidden="true">›</span>
                  </button>
                ))}</div>
              </section>
              <section className="detail-panel">
                <div className="detail-panel-heading">Quick Actions</div>
                <div className="detail-quick-actions">
                  <button type="button" onClick={() => detailAction('New visit')}>{Icons.calendarPlus}New Visit</button>
                  <button type="button" onClick={() => detailAction('Add treatment plan')}>{Icons.clipboard}Add Treatment Plan</button>
                  <button type="button" onClick={() => detailAction('Add medication')}>{Icons.pill}Add Medication</button>
                  <button type="button" onClick={() => setActiveTab('Visits & Check-ups')}>{Icons.file}View Full Record</button>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <section className="detail-panel">
            <div className="detail-panel-heading">{activeTab}</div>
            {detailRows.length ? (
              activeTab === 'Visits & Check-ups' ? (
                <>
                {hasMockVisits && <div className="detail-summary-note" role="note">Sample visit history for Sasad to preview this screen. These entries are not saved clinic records.</div>}
                <div className="detail-visits">{detailRows.map(entry => (
                  <button key={`${entry.date}-${entry.title}`} type="button" className={`detail-visit-button${selectedVisit?.date === entry.date && selectedVisit?.title === entry.title ? ' selected' : ''}`} aria-expanded={selectedVisit?.date === entry.date && selectedVisit?.title === entry.title} onClick={() => openVisit(entry)}>
                    <span>{entry.date}</span>
                    <span><strong>{entry.title}</strong><small>{entry.doctor}</small>{entry.isMock && <small className="visit-sample-label">Sample data</small>}</span>
                    <span className="visit-type-pill">{entry.visitType || (/vaccin|rabies/i.test(entry.title) ? 'Vaccination' : /follow/i.test(entry.title) ? 'Follow-up' : 'Check-up')}</span>
                    <StatusIndicator status={entry.status || 'Completed'} className="visit-list-status" />
                    <span className="detail-visit-chevron" aria-hidden="true">›</span>
                  </button>
                ))}</div>
                </>
              ) : activeTab === 'Vaccinations' ? (
                vaccinationsLoading ? <div className="detail-summary-note">Loading vaccination records from the clinic database…</div>
                  : vaccinationsError ? <div className="detail-summary-note" role="alert">{vaccinationsError}</div>
                    : vaccinationRecords.length ? (
                  <>
                    {vaccinationRecords.every(item => item.isMock) && <div className="detail-summary-note" role="note">Prototype sample records for Nala. These examples are not saved to the clinic database; verification and sharing actions are disabled.</div>}
                    {overdueVaccinationRows.length > 0 && <div className="vaccine-overdue-notice" role="status" aria-live="polite">
                      <span><strong>{overdueVaccinationRows.length} {overdueVaccinationRows.length === 1 ? 'vaccine is' : 'vaccines are'} overdue:</strong> {overdueVaccinationRows.map(item => item.title).join(' and ')}. Let {record.owner.split(' ')[0]} know so {record.owner.split(' ')[0] === 'you' ? 'you can' : 'they can'} book a visit.</span>
                      <button type="button" className="vaccine-overdue-action" onClick={contactOwner}>Contact owner</button>
                    </div>}
                    <div className="vaccine-filter-bar" role="group" aria-label="Filter vaccinations">
                      {[
                        ['All', vaccinationRows.length],
                        ['Overdue', overdueVaccinationRows.length],
                        ['Up to date', vaccinationRows.filter(item => item.isUpToDate).length],
                        ['Completed', vaccinationRows.filter(item => Boolean(getVaccinationDueDate(item.date || item.date_given))).length],
                      ].map(([label, count]) => <button
                        key={label}
                        type="button"
                        className={`vaccine-filter-button${vaccinationFilter === label ? ' active' : ''}`}
                        aria-pressed={vaccinationFilter === label}
                        onClick={() => setVaccinationFilter(label)}
                      >{label}<span className="vaccine-filter-count">{count}</span></button>)}
                    </div>
                    <div className="vaccine-records-wrap">
                    <table className="vaccine-records-table">
                      <thead><tr><th>Date given</th><th>Vaccine</th><th>Dose</th><th>Next due</th><th>Due status</th><th>Verification</th><th>Sharing</th><th aria-hidden="true"></th></tr></thead>
                      <tbody>
                        {filteredVaccinationRows.map(item => (
                          <tr
                            key={item.id}
                            className={selectedVaccinationId === item.id ? 'selected' : ''}
                            tabIndex={0}
                            aria-label={`View ${item.title} vaccination details`}
                            aria-haspopup="dialog"
                            onClick={() => setSelectedVaccinationId(item.id)}
                            onKeyDown={event => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedVaccinationId(item.id);
                              }
                            }}
                          >
                            <td>{formatVaccinationTableDate(item.date)}</td>
                            <td><strong className="vaccine-name">{item.title}{item.isMock && <small className="vaccine-mock-label">Sample</small>}</strong><span className="vaccine-secondary">{[item.manufacturer, item.lotNumber].filter(value => value && value !== 'Not recorded').join(' · ') || 'Manufacturer / lot not recorded'}</span></td>
                            <td>{item.dose || '—'}</td>
                            <td>{formatVaccinationTableDate(item.nextDue)}</td>
                            <td><span className={`vaccine-due-state ${item.isSuperseded ? 'superseded' : item.isOverdue ? 'overdue' : item.isUpToDate ? 'up-to-date' : 'unknown'}`}><span className="vaccine-status-dot" />{item.isSuperseded ? 'Superseded' : item.isOverdue ? 'Overdue' : item.isUpToDate ? 'Up to date' : 'Not recorded'}</span></td>
                            <td><span className={`vaccine-verification-state ${item.clinicVerified ? 'verified' : 'pending'}`}><span className="vaccine-status-dot" />{item.clinicVerified ? 'Clinic verified' : 'Pending verification'}</span></td>
                            <td><span className={`vaccine-share-state${item.shared ? ' shared' : ''}`}>{item.shared ? '✓ Shared' : 'Not shared'}</span></td>
                            <td aria-hidden="true"><span className="vaccine-row-arrow">›</span></td>
                          </tr>
                        ))}
                        {filteredVaccinationRows.length === 0 && <tr><td colSpan={7}>No vaccinations match this filter.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  </>
                ) : <div className="detail-summary-note">No vaccination records are available for this patient.</div>
              ) : (
                <div className="detail-visits">{detailRows.map(entry => <div className="detail-visit" key={`${entry.date}-${entry.title}`}><span className="detail-visit-date">{entry.date}</span><div>{entry.data ? <a href={entry.data} download={entry.fileName || entry.title} style={{ color: '#087f70', fontWeight: 700, textDecoration: 'none' }}>{entry.title}</a> : <strong>{entry.title}</strong>}<div className="detail-visit-doctor">{entry.fileType ? `${entry.fileType} · ${entry.linkedTo} · ` : ''}{entry.doctor}</div></div><StatusIndicator status={entry.status} /></div>)}</div>
              )
            ) : <div className="detail-summary-note">{activeTab === 'Visits & Check-ups' ? 'No visit or check-up records are available for this patient.' : activeTab === 'Inpatient' ? 'No inpatient admissions are recorded for this patient.' : `No ${activeTab.toLowerCase()} records are available for this patient.`}</div>}
          </section>
        )}
        {selectedVisit && selectedVisitDetails && (
          <aside id="visit-detail-panel" className="visit-detail-panel" role="dialog" aria-modal="false" aria-label={`${record.name} visit details`}>
            <header className="visit-detail-header">
              <div>
                <button type="button" className="visit-detail-back" onClick={() => setSelectedVisit(null)}>{Icons.arrowRight} Back to Visits</button>
                <div className="visit-detail-title-row"><h2>{selectedVisit.title}</h2><StatusIndicator status={selectedVisit.status || 'Completed'} className="visit-detail-status" /></div>
                <div className="visit-detail-meta">{selectedVisit.date} · {selectedVisit.doctor}</div>
              </div>
              <button type="button" className="visit-detail-close" aria-label="Close visit details" onClick={() => setSelectedVisit(null)}>{Icons.close}</button>
            </header>
            <div className="visit-detail-body">
              <div className="visit-detail-intro">
                <div className="visit-detail-field"><span>Reason for visit</span><strong>{selectedVisitDetails.reason || selectedVisit.title}</strong></div>
                <div className="visit-detail-field"><span>Chief complaint</span><strong>{selectedVisitDetails.chiefComplaint || 'Not recorded'}</strong></div>
              </div>
              <div className="visit-detail-exam">
                <section className="visit-detail-section">
                  <h3>Examination (vitals)</h3>
                  {selectedVisitDetails.vitals?.length ? (
                    <div className="visit-detail-vitals">{selectedVisitDetails.vitals.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
                  ) : <p className="visit-detail-empty">No examination values recorded for this visit.</p>}
                </section>
                <section className="visit-detail-section">
                  <h3>Assessment</h3>
                  {selectedVisitDetails.assessment?.length ? <ul className="visit-detail-list">{selectedVisitDetails.assessment.map(item => <li key={item}>{item}</li>)}</ul> : <p className="visit-detail-empty">No assessment recorded for this visit.</p>}
                </section>
              </div>
              <section className="visit-detail-section">
                <h3>Plan</h3>
                {selectedVisitDetails.plan?.length ? <ul className="visit-detail-list">{selectedVisitDetails.plan.map(item => <li key={item}>{item}</li>)}</ul> : <p className="visit-detail-empty">No follow-up plan recorded for this visit.</p>}
              </section>
              <section className="visit-detail-section">
                <h3>Attachments</h3>
                {selectedVisitAttachments.length ? selectedVisitAttachments.map(file => (
                  <div className="visit-attachment" key={`${file.date}-${file.title}`}>
                    {Icons.file}
                    {file.data ? <a href={file.data} download={file.fileName || file.title}>{file.title}</a> : <span>{file.title}</span>}
                    {file.size ? <small>{file.size}</small> : null}
                  </div>
                )) : <p className="visit-detail-empty">No attachments linked to this visit.</p>}
              </section>
              <div className="visit-owner-sharing">
                <span>{Icons.send}</span>
                <div className="visit-owner-sharing-copy">
                  <strong>Share with owner</strong>
                  <p>Choose which saved records to make available to {record.owner} in PetWatch.</p>
                </div>
                <button type="button" onClick={openShareOwner}>Manage sharing</button>
              </div>
            </div>
          </aside>
        )}
        {selectedVaccination && <VaccinationRecordDrawer
          record={selectedVaccination}
          sourceLabel="Vaccinations"
          isShared={selectedVaccination.shared}
          isMock={selectedVaccination.isMock}
          onClose={() => setSelectedVaccinationId(null)}
          onVerify={() => setVerifyVaccinationId(selectedVaccination.id)}
          onShare={() => openShareOwner(`vaccine:${selectedVaccination.id}`)}
        />}
        {verificationVaccination && <VaccinationVerificationDialog
          record={verificationVaccination}
          user={currentUser}
          onClose={() => setVerifyVaccinationId(null)}
          onVerified={applyVerifiedVaccination}
          onStickerUploaded={uploaded => setVaccinationRecords(previous => previous.map(item => Number(item.id) === Number(uploaded.id) ? {
            ...item,
            stickerUrl: uploaded.sticker_url || '',
            stickerFilename: uploaded.sticker_filename || '',
            clinicVerified: false,
            verifiedBy: '',
            verifiedAt: '',
          } : item))}
        />}
        {shareOwnerOpen && (
          <div className="patient-edit-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setShareOwnerOpen(false); }}>
            <form className="patient-edit-dialog share-owner-dialog" role="dialog" aria-modal="true" aria-labelledby="share-owner-title" onSubmit={saveOwnerShareSelection}>
              <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '13px 14px 10px', borderBottom: '1px solid #e0e8e6' }}>
                <div>
                  <h2 id="share-owner-title" style={{ margin: 0, color: '#173d37', fontSize: 18, lineHeight: 1.25 }}>Share with {record.owner}</h2>
                  <p style={{ margin: '4px 0 0', color: '#526b64', fontSize: 12 }}>Choose exactly which of {record.name}'s records to share.</p>
                </div>
                <button type="button" aria-label="Close share with owner" onClick={() => setShareOwnerOpen(false)} style={{ display: 'grid', flex: '0 0 34px', width: 34, height: 34, placeItems: 'center', border: 0, borderRadius: 8, background: '#f0f5f3', color: '#173d37', cursor: 'pointer' }}>
                  <span style={{ display: 'grid', width: 16, height: 16, placeItems: 'center' }}>{Icons.close}</span>
                </button>
              </header>
              <div className="share-owner-body">
                <div className="share-owner-link-status" role="status">
                  <div>
                    <strong>Share records from the clinic database</strong>
                    <p>Saved visits, vaccinations, and prescriptions appear automatically. Select what to share, or add a doctor update. The selected items will appear in the PetWatch account linked to this owner email.</p>
                  </div>
                </div>
                <section className="share-owner-record-section">
                  <div className="share-owner-section-heading">
                    <h3>Records to share</h3>
                    <div className="share-owner-section-actions">
                      <button type="button" disabled={shareRecordsLoading || !databasePetId} onClick={() => setAddDoctorUpdateOpen(previous => !previous)}>
                        {addDoctorUpdateOpen ? 'Close update form' : '＋ Add doctor update'}
                      </button>
                      <button type="button" disabled={!selectableOwnerRecords.length} onClick={() => setSelectedOwnerRecordIds(allOwnerRecordsSelected ? [] : selectableOwnerRecords.map(item => item.id))}>
                        {allOwnerRecordsSelected ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                  </div>
                  <p className="share-owner-instructions">Saved completed visits, vaccinations, and prescriptions load from the clinic database. Vaccinations must be clinic-verified before they can be shared. Select eligible items or add a doctor update with its own title and details.</p>
                  {addDoctorUpdateOpen && (
                    <div className="share-owner-add-update">
                      <form className="share-owner-add-update-form" onSubmit={addDoctorShareUpdate}>
                        <select aria-label="Update category" value={doctorShareUpdateForm.category} onChange={event => setDoctorShareUpdateForm(previous => ({ ...previous, category: event.target.value }))}>
                          {['Visit update', 'Lab result', 'Vaccination', 'Treatment plan', 'Medication instruction', 'Other update'].map(category => <option key={category}>{category}</option>)}
                        </select>
                        <input required aria-label="Update title" value={doctorShareUpdateForm.title} onChange={event => setDoctorShareUpdateForm(previous => ({ ...previous, title: event.target.value }))} placeholder="Record title (e.g. Follow-up summary)" />
                        <textarea required aria-label="Update details" value={doctorShareUpdateForm.detail} onChange={event => setDoctorShareUpdateForm(previous => ({ ...previous, detail: event.target.value }))} placeholder="Enter the specific information the owner should see." />
                        <div className="share-owner-add-update-actions">
                          <button type="button" onClick={() => setAddDoctorUpdateOpen(false)}>Cancel</button>
                          <button type="submit">Add to share list</button>
                        </div>
                      </form>
                    </div>
                  )}
                  <div className="share-owner-record-list">
                    {shareRecordsLoading && <p style={{ margin: 0, padding: '12px 10px', color: '#607873', fontSize: 13 }}>Loading saved clinic records…</p>}
                    {!shareRecordsLoading && shareRecordsError && <p role="alert" style={{ margin: 0, padding: '12px 10px', color: '#b42318', fontSize: 13 }}>{shareRecordsError}</p>}
                    {shareableOwnerRecords.map(item => (
                      <label key={item.id} className="share-owner-record">
                        <input type="checkbox" checked={selectedOwnerRecordIds.includes(item.id)} disabled={item.type === 'vaccine' && (!item.clinicVerified || item.shared)} onChange={event => setSelectedOwnerRecordIds(previous => event.target.checked ? [...previous, item.id] : previous.filter(id => id !== item.id))} />
                        <span className="share-owner-record-info"><strong>{item.title}</strong><small>{item.category} · {item.detail}{item.type === 'vaccine' ? (item.shared ? ' · Already shared' : item.clinicVerified ? ' · Clinic verified' : ' · Pending verification — cannot share yet') : ''}</small></span>
                        {item.type === 'vaccine' && <StatusIndicator status={item.clinicVerified ? 'Clinic Verified' : 'Pending Verification'} className="share-vaccination-status" />}
                        <time>{item.date ? new Date(item.date).toLocaleDateString() : 'Date not recorded'}</time>
                      </label>
                    ))}
                    {!shareRecordsLoading && !shareRecordsError && !shareableOwnerRecords.length && <p style={{ margin: 0, padding: '12px 10px', color: '#607873', fontSize: 13 }}>No saved visits, vaccinations, or prescriptions are linked to this patient yet. Use Add doctor update to enter a shareable update.</p>}
                  </div>
                </section>
                <label className="share-owner-message">
                  Message to owner (optional)
                  <textarea maxLength={600} value={ownerShareMessage} onChange={event => setOwnerShareMessage(event.target.value)} placeholder="Write a message to accompany the selected records." />
                  <span style={{ justifySelf: 'end', color: '#607873', fontSize: 11, fontWeight: 400 }}>{ownerShareMessage.length}/600</span>
                </label>
                <label className="share-owner-notify">
                  <input type="checkbox" checked={ownerShareNotify} onChange={event => setOwnerShareNotify(event.target.checked)} />
                  <span><strong>Request a push notification</strong><small>Push notification delivery is not connected yet.</small></span>
                </label>
              </div>
              <footer className="share-owner-footer">
                <button type="button" onClick={() => setShareOwnerOpen(false)}>Cancel</button>
                <button type="submit" disabled={!selectedOwnerRecordIds.length || !databasePetId || shareRecordsLoading || shareSaving}>{shareSaving ? 'Sharing…' : `Share ${selectedOwnerRecordIds.length} selected`}</button>
              </footer>
            </form>
          </div>
        )}
        {exportReportOpen && (
          <div className="patient-edit-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setExportReportOpen(false); }}>
            <form className="patient-edit-dialog export-report-dialog" role="dialog" aria-modal="true" aria-labelledby="export-report-title" onSubmit={generatePatientReport}>
              <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '17px 18px 13px', borderBottom: '1px solid #e0e8e6' }}>
                <div>
                  <h2 id="export-report-title" style={{ margin: 0, color: '#173d37', fontSize: 21, lineHeight: 1.25 }}>Export report</h2>
                  <p style={{ margin: '5px 0 0', color: '#607873', fontSize: 14 }}>Create a printable record for {record.name}.</p>
                </div>
                <button type="button" aria-label="Close export report" onClick={() => setExportReportOpen(false)} style={{ display: 'grid', flex: '0 0 40px', width: 40, height: 40, placeItems: 'center', border: 0, borderRadius: 10, background: '#f0f5f3', color: '#173d37', cursor: 'pointer' }}>
                  <span style={{ display: 'grid', width: 18, height: 18, placeItems: 'center' }}>{Icons.close}</span>
                </button>
              </header>
              <div className="export-report-body">
                <section className="export-report-section">
                  <div className="export-report-section-heading">
                    <div><h3>What to include</h3><p>Select the sections you want to include in the report.</p></div>
                    <label className="export-report-select-all" style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#173d37', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={allReportSectionsSelected} onChange={event => setReportSections(Object.fromEntries(exportSectionNames.map(section => [section, event.target.checked])))} />
                      Select all
                    </label>
                  </div>
                  <div className="export-report-check-grid">
                    {exportSectionNames.map(section => (
                      <label key={section} className="export-report-check">
                        <input type="checkbox" checked={reportSections[section]} onChange={event => setReportSections(previous => ({ ...previous, [section]: event.target.checked }))} />
                        {section}
                      </label>
                    ))}
                  </div>
                </section>
                <section className="export-report-section">
                  <div className="export-report-section-heading">
                    <div><h3>Report options</h3><p>Customize the details of your report.</p></div>
                  </div>
                  <div className="export-report-options-grid">
                    <label className="export-report-option-label">
                      Date range
                      <select value={reportDateRange} onChange={event => setReportDateRange(event.target.value)}>
                        <option>All records</option>
                        <option>Past 30 days</option>
                        <option>Past year</option>
                      </select>
                    </label>
                    <div className="export-report-option-label">
                      Output format
                      <div className="export-report-format-buttons">
                        {['PDF', 'Print'].map(format => <button key={format} type="button" aria-pressed={reportFormat === format} onClick={() => setReportFormat(format)}>{format}</button>)}
                      </div>
                    </div>
                  </div>
                  <label className="export-report-notes" style={{ margin: '0 12px 12px' }}>
                    <input type="checkbox" checked={includeInternalNotes} onChange={event => setIncludeInternalNotes(event.target.checked)} />
                    <span><strong>Include internal notes</strong><small>Internal notes may contain sensitive information. Not recommended for owner-facing reports.</small></span>
                  </label>
                </section>
              </div>
              <footer className="export-report-footer">
                <button type="button" onClick={() => setExportReportOpen(false)}>Cancel</button>
                <button type="submit" disabled={!selectedReportSections.length}>{reportFormat === 'Print' ? 'Print report' : 'Generate PDF'}</button>
              </footer>
            </form>
          </div>
        )}
        {importImageOpen && (
          <div className="patient-edit-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setImportImageOpen(false); }}>
            <form
              className="patient-edit-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="import-image-title"
              onSubmit={saveImportedFile}
              style={{ width: 'min(680px, 100%)', maxHeight: 'calc(100vh - 24px)', borderRadius: 16 }}
            >
              <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, padding: '20px 22px 15px', borderBottom: '1px solid #e0e8e6' }}>
                <div>
                  <h2 id="import-image-title" style={{ margin: 0, color: '#173d37', fontSize: 21, lineHeight: 1.25 }}>Import image</h2>
                  <p style={{ margin: '5px 0 0', color: '#607873', fontSize: 14, lineHeight: 1.4 }}>Add a photo or scanned document to {record.name}'s record.</p>
                </div>
                <button type="button" aria-label="Close import image" onClick={() => setImportImageOpen(false)} style={{ display: 'grid', flex: '0 0 40px', width: 40, height: 40, placeItems: 'center', border: 0, borderRadius: 10, background: '#f0f5f3', color: '#173d37', cursor: 'pointer' }}>
                  <span style={{ display: 'grid', width: 18, height: 18, placeItems: 'center' }}>{Icons.close}</span>
                </button>
              </header>
              <div style={{ overflowY: 'auto', padding: '20px 22px' }}>
                <input ref={filePickerRef} type="file" accept="image/jpeg,image/png,application/pdf" onChange={selectImportFile} style={{ display: 'none' }} />
                <input ref={cameraPickerRef} type="file" accept="image/*" capture="environment" onChange={selectImportFile} style={{ display: 'none' }} />
                <div style={{ display: 'grid', justifyItems: 'center', gap: 7, minHeight: 188, alignContent: 'center', padding: '18px 14px', border: '2px dashed #b9d4ce', borderRadius: 14, background: '#f8fbfa', textAlign: 'center' }}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#087f70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m-5 5 5-5 5 5M3 20h18" /></svg>
                  <strong style={{ marginTop: 4, color: '#173d37', fontSize: 15 }}>{importFile ? importFile.name : 'No file selected'}</strong>
                  <span style={{ color: '#607873', fontSize: 13 }}>{importFile ? `${(importFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to import` : 'JPG, PNG or PDF up to 10 MB'}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 8 }}>
                    <button type="button" onClick={() => cameraPickerRef.current?.click()} style={{ minHeight: 48, padding: '0 19px', border: '1px solid #087f70', borderRadius: 12, background: '#087f70', color: '#fff', font: 'inherit', fontSize: 15, fontWeight: 650, cursor: 'pointer' }}>Take photo</button>
                    <button type="button" onClick={() => filePickerRef.current?.click()} style={{ minHeight: 48, padding: '0 19px', border: '1px solid #d8e4e0', borderRadius: 12, background: '#fff', color: '#173d37', font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Choose file</button>
                  </div>
                </div>
                <div className="import-image-fields">
                  <label style={{ display: 'grid', gap: 8, color: '#173d37', fontSize: 14, fontWeight: 600 }}>
                    What is this?
                    <select value={importType} onChange={event => setImportType(event.target.value)} style={{ width: '100%', minWidth: 0, height: 48, padding: '0 13px', border: '1px solid #ccdcd7', borderRadius: 11, background: '#fff', color: '#173d37', font: 'inherit', fontSize: 15 }}>
                      {['Vaccine card', 'Lab result', 'Prescription', 'Medical image', 'Other document'].map(type => <option key={type}>{type}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: 8, color: '#173d37', fontSize: 14, fontWeight: 600 }}>
                    Link to
                    <select value={importLink} onChange={event => setImportLink(event.target.value)} style={{ width: '100%', minWidth: 0, height: 48, padding: '0 13px', border: '1px solid #ccdcd7', borderRadius: 11, background: '#fff', color: '#173d37', font: 'inherit', fontSize: 15 }}>
                      {['Patient record', 'Vaccinations', 'Lab Results', 'Medications', 'Medical History'].map(target => <option key={target}>{target}</option>)}
                    </select>
                  </label>
                </div>
                <label style={{ display: 'grid', gap: 8, marginTop: 17, color: '#173d37', fontSize: 14, fontWeight: 600 }}>
                  Description (optional)
                  <textarea value={importDescription} onChange={event => setImportDescription(event.target.value)} placeholder="e.g. Annual vaccination card" rows={3} style={{ width: '100%', minHeight: 90, resize: 'vertical', padding: '12px 13px', border: '1px solid #ccdcd7', borderRadius: 11, color: '#173d37', font: 'inherit', fontSize: 15, lineHeight: 1.45, outlineColor: '#087f70' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 15, padding: '12px 14px', border: '1px solid #dce7e3', borderRadius: 12, color: '#173d37', cursor: 'pointer' }}>
                  <input type="checkbox" checked={shareImportedFile} onChange={event => setShareImportedFile(event.target.checked)} style={{ width: 23, height: 23, flex: '0 0 23px', accentColor: '#087f70' }} />
                  <span style={{ display: 'grid', gap: 3 }}>
                    <strong style={{ fontSize: 14, fontWeight: 500 }}>Share with owner after staff review</strong>
                    <small style={{ color: '#607873', fontSize: 13 }}>Stays internal until you approve it</small>
                  </span>
                </label>
                {importError && <div role="alert" style={{ marginTop: 12, color: '#b42318', fontSize: 14 }}>{importError}</div>}
              </div>
              <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 22px', borderTop: '1px solid #e0e8e6', background: '#fff' }}>
                <button type="button" onClick={() => setImportImageOpen(false)} style={{ minHeight: 48, padding: '0 17px', border: '1px solid #d8e4e0', borderRadius: 12, background: '#fff', color: '#173d37', font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ minHeight: 48, padding: '0 18px', border: '1px solid #087f70', borderRadius: 12, background: '#087f70', color: '#fff', font: 'inherit', fontSize: 15, fontWeight: 650, cursor: 'pointer' }}>Import</button>
              </footer>
            </form>
          </div>
        )}
        {ownerProfileOpen && (
          <div className="patient-edit-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setOwnerProfileOpen(false); }}>
            <section className="patient-edit-dialog owner-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="owner-profile-title">
              <header className="patient-edit-header owner-profile-header">
                <div><h2 id="owner-profile-title">Owner profile</h2><p>{record.owner}</p></div>
                <button type="button" className="patient-edit-close" aria-label="Close owner profile" onClick={() => setOwnerProfileOpen(false)}>{Icons.close}</button>
              </header>
              <div className="patient-edit-body owner-profile-body">
                <div className="owner-profile-summary">
                  <span className="owner-profile-avatar">{Icons.user}</span>
                  <div><strong>{record.owner}</strong><span>Client since {record.ownerSince || '2024'}</span></div>
                  <span className="owner-profile-linked">App linked</span>
                </div>
                <div className="owner-profile-fields">
                  <div><span>Mobile</span><strong>{record.phone || 'Phone not recorded'}</strong></div>
                  <div><span>Email</span><strong>{record.email || 'Email not recorded'}</strong></div>
                  <div><span>Address</span><strong>{record.address || 'Address not recorded'}</strong></div>
                  <div><span>Preferred contact</span><strong>{record.preferredContact || 'Phone call'}</strong></div>
                </div>
                <div className="owner-profile-pets-heading">Pets (1)</div>
                <div className="owner-profile-pet">
                  <span className="owner-profile-pet-avatar">{record.name.slice(0, 1).toUpperCase()}</span>
                  <div><strong>{record.name}</strong><span>{record.breed} · {record.id}</span></div>
                  <StatusIndicator status={record.status} className="records-status-system" />
                </div>
              </div>
              <footer className="patient-edit-footer owner-profile-footer">
                <button type="button" onClick={() => setOwnerProfileOpen(false)}>Cancel</button>
                <button type="button" onClick={() => { setOwnerProfileOpen(false); openOwnerEdit(); }}>Edit owner</button>
              </footer>
            </section>
          </div>
        )}
        {ownerEditOpen && ownerForm && (
          <div className="patient-edit-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setOwnerEditOpen(false); }}>
            <form className="patient-edit-dialog owner-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="owner-edit-title" onSubmit={saveOwnerEdit}>
              <header className="patient-edit-header owner-edit-header">
                <div><h2 id="owner-edit-title">Edit owner information</h2><p>Contact details and communication preferences for this owner.</p></div>
                <button type="button" className="patient-edit-close" aria-label="Close edit owner information" onClick={() => setOwnerEditOpen(false)}>{Icons.close}</button>
              </header>
              <div className="patient-edit-body">
                <div className="owner-edit-grid">
                  <label className="owner-edit-field">
                    <span>Full name <span className="owner-edit-required">*</span></span>
                    <input required autoFocus value={ownerForm.name} onChange={event => setOwnerForm({ ...ownerForm, name: event.target.value })} />
                  </label>
                  <label className="owner-edit-field">
                    <span>Mobile number <span className="owner-edit-required">*</span></span>
                    <span className="owner-edit-phone">
                      <select aria-label="Country calling code" value={ownerForm.countryCode} onChange={event => setOwnerForm({ ...ownerForm, countryCode: event.target.value })}>
                        <option value="+63">+63</option><option value="+1">+1</option><option value="+44">+44</option><option value="+61">+61</option>
                      </select>
                      <input required type="tel" value={ownerForm.mobile} onChange={event => setOwnerForm({ ...ownerForm, mobile: event.target.value })} />
                    </span>
                  </label>
                  <label className="owner-edit-field">Alternate phone<input type="tel" placeholder="e.g. 912 345 6789" value={ownerForm.alternatePhone} onChange={event => setOwnerForm({ ...ownerForm, alternatePhone: event.target.value })} /></label>
                  <label className="owner-edit-field">Email<input type="email" value={ownerForm.email} onChange={event => setOwnerForm({ ...ownerForm, email: event.target.value })} /></label>
                  <label className="owner-edit-field wide">Address<textarea value={ownerForm.address} onChange={event => setOwnerForm({ ...ownerForm, address: event.target.value })} /></label>
                  <div className="owner-edit-app wide">
                    <span className="owner-edit-app-icon">{Icons.phone}</span>
                    <div>
                      <strong>Happy Paws app</strong>
                      <span>● &nbsp;Connected</span>
                      <p>Messages, calls and shared records can be sent through the app.</p>
                    </div>
                    <span className="owner-edit-app-arrow" aria-hidden="true">›</span>
                  </div>
                </div>
              </div>
              <footer className="patient-edit-footer">
                <button type="button" onClick={() => setOwnerEditOpen(false)}>Cancel</button>
                <button type="submit">Save changes</button>
              </footer>
            </form>
          </div>
        )}
        {editOpen && editForm && (
          <div className="patient-edit-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setEditOpen(false); }}>
            <form className="patient-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="patient-edit-title" onSubmit={savePatientEdit}>
              <header className="patient-edit-header">
                <div><h2 id="patient-edit-title">Edit patient</h2><p>Update {record.name}'s details. Changes are saved to the clinic record.</p></div>
                <button type="button" className="patient-edit-close" aria-label="Close edit patient" onClick={() => setEditOpen(false)}>{Icons.close}</button>
              </header>
              <div className="patient-edit-body">
                <div className="patient-edit-summary">
                  <img src="/healthy-pets.png" alt="" />
                  <div><div className="patient-edit-summary-name">{editForm.name || record.name}</div><div className="patient-edit-summary-meta">{editForm.breed || record.breed}<span>·</span>{editForm.gender || 'Gender not recorded'}<span>·</span>{editForm.birthDate ? calculateAge(editForm.birthDate) : record.age}</div></div>
                </div>
                <div className="patient-edit-grid">
                  <label className="patient-edit-field"><span>Pet name <span className="patient-edit-required">*</span></span><input required value={editForm.name} onChange={event => setEditForm({ ...editForm, name: event.target.value })} /></label>
                  <label className="patient-edit-field">Status<select value={editForm.status} onChange={event => setEditForm({ ...editForm, status: event.target.value })}><option>Active</option><option>Archived</option></select></label>
                  <label className="patient-edit-field">Species<select required value={editForm.species} onChange={event => setEditForm({ ...editForm, species: event.target.value })}><option>Dog</option><option>Cat</option><option>Rabbit</option><option>Bird</option><option>Other</option></select></label>
                  <label className="patient-edit-field"><span>Breed <span className="patient-edit-required">*</span></span><input required value={editForm.breed} onChange={event => setEditForm({ ...editForm, breed: event.target.value })} /></label>
                  <label className="patient-edit-field">Color<input value={editForm.colorName} onChange={event => setEditForm({ ...editForm, colorName: event.target.value })} /></label>
                  <label className="patient-edit-field">Gender<select value={editForm.gender} onChange={event => setEditForm({ ...editForm, gender: event.target.value })}><option value="">Not recorded</option><option>Female</option><option>Male</option></select></label>
                  <label className="patient-edit-field"><span>Date of birth <span className="patient-edit-required">*</span></span><input type="date" required value={editForm.birthDate} onChange={event => setEditForm({ ...editForm, birthDate: event.target.value })} /></label>
                  <label className="patient-edit-field">Spayed / neutered<select value={editForm.reproductiveStatus} onChange={event => setEditForm({ ...editForm, reproductiveStatus: event.target.value })}><option>Not recorded</option><option>Spayed</option><option>Neutered</option><option>Intact</option></select></label>
                  <label className="patient-edit-field"><span>Weight (kg) <span className="patient-edit-required">*</span></span><input type="number" min="0" step="0.1" required value={editForm.weight} onChange={event => setEditForm({ ...editForm, weight: event.target.value })} /></label>
                  <label className="patient-edit-field">Target weight (kg)<input type="number" min="0" step="0.1" value={editForm.weightTarget} onChange={event => setEditForm({ ...editForm, weightTarget: event.target.value })} /></label>
                  <label className="patient-edit-field">Microchip ID<input value={editForm.microchip} onChange={event => setEditForm({ ...editForm, microchip: event.target.value })} /></label>
                  <label className="patient-edit-field">Patient ID<input value={record.id} disabled /></label>
                  <label className="patient-edit-field wide">Known allergies<textarea placeholder="Separate allergies with commas." value={editForm.allergies} onChange={event => setEditForm({ ...editForm, allergies: event.target.value })} /></label>
                  {editError && <div className="patient-edit-error" role="alert">{editError}</div>}
                </div>
              </div>
              <footer className="patient-edit-footer">
                <button type="button" onClick={() => setEditOpen(false)}>Cancel</button>
                <button type="submit">Save changes</button>
              </footer>
            </form>
          </div>
        )}
      </main>
    );
  }

  return (
    <div className="patient-records-page">
      <style>{styles}</style>
      <Topbar
        user={user}
        title="Patient Records"
        subtitle="Manage patient records and owner information"
        className="records-topbar"
        actions={(
          <button type="button" className="records-add" onClick={() => onNavigate ? onNavigate('patient-registration') : notifySuccess('Add patient', 'Open patient registration to add a new patient.')}>
            {Icons.plus} Add Patient
          </button>
        )}
      />
      <main className="records-content">
        <section className="records-stats" aria-label="Patient record summary">
          <div className="records-stat">
            <span className="records-stat-icon stat-blue">{Icons.users}</span>
            <div><div className="records-stat-label">Total Patients</div><div className="records-stat-value">{patientRecords.length}</div><div className="records-stat-note">Registered in this clinic</div></div>
          </div>
          <div className="records-stat">
            <span className="records-stat-icon stat-green">{Icons.check}</span>
            <div><div className="records-stat-label">Active Patients</div><div className="records-stat-value">{activePatientCount}</div><div className="records-stat-note">Currently active</div></div>
          </div>
          <div className="records-stat">
            <span className="records-stat-icon stat-amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></svg></span>
            <div><div className="records-stat-label">With Alerts</div><div className="records-stat-value">{alertPatientCount}</div><div className="records-stat-note">Require attention</div></div>
          </div>
          <div className="records-stat">
            <span className="records-stat-icon stat-purple">{Icons.calendar}</span>
            <div><div className="records-stat-label">Upcoming Appointments</div><div className="records-stat-value">{patientRecords.filter(record => record.nextAppointment !== 'None scheduled').length}</div><div className="records-stat-note">Within next 7 days</div></div>
          </div>
        </section>

        <section className="records-toolbar" aria-label="Search and filter patients">
          <label className="records-search">
            {Icons.search}
            <input type="search" placeholder="Search by pet name, owner, breed or patient ID" value={search} onChange={event => setSearch(event.target.value)} />
          </label>
          <select aria-label="Filter by species" className="records-select" value={speciesFilter} onChange={event => setSpeciesFilter(event.target.value)}>
            <option value="All">Species · All</option><option>Dog</option><option>Cat</option><option>Rabbit</option>
          </select>
          <select aria-label="Filter by status" className="records-select" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="All">Status · All</option><option>Active</option><option>Archived</option>
          </select>
          <select aria-label="Filter by alerts" className="records-select" value={alertsFilter} onChange={event => setAlertsFilter(event.target.value)}>
            <option value="All">Alerts · All</option><option>With alerts</option><option>None</option>
          </select>
          <select aria-label="Sort patients" className="records-select records-sort" value={sortBy} onChange={event => setSortBy(event.target.value)}>
            <option>Last visit (newest)</option><option>Name (A-Z)</option><option>Name (Z-A)</option>
          </select>
          <div className="records-view-toggle" aria-label="Choose patient view">
            <button type="button" aria-label="List view" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}>{Icons.list}</button>
            <button type="button" aria-label="Grid view" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')}>{Icons.grid}</button>
          </div>
        </section>

        <h2 className="records-list-heading">All patients ({filtered.length})</h2>
        {patientRecordsError && <div role="alert" style={{ margin: '0 0 12px', color: '#b45309', fontSize: 13 }}>{patientRecordsError}</div>}
        <section className="records-table-wrap" aria-label="Patient records">
          {viewMode === 'list' ? (
            <>
              <table className="records-table">
                <thead><tr><th>Patient</th><th>Pet Information</th><th>Owner</th><th>Last Visit</th><th>Next Appointment</th><th>Alerts</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {filtered.map(record => (
                    <tr key={record.id}>
                      <td><div className="records-patient"><img className="records-avatar" src={record.photo_url || '/healthy-pets.png'} alt={`${record.name} profile`} /><div><div className="records-patient-name">{record.name}</div><div className="records-patient-id">{record.id}</div></div></div></td>
                      <td><div className="records-pet-info"><div className="records-info-line">{Icons.pet}{record.breed}</div><div className="records-info-line">{Icons.activity}{record.age}</div><div className="records-info-line">{Icons.clipboard}{record.weight}</div></div></td>
                      <td><div className="records-owner">{Icons.user}<span>{record.owner}</span></div></td>
                      <td><div className="records-date">{Icons.calendar}<span>{record.lastVisit}</span></div></td>
                      <td><div className={`records-date records-appointment${record.nextAppointment !== 'None scheduled' ? ' due' : ''}`}>{Icons.calendar}<span>{record.nextAppointment === 'None scheduled' ? <>None<br />scheduled</> : record.nextAppointment}</span></div></td>
                      <td>{record.alert ? <span className="records-alert"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></svg>{record.alert}</span> : <span className="records-alert-none">{Icons.eyeOff}None<br />recorded</span>}</td>
                      <td><StatusIndicator status={record.status} className="records-status-system" /></td>
                      <td><button type="button" className="records-view" onClick={() => openRecord(record)}>View Record {Icons.arrowRight}</button></td>
                    </tr>
                  ))}
                  {!filtered.length && <tr><td colSpan="8" className="records-empty">No patient records match your search or filters.</td></tr>}
                </tbody>
              </table>
              <footer className="records-footer">
                <span>Showing {filtered.length ? `1–${filtered.length}` : '0'} of {filtered.length} patients</span>
                <div className="records-pagination"><button type="button" aria-label="Previous page" disabled>‹</button><span>1</span><button type="button" aria-label="Next page" disabled>›</button></div>
              </footer>
            </>
          ) : (
            <div className="records-grid">
              {filtered.map(record => (
                <article className="records-grid-card" key={record.id}>
                  <img className="records-avatar" src={record.photo_url || '/healthy-pets.png'} alt={`${record.name} profile`} />
                  <div><div className="records-patient-name">{record.name}</div><div className="records-patient-id">{record.id}</div><div className="records-grid-meta">{record.breed} · {record.owner}</div></div>
                  <button type="button" className="records-view" aria-label={`View ${record.name} record`} onClick={() => openRecord(record)}>{Icons.arrowRight}</button>
                </article>
              ))}
              {!filtered.length && <div className="records-empty">No patient records match your search or filters.</div>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
