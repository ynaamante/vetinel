import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import Topbar from '../../components/Topbar';
import StatusIndicator from '../../components/StatusIndicator';
import VaccinationRecordDrawer, { VaccinationVerificationDialog } from '../../components/VaccinationRecordDrawer';
import { Icons } from '../../icons';
import { canViewFeature } from '../../utils/permissionUtils';
import { notifySuccess } from '../../utils/notifications';
import { validateOwnerFields } from '../../utils/validation';
import { CLINIC_MOCK_DATA } from '../../data/clinicMockData';

// ── DATA ──────────────────────────────────────────────────────────────
const APPOINTMENTS = [
  { id: 'APT-001', datetime: 'March 18, 2026 09:00 AM', pet: 'Max',    owner: 'John Smith',    type: 'Checkup',    status: 'confirmed', notes: 'Annual checkup' },
  { id: 'APT-002', datetime: 'March 18, 2026 10:30 AM', pet: 'Luna',   owner: 'Sarah Johnson', type: 'Vaccination', status: 'confirmed', notes: 'Distemper vaccine' },
  { id: 'APT-003', datetime: 'March 18, 2026 11:00 AM', pet: 'Charlie',owner: 'Mike Davis',    type: 'Surgery',    status: 'pending',   notes: 'Dental cleaning' },
  { id: 'APT-004', datetime: 'March 18, 2026 02:00 PM', pet: 'Bella',  owner: 'Emma Wilson',   type: 'Dental',     status: 'confirmed', notes: 'Routine dental' },
  { id: 'APT-005', datetime: 'March 18, 2026 03:30 PM', pet: 'Rocky',  owner: 'David Brown',   type: 'Checkup',    status: 'confirmed', notes: 'Annual checkup' },
];

const OWNERS = [
  { id: 'OWN-001', name: 'John Smith',    phone: '+1 555-0101', email: 'john.smith@email.com',  address: '123 Main St, Springfield', pets: 2 },
  { id: 'OWN-002', name: 'Sarah Johnson', phone: '+1 555-0102', email: 'sarah.j@email.com',      address: '456 Oak Ave, Springfield',  pets: 1 },
  { id: 'OWN-003', name: 'Mike Davis',    phone: '+1 555-0103', email: 'mike.davis@email.com',   address: '789 Pine Rd, Springfield',  pets: 3 },
];

const PETS = [
  { id: 'PET-001', name: 'Max',     species: 'Dog', breed: 'Golden Retriever', owner: 'John Smith',    age: '3 years',   lastVisit: 'March 1, 2026',   status: 'up-to-date' },
  { id: 'PET-002', name: 'Luna',    species: 'Cat', breed: 'Persian',          owner: 'Sarah Johnson', age: '5 months',  lastVisit: 'Feb 28, 2026',    status: 'high-risk'  },
  { id: 'PET-003', name: 'Charlie', species: 'Dog', breed: 'Labrador',         owner: 'Mike Davis',    age: '7 years',   lastVisit: 'Jan 15, 2026',    status: 'moderate'   },
];

const VACCINATIONS = CLINIC_MOCK_DATA.vaccinations;
const TREATMENTS = CLINIC_MOCK_DATA.treatments;
const LAB_RESULTS = CLINIC_MOCK_DATA.labResults;

function formatClinicDate(value) {
  if (!value || value === '—') return '—';
  const rawValue = String(value);
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawValue);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(rawValue);
  if (Number.isNaN(date.getTime())) return rawValue;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeVaccination(v) {
  const dueValue = v.nextDue || v.next_due;
  let status = v.status;
  if (!status && dueValue) {
    const due = new Date(`${String(dueValue).slice(0, 10)}T00:00:00`);
    if (!Number.isNaN(due.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / 86400000);
      status = daysUntilDue < 0 ? 'overdue' : daysUntilDue <= 30 ? 'due-soon' : 'up-to-date';
    }
  }
  return {
    ...v,
    id: v.id || v.vaccination_id,
    pet: v.pet || v.pet_name || '—',
    type: v.type || v.vaccine_name || '—',
    dateGiven: v.dateGiven || v.date_given || '—',
    nextDue: dueValue || '—',
    attendingDoctor: v.attendingDoctor || v.attending_doctor || v.administered_by_name || v.administered_by || v.by || '—',
    createdBy: v.createdBy || v.created_by || v.created_by_name || v.administered_by_name || v.by || '—',
    lastUpdatedBy: v.lastUpdatedBy || v.last_updated_by || v.administered_by_name || v.by || '—',
    dateCreated: v.dateCreated || v.date_created || v.created_at || '—',
    linkedPatient: v.linkedPatient || v.linked_patient || (v.pet && v.owner ? `${v.pet} (${v.owner})` : v.pet) || '—',
    pet_id: v.pet_id,
    stickerUrl: v.sticker_url || v.stickerUrl || '',
    stickerFilename: v.sticker_filename || v.stickerFilename || '',
    status: status || 'unknown',
    clinicVerified: v.clinicVerified ?? v.clinic_verified ?? v.verified ?? false,
  };
}

const INPATIENT_RECORDS = [
  { id: 'INP-001', pet: 'Luna', owner: 'Sarah Johnson', admitted: 'Feb 28, 2026', ward: 'Ward A - Cage 3', diagnosis: 'Parvovirus treatment', discharge: 'Mar 5, 2026', doctor: 'Dr. Johnson', status: 'admitted' },
  { id: 'INP-002', pet: 'Charlie', owner: 'Mike Davis', admitted: 'Jan 14, 2026', ward: 'Ward B - Cage 1', diagnosis: 'Post-op recovery (dental)', discharge: 'Jan 16, 2026', doctor: 'Dr. Smith', status: 'discharged' },
];

const TREATMENT_PLANS = [
  {
    id: 'PLN-007',
    status: 'active',
    title: 'Routine Preventive Wellness Plan',
    pet: 'Nala',
    species: 'Dog',
    age: '5 yr 3 mo',
    owner: 'Grace Villanueva',
    diagnosis: 'Preventive wellness and routine monitoring',
    diagnosisConfirmation: 'Preventive care',
    severity: 'Low',
    weight: '27 kg',
    allergies: 'None recorded',
    isolationRequired: false,
    reportedToDiseaseMonitoring: false,
    sex: 'Female',
    vaccines: 'Up to date',
    consent: 'Signed',
    homeCareInstructions: 'Sent',
    doctor: 'Dr. Santos',
    created: 'Sep 8, 2026',
    followUp: 'Dec 12, 2026',
    nextActionDue: 'Dec 12, 2026',
    completedSteps: 1,
    totalSteps: 3,
    stepDetails: [
      { detail: 'Wellness examination and weight recorded', assignee: 'Dr. Santos', completedAt: 'Sep 8, 2026' },
      { detail: 'Review preventive care and vaccination schedule', assignee: 'Dr. Santos', due: 'Dec 12, 2026' },
      { detail: 'Complete follow-up wellness review', assignee: 'Dr. Santos', due: 'Mar 8, 2027' },
    ],
    monitoring: { temperature: 'Normal', weight: '27 kg', hydration: 'Normal', appetite: 'Normal' },
    medications: [],
    pastMedications: [],
    clinicalUpdates: [{ date: 'Sep 8, 2026', author: 'Dr. Santos', text: 'Wellness check completed. Patient is stable; continue routine preventive care.' }],
  },
  {
    id: 'PLN-001',
    status: 'active',
    title: 'Feline Panleukopenia Recovery Protocol',
    pet: 'Luna',
    species: 'Cat',
    age: '5 months',
    owner: 'Sarah Johnson',
    diagnosis: 'Feline Panleukopenia',
    diagnosisConfirmation: 'Confirmed · in-clinic test',
    severity: 'Moderate',
    weight: '2.1 kg',
    allergies: 'None known',
    isolationRequired: true,
    reportedToDiseaseMonitoring: true,
    sex: 'Female, intact',
    vaccines: 'Incomplete (1 of 3)',
    consent: 'Signed',
    homeCareInstructions: 'Sent',
    doctor: 'Dr. Johnson',
    created: 'Feb 28, 2026',
    followUp: 'Mar 5, 2026',
    nextActionDue: 'Feb 28, 2026, 2:00 PM',
    completedSteps: 2,
    totalSteps: 4,
    stepDetails: [
      { detail: 'Exam, test and weight recorded', assignee: 'Dr. Johnson', completedAt: 'Feb 28, 9:10 AM' },
      { detail: 'Fluids and medications started', assignee: 'Nurse Reyes', completedAt: 'Feb 28, 10:30 AM' },
      { detail: 'Review response, temperature and hydration', assignee: 'Dr. Johnson', due: 'Feb 28, 2:00 PM', overdue: true },
      { detail: 'Confirm recovery and next steps', assignee: 'Dr. Johnson', due: 'Mar 5, 9:00 AM' },
    ],
    monitoring: {
      temperature: '39.4 °C',
      temperatureStatus: 'High',
      weight: '2.1 kg',
      hydration: 'Mild deficit',
      appetite: 'Poor',
      whiteBloodCellCount: '1.8 ×10³/µL',
      whiteBloodCellStatus: 'Abnormal',
    },
    medications: [
      { name: 'Amoxicillin', dose: '20 mg/kg = 42 mg', route: 'Oral', frequency: 'Twice daily', duration: '7 days', day: 'Day 1 of 7', nextDue: '6:00 PM', status: 'In Progress' },
      { name: 'Maropitant', dose: '1 mg/kg = 2.1 mg', route: 'SC', frequency: 'Once daily', duration: '5 days', day: 'Day 1 of 5', nextDue: 'Tomorrow, 9:00 AM', status: 'In Progress' },
    ],
    pastMedications: [
      'Pyrantel · Jan 3 – Jan 10, 2026 · Deworming',
      'Multi-vitamin · Jan 3 – Jan 10, 2026 · Recovery support',
    ],
    clinicalUpdates: [
      { date: 'Feb 28, 4:15 PM', author: 'Dr. Johnson', text: 'Owner reports vomiting twice and low appetite. Temp 39.4°C, mild dehydration, WBC low. Responding to fluids, still guarded. Continue medications and recheck in the morning.' },
      { date: 'Feb 28, 10:30 AM', author: 'Nurse Reyes', text: 'Treatment started, isolation ward assigned, and owner given home-care instructions.' },
    ],
  },
  { id: 'PLN-002', status: 'active', title: 'Dental Disease Management', pet: 'Charlie', species: 'Dog', age: '7 years', owner: 'Mike Davis', diagnosis: 'Periodontal Disease Grade 3', doctor: 'Dr. Smith', created: 'Jan 14, 2026', followUp: 'Mar 8, 2026', completedSteps: 3, totalSteps: 4 },
  { id: 'PLN-003', status: 'active', title: 'Post-Surgery Recovery', pet: 'Max', species: 'Dog', age: '3 years', owner: 'John Smith', diagnosis: 'Post-operative recovery', doctor: 'Dr. Smith', created: 'Mar 1, 2026', followUp: 'Mar 10, 2026', completedSteps: 2, totalSteps: 3 },
  { id: 'PLN-004', status: 'paused', title: 'Chronic Kidney Support', pet: 'Bella', species: 'Dog', age: '8 years', owner: 'Emma Wilson', diagnosis: 'CKD Stage 2', doctor: 'Dr. Johnson', created: 'Feb 20, 2026', followUp: 'Mar 15, 2026', completedSteps: 1, totalSteps: 5 },
  { id: 'PLN-005', status: 'active', title: 'Vaccination Catch-up', pet: 'Rocky', species: 'Dog', age: '1 year', owner: 'David Brown', diagnosis: 'Incomplete Vaccinations', doctor: 'Dr. Chen', created: 'Feb 25, 2026', followUp: 'Mar 12, 2026', completedSteps: 2, totalSteps: 3 },
  { id: 'PLN-006', status: 'completed', title: 'Flea & Tick Prevention', pet: 'Simba', species: 'Cat', age: '3 years', owner: 'Maria Santos', diagnosis: 'Parasite Control', doctor: 'Dr. Smith', created: 'Feb 10, 2026', followUp: '—', completedSteps: 2, totalSteps: 2 },
];

const CLINIC_INVENTORY = [
  { name: 'Amoxicillin 500mg', category: 'Medication', stock: '240 tablets', quantity: 240, expiry: '2027-06-30', status: 'Healthy Stock' },
  { name: 'Doxycycline 100mg', category: 'Medication', stock: '18 tablets', quantity: 18, expiry: '2027-03-15', status: 'Low Stock' },
  { name: 'Metronidazole 250mg', category: 'Medication', stock: '0 tablets', quantity: 0, expiry: '2026-12-01', status: 'Out of Stock' },
  { name: 'Meloxicam Oral 1.5mg/ml', category: 'Medication', stock: '12 bottles', quantity: 12, expiry: '2026-09-20', status: 'Expiring Soon' },
  { name: 'Enrofloxacin 50mg', category: 'Medication', stock: '95 tablets', quantity: 95, expiry: '2027-01-10', status: 'Healthy Stock' },
  { name: 'Rabies Vaccine (IMRAB)', category: 'Vaccine', stock: '22 vials', quantity: 22, expiry: '2026-11-30', status: 'Healthy Stock' },
  { name: 'DHPP (Distemper Combo)', category: 'Vaccine', stock: '8 vials', quantity: 8, expiry: '2026-08-15', status: 'Critical Stock' },
  { name: 'Feline Distemper (FVRCP)', category: 'Vaccine', stock: '15 vials', quantity: 15, expiry: '2026-10-01', status: 'Expiring Soon' },
  { name: 'Bordetella Intranasal', category: 'Vaccine', stock: '30 doses', quantity: 30, expiry: '2027-02-28', status: 'Healthy Stock' },
  { name: 'Leptospirosis 4-way', category: 'Vaccine', stock: '5 vials', quantity: 5, expiry: '2026-07-31', status: 'Critical Stock' },
  { name: 'Syringes 5ml', category: 'Supply', stock: '500 pieces', quantity: 500, expiry: 'N/A', status: 'Healthy Stock' },
  { name: 'Exam Gloves (Medium)', category: 'Supply', stock: '80 pairs', quantity: 80, expiry: 'N/A', status: 'Reorder Soon' },
];

const CONSULTATION_PETS = ['Max — John Smith', 'Luna — Sarah Johnson', 'Charlie — Mike Davis'];
const CONSULTATION_SERVICES = [
  { name: 'General Consultation', charge: 850 },
  { name: 'Vaccination Consultation', charge: 650 },
  { name: 'Dental Examination', charge: 1200 },
];
const CONSULTATION_ITEMS = [
  { name: 'Amoxicillin 500mg', category: 'Medication', unit: 'tablets' },
  { name: 'Doxycycline 100mg', category: 'Medication', unit: 'tablets' },
  { name: 'Metronidazole 250mg', category: 'Medication', unit: 'tablets' },
  { name: 'Meloxicam Oral 1.5mg/ml', category: 'Medication', unit: 'mls' },
  { name: 'Enrofloxacin 50mg', category: 'Medication', unit: 'tablets' },
  { name: 'Rabies Vaccine (IMRAB)', category: 'Vaccine', unit: 'vials' },
  { name: 'DHPP (Distemper Combo)', category: 'Vaccine', unit: 'vials' },
  { name: 'Feline Distemper (FVRCP)', category: 'Vaccine', unit: 'vials' },
  { name: 'Bordetella Intranasal', category: 'Vaccine', unit: 'doses' },
  { name: 'Leptospirosis 4-way', category: 'Vaccine', unit: 'vials' },
  { name: 'Carprofen 50mg', category: 'Medication', unit: 'tablets' },
];
const OWNER_ADDRESS_OPTIONS = [
  {
    region: 'Region III',
    provinces: [{
      name: 'Bulacan',
      municipalities: [
        {
          name: 'Santa Maria',
          zip: '3022',
          barangays: ['Bagbaguin', 'Balasing', 'Buenavista', 'Bulac', 'Camangyanan', 'Catmon', 'Cay Pombo', 'Caysio', 'Guyong', 'Lalakhan', 'Mag-asawang Sapa', 'Mahabang Parang', 'Manggahan', 'Parada', 'Poblacion', 'Pulong Buhangin', 'San Gabriel', 'San Jose Patag', 'San Vicente', 'Santa Clara', 'Santa Cruz', 'Silangan', 'Tabing Bakod', 'Tumana'],
        },
        {
          name: 'Pandi',
          zip: '3014',
          barangays: ['Bagbaguin', 'Bagong Barrio', 'Baka-Bakahan', 'Bunsuran 1st', 'Bunsuran 2nd', 'Bunsuran 3rd', 'Cacarong Bata', 'Cacarong Matanda', 'Cupang', 'Malibo Bata', 'Malibo Matanda', 'Manatal', 'Mapulang Lupa', 'Masagana', 'Masuso', 'Pinagkuartelan', 'Poblacion', 'Real de Cacarong', 'San Roque', 'Santo Niño', 'Siling Bata', 'Siling Matanda'],
        },
      ],
    }],
  },
];

// ── STATUS BADGES ──────────────────────────────────────────────────────
function StatusBadge({ status, vaccination = false }) {
  return <StatusIndicator status={status} className={vaccination ? 'vaccination-status-indicator' : ''} />;
}

const ab = {
  btn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' },
};

async function updateClinicRecordArchive({ user, endpoint, record, label }) {
  if (!user?.clinic_id) throw new Error('Your account is not assigned to a clinic.');
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
  const query = `?clinic_id=${encodeURIComponent(user.clinic_id)}`;
  const response = await fetch(`${apiUrl}${endpoint}/${record.id}/archive${query}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ archived: !record.archived }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Unable to update the ${label} record.`);
  return payload;
}

// ── SHARED TABLE STYLES ────────────────────────────────────────────────
const T = {
  wrap:    { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 24px' },
  hd:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title:   { fontSize: '.9rem', fontWeight: 600, color: '#111827' },
  actions: { display: 'flex', gap: 10 },
  search:  {
    width: '100%', padding: '9px 14px 9px 36px',
    border: '1px solid #e8ecf0', borderRadius: 8,
    fontSize: '.78rem', color: '#111827',
    background: '#f4f6f9', outline: 'none', marginBottom: 20,
  },
  searchWrap: { position: 'relative', marginBottom: 20 },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#64748b', display: 'flex' },
  table:   { width: '100%', borderCollapse: 'collapse' },
  th:      { textAlign: 'left', fontSize: '.72rem', fontWeight: 700, color: '#111827', textTransform: 'none', letterSpacing: 0, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  td:      { padding: '13px 0', fontSize: '.75rem', color: '#111827', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  tdMuted: { padding: '13px 0', fontSize: '.75rem', color: '#111827', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  secondaryBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', border: '1px solid #e8ecf0',
    borderRadius: 8, fontSize: '.75rem', color: '#111827',
    background: '#fff', cursor: 'pointer',
  },
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', border: 'none',
    borderRadius: 8, fontSize: '.75rem', color: '#fff',
    background: '#0f1117', cursor: 'pointer', fontWeight: 500,
  },
};

// ── PRIVACY BANNER ─────────────────────────────────────────────────────
function PrivacyBanner({ onClose }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: '#fffbeb', border: '1px solid #fde68a',
      borderRadius: 10, padding: '12px 16px', marginBottom: 20,
    }}>
      <span style={{ width: 16, height: 16, display: 'flex', color: '#d97706', flexShrink: 0 }}>{Icons.lock}</span>
      <div style={{ fontSize: '.82rem', color: '#92400e', flex: 1 }}>
        <strong style={{ fontWeight: 600 }}>Privacy Protected</strong>
        {' — Patient names, owner info, and contact details are stored locally and NEVER shared with the intelligence network.'}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d97706', display: 'flex' }}>
        <span style={{ width: 16, height: 16, display: 'flex' }}>{Icons.close}</span>
      </button>
    </div>
  );
}

// ── TAB NAV ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: 'grid'     },
  { id: 'owners',       label: 'Owners',       icon: 'users'    },
  { id: 'pets',         label: 'Pets',         icon: 'pet'      },
  { id: 'appointments', label: 'Appointments', icon: 'calendar' },
  { id: 'vaccinations', label: 'Vaccinations', icon: 'syringe'  },
  { id: 'treatments',   label: 'Treatments',   icon: 'pill'     },
  { id: 'lab-results',  label: 'Lab Results',  icon: 'file'     },
  { id: 'inpatient',    label: 'Inpatient',    icon: 'bed'      },
  { id: 'plans',        label: 'Treatment Plans', icon: 'clipboard' },
  { id: 'consultation', label: 'Log Consultation', icon: 'stethoscope' },
  { id: 'inventory',    label: 'Inventory',    icon: 'building'  },
  
];

function TabNav({ active, setTab }) {
  return (
    <div style={{
      display: 'flex', gap: 2, alignItems: 'center',
      background: '#e5e7eb', border: 'none',
      borderRadius: 18, padding: 3, marginBottom: 20,
      width: 'fit-content', maxWidth: '100%', overflowX: 'auto',
    }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 12px', borderRadius: 15, border: active === t.id ? '2px solid #9ca3af' : '2px solid transparent',
            fontSize: '.78rem', fontWeight: active === t.id ? 600 : 500,
            background: active === t.id ? '#fff' : 'transparent',
            color: '#111827',
            boxShadow: active === t.id ? '0 1px 2px rgba(15,23,42,.08)' : 'none',
            cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 13, height: 13, display: 'flex' }}>
            {Icons[t.icon] || Icons.grid}
          </span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function ClinicSectionPlaceholder({ label }) {
  return (
    <div style={T.wrap}>
      <div style={T.title}>{label}</div>
      <div style={{ padding: '32px 0 18px', color: '#64748b', fontSize: '.82rem' }}>
        {label} records will appear here when they are available for this clinic.
      </div>
    </div>
  );
}

export function LabResultsTab({ patientName } = {}) {
  const [search, setSearch] = useState('');
  const [localResults, setLocalResults] = useState(LAB_RESULTS);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestForm, setRequestForm] = useState({ pet: patientName || '', testType: '', laboratory: '', notes: '' });
  const [actionResult, setActionResult] = useState(null);
  const [historyResult, setHistoryResult] = useState(null);
  const [viewResult, setViewResult] = useState(null);
  const filtered = localResults.filter(result => (
    (!patientName || result.pet === patientName) &&
    [result.id, result.pet, result.testType, result.date, result.laboratory, result.summary, result.status, result.requestedBy, result.createdBy, result.lastUpdatedBy, result.dateCreated, result.linkedPatient]
      .some(value => String(value || '').toLowerCase().includes(search.toLowerCase()))
  ));
  const downloadResult = result => {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text('Laboratory Result', 14, 18);
    pdf.setFontSize(10);
    [
      `ID: ${result.id}`,
      `Pet: ${result.pet}`,
      `Test Type: ${result.testType}`,
      `Date: ${result.date}`,
      `Laboratory: ${result.laboratory}`,
      `Status: ${result.status}`,
      `Summary: ${result.summary}`,
    ].forEach((line, index) => pdf.text(line, 14, 32 + index * 8));
    pdf.save(`${result.id}-lab-result.pdf`);
    setActionResult(null);
  };
  const petOptions = [...new Set(localResults.map(result => result.pet).filter(Boolean))];
  const testOptions = [...new Set(localResults.map(result => result.testType).filter(Boolean))];
  const laboratoryOptions = [...new Set(localResults.map(result => result.laboratory).filter(Boolean))];
  const closeNewRequest = () => {
    setNewRequestOpen(false);
    setRequestError('');
    setRequestForm({ pet: patientName || '', testType: '', laboratory: '', notes: '' });
  };
  const submitNewRequest = event => {
    event.preventDefault();
    if (!requestForm.pet || !requestForm.testType || !requestForm.laboratory) {
      setRequestError('Select a patient, test type, and laboratory before submitting.');
      return;
    }
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const newRecord = {
      id: `LAB-${String(localResults.length + 1).padStart(3, '0')}`,
      pet: requestForm.pet,
      testType: requestForm.testType,
      date: today,
      laboratory: requestForm.laboratory,
      summary: requestForm.notes || 'Awaiting laboratory result',
      status: 'pending',
      requestedBy: 'Dr. Smith',
      createdBy: 'Dr. Smith',
      lastUpdatedBy: 'Dr. Smith',
      dateCreated: today,
      linkedPatient: requestForm.pet,
      downloadable: false,
    };
    setLocalResults(previous => [newRecord, ...previous]);
    closeNewRequest();
  };
  return (
    <div style={{ ...T.wrap, width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '20px 20px 18px', borderRadius: 14 }}>
      <div style={{ ...T.hd, margin: '0 0 4px' }}>
        <div>
          <div style={{ ...T.title, fontSize: '.9rem', fontWeight: 600 }}>Lab Results</div>
          <div style={{ marginTop: 4, fontSize: '.75rem', color: '#64748b' }}>Diagnostic test results — linked to Zoetis, IDEXX, and VetPath integrations</div>
        </div>
        <button type="button" onClick={() => setNewRequestOpen(true)} style={{ ...T.primaryBtn, padding: '7px 13px', fontSize: '.75rem', borderRadius: 8 }}>
          <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
          New Lab Request
        </button>
      </div>
      <div style={{ ...T.searchWrap, margin: '24px 0 18px' }}>
        <span style={T.searchIcon}>{Icons.search}</span>
        <input
          style={{ ...T.search, marginBottom: 0, padding: '8px 14px 8px 36px', border: 'none', borderRadius: 8, background: '#f1f1f3', fontSize: '.78rem', color: '#374151' }}
          placeholder="Search lab results..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <table style={{ ...T.table, tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {[
              ['ID', '7%'], ['Pet', '8%'], ['Test Type', '12%'], ['Date', '9%'],
              ['Laboratory', '12%'], ['Result Summary', '19%'], ['Status', '8%'], ['Requested By', '12%'], ['Actions', '7%'],
            ].map(([label, width]) => (
              <th key={label} style={{ ...T.th, width, textTransform: 'none', letterSpacing: 0, color: '#374151', fontSize: '.72rem', padding: '0 7px 9px' }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(result => {
            return (
              <tr key={result.id}>
                <td style={{ ...T.td, padding: '9px 7px', fontWeight: 600, fontSize: '.75rem', color: '#374151', whiteSpace: 'nowrap' }}>{result.id}</td>
                <td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', color: '#374151', fontWeight: 600 }}>{result.pet}</td>
                <td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{result.testType}</td>
                <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{result.date}</td>
                <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{result.laboratory}</td>
                <td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{result.summary}</td>
                <td style={{ ...T.td, padding: '9px 7px' }}>
                  <StatusIndicator status={result.status || 'pending'} />
                </td>
                <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem', color: '#374151', whiteSpace: 'nowrap' }}>{result.requestedBy}</td>
                <td style={{ ...T.td, padding: '9px 7px', textAlign: 'center' }}>
                  <button type="button" onClick={() => setActionResult(result)} aria-label={`Open actions for lab result ${result.id}`} title="Lab result actions" style={{ border: '1px solid #dbe3ee', borderRadius: 7, background: '#fff', color: '#374151', padding: 6, width: 29, height: 29, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', cursor: 'pointer' }}>
                    <span style={{ width: 15, height: 15, display: 'flex' }}>{Icons.moreVertical}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {newRequestOpen && <div style={modalStyles.backdrop} onClick={closeNewRequest}>
        <form role="dialog" aria-modal="true" aria-labelledby="new-lab-request-title" onSubmit={submitNewRequest} onClick={event => event.stopPropagation()} style={{ ...modalStyles.dialog, width: 500, padding: '24px 25px 20px' }}>
          <button type="button" aria-label="Close new lab request" onClick={closeNewRequest} style={modalStyles.close}>{Icons.close}</button>
          <div style={{ paddingRight: 25 }}>
            <h2 id="new-lab-request-title" style={{ margin: 0, color: '#171717', fontSize: '1.05rem', fontWeight: 700 }}>New Lab Request</h2>
            <div style={{ marginTop: 7, color: '#7b8090', fontSize: '.73rem' }}>Create a new diagnostic test request for a patient.</div>
          </div>
          <div style={{ display: 'grid', gap: 14, marginTop: 17 }}>
            {[
              ['Patient (Pet)*', 'pet', 'Select pet', petOptions],
              ['Test Type*', 'testType', 'Select test', testOptions],
              ['Laboratory / Integration*', 'laboratory', 'Select laboratory', laboratoryOptions],
            ].map(([label, field, placeholder, options]) => (
              <label key={field} style={{ display: 'grid', gap: 6, color: '#202020', fontSize: '.73rem', fontWeight: 600 }}>
                {label}
                <span style={{ position: 'relative' }}>
                  <select required value={requestForm[field]} onChange={event => setRequestForm(previous => ({ ...previous, [field]: event.target.value }))} style={{ width: '100%', appearance: 'none', border: 'none', borderRadius: 9, background: '#f1f1f3', color: '#111827', padding: '10px 35px 10px 13px', fontSize: '.75rem', outline: 'none' }}>
                    <option value="" disabled style={{ color: '#111827' }}>{placeholder}</option>
                    {options.map(option => <option key={option} value={option} style={{ color: '#111827' }}>{option}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 13, top: '46%', transform: 'translateY(-50%)', color: '#aeb4c0', pointerEvents: 'none', fontSize: 16, lineHeight: 1 }}>⌄</span>
                </span>
              </label>
            ))}
            <label style={{ display: 'grid', gap: 6, color: '#202020', fontSize: '.73rem', fontWeight: 600 }}>
              Requested By
              <input value="Dr. Smith" readOnly style={{ border: 'none', borderRadius: 9, background: '#f1f1f3', color: '#7b8090', padding: '10px 13px', fontSize: '.75rem', outline: 'none' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, color: '#202020', fontSize: '.73rem', fontWeight: 600 }}>
              Clinical Notes
              <textarea value={requestForm.notes} onChange={event => setRequestForm(previous => ({ ...previous, notes: event.target.value }))} placeholder="Reason for test, suspected diagnosis..." rows={3} style={{ resize: 'vertical', minHeight: 64, border: 'none', borderRadius: 9, background: '#f1f1f3', color: '#202020', padding: '10px 13px', fontFamily: 'inherit', fontSize: '.75rem', outline: 'none' }} />
            </label>
          </div>
          {requestError && <div role="alert" style={{ marginTop: 12, color: '#b42318', fontSize: '.72rem' }}>{requestError}</div>}
          <div style={{ ...modalStyles.footer, marginTop: 16 }}>
            <button type="button" onClick={closeNewRequest} style={modalStyles.cancel}>Cancel</button>
            <button type="submit" style={{ ...T.primaryBtn, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 13px', fontSize: '.72rem', borderRadius: 8 }}><span style={{ width: 14, height: 14, display: 'flex', transform: 'rotate(180deg)' }}>{Icons.download}</span>Submit Request</button>
          </div>
        </form>
      </div>}
      {actionResult && <div style={modalStyles.backdrop} onClick={() => setActionResult(null)}>
        <div role="dialog" aria-modal="true" aria-labelledby="lab-result-actions-title" onClick={event => event.stopPropagation()} style={modalStyles.vaccinationActionsDialog}>
          <button type="button" aria-label="Close lab result actions" onClick={() => setActionResult(null)} style={modalStyles.vaccinationActionsClose}>{Icons.close}</button>
          <div style={modalStyles.vaccinationActionsHeader}>
            <div style={modalStyles.vaccinationActionsHeaderIcon}><span style={{ width: 25, height: 25, display: 'flex' }}>{Icons.activity}</span></div>
            <div><h2 id="lab-result-actions-title" style={modalStyles.vaccinationActionsTitle}>Lab Result Actions</h2><div style={modalStyles.vaccinationActionsSubtitle}>{actionResult.id} — {actionResult.testType} ({actionResult.pet})</div></div>
          </div>
          <div style={modalStyles.vaccinationActionsPet}>
            <div style={modalStyles.vaccinationActionsPetInfo}><div style={{ ...modalStyles.vaccinationActionsHeaderIcon, width: 38, height: 38, borderRadius: '50%', background: '#e7f5f2', color: '#087a70' }}><span style={{ width: 21, height: 21, display: 'flex' }}>{Icons.file}</span></div><div><div style={modalStyles.vaccinationActionsPetName}>{actionResult.pet || 'Selected Patient'}</div><div style={modalStyles.vaccinationActionsPetMeta}>Lab result&nbsp; • &nbsp;{actionResult.laboratory}&nbsp; • &nbsp;{actionResult.date}</div></div></div><StatusIndicator status={actionResult.status || 'Pending'} />
          </div>
          <div style={modalStyles.vaccinationActionsList}>
            <button type="button" onClick={() => setHistoryResult(actionResult)} style={{ ...modalStyles.vaccinationActionCard, border: '1px solid #b7e4d7', background: '#f2fbf8' }}><span style={{ ...modalStyles.vaccinationActionCardIcon, background: '#e7f5f2', color: '#087f65' }}><span style={{ width: 24, height: 24, display: 'flex' }}>{Icons.clipboard}</span></span><span style={modalStyles.vaccinationActionCardText}><strong style={modalStyles.vaccinationActionCardTitle}>View Audit History</strong><small style={modalStyles.vaccinationActionCardDescription}>See who made changes, when, and what was updated for this lab result.</small></span><span style={modalStyles.vaccinationActionArrow}>›</span></button>
            <button type="button" onClick={() => setViewResult(actionResult)} style={{ ...modalStyles.vaccinationActionCard, border: '1px solid #b7e4d7', background: '#f2fbf8' }}><span style={{ ...modalStyles.vaccinationActionCardIcon, background: '#d9f3ea', color: '#0d8a69' }}><span style={{ width: 23, height: 23, display: 'flex' }}>{Icons.eye}</span></span><span style={modalStyles.vaccinationActionCardText}><strong style={modalStyles.vaccinationActionCardTitle}>View Result</strong><small style={modalStyles.vaccinationActionCardDescription}>Open the complete lab result details, including values and reference ranges.</small></span><span style={modalStyles.vaccinationActionArrow}>›</span></button>
            {actionResult.downloadable && <button type="button" onClick={() => downloadResult(actionResult)} style={{ ...modalStyles.vaccinationActionCard, border: '1px solid #d0c6f5', background: '#f8f6ff' }}><span style={{ ...modalStyles.vaccinationActionCardIcon, background: '#e4defb', color: '#6d50c8' }}><span style={{ width: 23, height: 23, display: 'flex' }}>{Icons.download}</span></span><span style={modalStyles.vaccinationActionCardText}><strong style={modalStyles.vaccinationActionCardTitle}>Download Result</strong><small style={modalStyles.vaccinationActionCardDescription}>Export the lab result as a PDF file.</small></span><span style={modalStyles.vaccinationActionArrow}>›</span></button>}
          </div>
          <div style={modalStyles.vaccinationActionsFooter}><span style={modalStyles.vaccinationActionsNote}>ⓘ &nbsp;These actions only affect the selected lab result ({actionResult.id}).</span><button type="button" style={modalStyles.vaccinationActionsCancel} onClick={() => setActionResult(null)}>Cancel</button></div>
        </div>
      </div>}
      {viewResult && <div style={modalStyles.backdrop} onClick={() => setViewResult(null)}>
        <div role="dialog" aria-modal="true" onClick={event => event.stopPropagation()} style={{ ...modalStyles.dialog, width: 500, padding: '22px 24px 18px' }}>
          <button type="button" aria-label="Close lab result" onClick={() => setViewResult(null)} style={modalStyles.close}>{Icons.close}</button>
          <div style={{ paddingRight: 24 }}><h2 style={{ margin: 0, color: '#111827', fontSize: '1.05rem', fontWeight: 700 }}>Lab Result Details</h2><div style={{ marginTop: 6, color: '#64748b', fontSize: '.72rem' }}>{viewResult.id} - {viewResult.pet}</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '17px 28px', marginTop: 19 }}>
            {[['Test Type', viewResult.testType], ['Date', viewResult.date], ['Laboratory', viewResult.laboratory], ['Requested By', viewResult.requestedBy || 'Dr. Smith']].map(([label, value]) => <div key={label}><div style={{ color: '#718096', fontSize: '.7rem' }}>{label}</div><div style={{ marginTop: 4, color: '#111827', fontSize: '.76rem', fontWeight: 600 }}>{value}</div></div>)}
          </div>
          <div style={{ marginTop: 18, padding: '13px 12px', border: '1px solid #dce1e7', borderRadius: 10 }}><div style={{ color: '#718096', fontSize: '.7rem' }}>Result Summary</div><div style={{ marginTop: 8, color: '#111827', fontSize: '.78rem', fontWeight: 600 }}>{viewResult.summary}</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}><span style={{ color: '#718096', fontSize: '.72rem' }}>Status:</span><StatusIndicator status={viewResult.status || 'Pending'} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 13, padding: '10px 12px', borderRadius: 10, background: '#f6f8fa' }}><span style={{ width: 20, height: 20, display: 'flex', color: '#8da0b4' }}>{Icons.file}</span><div style={{ flex: 1 }}><div style={{ color: '#111827', fontSize: '.75rem', fontWeight: 600 }}>{viewResult.fileName || `${String(viewResult.id).toLowerCase()}_report.pdf`}</div><div style={{ marginTop: 3, color: '#718096', fontSize: '.65rem' }}>Report file</div></div>{viewResult.downloadable && <button type="button" onClick={() => downloadResult(viewResult)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #d6dde5', borderRadius: 8, background: '#fff', color: '#111827', padding: '7px 10px', fontSize: '.7rem', cursor: 'pointer' }}><span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.download}</span>Download</button>}</div>
          <div style={{ ...modalStyles.footer, marginTop: 15 }}><button type="button" style={modalStyles.cancel} onClick={() => setViewResult(null)}>Close</button></div>
        </div>
      </div>}
      {historyResult && <div style={modalStyles.backdrop} onClick={() => setHistoryResult(null)}>
        <div role="dialog" aria-modal="true" onClick={event => event.stopPropagation()} style={{ ...modalStyles.dialog, width: 520 }}>
          <button type="button" aria-label="Close lab result audit history" onClick={() => setHistoryResult(null)} style={modalStyles.close}>{Icons.close}</button>
          <div style={modalStyles.headerText}><h2 style={modalStyles.title}>Audit History</h2><div style={modalStyles.subtitle}>{historyResult.id} — {historyResult.testType} ({historyResult.pet})</div></div>
          <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
            {[
              ['Created By', historyResult.createdBy],
              ['Date Created', historyResult.dateCreated],
              ['Last Updated By', historyResult.lastUpdatedBy],
              ['Linked Patient', historyResult.linkedPatient],
            ].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 9, background: '#f8fafc' }}>
              <strong style={{ color: '#475569', fontSize: '.74rem' }}>{label}</strong>
              <span style={{ color: '#64748b', fontSize: '.74rem', textAlign: 'right', overflowWrap: 'anywhere' }}>{value || '—'}</span>
            </div>)}
            {[['Result Requested', historyResult.date, 'Dr. Smith'], ['Result Received', historyResult.date, historyResult.laboratory], ['Last Updated', historyResult.date, 'System']].map(([event, date, actor]) => <div key={event} style={{ padding: '11px 13px', border: '1px solid #e2e8f0', borderRadius: 9, background: '#f8fafc' }}><div style={{ color: '#334155', fontSize: '.76rem', fontWeight: 700 }}>{event} <span style={{ color: '#94a3b8', fontWeight: 400 }}> {date}</span></div><div style={{ marginTop: 4, color: '#64748b', fontSize: '.72rem' }}>{actor}</div></div>)}
          </div>
          <div style={modalStyles.footer}><button type="button" style={modalStyles.cancel} onClick={() => setHistoryResult(null)}>Close</button></div>
        </div>
      </div>}
    </div>
  );
}

function InpatientTab() {
  const [filter, setFilter] = useState('all');
  const [localRecords, setLocalRecords] = useState(INPATIENT_RECORDS);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [admitError, setAdmitError] = useState('');
  const [admitForm, setAdmitForm] = useState({ pet: '', owner: '', ward: '', diagnosis: '', discharge: '', doctor: '', notes: '' });
  const records = filter === 'all' ? localRecords : localRecords.filter(record => record.status === filter);
  const admittedCount = localRecords.filter(record => record.status === 'admitted').length;
  const dischargedCount = localRecords.filter(record => record.status === 'discharged').length;
  const petOptions = PETS.map(pet => ({ name: pet.name, owner: pet.owner })).filter((pet, index, options) => options.findIndex(option => option.name === pet.name) === index);
  const ownerOptions = [...new Set([...OWNERS.map(owner => owner.name), ...petOptions.map(pet => pet.owner)])];
  const wardOptions = ['Ward A - Cage 1', 'Ward A - Cage 2', 'Ward A - Cage 3', 'Ward B - Cage 1', 'Ward B - Cage 2'];
  const doctorOptions = ['Dr. Smith', 'Dr. Johnson', 'Dr. Chen'];
  const closeAdmit = () => {
    setAdmitOpen(false);
    setAdmitError('');
    setAdmitForm({ pet: '', owner: '', ward: '', diagnosis: '', discharge: '', doctor: '', notes: '' });
  };
  const submitAdmission = event => {
    event.preventDefault();
    if (!admitForm.pet || !admitForm.ward || !admitForm.diagnosis) {
      setAdmitError('Complete the required patient, ward, and diagnosis fields.');
      return;
    }
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const record = {
      id: `INP-${String(localRecords.length + 1).padStart(3, '0')}`,
      pet: admitForm.pet,
      owner: admitForm.owner || petOptions.find(pet => pet.name === admitForm.pet)?.owner || 'Not specified',
      admitted: today,
      ward: admitForm.ward,
      diagnosis: admitForm.diagnosis,
      discharge: admitForm.discharge || 'Not scheduled',
      doctor: admitForm.doctor || 'Not assigned',
      notes: admitForm.notes,
      status: 'admitted',
    };
    setLocalRecords(previous => [record, ...previous]);
    closeAdmit();
    notifySuccess(`Patient ${record.pet} admitted successfully`, `Inpatient record ${record.id} was created.`);
  };
  return (
    <div style={{ ...T.wrap, padding: '20px 20px 18px', borderRadius: 14 }}>
      <div style={{ ...T.hd, margin: '0 0 26px' }}>
        <div>
          <div style={{ ...T.title, fontSize: '.9rem', fontWeight: 600 }}>Inpatient &amp; Ward Management</div>
          <div style={{ marginTop: 4, fontSize: '.75rem', color: '#64748b' }}>Track hospitalized patients, ward assignments, and discharge status</div>
        </div>
        <button type="button" onClick={() => setAdmitOpen(true)} style={{ ...T.primaryBtn, padding: '7px 13px', fontSize: '.75rem', borderRadius: 8 }}>
          <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
          Admit Patient
        </button>
      </div>
      <div style={{ display: 'flex', gap: 9, marginBottom: filter === 'admitted' ? 16 : 18 }}>
        {[
          ['all', 'All Patients', INPATIENT_RECORDS.length, '#243247', '#f8fafc', '#cbd5e1'],
          ['admitted', 'Currently Admitted', admittedCount, '#087f65', '#e7f5f2', '#b7e4d7'],
          ['discharged', 'Discharged', dischargedCount, '#16a34a', '#f0fdf4', '#bbf7d0'],
        ].map(([value, label, count, activeColor, inactiveBackground, inactiveBorder]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: `1px solid ${filter === value ? activeColor : inactiveBorder}`,
              background: filter === value ? activeColor : inactiveBackground,
              color: filter === value ? '#fff' : activeColor,
              borderRadius: 9, padding: '8px 13px', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <span style={{ width: 13, height: 13, display: 'flex' }}>{value === 'discharged' ? Icons.shieldCheck : Icons.bed}</span>
            {label}
            <span style={{ opacity: .75 }}>{count}</span>
          </button>
        ))}
      </div>
      {filter === 'admitted' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#e7f5f2', border: '1px solid #b7e4d7', borderRadius: 8, padding: '9px 13px', marginBottom: 18, color: '#087f65', fontSize: '.72rem' }}>
          <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.bed}</span>
          Showing {admittedCount} currently admitted patient. Click a row&apos;s eye icon to view details or discharge.
        </div>
      )}
      <table style={{ ...T.table, tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {[
              ['ID', '8%'], ['Pet', '7%'], ['Owner', '13%'], ['Admitted', '12%'], ['Ward / Cage', '14%'],
              ['Diagnosis', '17%'], ['Exp. Discharge', '13%'], ['Doctor', '10%'], ['Status', '9%'], ['Actions', '7%'],
            ].map(([label, width]) => (
              <th key={label} style={{ ...T.th, width, textTransform: 'none', letterSpacing: 0, color: '#374151', fontSize: '.72rem', padding: '0 7px 9px' }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record.id}>
              <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem', color: '#64748b' }}>{record.id}</td>
              <td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', fontWeight: 600, color: '#374151' }}>{record.pet}</td>
              <td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{record.owner}</td>
              <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem', color: '#64748b' }}>{record.admitted}</td>
              <td style={{ ...T.td, padding: '9px 7px' }}><span style={{ background: '#f1f5f9', borderRadius: 7, padding: '4px 8px', fontSize: '.68rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{record.ward}</span></td>
              <td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{record.diagnosis}</td>
              <td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', color: record.status === 'admitted' ? '#087f65' : '#64748b', fontWeight: record.status === 'admitted' ? 600 : 400 }}>{record.discharge}</td>
              <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem', color: '#64748b' }}>{record.doctor}</td>
              <td style={{ ...T.td, padding: '9px 7px' }}>
                <StatusIndicator status={record.status === 'admitted' ? 'Active' : 'Completed'} />
              </td>
              <td style={{ ...T.td, padding: '9px 7px' }}>
                <button type="button" aria-label={`View ${record.id}`} onClick={() => setSelectedRecord(record)} style={{ ...ab.btn, color: '#64748b', padding: 4 }}>
                  <span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.eye}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {admitOpen && <div style={modalStyles.backdrop} onClick={closeAdmit}>
        <form role="dialog" aria-modal="true" aria-labelledby="admit-patient-title" onSubmit={submitAdmission} onClick={event => event.stopPropagation()} style={{ ...modalStyles.dialog, width: 540, padding: '24px 25px 20px' }}>
          <button type="button" aria-label="Close admit patient" onClick={closeAdmit} style={modalStyles.close}>{Icons.close}</button>
          <div style={{ paddingRight: 24 }}>
            <h2 id="admit-patient-title" style={{ margin: 0, color: '#171717', fontSize: '1.05rem', fontWeight: 700 }}>Admit Patient</h2>
            <div style={{ marginTop: 7, color: '#7b8090', fontSize: '.73rem' }}>Register a pet for inpatient care and assign a ward.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px', marginTop: 18 }}>
            {[
              ['Patient (Pet)*', 'pet', 'Select pet', petOptions.map(option => option.name)],
              ['Owner', 'owner', 'Select owner', ownerOptions],
            ].map(([label, field, placeholder, options]) => (
              <label key={field} style={{ display: 'grid', gap: 6, color: '#202020', fontSize: '.73rem', fontWeight: 600 }}>
                {label}
                <span style={{ position: 'relative' }}>
                  <select required={field === 'pet'} value={admitForm[field]} onChange={event => setAdmitForm(previous => ({ ...previous, [field]: event.target.value }))} style={{ width: '100%', appearance: 'none', border: 'none', borderRadius: 9, background: '#f1f1f3', color: '#111827', padding: '10px 35px 10px 13px', fontSize: '.75rem', outline: 'none' }}>
                    <option value="" disabled>{placeholder}</option>
                    {options.map(option => <option key={option} value={option} style={{ color: '#111827' }}>{option}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 13, top: '46%', transform: 'translateY(-50%)', color: '#aeb4c0', pointerEvents: 'none', fontSize: 16, lineHeight: 1 }}>⌄</span>
                </span>
              </label>
            ))}
            <label style={{ display: 'grid', gridColumn: '1 / -1', gap: 6, color: '#202020', fontSize: '.73rem', fontWeight: 600 }}>
              Ward / Cage Assignment*
              <span style={{ position: 'relative' }}>
                <select required value={admitForm.ward} onChange={event => setAdmitForm(previous => ({ ...previous, ward: event.target.value }))} style={{ width: '100%', appearance: 'none', border: 'none', borderRadius: 9, background: '#f1f1f3', color: '#111827', padding: '10px 35px 10px 13px', fontSize: '.75rem', outline: 'none' }}>
                  <option value="" disabled>Select ward</option>
                  {wardOptions.map(option => <option key={option} value={option} style={{ color: '#111827' }}>{option}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 13, top: '46%', transform: 'translateY(-50%)', color: '#aeb4c0', pointerEvents: 'none', fontSize: 16, lineHeight: 1 }}>⌄</span>
              </span>
            </label>
            <label style={{ display: 'grid', gridColumn: '1 / -1', gap: 6, color: '#202020', fontSize: '.73rem', fontWeight: 600 }}>
              Diagnosis / Reason for Admission*
              <input required value={admitForm.diagnosis} onChange={event => setAdmitForm(previous => ({ ...previous, diagnosis: event.target.value }))} placeholder="e.g. Post-operative recovery" style={{ border: 'none', borderRadius: 9, background: '#f1f1f3', color: '#111827', padding: '10px 13px', fontSize: '.75rem', outline: 'none' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, color: '#202020', fontSize: '.73rem', fontWeight: 600 }}>
              Expected Discharge
              <input type="date" value={admitForm.discharge} onChange={event => setAdmitForm(previous => ({ ...previous, discharge: event.target.value }))} style={{ border: 'none', borderRadius: 9, background: '#f1f1f3', color: '#111827', padding: '10px 13px', fontSize: '.75rem', outline: 'none' }} />
            </label>
            <label style={{ display: 'grid', gap: 6, color: '#202020', fontSize: '.73rem', fontWeight: 600 }}>
              Attending Doctor
              <span style={{ position: 'relative' }}>
                <select value={admitForm.doctor} onChange={event => setAdmitForm(previous => ({ ...previous, doctor: event.target.value }))} style={{ width: '100%', appearance: 'none', border: 'none', borderRadius: 9, background: '#f1f1f3', color: '#111827', padding: '10px 35px 10px 13px', fontSize: '.75rem', outline: 'none' }}>
                  <option value="" disabled>Select doctor</option>
                  {doctorOptions.map(option => <option key={option} value={option} style={{ color: '#111827' }}>{option}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 13, top: '46%', transform: 'translateY(-50%)', color: '#aeb4c0', pointerEvents: 'none', fontSize: 16, lineHeight: 1 }}>⌄</span>
              </span>
            </label>
            <label style={{ display: 'grid', gridColumn: '1 / -1', gap: 6, color: '#202020', fontSize: '.73rem', fontWeight: 600 }}>
              Notes
              <textarea value={admitForm.notes} onChange={event => setAdmitForm(previous => ({ ...previous, notes: event.target.value }))} placeholder="Treatment protocol, special care instructions..." rows={3} style={{ resize: 'vertical', minHeight: 64, border: 'none', borderRadius: 9, background: '#f1f1f3', color: '#111827', padding: '10px 13px', fontFamily: 'inherit', fontSize: '.75rem', outline: 'none' }} />
            </label>
          </div>
          {admitError && <div role="alert" style={{ marginTop: 12, color: '#b42318', fontSize: '.72rem' }}>{admitError}</div>}
          <div style={{ ...modalStyles.footer, marginTop: 16 }}>
            <button type="button" style={modalStyles.cancel} onClick={closeAdmit}>Cancel</button>
            <button type="submit" style={{ ...T.primaryBtn, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 13px', fontSize: '.72rem', borderRadius: 8 }}><span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.bed}</span>Admit Patient</button>
          </div>
        </form>
      </div>}
      {selectedRecord && <div style={modalStyles.backdrop} onClick={() => setSelectedRecord(null)}>
        <div role="dialog" aria-modal="true" aria-labelledby="inpatient-record-title" onClick={event => event.stopPropagation()} style={{ ...modalStyles.dialog, width: 500, padding: '22px 24px 18px' }}>
          <button type="button" aria-label="Close inpatient record" onClick={() => setSelectedRecord(null)} style={modalStyles.close}>{Icons.close}</button>
          <div style={{ paddingRight: 24 }}><h2 id="inpatient-record-title" style={{ margin: 0, color: '#111827', fontSize: '1.05rem', fontWeight: 700 }}>Inpatient Record</h2><div style={{ marginTop: 6, color: '#64748b', fontSize: '.72rem' }}>{selectedRecord.id} - {selectedRecord.pet}</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '17px 28px', marginTop: 20 }}>
            {[['Pet', selectedRecord.pet], ['Owner', selectedRecord.owner], ['Ward / Cage', selectedRecord.ward], ['Doctor', selectedRecord.doctor], ['Admitted', selectedRecord.admitted], ['Expected Discharge', selectedRecord.discharge]].map(([label, value]) => <div key={label}><div style={{ color: '#718096', fontSize: '.7rem' }}>{label}</div><div style={{ marginTop: 4, color: '#111827', fontSize: '.76rem', fontWeight: 600 }}>{value}</div></div>)}
          </div>
          <div style={{ marginTop: 18, padding: '13px 12px', border: '1px solid #dce1e7', borderRadius: 10 }}><div style={{ color: '#718096', fontSize: '.7rem' }}>Diagnosis</div><div style={{ marginTop: 8, color: '#111827', fontSize: '.78rem', fontWeight: 600 }}>{selectedRecord.diagnosis}</div></div>
          <div style={{ marginTop: 12, padding: '13px 12px', borderRadius: 10, background: '#f6f8fa' }}><div style={{ color: '#718096', fontSize: '.7rem' }}>Notes</div><div style={{ marginTop: 8, color: '#111827', fontSize: '.78rem' }}>IV fluids + antibiotics protocol</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}><span style={{ color: '#718096', fontSize: '.72rem' }}>Status:</span><StatusIndicator status={selectedRecord.status === 'admitted' ? 'Admitted' : 'Discharged'} /></div>
          <div style={{ ...modalStyles.footer, marginTop: 17 }}><button type="button" style={modalStyles.cancel} onClick={() => setSelectedRecord(null)}>Close</button>{selectedRecord.status === 'admitted' && <button type="button" onClick={() => { const dischargedRecord = { ...selectedRecord, status: 'discharged' }; setLocalRecords(previous => previous.map(item => item.id === selectedRecord.id ? dischargedRecord : item)); setSelectedRecord(dischargedRecord); notifySuccess(`Patient ${selectedRecord.pet} discharged successfully`, `Inpatient record ${selectedRecord.id} was marked as discharged.`); }} style={{ ...T.primaryBtn, display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', fontSize: '.7rem' }}><span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.check}</span>Discharge Patient</button>}</div>
        </div>
      </div>}
    </div>
  );
}

export function TreatmentPlansTab({ patientName } = {}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [patientFilter, setPatientFilter] = useState(patientName || 'all');
  const [createdPlans, setCreatedPlans] = useState([]);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [createPlanError, setCreatePlanError] = useState('');
  const [createPlanForm, setCreatePlanForm] = useState(() => ({
    pet: patientName || '',
    title: '',
    diagnosis: '',
    severity: 'Moderate',
    doctor: 'Dr. Smith',
    followUp: '',
    steps: [{ title: '', due: '' }],
  }));
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanTab, setSelectedPlanTab] = useState('Plan Details');
  const [planStepState, setPlanStepState] = useState({});
  const [planOverrides, setPlanOverrides] = useState({});
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [editPlanForm, setEditPlanForm] = useState({ title: '', severity: '', doctor: '', completionDate: '', steps: [] });
  const [planNote, setPlanNote] = useState('');
  const [savedPlanNotes, setSavedPlanNotes] = useState([]);
  const [clinicalUpdateOpen, setClinicalUpdateOpen] = useState(false);
  const [clinicalUpdateForm, setClinicalUpdateForm] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
  const [planClinicalUpdates, setPlanClinicalUpdates] = useState({});
  const [fullPlanOpen, setFullPlanOpen] = useState(false);
  const [addMedicationOpen, setAddMedicationOpen] = useState(false);
  const [medicationForm, setMedicationForm] = useState({ name: '', dose: '', route: '', frequency: '', duration: '', date: '' });
  const [planMedications, setPlanMedications] = useState({});
  const [doseLog, setDoseLog] = useState({});
  const allPlans = [...createdPlans, ...TREATMENT_PLANS].map(plan => ({ ...plan, ...(planOverrides[plan.id] || {}) }));
  const plans = allPlans.filter(plan => {
    const matchesSearch = [plan.pet, plan.owner, plan.title, plan.diagnosis, plan.doctor].some(value => value.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch && (statusFilter === 'all' || plan.status === statusFilter) && (patientFilter === 'all' || plan.pet === patientFilter);
  });
  const selectedPatient = selectedPlan && (PETS.find(pet => pet.name === selectedPlan.pet) || selectedPlan);
  const patientOptions = [...new Set([...allPlans.map(plan => plan.pet), ...(patientName ? [patientName] : [])])];
  const planSteps = (plan, completedSteps = plan.completedSteps) => {
    const defaultSteps = [
      { title: 'Initial Assessment', detail: plan.diagnosis, date: plan.created },
      { title: 'Treatment Protocol', detail: `${plan.title} care protocol`, date: plan.created },
      { title: 'Progress Check', detail: 'Review patient response', date: plan.created },
      { title: 'Follow-up Review', detail: 'Confirm recovery and next steps', date: plan.followUp || 'Not scheduled' },
    ];
    return Array.from({ length: plan.totalSteps }, (_, index) => ({
      ...(defaultSteps[index] || {
        title: `Treatment Step ${index + 1}`,
        detail: `${plan.title} care protocol`,
        date: plan.created,
      }),
      ...plan.stepDetails?.[index],
      done: index < completedSteps,
    }));
  };
  const selectedPlanCheckedSteps = selectedPlan
    ? planStepState[selectedPlan.id] || Array.from({ length: selectedPlan.totalSteps }, (_, index) => index < selectedPlan.completedSteps)
    : [];
  const selectedPlanSteps = selectedPlan
    ? planSteps(selectedPlan).map((step, index) => ({ ...step, done: selectedPlanCheckedSteps[index] }))
    : [];
  const nextStepIndex = selectedPlanCheckedSteps.findIndex(done => !done);
  const nextPlanStep = nextStepIndex < 0 ? null : selectedPlanSteps[nextStepIndex];
  const currentMedicationCount = selectedPlan
    ? (selectedPlan.medications || []).length + (planMedications[selectedPlan.id] || []).length
    : 0;
  const selectedPlanMedications = selectedPlan
    ? [...(selectedPlan.medications || []), ...(planMedications[selectedPlan.id] || [])]
    : [];
  const currentNoteCount = savedPlanNotes.length + 1;
  const selectedPlanClinicalUpdates = selectedPlan
    ? [...(planClinicalUpdates[selectedPlan.id] || []), ...(selectedPlan.clinicalUpdates || [])]
    : [];
  const dateForInput = value => {
    if (!value || value === '—') return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  };
  const openEditPlan = () => {
    if (!selectedPlan) return;
    setClinicalUpdateOpen(false);
    setEditPlanForm({
      title: selectedPlan.title,
      severity: selectedPlan.severity || 'Moderate',
      doctor: selectedPlan.doctor,
      completionDate: dateForInput(selectedPlan.followUp),
      steps: selectedPlanSteps.map((step, index) => ({ index, title: step.title, assignee: step.assignee || selectedPlan.doctor, due: step.due || step.date || '' })).filter(step => !selectedPlanCheckedSteps[step.index]),
    });
    setEditPlanOpen(true);
  };
  const saveEditedPlan = event => {
    event.preventDefault();
    if (!selectedPlan || !editPlanForm.title.trim()) return;
    const formattedCompletionDate = editPlanForm.completionDate
      ? new Date(`${editPlanForm.completionDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : selectedPlan.followUp;
    const changes = [];
    if (editPlanForm.title !== selectedPlan.title) changes.push(`Plan title changed to "${editPlanForm.title}"`);
    if (editPlanForm.severity !== selectedPlan.severity) changes.push(`Severity changed to ${editPlanForm.severity}`);
    if (editPlanForm.doctor !== selectedPlan.doctor) changes.push(`Attending veterinarian changed to ${editPlanForm.doctor}`);
    if (formattedCompletionDate !== selectedPlan.followUp) changes.push(`Expected completion changed to ${formattedCompletionDate}`);
    const stepDetails = selectedPlanSteps.map((step, index) => {
      const editedStep = editPlanForm.steps.find(item => item.index === index);
      if (!editedStep) return selectedPlan.stepDetails?.[index] || step;
      const stepChanges = [];
      if (editedStep.assignee !== step.assignee) stepChanges.push(`${step.title} assigned to ${editedStep.assignee}`);
      if (editedStep.due !== (step.due || step.date || '')) stepChanges.push(`${step.title} due date changed to ${editedStep.due}`);
      changes.push(...stepChanges);
      return {
        ...(selectedPlan.stepDetails?.[index] || step),
        assignee: editedStep.assignee,
        due: editedStep.due,
        overdue: editedStep.due !== (step.due || step.date || '') ? false : step.overdue,
      };
    });
    if (!changes.length) {
      setEditPlanOpen(false);
      return;
    }
    const updatedPlan = {
      ...selectedPlan,
      title: editPlanForm.title.trim(),
      severity: editPlanForm.severity,
      doctor: editPlanForm.doctor,
      followUp: formattedCompletionDate,
      stepDetails,
    };
    setPlanOverrides(previous => ({ ...previous, [selectedPlan.id]: updatedPlan }));
    setSelectedPlan(updatedPlan);
    setPlanClinicalUpdates(previous => ({
      ...previous,
      [selectedPlan.id]: [{
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        author: editPlanForm.doctor,
        text: `Plan updated: ${changes.join('. ')}.`,
      }, ...(previous[selectedPlan.id] || [])],
    }));
    setEditPlanOpen(false);
    notifySuccess('Treatment plan updated', `${selectedPlan.pet}'s treatment plan changes were saved and logged.`);
  };
  const closeCreatePlan = () => {
    setCreatePlanOpen(false);
    setCreatePlanError('');
    setCreatePlanForm({
      pet: patientName || '',
      title: '',
      diagnosis: '',
      severity: 'Moderate',
      doctor: 'Dr. Smith',
      followUp: '',
      steps: [{ title: '', due: '' }],
    });
  };
  const saveNewPlan = event => {
    event.preventDefault();
    const steps = createPlanForm.steps
      .map(step => ({ ...step, title: step.title.trim() }))
      .filter(step => step.title);
    if (!createPlanForm.pet || !createPlanForm.title.trim() || !createPlanForm.diagnosis.trim() || !steps.length) {
      setCreatePlanError('Select a patient and enter a plan title, diagnosis, and at least one treatment step.');
      return;
    }
    const existingPatientPlan = allPlans.find(plan => plan.pet === createPlanForm.pet);
    const petRecord = PETS.find(pet => pet.name === createPlanForm.pet);
    const followUp = createPlanForm.followUp
      ? new Date(`${createPlanForm.followUp}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—';
    const created = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const plan = {
      id: `PLN-${Date.now()}`,
      status: 'active',
      title: createPlanForm.title.trim(),
      pet: createPlanForm.pet,
      species: existingPatientPlan?.species || petRecord?.species || 'Pet',
      age: existingPatientPlan?.age || petRecord?.age || '—',
      owner: existingPatientPlan?.owner || petRecord?.owner || 'Owner not recorded',
      diagnosis: createPlanForm.diagnosis.trim(),
      diagnosisConfirmation: 'Clinical assessment',
      severity: createPlanForm.severity,
      weight: existingPatientPlan?.weight || petRecord?.weight || 'Not recorded',
      allergies: existingPatientPlan?.allergies || petRecord?.allergies || 'Not recorded',
      isolationRequired: false,
      reportedToDiseaseMonitoring: false,
      sex: existingPatientPlan?.sex || 'Not recorded',
      vaccines: existingPatientPlan?.vaccines || 'Not recorded',
      consent: 'Pending',
      homeCareInstructions: 'Pending',
      doctor: createPlanForm.doctor,
      created,
      followUp,
      nextActionDue: steps[0].due
        ? new Date(`${steps[0].due}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : followUp,
      completedSteps: 0,
      totalSteps: steps.length,
      stepDetails: steps.map(step => ({
        title: step.title,
        detail: step.title,
        assignee: createPlanForm.doctor,
        due: step.due
          ? new Date(`${step.due}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : followUp,
      })),
      medications: [],
      pastMedications: [],
      clinicalUpdates: [],
    };
    setCreatedPlans(previous => [plan, ...previous]);
    setSearch('');
    setStatusFilter('all');
    setPatientFilter('all');
    closeCreatePlan();
    notifySuccess('Treatment plan created', `${plan.title} was added for ${plan.pet}.`);
  };
  const hasClinicalUpdateContent = Object.values(clinicalUpdateForm).some(value => value.trim());
  const logMedicationDose = key => {
    if (doseLog[key]) return;
    const givenAt = new Date().toISOString();
    setDoseLog(previous => ({ ...previous, [key]: givenAt }));
    notifySuccess('Dose logged', `Medication dose recorded at ${new Date(givenAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`);
  };
  const formatDoseTime = value => value
    ? new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;
  const saveClinicalUpdate = event => {
    event.preventDefault();
    const update = {
      ...clinicalUpdateForm,
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      author: selectedPlan.doctor,
    };
    setPlanClinicalUpdates(previous => ({
      ...previous,
      [selectedPlan.id]: [update, ...(previous[selectedPlan.id] || [])],
    }));
    setClinicalUpdateForm({ subjective: '', objective: '', assessment: '', plan: '' });
    setClinicalUpdateOpen(false);
    notifySuccess('Clinical update saved', `A clinical update was added to ${selectedPlan.pet}'s treatment plan.`);
  };
  return (
    <div style={{ ...T.wrap, padding: '20px 20px 20px', borderRadius: 14 }}>
      <div style={{ ...T.hd, margin: '0 0 26px' }}>
        <div>
          <div style={{ ...T.title, fontSize: '.9rem', fontWeight: 600 }}>Treatment Plans</div>
          <div style={{ marginTop: 4, fontSize: '.75rem', color: '#64748b' }}>Formal multi-step care plans linked to patients</div>
        </div>
        <button type="button" onClick={() => { setCreatePlanError(''); setCreatePlanOpen(true); }} style={{ ...T.primaryBtn, padding: '7px 13px', fontSize: '.75rem', borderRadius: 8 }}>
          <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
          Create Plan
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.6fr) minmax(130px, .55fr) minmax(130px, .55fr)', gap: 12, marginBottom: 14 }}>
        <div style={{ ...T.searchWrap, margin: 0 }}>
          <span style={T.searchIcon}>{Icons.search}</span>
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by pet name, owner, or diagnosis..." style={{ ...T.search, marginBottom: 0, padding: '9px 12px 9px 34px', fontSize: '.74rem' }} />
        </div>
        <span style={{ position: 'relative', display: 'block' }}>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} style={{ width: '100%', height: 36, appearance: 'none', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f4f6f9', color: '#111827', padding: '0 34px 0 12px', fontSize: '.74rem', outline: 'none', cursor: 'pointer' }}>
            <option value="all">All Statuses</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option>
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none', fontSize: 15, lineHeight: 1 }}>⌄</span>
        </span>
        <span style={{ position: 'relative', display: 'block' }}>
          <select value={patientFilter} onChange={event => setPatientFilter(event.target.value)} style={{ width: '100%', height: 36, appearance: 'none', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f4f6f9', color: '#111827', padding: '0 34px 0 12px', fontSize: '.74rem', outline: 'none', cursor: 'pointer' }}>
            <option value="all">All Patients</option>{patientOptions.map(patient => <option key={patient} value={patient}>{patient}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none', fontSize: 15, lineHeight: 1 }}>⌄</span>
        </span>
      </div>
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
        <table style={{ ...T.table, minWidth: 850, tableLayout: 'fixed' }}>
          <thead><tr>{[['Patient', '20%'], ['Plan Title', '21%'], ['Diagnosis', '19%'], ['Progress', '17%'], ['Status', '11%'], ['Next Follow-up', '9%'], ['Actions', '5%']].map(([label, width]) => <th key={label} style={{ ...T.th, width, padding: '11px 9px', color: '#374151', fontSize: '.7rem', textTransform: 'none', letterSpacing: 0 }}>{label}</th>)}</tr></thead>
          <tbody>
            {plans.map(plan => {
              const patient = PETS.find(item => item.name === plan.pet);
              return <tr key={plan.id}>
                <td style={{ ...T.td, padding: '13px 9px' }}><button type="button" onClick={() => { setSelectedPlan(plan); setSelectedPlanTab('Plan Details'); }} style={{ display: 'flex', alignItems: 'center', gap: 9, border: 0, background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer' }}><div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e7f5f2', color: '#087f65', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.78rem' }}>{plan.pet.slice(0, 1)}</div><div><div style={{ color: '#111827', fontWeight: 700, fontSize: '.78rem' }}>{plan.pet}</div><div style={{ color: '#64748b', fontSize: '.68rem' }}>{plan.species || patient?.species || 'Pet'} · {plan.age || patient?.age || '—'}</div></div></button></td>
                <td style={{ ...T.td, padding: '13px 9px', color: '#087f65', fontWeight: 700, fontSize: '.78rem' }}><button type="button" onClick={() => { setSelectedPlan(plan); setSelectedPlanTab('Plan Details'); }} style={{ border: 0, padding: 0, background: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}>{plan.title}<div style={{ marginTop: 3, color: '#64748b', fontWeight: 400, fontSize: '.68rem' }}>{plan.id} · Created {plan.created}</div></button></td>
                <td style={{ ...T.tdMuted, padding: '13px 9px', color: '#475569', fontSize: '.7rem' }}>{plan.diagnosis}</td>
                <td style={{ ...T.td, padding: '13px 9px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 66, height: 7, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}><span style={{ display: 'block', width: `${(plan.completedSteps / plan.totalSteps) * 100}%`, height: '100%', background: '#139b76', borderRadius: 5 }} /></span><strong style={{ color: '#475569', fontSize: '.68rem' }}>{plan.completedSteps}/{plan.totalSteps}</strong></div></td>
                <td style={{ ...T.td, padding: '13px 9px' }}><StatusIndicator status={plan.status} /></td>
                <td style={{ ...T.tdMuted, padding: '13px 9px', color: '#475569', fontSize: '.68rem' }}>{plan.followUp || (plan.status === 'completed' ? '—' : plan.created)}</td>
                <td style={{ ...T.td, padding: '13px 9px', textAlign: 'center' }}><button type="button" aria-label={`View ${plan.id}`} onClick={() => { setSelectedPlan(plan); setSelectedPlanTab('Plan Details'); }} style={{ border: 0, background: 'transparent', color: '#087f65', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700, padding: 8 }}>•••</button></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, color: '#64748b', fontSize: '.68rem' }}>Showing {plans.length} of {allPlans.length} plans</div>
      {createPlanOpen && createPortal(<div style={modalStyles.backdrop} onClick={closeCreatePlan}>
        <form role="dialog" aria-modal="true" aria-labelledby="create-plan-title" onSubmit={saveNewPlan} onClick={event => event.stopPropagation()} style={{ ...modalStyles.dialog, width: 'min(720px, calc(100vw - 24px))', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', padding: '26px 28px 22px', fontSize: '1rem' }}>
          <button type="button" aria-label="Close create treatment plan" onClick={closeCreatePlan} style={modalStyles.close}>{Icons.close}</button>
          <div style={{ paddingRight: 25 }}>
            <h2 id="create-plan-title" style={{ margin: 0, color: '#193a32', fontSize: '1.4rem', fontWeight: 700 }}>Create Treatment Plan</h2>
            <div style={{ marginTop: 7, color: '#526b64', fontSize: '.95rem', lineHeight: 1.45 }}>Create a structured care plan and assign follow-up steps to a patient.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px 16px', marginTop: 19 }}>
            <label style={{ display: 'grid', gap: 7, color: '#193a32', fontSize: '1rem', fontWeight: 600 }}>
              Patient (Pet)*
              <select required value={createPlanForm.pet} onChange={event => setCreatePlanForm(previous => ({ ...previous, pet: event.target.value }))} style={{ width: '100%', minWidth: 0, height: 48, border: '1px solid #d8e9e1', borderRadius: 9, background: '#fff', color: '#193a32', padding: '0 14px', fontSize: '1rem', outlineColor: '#78b7a1' }}>
                <option value="" disabled>Select patient</option>
                {patientOptions.map(patient => <option key={patient} value={patient}>{patient}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 7, color: '#193a32', fontSize: '1rem', fontWeight: 600 }}>
              Plan title*
              <input required value={createPlanForm.title} onChange={event => setCreatePlanForm(previous => ({ ...previous, title: event.target.value }))} placeholder="e.g. Post-surgery recovery" style={{ width: '100%', minWidth: 0, height: 48, boxSizing: 'border-box', border: '1px solid #d8e9e1', borderRadius: 9, padding: '0 14px', color: '#193a32', font: 'inherit', fontWeight: 400, outlineColor: '#78b7a1' }} />
            </label>
            <label style={{ display: 'grid', gap: 7, color: '#193a32', fontSize: '1rem', fontWeight: 600 }}>
              Diagnosis*
              <input required value={createPlanForm.diagnosis} onChange={event => setCreatePlanForm(previous => ({ ...previous, diagnosis: event.target.value }))} placeholder="Enter diagnosis or reason for care" style={{ width: '100%', minWidth: 0, height: 48, boxSizing: 'border-box', border: '1px solid #d8e9e1', borderRadius: 9, padding: '0 14px', color: '#193a32', font: 'inherit', fontWeight: 400, outlineColor: '#78b7a1' }} />
            </label>
            <label style={{ display: 'grid', gap: 7, color: '#193a32', fontSize: '1rem', fontWeight: 600 }}>
              Severity
              <select value={createPlanForm.severity} onChange={event => setCreatePlanForm(previous => ({ ...previous, severity: event.target.value }))} style={{ width: '100%', height: 48, border: '1px solid #d8e9e1', borderRadius: 9, background: '#fff', color: '#193a32', padding: '0 14px', fontSize: '1rem', outlineColor: '#78b7a1' }}>
                <option>Low</option><option>Mild</option><option>Moderate</option><option>Severe</option><option>High</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 7, color: '#193a32', fontSize: '1rem', fontWeight: 600 }}>
              Attending veterinarian
              <select value={createPlanForm.doctor} onChange={event => setCreatePlanForm(previous => ({ ...previous, doctor: event.target.value }))} style={{ width: '100%', height: 48, border: '1px solid #d8e9e1', borderRadius: 9, background: '#fff', color: '#193a32', padding: '0 14px', fontSize: '1rem', outlineColor: '#78b7a1' }}>
                {['Dr. Smith', 'Dr. Johnson', 'Dr. Chen', 'Dr. Torres', 'Dr. Santos', 'Dr. Reyes'].map(doctor => <option key={doctor}>{doctor}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 7, color: '#193a32', fontSize: '1rem', fontWeight: 600 }}>
              Expected follow-up
              <input type="date" value={createPlanForm.followUp} onChange={event => setCreatePlanForm(previous => ({ ...previous, followUp: event.target.value }))} style={{ width: '100%', height: 48, boxSizing: 'border-box', border: '1px solid #d8e9e1', borderRadius: 9, background: '#fff', color: '#193a32', padding: '0 14px', font: 'inherit', outlineColor: '#78b7a1' }} />
            </label>
          </div>
          <section style={{ display: 'grid', gap: 10, marginTop: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, color: '#193a32', fontSize: '1.1rem' }}>Treatment steps*</h3>
                <p style={{ margin: '4px 0 0', color: '#526b64', fontSize: '.9rem', lineHeight: 1.4 }}>Add the actions that make up this care plan.</p>
              </div>
              <button type="button" onClick={() => setCreatePlanForm(previous => ({ ...previous, steps: [...previous.steps, { title: '', due: '' }] }))} style={{ ...modalStyles.cancel, minHeight: 44, padding: '8px 13px', color: '#087f65', fontSize: '.95rem' }}>＋ Add step</button>
            </div>
            {createPlanForm.steps.map((step, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(145px, .55fr) auto', gap: 9, alignItems: 'center' }}>
                <input aria-label={`Treatment step ${index + 1}`} value={step.title} onChange={event => setCreatePlanForm(previous => ({ ...previous, steps: previous.steps.map((item, stepIndex) => stepIndex === index ? { ...item, title: event.target.value } : item) }))} placeholder={`Step ${index + 1} · e.g. Initial assessment`} style={{ width: '100%', minWidth: 0, height: 48, boxSizing: 'border-box', border: '1px solid #d8e9e1', borderRadius: 9, padding: '0 14px', color: '#193a32', font: 'inherit', fontSize: '1rem', outlineColor: '#78b7a1' }} />
                <input aria-label={`Treatment step ${index + 1} due date`} type="date" value={step.due} onChange={event => setCreatePlanForm(previous => ({ ...previous, steps: previous.steps.map((item, stepIndex) => stepIndex === index ? { ...item, due: event.target.value } : item) }))} style={{ width: '100%', minWidth: 0, height: 48, boxSizing: 'border-box', border: '1px solid #d8e9e1', borderRadius: 9, padding: '0 10px', color: '#193a32', font: 'inherit', fontSize: '.95rem', outlineColor: '#78b7a1' }} />
                <button
                  type="button"
                  disabled={createPlanForm.steps.length === 1}
                  aria-label={`Remove treatment step ${index + 1}`}
                  title={createPlanForm.steps.length === 1 ? 'At least one treatment step is required' : `Remove step ${index + 1}`}
                  onClick={() => setCreatePlanForm(previous => ({ ...previous, steps: previous.steps.filter((_, stepIndex) => stepIndex !== index) }))}
                  style={{
                    ...ab.btn,
                    minWidth: 42,
                    minHeight: 42,
                    justifyContent: 'center',
                    color: createPlanForm.steps.length === 1 ? '#9aa8a2' : '#b42318',
                    background: createPlanForm.steps.length === 1 ? '#f5f7f6' : '#fff5f5',
                    border: `1px solid ${createPlanForm.steps.length === 1 ? '#e5ebe8' : '#f3d5d5'}`,
                    padding: 7,
                    cursor: createPlanForm.steps.length === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.75 5.5h12.5M8 5.5V3.75h4V5.5m2.75 0-.65 10.1a1.5 1.5 0 0 1-1.5 1.4H7.4a1.5 1.5 0 0 1-1.5-1.4L5.25 5.5m2.9 3v5.5m3.7-5.5v5.5" />
                  </svg>
                </button>
              </div>
            ))}
          </section>
          {createPlanError && <div role="alert" style={{ marginTop: 12, color: '#b42318', fontSize: '.74rem' }}>{createPlanError}</div>}
          <div style={{ ...modalStyles.footer, marginTop: 20 }}>
            <button type="button" onClick={closeCreatePlan} style={{ ...modalStyles.cancel, minHeight: 46, padding: '10px 16px', fontSize: '.95rem' }}>Cancel</button>
            <button type="submit" style={{ ...T.primaryBtn, display: 'flex', alignItems: 'center', gap: 8, minHeight: 46, padding: '10px 16px', fontSize: '.95rem', borderRadius: 8 }}><span style={{ width: 16, height: 16, display: 'flex' }}>{Icons.plus}</span>Create Plan</button>
          </div>
        </form>
      </div>, document.body)}
      {selectedPlan && !fullPlanOpen && <div style={modalStyles.backdrop} onClick={() => setSelectedPlan(null)}>
        <div role="dialog" aria-modal="true" aria-labelledby="treatment-plan-details-title" onClick={event => event.stopPropagation()} style={{ ...modalStyles.dialog, position: 'relative', display: 'flex', flexDirection: 'column', width: 'min(760px, calc(100vw - 20px))', maxHeight: 'calc(100vh - 20px)', overflow: 'hidden', padding: 0, borderRadius: 16 }}>
          <button type="button" aria-label="Close treatment plan details" onClick={() => setSelectedPlan(null)} style={{ ...modalStyles.close, zIndex: 1, top: 18, right: 20 }}>{Icons.close}</button>
          <header style={{ flex: '0 0 auto', padding: '22px 30px 12px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, paddingRight: 26 }}>
              <div style={{ width: 52, height: 52, flex: '0 0 52px', borderRadius: '50%', background: '#e7f5f2', color: '#087f65', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', fontWeight: 700 }}>{selectedPlan.pet.slice(0, 1)}</div>
              <div style={{ minWidth: 0 }}><h2 id="treatment-plan-details-title" style={{ margin: 0, color: '#1f2937', fontSize: '1.25rem' }}>{selectedPlan.pet} <StatusIndicator status={selectedPlan.status} style={{ marginLeft: 7, verticalAlign: 'middle', fontSize: '.78rem' }} /></h2><div style={{ marginTop: 4, color: '#64748b', fontSize: '.82rem' }}>{selectedPatient?.species || 'Pet'} · {selectedPatient?.age || '—'} · Owner: {selectedPatient?.owner || '—'}</div></div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 22px', margin: '13px 0 0 65px', color: '#334155', fontSize: '.75rem' }}>
              <span>{selectedPlan.weight || selectedPatient?.weight || 'Weight not recorded'}</span>
              <span>Allergies: {selectedPlan.allergies || selectedPatient?.allergies || 'Not recorded'}</span>
              {selectedPlan.isolationRequired && <span style={{ padding: '5px 9px', borderRadius: 7, color: '#b42318', background: '#fff1f0', whiteSpace: 'nowrap' }}>⚠ Isolation required</span>}
            </div>
          </header>
          <nav aria-label="Treatment plan sections" style={{ display: 'flex', flex: '0 0 auto', gap: 0, padding: '0 30px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
            {[['Plan Details', 'Plan'], ['Medications', 'Medications'], ['Notes', 'Notes']].map(([tab, label]) => <button key={tab} type="button" aria-current={selectedPlanTab === tab ? 'page' : undefined} onClick={() => setSelectedPlanTab(tab)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginRight: 25, padding: '11px 0 10px', border: 0, borderBottom: selectedPlanTab === tab ? '3px solid #087f65' : '3px solid transparent', background: 'transparent', color: selectedPlanTab === tab ? '#087f65' : '#64748b', fontWeight: selectedPlanTab === tab ? 700 : 500, fontSize: '.8rem', cursor: 'pointer' }}>{label}{tab === 'Medications' && <span style={{ borderRadius: 6, padding: '2px 5px', background: '#edf5f2', color: '#526663', fontSize: '.65rem' }}>{currentMedicationCount}</span>}{tab === 'Notes' && <span style={{ borderRadius: 6, padding: '2px 5px', background: '#edf5f2', color: '#526663', fontSize: '.65rem' }}>{currentNoteCount}</span>}</button>)}
          </nav>
          <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '0 30px 20px', background: '#fff' }}>
          {selectedPlanTab === 'Medications' ? <div style={{ marginTop: 19 }}>
            <h3 style={{ margin: 0, color: '#526663', fontSize: '.72rem', letterSpacing: '.07em', textTransform: 'uppercase' }}>Current medications</h3>
            <div style={{ marginTop: 5, borderTop: '1px solid #dcece5' }}>
              {(selectedPlan.medications || []).concat(planMedications[selectedPlan.id] || []).map((medication, index) => <div key={`${medication.name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, padding: '11px 4px', borderBottom: '1px solid #e5eeea', color: '#475569', fontSize: '.72rem' }}>
                <div><strong style={{ display: 'block', color: '#1f2937', fontSize: '.77rem' }}>{medication.name}</strong><span style={{ display: 'block', marginTop: 3, color: '#64748b' }}>{medication.dose} · {medication.route || 'Route not recorded'} · {medication.frequency}</span><small style={{ display: 'block', marginTop: 2, color: '#64748b' }}>{medication.day ? `${medication.day} of ${medication.duration} · ` : ''}Next dose {medication.nextDue || medication.duration || 'Not scheduled'}</small></div>
                <StatusIndicator status={medication.status} style={{ flexShrink: 0, fontSize: '.7rem' }} />
              </div>)}
              {!currentMedicationCount && <p style={{ padding: '14px 4px', color: '#64748b', fontSize: '.74rem' }}>No current medications recorded.</p>}
            </div>
            <div style={{ marginTop: 15 }}>
              <h3 style={{ margin: '0 0 7px', color: '#526663', fontSize: '.68rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>Dose log · tap when given</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{selectedPlanMedications.map((medication, index) => {
                const key = `${selectedPlan.id}-${medication.name}-${index}`;
                const logged = doseLog[key];
                return <button key={key} type="button" aria-pressed={!!logged} disabled={!!logged} onClick={() => logMedicationDose(key)} style={{ border: `1px solid ${logged ? '#b7e4d7' : '#dcece5'}`, borderRadius: 7, background: logged ? '#e7f5f2' : '#fff', color: '#087f65', padding: '7px 9px', fontSize: '.68rem', cursor: logged ? 'default' : 'pointer' }}>{logged ? '✓' : '○'} {medication.name} · {logged ? `Given ${formatDoseTime(logged)}` : '9:00 AM'}</button>;
              })}</div>
            </div>
            <h3 style={{ margin: '20px 0 0', color: '#526663', fontSize: '.72rem', letterSpacing: '.07em', textTransform: 'uppercase' }}>Past medications</h3>
            <div style={{ marginTop: 5, borderTop: '1px solid #dcece5' }}>{(selectedPlan.pastMedications || []).map(item => <div key={item} style={{ padding: '10px 4px', borderBottom: '1px solid #e5eeea', color: '#475569', fontSize: '.72rem' }}>{item}</div>)}</div>
            <p style={{ margin: '14px 0 0', color: '#64748b', fontSize: '.68rem' }}>Sample data for design purposes only, not clinical guidance.</p>
          </div> : selectedPlanTab === 'Notes' ? <div style={{ marginTop: 19 }}>
            <div style={{ display: 'grid', gap: 10, padding: 14, border: '1px solid #d8f4e8', borderRadius: 10, background: '#f8fbff' }}><h3 style={{ margin: 0, color: '#087f65', fontSize: '.95rem' }}>Add Note</h3><textarea value={planNote} onChange={event => setPlanNote(event.target.value)} placeholder="Write a note about this patient's condition, treatment, or follow-up..." rows={4} style={{ resize: 'vertical', border: '1px solid #d8f4e8', borderRadius: 8, padding: 11, color: '#111827', fontFamily: 'inherit', fontSize: '.78rem', outline: 'none' }} /></div>
            <h3 style={{ margin: '22px 0 10px', color: '#087f65', fontSize: '.95rem' }}>Patient Notes</h3><div style={{ display: 'grid', gap: 9 }}>{[...savedPlanNotes, { text: 'Continue current treatment protocol and monitor patient response.', date: selectedPlan.created, author: selectedPlan.doctor }].map((note, index) => <div key={`${note.date}-${index}`} style={{ padding: 12, border: '1px solid #eef2f7', borderRadius: 8 }}><div style={{ color: '#334155', fontSize: '.78rem' }}>{note.text}</div><div style={{ marginTop: 5, color: '#64748b', fontSize: '.68rem' }}>{note.date} · {note.author}</div></div>)}</div>
          </div> : <>
          <div style={{ marginTop: 18, paddingBottom: 15, borderBottom: '1px solid #e2e8f0' }}><strong style={{ display: 'block', color: '#1f2937', fontSize: '.9rem' }}>{selectedPlan.title}</strong><span style={{ display: 'block', marginTop: 4, color: '#64748b', fontSize: '.72rem' }}>{selectedPlan.id} · Created {selectedPlan.created} · {selectedPlan.doctor}</span></div>
          {nextPlanStep && <div style={{ marginTop: 14, padding: '12px 14px', border: `1px solid ${nextPlanStep.overdue ? '#f2d5a6' : '#d8e9e2'}`, borderRadius: 11, background: nextPlanStep.overdue ? '#fff8eb' : '#f6fbf8' }}>
            <div style={{ color: nextPlanStep.overdue ? '#9a5b00' : '#526663', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.03em' }}>NEXT ACTION{nextPlanStep.overdue ? ' · OVERDUE' : ''}</div>
            <strong style={{ display: 'block', marginTop: 5, color: '#1f2937', fontSize: '.95rem' }}>{nextPlanStep.title}</strong>
            <span style={{ display: 'block', marginTop: 3, color: '#64748b', fontSize: '.75rem' }}>Was due {nextPlanStep.due || selectedPlan.nextActionDue || selectedPlan.followUp || 'Not scheduled'} · {nextPlanStep.assignee || selectedPlan.doctor}</span>
          </div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '17px 24px', marginTop: 17 }}>
            <div><div style={{ color: '#64748b', fontSize: '.72rem' }}>Diagnosis</div><strong style={{ display: 'block', marginTop: 3, color: '#1f2937', fontSize: '.82rem' }}>{selectedPlan.diagnosis}</strong><span style={{ display: 'block', marginTop: 2, color: '#64748b', fontSize: '.7rem' }}>{selectedPlan.diagnosisConfirmation || 'Confirmation not recorded'}</span></div>
            <div><div style={{ color: '#64748b', fontSize: '.72rem' }}>Severity</div><strong style={{ display: 'block', marginTop: 3, color: '#1f2937', fontSize: '.82rem' }}>{selectedPlan.severity || 'Not recorded'}</strong></div>
            <div><div style={{ color: '#64748b', fontSize: '.72rem' }}>Start date</div><strong style={{ display: 'block', marginTop: 3, color: '#1f2937', fontSize: '.82rem' }}>{selectedPlan.created}</strong></div>
            <div><div style={{ color: '#64748b', fontSize: '.72rem' }}>Next follow-up</div><strong style={{ display: 'block', marginTop: 3, color: '#1f2937', fontSize: '.82rem' }}>{selectedPlan.followUp || (selectedPlan.status === 'completed' ? 'Completed' : 'Not scheduled')}</strong></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 21, color: '#087f65', fontSize: '.78rem', fontWeight: 700 }}><span>Progress</span><span>{selectedPlanCheckedSteps.filter(Boolean).length} of {selectedPlan.totalSteps} steps</span></div>
          <div style={{ height: 9, marginTop: 7, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}><div style={{ width: `${(selectedPlanCheckedSteps.filter(Boolean).length / selectedPlan.totalSteps) * 100}%`, height: '100%', background: '#139b76', borderRadius: 6, transition: 'width .2s ease' }} /></div>
          <div style={{ display: 'grid', marginTop: 10 }}>
            {selectedPlanSteps.map((step, index) => {
              const stepStatus = step.done ? `Done ${step.completedAt || step.date}` : step.overdue ? 'Overdue' : `Due ${step.due || step.date}`;
              const stepStatusColor = step.done ? '#087f65' : step.overdue ? '#c51f18' : '#1d55bd';
              return <button key={step.title} type="button" aria-pressed={step.done} onClick={() => setPlanStepState(previous => ({ ...previous, [selectedPlan.id]: selectedPlanCheckedSteps.map((checked, stepIndex) => stepIndex === index ? !checked : checked) }))} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 0', border: 0, borderBottom: index < selectedPlanSteps.length - 1 ? '1px solid #e5eeea' : 0, background: 'transparent', textAlign: 'left', cursor: 'pointer' }}>
                <span style={{ width: 27, height: 27, flex: '0 0 27px', borderRadius: '50%', border: `2px solid ${step.done ? '#0c8b6e' : step.overdue ? '#e42d27' : '#cbd5e1'}`, background: step.done ? '#0c8b6e' : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.76rem' }}>{step.done ? '✓' : ''}</span>
                <span style={{ minWidth: 0, flex: 1 }}><strong style={{ display: 'block', color: '#334155', fontSize: '.78rem' }}>{step.title}</strong><small style={{ display: 'block', marginTop: 3, color: '#64748b', fontSize: '.68rem' }}>{step.assignee || selectedPlan.doctor}</small></span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: stepStatusColor, fontSize: '.7rem', whiteSpace: 'nowrap' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: stepStatusColor }} />{stepStatus}</span>
              </button>;
            })}
          </div>
          </>}
          </div>
          <footer style={{ display: 'flex', flex: '0 0 auto', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 28px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
            <button type="button" onClick={() => setFullPlanOpen(true)} style={{ border: 0, background: 'transparent', color: '#087f65', padding: '10px 12px', fontSize: '.76rem', fontWeight: 600, cursor: 'pointer' }}>Open full plan</button>
            {selectedPlanTab === 'Plan Details' ? <button type="button" disabled={!nextPlanStep} onClick={() => {
              if (!nextPlanStep) return;
              setPlanStepState(previous => ({ ...previous, [selectedPlan.id]: selectedPlanCheckedSteps.map((done, index) => index === nextStepIndex ? true : done) }));
              notifySuccess('Treatment step completed', `${nextPlanStep.title} was marked complete.`);
            }} style={{ border: 0, borderRadius: 9, background: nextPlanStep ? '#087f65' : '#d1e5dd', color: '#fff', padding: '11px 17px', fontSize: '.75rem', fontWeight: 700, cursor: nextPlanStep ? 'pointer' : 'default' }}>{nextPlanStep ? 'Complete step' : 'All steps complete'}</button>
              : selectedPlanTab === 'Medications' ? <button type="button" onClick={() => setAddMedicationOpen(true)} style={{ border: 0, borderRadius: 9, background: '#087f65', color: '#fff', padding: '11px 17px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}>＋ Add medication</button>
                : <button type="button" disabled={!planNote.trim()} onClick={() => {
                  if (!planNote.trim()) return;
                  setSavedPlanNotes(previous => [{ text: planNote.trim(), date: new Date().toLocaleString(), author: 'Dr. Smith' }, ...previous]);
                  setPlanNote('');
                  notifySuccess('Note saved', `A note was added to ${selectedPlan.pet}'s treatment plan.`);
                }} style={{ border: 0, borderRadius: 9, background: planNote.trim() ? '#087f65' : '#d1e5dd', color: '#fff', padding: '11px 17px', fontSize: '.75rem', fontWeight: 700, cursor: planNote.trim() ? 'pointer' : 'default' }}>Save note</button>}
          </footer>
        </div>
      </div>}
      {addMedicationOpen && selectedPlan && createPortal(<div style={{ ...modalStyles.backdrop, zIndex: 1400 }} onClick={() => setAddMedicationOpen(false)}>
        <form role="dialog" aria-modal="true" aria-labelledby="add-medication-title" onClick={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); if (!medicationForm.name.trim() || !medicationForm.dose.trim() || !medicationForm.frequency.trim()) return; const medication = { ...medicationForm, name: medicationForm.name.trim(), dose: medicationForm.dose.trim(), route: medicationForm.route.trim(), frequency: medicationForm.frequency.trim(), date: medicationForm.date || selectedPlan.created, status: 'In Progress' }; setPlanMedications(previous => ({ ...previous, [selectedPlan.id]: [...(previous[selectedPlan.id] || []), medication] })); setMedicationForm({ name: '', dose: '', route: '', frequency: '', duration: '', date: '' }); setAddMedicationOpen(false); notifySuccess('Medication added', `${medication.name} was added to ${selectedPlan.pet}'s plan.`); }} style={{ ...modalStyles.dialog, width: 'min(500px, calc(100vw - 32px))', padding: '25px 28px 22px' }}>
          <button type="button" aria-label="Close add medication" onClick={() => setAddMedicationOpen(false)} style={modalStyles.close}>{Icons.close}</button>
          <h2 id="add-medication-title" style={{ margin: 0, color: '#1f2937', fontSize: '1.15rem' }}>Add Medication</h2>
          <div style={{ marginTop: 6, color: '#64748b', fontSize: '.78rem' }}>Add medication instructions for {selectedPlan.pet}.</div>
          <div style={{ display: 'grid', gap: 13, marginTop: 20 }}>
            {[['Medication', 'name', 'e.g. Amoxicillin 500mg'], ['Dosage', 'dose', 'e.g. 1 tablet'], ['Route', 'route', 'e.g. Oral or SC'], ['Frequency', 'frequency', 'e.g. Twice daily'], ['Duration', 'duration', 'e.g. 7 days']].map(([label, field, placeholder]) => <label key={field} style={{ display: 'grid', gap: 6, color: '#1f2937', fontSize: '.78rem', fontWeight: 700 }}>{label}<input required={!['duration', 'route'].includes(field)} value={medicationForm[field]} onChange={event => setMedicationForm(previous => ({ ...previous, [field]: event.target.value }))} placeholder={placeholder} style={{ border: '1px solid #d8f4e8', borderRadius: 8, padding: '11px 12px', color: '#111827', fontSize: '.78rem', outline: 'none' }} /></label>)}
            <label style={{ display: 'grid', gap: 6, color: '#1f2937', fontSize: '.78rem', fontWeight: 700 }}>Start Date<input type="date" value={medicationForm.date} onChange={event => setMedicationForm(previous => ({ ...previous, date: event.target.value }))} style={{ border: '1px solid #d8f4e8', borderRadius: 8, padding: '10px 12px', color: '#111827', fontSize: '.78rem', outline: 'none' }} /></label>
          </div>
          <div style={{ ...modalStyles.footer, marginTop: 20 }}><button type="button" onClick={() => setAddMedicationOpen(false)} style={modalStyles.cancel}>Cancel</button><button type="submit" style={{ ...T.primaryBtn, padding: '10px 14px', fontSize: '.78rem' }}>Add Medication</button></div>
        </form>
      </div>, document.body)}
      {clinicalUpdateOpen && selectedPlan && createPortal(<div onClick={() => setClinicalUpdateOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: 20, boxSizing: 'border-box', background: 'rgba(25, 43, 38, .52)' }}>
        <form role="dialog" aria-modal="true" aria-labelledby="clinical-update-title" onClick={event => event.stopPropagation()} onSubmit={saveClinicalUpdate} style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: 'min(560px, 100%)', maxHeight: 'calc(100vh - 40px)', overflow: 'hidden', borderRadius: 20, background: '#fff', boxShadow: '0 24px 70px rgba(15, 35, 28, .26)', color: '#193a32' }}>
          <button type="button" aria-label="Close clinical update" onClick={() => setClinicalUpdateOpen(false)} style={{ position: 'absolute', top: 23, right: 24, zIndex: 1, display: 'grid', placeItems: 'center', width: 28, height: 28, border: 0, background: 'transparent', color: '#58716b', fontSize: 23, cursor: 'pointer' }}>×</button>
          <header style={{ flex: '0 0 auto', padding: '23px 24px 12px' }}>
            <h2 id="clinical-update-title" style={{ margin: 0, paddingRight: 34, color: '#193a32', fontSize: '1.28rem', fontWeight: 750 }}>Add clinical update</h2>
            <div style={{ marginTop: 4, color: '#58716b', fontSize: '.88rem' }}>{selectedPlan.pet} · as {selectedPlan.doctor}</div>
          </header>
          <div style={{ flex: '1 1 auto', overflowY: 'auto', display: 'grid', gap: 21, padding: '10px 24px 24px' }}>
            {[
              ['S · Subjective (what the owner reports)', 'subjective'],
              ['O · Objective (exam findings, vitals)', 'objective'],
              ['A · Assessment', 'assessment'],
              ['P · Plan', 'plan'],
            ].map(([label, field]) => <label key={field} style={{ display: 'grid', gap: 8, color: '#193a32', fontSize: '.9rem', fontWeight: 500 }}>
              {label}
              <textarea aria-label={label} value={clinicalUpdateForm[field]} onChange={event => setClinicalUpdateForm(previous => ({ ...previous, [field]: event.target.value }))} rows={3} style={{ width: '100%', minHeight: 88, boxSizing: 'border-box', resize: 'vertical', border: '1px solid #d8e9e1', borderRadius: 13, padding: '12px 14px', background: '#fff', color: '#1f2937', font: 'inherit', outlineColor: '#78b7a1' }} />
            </label>)}
          </div>
          <footer style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 22, padding: '16px 24px', borderTop: '1px solid #e1ebe6', background: '#fff' }}>
            <button type="button" onClick={() => setClinicalUpdateOpen(false)} style={{ border: 0, background: 'transparent', color: '#087f65', padding: '10px 8px', fontSize: '.82rem', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={!hasClinicalUpdateContent} style={{ minWidth: 118, border: 0, borderRadius: 12, background: hasClinicalUpdateContent ? '#087f65' : '#8fc6b5', color: '#fff', padding: '15px 17px', fontSize: '.82rem', fontWeight: 700, cursor: hasClinicalUpdateContent ? 'pointer' : 'default' }}>Save update</button>
          </footer>
        </form>
      </div>, document.body)}
      {editPlanOpen && selectedPlan && createPortal(<div onClick={() => setEditPlanOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: 20, boxSizing: 'border-box', background: 'rgba(25, 43, 38, .52)' }}>
        <form role="dialog" aria-modal="true" aria-labelledby="edit-plan-title" onClick={event => event.stopPropagation()} onSubmit={saveEditedPlan} style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: 'min(554px, 100%)', maxHeight: 'calc(100vh - 40px)', overflow: 'hidden', borderRadius: 20, background: '#fff', boxShadow: '0 24px 70px rgba(15, 35, 28, .26)', color: '#193a32' }}>
          <button type="button" aria-label="Close edit plan" onClick={() => setEditPlanOpen(false)} style={{ position: 'absolute', top: 22, right: 23, zIndex: 1, display: 'grid', placeItems: 'center', width: 28, height: 28, border: 0, background: 'transparent', color: '#58716b', fontSize: 23, cursor: 'pointer' }}>×</button>
          <header style={{ flex: '0 0 auto', padding: '22px 24px 13px' }}>
            <h2 id="edit-plan-title" style={{ margin: 0, paddingRight: 36, color: '#193a32', fontSize: '1.28rem', fontWeight: 750 }}>Edit plan</h2>
            <div style={{ marginTop: 4, color: '#58716b', fontSize: '.88rem' }}>{selectedPlan.pet} · {selectedPlan.id}</div>
          </header>
          <div style={{ flex: '1 1 auto', overflowY: 'auto', display: 'grid', alignContent: 'start', gap: 17, padding: '9px 24px 22px' }}>
            <label style={{ display: 'grid', gap: 8, color: '#193a32', fontSize: '.88rem', fontWeight: 600 }}>
              Plan title
              <input required value={editPlanForm.title} onChange={event => setEditPlanForm(previous => ({ ...previous, title: event.target.value }))} style={{ width: '100%', height: 55, boxSizing: 'border-box', border: '1px solid #d8e9e1', borderRadius: 13, padding: '0 15px', color: '#193a32', font: 'inherit', fontWeight: 400, outlineColor: '#78b7a1' }} />
            </label>
            <fieldset style={{ display: 'grid', gap: 9, margin: 0, padding: 0, border: 0 }}>
              <legend style={{ marginBottom: 9, color: '#193a32', fontSize: '.88rem', fontWeight: 600 }}>Severity</legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>{['Mild', 'Moderate', 'Severe'].map(severity => <button key={severity} type="button" aria-pressed={editPlanForm.severity === severity} onClick={() => setEditPlanForm(previous => ({ ...previous, severity }))} style={{ minWidth: 72, height: 47, border: `1px solid ${editPlanForm.severity === severity ? '#087f65' : '#d8e9e1'}`, borderRadius: 13, background: editPlanForm.severity === severity ? '#e7f5f2' : '#fff', color: editPlanForm.severity === severity ? '#087f65' : '#38534c', fontSize: '.8rem', cursor: 'pointer' }}>{severity}</button>)}</div>
            </fieldset>
            <fieldset style={{ display: 'grid', gap: 9, margin: 0, padding: 0, border: 0 }}>
              <legend style={{ marginBottom: 9, color: '#193a32', fontSize: '.88rem', fontWeight: 600 }}>Attending veterinarian</legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>{Array.from(new Set([selectedPlan.doctor, 'Dr. Johnson', 'Dr. Cruz', 'Dr. Reyes', 'Dr. Smith', 'Dr. Chen'])).map(doctor => <button key={doctor} type="button" aria-pressed={editPlanForm.doctor === doctor} onClick={() => setEditPlanForm(previous => ({ ...previous, doctor }))} style={{ minHeight: 47, border: `1px solid ${editPlanForm.doctor === doctor ? '#087f65' : '#d8e9e1'}`, borderRadius: 13, background: editPlanForm.doctor === doctor ? '#e7f5f2' : '#fff', color: editPlanForm.doctor === doctor ? '#087f65' : '#38534c', padding: '0 14px', fontSize: '.8rem', cursor: 'pointer' }}>{doctor}</button>)}</div>
            </fieldset>
            <label style={{ display: 'grid', gap: 8, color: '#193a32', fontSize: '.88rem', fontWeight: 600 }}>
              Expected completion
              <input type="date" value={editPlanForm.completionDate} onChange={event => setEditPlanForm(previous => ({ ...previous, completionDate: event.target.value }))} style={{ width: '100%', height: 55, boxSizing: 'border-box', border: '1px solid #d8e9e1', borderRadius: 13, padding: '0 15px', background: '#fff', color: '#193a32', font: 'inherit', fontWeight: 400, outlineColor: '#78b7a1' }} />
            </label>
            {!!editPlanForm.steps.length && <section style={{ display: 'grid', gap: 13 }}>
              <h3 style={{ margin: '3px 0 0', color: '#58716b', fontSize: '.8rem', fontWeight: 750, letterSpacing: '.08em' }}>REMAINING STEPS</h3>
              {editPlanForm.steps.map(step => <div key={step.index} style={{ display: 'grid', gap: 8 }}>
                <strong style={{ color: '#193a32', fontSize: '.88rem' }}>{step.index + 1}. {step.title}</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <select aria-label={`${step.title} assignee`} value={step.assignee} onChange={event => setEditPlanForm(previous => ({ ...previous, steps: previous.steps.map(item => item.index === step.index ? { ...item, assignee: event.target.value } : item) }))} style={{ minWidth: 0, height: 56, border: '1px solid #d8e9e1', borderRadius: 13, padding: '0 13px', background: '#fff', color: '#38534c', fontSize: '.8rem' }}>{Array.from(new Set([step.assignee, selectedPlan.doctor, 'Dr. Johnson', 'Dr. Cruz', 'Dr. Reyes', 'Dr. Smith', 'Dr. Chen'])).map(doctor => <option key={doctor} value={doctor}>{doctor}</option>)}</select>
                  <input aria-label={`${step.title} due date`} value={step.due} onChange={event => setEditPlanForm(previous => ({ ...previous, steps: previous.steps.map(item => item.index === step.index ? { ...item, due: event.target.value } : item) }))} placeholder="Due date and time" style={{ minWidth: 0, height: 56, boxSizing: 'border-box', border: '1px solid #d8e9e1', borderRadius: 13, padding: '0 13px', color: '#38534c', fontSize: '.8rem', outlineColor: '#78b7a1' }} />
                </div>
              </div>)}
              <p style={{ margin: 0, color: '#58716b', fontSize: '.76rem', lineHeight: 1.45 }}>Changing a due date reschedules the step and clears its overdue flag. Every change is logged in Clinical Updates.</p>
            </section>}
          </div>
          <footer style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 22, padding: '16px 24px', borderTop: '1px solid #e1ebe6', background: '#fff' }}>
            <button type="button" onClick={() => setEditPlanOpen(false)} style={{ border: 0, background: 'transparent', color: '#087f65', padding: '10px 8px', fontSize: '.82rem', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ minWidth: 123, border: 0, borderRadius: 12, background: '#087f65', color: '#fff', padding: '15px 17px', fontSize: '.82rem', fontWeight: 700, cursor: 'pointer' }}>Save changes</button>
          </footer>
        </form>
      </div>, document.body)}
      {fullPlanOpen && selectedPlan && createPortal(<div style={{ position: 'fixed', inset: 0, zIndex: 1200, overflowY: 'auto', background: '#f4f7fb', padding: '24px 20px 40px', boxSizing: 'border-box' }}>
        <style>{`.full-plan-columns{grid-template-columns:minmax(0,1.35fr) minmax(300px,.8fr)}@media(max-width:900px){.full-plan-columns{grid-template-columns:minmax(0,1fr)!important}}@media(max-width:620px){.full-plan-metadata{grid-template-columns:repeat(2,minmax(0,1fr))!important}.full-plan-metadata>div{border-right:0!important;border-bottom:1px solid #e5eeea}.full-treatment-plan{font-size:15px!important}}`}</style>
        <div className="full-treatment-plan" role="dialog" aria-modal="true" aria-labelledby="full-plan-title" style={{ width: 'min(1180px, 100%)', margin: '0 auto', padding: '4px 0', fontSize: '16px' }}>
          <button type="button" onClick={() => setFullPlanOpen(false)} style={{ border: 0, background: 'transparent', color: '#087f65', padding: 0, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer' }}>← Back to Treatment Plans</button>
          <div style={{ marginTop: 18, padding: '25px 27px', border: '1px solid #dcece5', borderRadius: 14, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 46, height: 46, flex: '0 0 46px', borderRadius: '50%', background: '#e7f5f2', color: '#087f65', display: 'grid', placeItems: 'center', fontSize: '1.05rem', fontWeight: 800 }}>{selectedPlan.pet.slice(0, 1)}</span>
              <div style={{ minWidth: 0 }}>
                <h2 id="full-plan-title" style={{ margin: 0, color: '#1f2937', fontSize: '1.35rem' }}>{selectedPlan.pet} <StatusIndicator status={selectedPlan.status} style={{ marginLeft: 7, verticalAlign: 'middle', fontSize: '.86rem' }} /></h2>
                <div style={{ marginTop: 5, color: '#526663', fontSize: '.86rem' }}>{selectedPlan.diagnosis} · {selectedPlan.diagnosisConfirmation || 'Diagnosis confirmation not recorded'} · {selectedPlan.created} · Severity: {selectedPlan.severity || 'Not recorded'}</div>
                <div style={{ marginTop: 4, color: '#64748b', fontSize: '.8rem' }}>{selectedPlan.id} · {selectedPlan.doctor} · Owner: {selectedPlan.owner}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>{selectedPlan.isolationRequired && <span style={{ padding: '5px 9px', borderRadius: 6, color: '#b42318', background: '#fff1f0', fontSize: '.76rem' }}>⚠ Isolation required</span>}{selectedPlan.reportedToDiseaseMonitoring && <span style={{ padding: '5px 9px', borderRadius: 6, color: '#1d55bd', background: '#eef4ff', fontSize: '.76rem' }}>● Reported to Disease Monitoring</span>}</div>
              </div>
            </div>
            <div className="full-plan-metadata" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', marginTop: 16, border: '1px solid #e5eeea', borderRadius: 9, overflow: 'hidden' }}>{[
              ['Weight', selectedPlan.weight || selectedPatient?.weight || 'Not recorded'],
              ['Species · Age', `${selectedPlan.species || selectedPatient?.species || 'Pet'} · ${selectedPlan.age || selectedPatient?.age || '—'}`],
              ['Sex', selectedPlan.sex || 'Not recorded'],
              ['Allergies', selectedPlan.allergies || selectedPatient?.allergies || 'Not recorded'],
              ['Vaccines', selectedPlan.vaccines || 'Not recorded'],
            ].map(([label, value], index) => <div key={label} style={{ minWidth: 0, padding: '13px 14px', borderRight: index < 4 ? '1px solid #e5eeea' : 0 }}><small style={{ display: 'block', color: '#64748b', fontSize: '.76rem' }}>{label}</small><strong style={{ display: 'block', marginTop: 4, color: '#1f2937', fontSize: '.86rem' }}>{value}</strong></div>)}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 18, color: '#334155', fontSize: '.86rem' }}><strong>Plan progress</strong><span>Step {Math.min(selectedPlanCheckedSteps.filter(Boolean).length + 1, selectedPlan.totalSteps)} of {selectedPlan.totalSteps} · Expected completion {selectedPlan.followUp || 'Not scheduled'}</span></div><div style={{ height: 10, marginTop: 7, background: '#e1ebe6', borderRadius: 7, overflow: 'hidden' }}><div style={{ width: `${selectedPlanCheckedSteps.filter(Boolean).length / selectedPlan.totalSteps * 100}%`, height: '100%', background: '#0c8b6e', borderRadius: 7 }} /></div>
          </div>
          {nextPlanStep && <section style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginTop: 16, padding: '19px 21px', border: `1px solid ${nextPlanStep.overdue ? '#f2d5a6' : '#dcece5'}`, borderRadius: 12, background: nextPlanStep.overdue ? '#fff8eb' : '#fff' }}>
            <div><div style={{ color: nextPlanStep.overdue ? '#9a5b00' : '#64748b', fontSize: '.78rem', fontWeight: 700, letterSpacing: '.04em' }}>NEXT ACTION · {nextPlanStep.overdue ? 'OVERDUE' : 'SCHEDULED'}</div><strong style={{ display: 'block', marginTop: 5, color: '#1f2937', fontSize: '1.08rem' }}>{nextPlanStep.title}</strong><span style={{ color: '#64748b', fontSize: '.84rem' }}>Was due {nextPlanStep.due || selectedPlan.nextActionDue || selectedPlan.followUp || 'Not scheduled'} · Assigned to {nextPlanStep.assignee || selectedPlan.doctor}</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}><button type="button" onClick={() => setClinicalUpdateOpen(true)} style={{ ...T.primaryBtn, padding: '11px 14px', fontSize: '.78rem' }}>Add clinical update</button><button type="button" onClick={() => {
              if (!nextPlanStep) return;
              setPlanStepState(previous => ({ ...previous, [selectedPlan.id]: selectedPlanCheckedSteps.map((done, index) => index === nextStepIndex ? true : done) }));
              notifySuccess('Treatment step completed', `${nextPlanStep.title} was marked complete.`);
            }} style={{ ...modalStyles.cancel, padding: '11px 14px', fontSize: '.78rem' }}>Complete step</button></div>
          </section>}
          <div className="full-plan-columns" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(300px, .8fr)', gap: 18, marginTop: 17, alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
              <section style={{ border: '1px solid #dcece5', borderRadius: 13, padding: '21px 22px', background: '#fff' }}>
                <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.02rem' }}>Treatment steps</h3>
                <div style={{ display: 'grid', marginTop: 12 }}>{selectedPlanSteps.map((step, index) => {
                  const statusLabel = step.done ? `Done ${step.completedAt || step.date}` : step.overdue ? 'Overdue' : `Scheduled ${step.due || step.date}`;
                  const tone = step.done ? '#0c8b6e' : step.overdue ? '#dc2626' : '#3674e8';
                  return <div key={step.title} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) auto', gap: 12, alignItems: 'center', padding: '15px 0', borderBottom: index < selectedPlanSteps.length - 1 ? '1px solid #e5eeea' : 0 }}>
                    <span style={{ width: 29, height: 29, borderRadius: '50%', border: `2px solid ${tone}`, background: step.done ? tone : '#fff', color: step.done ? '#fff' : tone, display: 'grid', placeItems: 'center', fontSize: '.82rem' }}>{step.done ? '✓' : index + 1}</span>
                    <div><strong style={{ display: 'block', color: '#1f2937', fontSize: '.86rem' }}>{step.title}</strong><small style={{ display: 'block', marginTop: 4, color: '#64748b', fontSize: '.76rem', lineHeight: 1.4 }}>{step.detail} · {step.assignee || selectedPlan.doctor}</small></div>
                    <span style={{ color: tone, fontSize: '.76rem', whiteSpace: 'nowrap' }}>● {statusLabel}</span>
                  </div>;
                })}</div>
              </section>
              <section style={{ border: '1px solid #dcece5', borderRadius: 13, padding: '21px 22px', background: '#fff', minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.02rem' }}>Medications</h3><button type="button" onClick={() => setAddMedicationOpen(true)} style={{ ...modalStyles.cancel, padding: '9px 12px', color: '#087f65', fontSize: '.76rem' }}>＋ Add medication</button></div>
                <div style={{ overflowX: 'auto', marginTop: 14 }}>
                  <div style={{ minWidth: 630 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr .65fr 1fr .85fr auto', gap: 10, padding: '0 5px 9px', borderBottom: '1px solid #dcece5', color: '#64748b', fontSize: '.73rem', fontWeight: 700 }}><span>Drug</span><span>Dose</span><span>Route</span><span>Frequency</span><span>Next due</span><span>Status</span></div>
                    {(selectedPlan.medications || []).concat(planMedications[selectedPlan.id] || []).map((medication, index) => <div key={`${medication.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr .65fr 1fr .85fr auto', gap: 10, alignItems: 'center', padding: '13px 5px', borderBottom: '1px solid #e8efec', color: '#334155', fontSize: '.78rem' }}>
                      <span><strong style={{ display: 'block', color: '#1f2937', fontSize: '.83rem' }}>{medication.name}</strong><small style={{ display: 'block', marginTop: 3, color: '#64748b', fontSize: '.73rem' }}>{medication.day || medication.duration}</small></span><span>{medication.dose}</span><span>{medication.route || '—'}</span><span>{medication.frequency}</span><span>{medication.nextDue || medication.duration}</span><StatusIndicator status={medication.status} style={{ fontSize: '.74rem' }} />
                    </div>)}
                  </div>
                </div>
                {!currentMedicationCount && <p style={{ margin: '13px 5px', color: '#64748b', fontSize: '.8rem' }}>No current medications recorded.</p>}
                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 9, color: '#526663', fontSize: '.73rem', fontWeight: 700, letterSpacing: '.05em' }}>DOSE LOG · TAP WHEN GIVEN</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{selectedPlanMedications.map((medication, index) => {
                    const key = `${selectedPlan.id}-${medication.name}-${index}`;
                    const logged = doseLog[key];
                    return <button key={key} type="button" aria-pressed={!!logged} disabled={!!logged} onClick={() => logMedicationDose(key)} style={{ border: '1px solid #cfe8dc', borderRadius: 8, background: logged ? '#e7f5f2' : '#fff', color: '#087f65', padding: '9px 11px', fontSize: '.76rem', cursor: logged ? 'default' : 'pointer' }}>{logged ? '✓' : '○'} {medication.name} · {logged ? `Given ${formatDoseTime(logged)}` : '9:00 AM'}</button>;
                  })}</div>
                </div>
                <p style={{ margin: '14px 0 0', color: '#64748b', fontSize: '.74rem' }}>Sample data for design purposes only, not clinical guidance.</p>
              </section>
              <section style={{ border: '1px solid #dcece5', borderRadius: 13, padding: '21px 22px', background: '#fff' }}>
                <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.02rem' }}>Clinical updates</h3>
                <div style={{ display: 'grid', gap: 0, marginTop: 15 }}>{selectedPlanClinicalUpdates.map((update, index) => <div key={`${update.date}-${index}`} style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: 11, paddingBottom: 15 }}>
                  <span style={{ width: 12, height: 12, marginTop: 4, border: '2px solid #0c8b6e', borderRadius: '50%', background: '#e7f5f2' }} />
                  <div><strong style={{ display: 'block', color: '#1f2937', fontSize: '.8rem' }}>{update.date} · {update.author}</strong><p style={{ margin: '5px 0 0', color: '#475569', fontSize: '.8rem', lineHeight: 1.55, whiteSpace: 'pre-line' }}>{update.text || [['S', update.subjective], ['O', update.objective], ['A', update.assessment], ['P', update.plan]].filter(([, value]) => value).map(([label, value]) => `${label} · ${value}`).join('\n')}</p></div>
                </div>)}
                  {!selectedPlanClinicalUpdates.length && <p style={{ color: '#64748b', fontSize: '.8rem' }}>No clinical updates recorded.</p>}
                </div>
              </section>
            </div>
            <div style={{ display: 'grid', gap: 15, minWidth: 0 }}>
              <section style={{ border: '1px solid #dcece5', borderRadius: 13, padding: '20px 21px', background: '#fff' }}>
                <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.02rem' }}>Monitoring</h3>
                {selectedPlan.monitoring ? <><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>{[
                  ['Temperature', selectedPlan.monitoring.temperature, selectedPlan.monitoring.temperatureStatus],
                  ['Weight', selectedPlan.monitoring.weight],
                  ['Hydration', selectedPlan.monitoring.hydration],
                  ['Appetite', selectedPlan.monitoring.appetite],
                  ['WBC', selectedPlan.monitoring.whiteBloodCellCount, selectedPlan.monitoring.whiteBloodCellStatus],
                ].map(([label, value, status]) => <div key={label} style={{ padding: '12px 13px', borderRadius: 9, background: '#f5faf7' }}><small style={{ display: 'block', color: '#64748b', fontSize: '.74rem' }}>{label}</small><strong style={{ display: 'block', marginTop: 4, color: '#1f2937', fontSize: '.86rem' }}>{value}</strong>{status && <StatusIndicator status={status} style={{ marginTop: 5, fontSize: '.76rem' }} />}</div>)}</div><svg viewBox="0 0 300 72" role="img" aria-label="Recent temperature readings trending down" style={{ display: 'block', width: '100%', height: 76, marginTop: 13 }}><polyline points="8,16 78,30 148,42 220,55 292,62" fill="none" stroke="#087f65" strokeWidth="3" />{[[8,16],[78,30],[148,42],[220,55],[292,62]].map(([x,y]) => <circle key={x} cx={x} cy={y} r="4" fill="#087f65" />)}</svg><small style={{ display: 'block', marginTop: 1, color: '#64748b', fontSize: '.72rem' }}>Temperature, last readings</small></>
                  : <p style={{ margin: '12px 0 0', color: '#64748b', fontSize: '.82rem' }}>No monitoring measurements have been recorded for this plan.</p>}
              </section>
              <section style={{ border: '1px solid #dcece5', borderRadius: 13, padding: '20px 21px', background: '#fff' }}>
                <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.02rem' }}>Follow-up schedule</h3>
                <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>{[
                  [selectedPlan.nextActionDue || selectedPlan.followUp, nextPlanStep?.title || 'Progress check', nextPlanStep?.overdue ? 'Overdue' : 'Due Soon'],
                  [selectedPlan.followUp, 'Follow-up review', 'Booked'],
                ].map(([date, label, status], index) => <div key={`${label}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderTop: '1px solid #e8efec', color: '#334155', fontSize: '.78rem' }}><span>{date || 'No date set'} · {label}</span><StatusIndicator status={status} style={{ fontSize: '.74rem' }} /></div>)}</div>
              </section>
              <section style={{ border: '1px solid #dcece5', borderRadius: 13, padding: '20px 21px', background: '#fff' }}>
                <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.02rem' }}>Owner & consent</h3>
                <div style={{ display: 'grid', gap: 11, marginTop: 13, color: '#475569', fontSize: '.8rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span>Owner</span><strong>{selectedPlan.owner}</strong></div><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 9, borderTop: '1px solid #e8efec' }}><span>Treatment consent</span><StatusIndicator status={selectedPlan.consent || 'Pending'} style={{ fontSize: '.76rem' }} /></div><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 9, borderTop: '1px solid #e8efec' }}><span>Estimate</span><strong>{selectedPlan.estimate || 'Not recorded'}</strong></div><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 9, borderTop: '1px solid #e8efec' }}><span>Home-care instructions</span><StatusIndicator status={selectedPlan.homeCareInstructions || 'Pending'} style={{ fontSize: '.76rem' }} /></div></div>
              </section>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 24, paddingTop: 17, borderTop: '1px solid #e2e8f0' }}><button type="button" onClick={openEditPlan} style={{ ...T.primaryBtn, padding: '10px 14px', fontSize: '.76rem' }}>Edit Plan</button><button type="button" onClick={() => notifySuccess('Treatment plan printed', `${selectedPlan.title} is ready to print.`)} style={{ ...modalStyles.cancel, padding: '10px 14px', fontSize: '.76rem' }}>Print Plan</button><button type="button" onClick={() => setClinicalUpdateOpen(true)} style={{ ...modalStyles.cancel, padding: '10px 14px', fontSize: '.76rem' }}>Add Clinical Update</button></div>
          {selectedPlan.completedSteps >= selectedPlan.totalSteps && <button type="button" onClick={() => notifySuccess('Treatment plan completed', `${selectedPlan.title} was marked completed.`)} style={{ width: '100%', marginTop: 12, border: 0, borderRadius: 8, background: '#087f65', color: '#fff', padding: '12px 14px', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}>Complete Treatment Plan</button>}
        </div>
      </div>, document.body)}
    </div>
  );
}

function ConsultationTab() {
  const [patient, setPatient] = useState('');
  const [service, setService] = useState('');
  const [weight, setWeight] = useState('');
  const [temperature, setTemperature] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [hydration, setHydration] = useState('Normal');
  const [diagnosisStatus, setDiagnosisStatus] = useState('Suspected');
  const [severity, setSeverity] = useState('Mild');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [prescription, setPrescription] = useState('');
  const [validationError, setValidationError] = useState('');
  const [medicines, setMedicines] = useState([{ medicine: '', quantity: '', unit: '', doseRate: '' }]);
  const selectedService = CONSULTATION_SERVICES.find(item => item.name === service);
  const updateMedicine = (index, key, value) => {
    setMedicines(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  };
  const submitConsultation = () => {
    if (!patient || !service || !diagnosis.trim()) {
      setValidationError('Patient, service, and diagnosis are required before submitting.');
      return;
    }
    setValidationError('');
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#e7f5f2', border: '1px solid #b7e4d7', borderRadius: 8, padding: '11px 13px', marginBottom: 14, color: '#087f65' }}>
        <span style={{ width: 17, height: 17, display: 'flex', flexShrink: 0 }}>{Icons.stethoscope}</span>
        <div>
          <div style={{ fontSize: '.76rem', fontWeight: 600 }}>Consultation Logging</div>
          <div style={{ marginTop: 4, fontSize: '.72rem' }}>Select the patient, service, and any medicines/vaccines used. On submit, inventory will be automatically deducted and billing forwarded to the receptionist.</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: 14, alignItems: 'start' }}>
        <div style={{ ...T.wrap, padding: '20px 20px 18px' }}>
          <div style={{ ...T.title, marginBottom: 24 }}>Patient &amp; Service</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label style={consultationStyles.label}><span>Patient (Pet)<span style={modalStyles.required}>*</span></span><select value={patient} onChange={event => setPatient(event.target.value)} style={consultationStyles.input}><option value="">Select patient</option>{CONSULTATION_PETS.map(item => <option key={item}>{item}</option>)}</select></label>
            <label style={consultationStyles.label}><span>Service / Procedure<span style={modalStyles.required}>*</span></span><select value={service} onChange={event => setService(event.target.value)} style={consultationStyles.input}><option value="">Select service</option>{CONSULTATION_SERVICES.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label style={consultationStyles.label}>Weight (kg)<input type="number" min="0" step="0.1" value={weight} onChange={event => setWeight(event.target.value)} placeholder="Enter weight" style={consultationStyles.input} /></label>
            <label style={consultationStyles.label}>Known allergies<input value={patient ? 'Not recorded' : 'Select a patient first'} readOnly style={consultationStyles.input} /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <label style={consultationStyles.label}>Temperature (°C)<input type="number" min="0" step="0.1" value={temperature} onChange={event => setTemperature(event.target.value)} placeholder="e.g. 38.5" style={consultationStyles.input} /></label>
            <label style={consultationStyles.label}>Heart rate (bpm)<input type="number" min="0" step="1" value={heartRate} onChange={event => setHeartRate(event.target.value)} placeholder="e.g. 100" style={consultationStyles.input} /></label>
            <label style={consultationStyles.label}>Resp. rate (/min)<input type="number" min="0" step="1" value={respiratoryRate} onChange={event => setRespiratoryRate(event.target.value)} placeholder="e.g. 22" style={consultationStyles.input} /></label>
          </div>
          <div style={{ marginBottom: 13 }}>
            <div style={{ ...consultationStyles.label, marginBottom: 7 }}>Hydration</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {['Normal', 'Mild deficit', 'Moderate deficit'].map(value => <button key={value} type="button" aria-pressed={hydration === value} onClick={() => setHydration(value)} style={{ ...consultationStyles.choice, ...(hydration === value ? consultationStyles.choiceSelected : {}) }}>{value}</button>)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, paddingTop: 13, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: 4 }}>
              <div style={{ ...consultationStyles.label, marginBottom: 7 }}>Diagnosis status</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['Suspected', 'Confirmed'].map(value => <button key={value} type="button" aria-pressed={diagnosisStatus === value} onClick={() => setDiagnosisStatus(value)} style={{ ...consultationStyles.choice, ...(diagnosisStatus === value ? consultationStyles.choiceSelected : {}) }}>{value}</button>)}
              </div>
            </div>
            <div style={{ marginBottom: 4 }}>
              <div style={{ ...consultationStyles.label, marginBottom: 7 }}>Severity</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['Mild', 'Moderate', 'Severe'].map(value => <button key={value} type="button" aria-pressed={severity === value} onClick={() => setSeverity(value)} style={{ ...consultationStyles.choice, ...(severity === value ? consultationStyles.choiceSelected : {}) }}>{value}</button>)}
              </div>
            </div>
          </div>
          <label style={consultationStyles.label}><span>Diagnosis / Chief Complaint<span style={modalStyles.required}>*</span></span><input value={diagnosis} onChange={event => setDiagnosis(event.target.value)} placeholder="e.g. Suspected bacterial infection, routine wellness check..." style={consultationStyles.input} /></label>
          <label style={consultationStyles.label}>Clinical Notes<textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Physical examination findings, vital signs, observations..." style={{ ...consultationStyles.input, minHeight: 66, resize: 'vertical' }} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label style={consultationStyles.label}>Follow-up Date (optional)<input type="date" value={followUp} onChange={event => setFollowUp(event.target.value)} style={consultationStyles.input} /></label>
            <label style={consultationStyles.label}>Follow-up time<input type="time" value={followUpTime} onChange={event => setFollowUpTime(event.target.value)} style={consultationStyles.input} /></label>
          </div>
        </div>
        <div style={{ ...T.wrap, padding: '20px 20px 18px' }}>
          <div style={{ ...T.title, marginBottom: 25 }}>Consultation Summary</div>
          {[
            ['Patient', patient || '—'],
            ['Service', service || '—'],
            ['Known allergies', patient ? 'Not recorded' : '—'],
            ['Diagnosis', diagnosis || '—'],
            ['Diagnosis status / severity', `${diagnosisStatus} · ${severity}`],
            ['Weight', weight ? `${weight} kg` : '—'],
            ['Temperature', temperature ? `${temperature} °C` : '—'],
            ['Heart / respiratory rate', `${heartRate || '—'} bpm / ${respiratoryRate || '—'} per min`],
            ['Hydration', hydration],
            ['Follow-up', followUp ? `${followUp}${followUpTime ? ` at ${followUpTime}` : ''}` : '—'],
          ].map(([label, value]) => <div key={label} style={consultationStyles.summaryRow}><span style={consultationStyles.summaryLabel}>{label}</span><strong style={consultationStyles.summaryValue}>{value}</strong></div>)}
          <div style={consultationStyles.summarySection}>
            <div style={consultationStyles.summarySectionTitle}>Medicines &amp; Vaccines</div>
            {medicines.filter(row => row.medicine).length
              ? medicines.filter(row => row.medicine).map((row, index) => {
                const item = CONSULTATION_ITEMS.find(candidate => candidate.name === row.medicine);
                const dose = Number(weight) * Number(row.doseRate);
                return <div key={`${row.medicine}-${index}`} style={consultationStyles.summaryRow}>
                  <span style={consultationStyles.summaryValue}>{row.medicine}{row.quantity ? ` × ${row.quantity}` : ''}{row.unit ? ` ${row.unit}` : ''}</span>
                  {item?.category === 'Medication' && Number.isFinite(dose) && dose > 0
                    ? <strong style={consultationStyles.summaryValue}>{Number(dose.toFixed(2))} mg/dose</strong>
                    : <strong style={consultationStyles.summaryValue}>{item?.category || 'Item'}</strong>}
                </div>;
              })
              : <div style={consultationStyles.summaryEmpty}>No medicines or vaccines selected</div>}
          </div>
          <div style={consultationStyles.summaryTotal}>
            <div><strong style={consultationStyles.summaryTotalLabel}>Estimated total (service only)</strong><small style={consultationStyles.summaryTotalNote}>Medicine and vaccine prices are not configured here</small></div>
            <strong style={consultationStyles.summaryTotalAmount}>₱{(selectedService?.charge || 0).toLocaleString('en-PH')}</strong>
          </div>
          {validationError && <div style={{ ...modalStyles.error, marginTop: 12 }}>{validationError}</div>}
          <button type="button" onClick={submitConsultation} style={{ ...T.primaryBtn, justifyContent: 'center', width: '100%', marginTop: 14, padding: '8px 12px' }}>
            <span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.send}</span>
            Submit &amp; Send to Billing
          </button>
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '.67rem', marginTop: 9 }}>This will deduct inventory and notify the receptionist</div>
        </div>
        <div style={{ ...T.wrap, padding: '20px 20px 18px', gridColumn: '1 / 2' }}>
          <div style={{ ...T.title, marginBottom: 25 }}>Medicines &amp; Vaccines Used</div>
          {medicines.map((row, index) => {
            const selectedItem = CONSULTATION_ITEMS.find(item => item.name === row.medicine);
            const dose = Number(weight) * Number(row.doseRate);
            const hasCalculatedDose = selectedItem?.category === 'Medication'
              && Number(weight) > 0
              && Number(row.doseRate) > 0
              && Number.isFinite(dose);
            return <div key={index} style={consultationStyles.medicineCard}>
              <div style={consultationStyles.medicineGrid}>
                <label style={consultationStyles.medicineLabel}>Medicine / Vaccine<select value={row.medicine} onChange={event => {
                  const item = CONSULTATION_ITEMS.find(candidate => candidate.name === event.target.value);
                  setMedicines(rows => rows.map((current, rowIndex) => rowIndex === index
                    ? { ...current, medicine: item?.name || '', unit: item?.unit || '', doseRate: '' }
                    : current));
                }} style={consultationStyles.input}><option value="">Select item</option>{CONSULTATION_ITEMS.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
                <label style={consultationStyles.medicineLabel}>Quantity<input type="number" min="0" step="any" value={row.quantity} onChange={event => updateMedicine(index, 'quantity', event.target.value)} placeholder="Qty" style={consultationStyles.input} /></label>
                <label style={consultationStyles.medicineLabel}>Unit<input value={row.unit} onChange={event => updateMedicine(index, 'unit', event.target.value)} placeholder="e.g. tablets" style={consultationStyles.input} /></label>
                <button type="button" onClick={() => setMedicines(rows => rows.filter((_, rowIndex) => rowIndex !== index))} style={consultationStyles.removeMedicineButton} aria-label={`Remove ${row.medicine || 'medicine or vaccine'}`} title="Remove item"><span style={consultationStyles.removeMedicineIcon}>{Icons.trash}</span></button>
              </div>
              {selectedItem?.category === 'Medication' && <div style={consultationStyles.doseCalculation}>
                <label style={consultationStyles.doseRateLabel}>Prescribed dose rate (mg/kg)<input type="number" min="0" step="any" value={row.doseRate} onChange={event => updateMedicine(index, 'doseRate', event.target.value)} placeholder="Enter prescribed rate" style={consultationStyles.doseRateInput} /></label>
                <div style={consultationStyles.calculatedDose}>
                  {hasCalculatedDose
                    ? <>Calculated dose: <strong>{Number(dose.toFixed(2))} mg</strong> per dose ({Number(row.doseRate)} mg/kg)</>
                    : 'Enter patient weight and the prescribed dose rate to calculate.'}
                </div>
              </div>}
            </div>;
          })}
          <button type="button" onClick={() => setMedicines(rows => [...rows, { medicine: '', quantity: '', unit: '', doseRate: '' }])} style={consultationStyles.addMedicineButton}><span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.plus}</span>Add another medicine or vaccine</button>
          <label style={consultationStyles.label}>Prescription Instructions<textarea value={prescription} onChange={event => setPrescription(event.target.value)} placeholder="e.g. Amoxicillin 500mg — 1 tablet twice daily for 7 days with food..." style={{ ...consultationStyles.input, minHeight: 50, resize: 'vertical' }} /></label>
        </div>
      </div>
    </div>
  );
}

function InventoryTab() {
  const [category, setCategory] = useState('All Items');
  const [requested, setRequested] = useState([]);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const categories = ['All Items', 'Medication', 'Vaccine', 'Supply'];
  const filtered = category === 'All Items' ? CLINIC_INVENTORY : CLINIC_INVENTORY.filter(item => item.category === category);
  const requestRestock = (item, quantity, note) => {
    setRequested(items => items.includes(item.name) ? items : [...items, item.name]);
    notifySuccess(
      'Restock request submitted',
      `${quantity} ${item.unit} requested for ${item.name}.${note ? ` Note: ${note}` : ''}`,
    );
  };
  const getInventoryStatus = item => {
    if (item.expiry !== 'N/A') {
      const expiryDate = new Date(`${item.expiry}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!Number.isNaN(expiryDate.getTime()) && expiryDate < today) return 'Expired';
      if (!Number.isNaN(expiryDate.getTime()) && (expiryDate.getTime() - today.getTime()) / 86400000 <= 30) return 'Expiring Soon';
    }
    if (item.quantity === 0) return 'Out of Stock';
    return item.status;
  };
  const statusTone = status => ({
    'Healthy Stock': { color: '#087f65', dot: '#10b981' },
    'Low Stock': { color: '#a34b00', dot: '#f59e0b' },
    'Critical Stock': { color: '#a34b00', dot: '#f59e0b' },
    'Reorder Soon': { color: '#a34b00', dot: '#f59e0b' },
    'Out of Stock': { color: '#b42318', dot: '#ef4444' },
    'Expired': { color: '#b42318', dot: '#ef4444' },
    'Expiring Soon': { color: '#a34b00', dot: '#f59e0b' },
  }[status] || { color: '#374151', dot: '#94a3b8' });
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '11px 13px', marginBottom: 14, color: '#b45309' }}>
        <span style={{ width: 16, height: 16, display: 'flex', flexShrink: 0 }}>{Icons.trendDown || Icons.refresh}</span>
        <div><div style={{ fontSize: '.76rem', fontWeight: 600 }}>View-Only Access</div><div style={{ marginTop: 4, fontSize: '.72rem' }}>As a doctor you can view stock status and submit restock requests. All stock adjustments are managed by the owner.</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        {[
          ['Total Items', CLINIC_INVENTORY.length, '#087f65'],
          ['In Stock', CLINIC_INVENTORY.filter(item => item.status === 'Healthy Stock').length, '#16a34a'],
          ['Low / Critical', CLINIC_INVENTORY.filter(item => ['Low Stock', 'Critical Stock'].includes(item.status)).length, '#c2410c'],
          ['Out of Stock', CLINIC_INVENTORY.filter(item => item.status === 'Out of Stock').length, '#dc2626'],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 20px' }}>
            <div style={{ color: '#94a3b8', fontSize: '.68rem' }}>{label}</div>
            <div style={{ color, fontSize: '1.45rem', fontWeight: 700, marginTop: 3 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {categories.map(item => <button key={item} type="button" onClick={() => setCategory(item)} style={{ border: 'none', borderRadius: 8, padding: '7px 12px', background: category === item ? '#087f65' : '#eef2f7', color: category === item ? '#fff' : '#64748b', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer' }}>{item}</button>)}
      </div>
      <div style={inventoryTable.wrap}>
      <table style={inventoryTable.table}>
        <thead><tr>{[['Item Name', '25%'], ['Category', '14%'], ['Current Stock', '14%'], ['Expiry', '12%'], ['Status', '16%'], ['Action', '19%']].map(([label, width]) => <th key={label} style={{ ...inventoryTable.heading, width }}>{label}</th>)}</tr></thead>
        <tbody>{filtered.map(item => {
          const status = getInventoryStatus(item);
          const tone = statusTone(status);
          const needsRestock = ['Low Stock', 'Critical Stock', 'Out of Stock', 'Expired', 'Reorder Soon'].includes(status);
          const stockColor = status === 'Expired' || status === 'Out of Stock' ? '#dc2626' : ['Low Stock', 'Critical Stock', 'Reorder Soon'].includes(status) ? '#b45309' : '#111827';
          return <tr key={item.name} style={{ background: ['Expired', 'Out of Stock'].includes(status) ? '#fff0ee' : '#fff' }}>
            <td style={{ ...inventoryTable.cell, fontWeight: 700 }}>{item.name}</td>
            <td style={inventoryTable.cell}><span style={inventoryTable.category}>{item.category}</span></td>
            <td style={{ ...inventoryTable.cell, color: stockColor, fontWeight: 700 }}>{item.stock}</td>
            <td style={inventoryTable.cell}>{item.expiry}</td>
            <td style={inventoryTable.cell}><span style={{ ...inventoryTable.status, color: tone.color }}>{status === 'Expired' ? <i style={inventoryTable.expiredMark}>×</i> : <i style={{ ...inventoryTable.statusDot, background: tone.dot }} />}{status}</span></td>
            <td style={inventoryTable.cell}>{needsRestock
              ? <button type="button" disabled={requested.includes(item.name)} onClick={() => { setRestockItem(item); setRestockQuantity(''); setRestockNote(''); }} style={{ ...inventoryTable.restockButton, ...(requested.includes(item.name) ? inventoryTable.restockSubmitted : {}) }}><span style={inventoryTable.restockIcon}>{Icons.refresh}</span>{requested.includes(item.name) ? 'Request Submitted' : 'Request Restock'}</button>
              : <span style={inventoryTable.emptyAction}>—</span>}</td>
          </tr>;
        })}</tbody>
      </table>
      </div>
      {restockItem && <div style={inventoryTable.backdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setRestockItem(null); }}>
        <form style={inventoryTable.dialog} role="dialog" aria-modal="true" aria-labelledby="restock-dialog-title" onSubmit={event => {
          event.preventDefault();
          requestRestock(restockItem, restockQuantity, restockNote.trim());
          setRestockItem(null);
          setRestockQuantity('');
          setRestockNote('');
        }}>
          <div style={inventoryTable.dialogHeader}>
            <h2 id="restock-dialog-title" style={inventoryTable.dialogTitle}>Request Restock</h2>
            <p style={inventoryTable.dialogSubtitle}>{restockItem.name} · currently {restockItem.stock}</p>
          </div>
          <div style={inventoryTable.dialogBody}>
            <label style={inventoryTable.dialogLabel}>Quantity needed<input autoFocus required type="number" min="1" step="1" value={restockQuantity} onChange={event => setRestockQuantity(event.target.value)} placeholder="e.g. 100" style={inventoryTable.dialogInput} /></label>
            <label style={inventoryTable.dialogLabel}>Note for the owner (optional)<textarea value={restockNote} onChange={event => setRestockNote(event.target.value)} placeholder="Any urgency or supplier preference..." rows={3} style={inventoryTable.dialogTextarea} /></label>
          </div>
          <div style={inventoryTable.dialogFooter}>
            <button type="button" onClick={() => setRestockItem(null)} style={inventoryTable.dialogCancel}>Cancel</button>
            <button type="submit" style={inventoryTable.dialogSubmit}>Send Restock Request</button>
          </div>
        </form>
      </div>}
    </div>
  );
}

const inventoryTable = {
  wrap: { width: '100%', overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff' },
  table: { width: '100%', minWidth: 760, borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '.78rem', color: '#111827' },
  heading: { height: 40, padding: '0 16px', borderBottom: '1px solid #e5e7eb', background: '#fbfbfc', color: '#64748b', fontSize: '.7rem', fontWeight: 500, textAlign: 'left' },
  cell: { height: 53, padding: '0 16px', borderBottom: '1px solid #e5e7eb', color: '#111827', fontSize: '.76rem', textAlign: 'left', whiteSpace: 'nowrap' },
  category: { display: 'inline-flex', alignItems: 'center', minHeight: 27, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 7, color: '#334155', fontSize: '.7rem' },
  status: { display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: '.75rem' },
  statusDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', fontStyle: 'normal' },
  expiredMark: { color: '#dc2626', fontSize: '.9rem', fontStyle: 'normal', fontWeight: 700, lineHeight: 1 },
  restockButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 40, padding: '0 13px', border: '1px solid #e2e8f0', borderRadius: 9, background: '#fff', color: '#111827', fontSize: '.7rem', fontWeight: 500, whiteSpace: 'nowrap', cursor: 'pointer' },
  restockSubmitted: { borderColor: '#b7e4d7', background: '#e7f5f2', color: '#087f65' },
  restockIcon: { display: 'inline-flex', width: 14, height: 14 },
  emptyAction: { color: '#94a3b8' },
  backdrop: { position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,.45)' },
  dialog: { width: 'min(396px, 100%)', boxSizing: 'border-box', overflow: 'hidden', borderRadius: 14, background: '#fff', boxShadow: '0 18px 50px rgba(15,23,42,.25)' },
  dialogHeader: { padding: '20px 20px 0' },
  dialogTitle: { margin: 0, color: '#111827', fontSize: '1rem', fontWeight: 700 },
  dialogSubtitle: { margin: '5px 0 0', color: '#64748b', fontSize: '.75rem' },
  dialogBody: { display: 'grid', gap: 14, padding: '16px 20px 18px' },
  dialogLabel: { display: 'grid', gap: 7, color: '#111827', fontSize: '.75rem', fontWeight: 600 },
  dialogInput: { width: '100%', height: 44, boxSizing: 'border-box', border: 0, borderRadius: 9, padding: '0 13px', background: '#f1f1f3', color: '#111827', font: 'inherit', fontSize: '.75rem', outlineColor: '#087f65' },
  dialogTextarea: { width: '100%', minHeight: 72, boxSizing: 'border-box', resize: 'vertical', border: 0, borderRadius: 9, padding: '12px 13px', background: '#f1f1f3', color: '#111827', font: 'inherit', fontSize: '.75rem', outlineColor: '#087f65' },
  dialogFooter: { display: 'grid', gap: 9, padding: '15px 20px 14px', borderTop: '1px solid #e5e7eb' },
  dialogCancel: { minHeight: 45, border: '1px solid #e2e8f0', borderRadius: 9, background: '#fff', color: '#111827', font: 'inherit', fontSize: '.75rem', cursor: 'pointer' },
  dialogSubmit: { minHeight: 45, border: 0, borderRadius: 9, background: '#111318', color: '#fff', font: 'inherit', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' },
};

const consultationStyles = {
  label: { display: 'flex', flexDirection: 'column', gap: 5, color: '#374151', fontSize: '.72rem', fontWeight: 600, marginBottom: 13 },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 7, background: '#f1f1f3', padding: '8px 10px', color: '#374151', fontSize: '.74rem', outline: 'none' },
  choice: { minHeight: 34, padding: '0 11px', border: '1px solid #d8e9e1', borderRadius: 8, background: '#fff', color: '#38534c', fontSize: '.7rem', cursor: 'pointer' },
  choiceSelected: { borderColor: '#087f65', background: '#e7f5f2', color: '#087f65' },
  addMedicineButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', minHeight: 46, marginBottom: 14, border: '1px dashed #9ddbc8', borderRadius: 9, background: '#e7f5f2', color: '#087f65', fontFamily: 'inherit', fontSize: '.74rem', cursor: 'pointer' },
  medicineCard: { marginBottom: 16, padding: 12, border: '1px solid #dcece5', borderRadius: 11, background: '#fff' },
  medicineGrid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(65px, .7fr) minmax(72px, .7fr) 34px', gap: 8, alignItems: 'end' },
  medicineLabel: { display: 'flex', minWidth: 0, flexDirection: 'column', gap: 5, color: '#374151', fontSize: '.7rem', fontWeight: 600 },
  removeMedicineButton: { display: 'grid', width: 32, height: 32, placeItems: 'center', marginBottom: 2, border: '1px solid #fecaca', borderRadius: 8, background: '#fff7f7', color: '#b42318', cursor: 'pointer' },
  removeMedicineIcon: { display: 'flex', width: 15, height: 15 },
  doseCalculation: { display: 'grid', gridTemplateColumns: 'minmax(120px, .8fr) minmax(0, 1.2fr)', gap: 9, alignItems: 'end', marginTop: 10 },
  doseRateLabel: { display: 'flex', minWidth: 0, flexDirection: 'column', gap: 5, color: '#526663', fontSize: '.66rem', fontWeight: 600 },
  doseRateInput: { width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', padding: '7px 9px', color: '#374151', fontSize: '.72rem', outline: 'none' },
  calculatedDose: { padding: '8px 10px', borderRadius: 8, background: '#e7f5f2', color: '#087f65', fontSize: '.68rem', lineHeight: 1.4 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid #e2ebe7' },
  summaryLabel: { color: '#111827', fontSize: '.7rem' },
  summaryValue: { color: '#111827', fontSize: '.72rem', minHeight: 15, textAlign: 'right' },
  summarySection: { padding: '12px 0 4px', borderBottom: '1px solid #e2ebe7' },
  summarySectionTitle: { marginBottom: 4, color: '#111827', fontSize: '.7rem', fontWeight: 700 },
  summaryEmpty: { padding: '8px 0', color: '#111827', fontSize: '.7rem' },
  summaryTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 13 },
  summaryTotalLabel: { display: 'block', color: '#111827', fontSize: '.72rem' },
  summaryTotalNote: { display: 'block', marginTop: 3, color: '#111827', fontSize: '.63rem' },
  summaryTotalAmount: { color: '#111827', fontSize: '1rem' },
};

// ── DASHBOARD TAB ──────────────────────────────────────────────────────
function ExportReportsModal({ user, reports, onClose }) {
  const [selected, setSelected] = useState(['owners', 'pets']);
  const [format, setFormat] = useState('csv');
  const toggleReport = report => setSelected(current => current.includes(report) ? current.filter(value => value !== report) : [...current, report]);
  const reportNames = Object.keys(reports);
  const allSelected = selected.length === reportNames.length;
  const exportReport = async () => {
    const rows = [['Report', 'ID', 'Name / Pet', 'Owner', 'Status', 'Date']];
    selected.forEach(report => {
      reports[report].forEach(item => rows.push([
        report,
        item.id || '—',
        item.name || item.pet || item.pet_name || item.type || item.diagnosis || '—',
        item.owner || item.owner_name || '—',
        item.status || '—',
        item.date || item.dateGiven || item.date_given || item.start_time || '—',
      ]));
    });
    if (format === 'csv') {
      const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
      link.download = 'clinic-report.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const pdf = new jsPDF({ orientation: 'landscape' });
      pdf.setFontSize(16);
      pdf.text('Clinic Report', 14, 16);
      pdf.setFontSize(8);
      rows.slice(1).forEach((row, index) => pdf.text(row.map(value => String(value)).join(' | ').slice(0, 150), 14, 26 + index * 6));
      pdf.save('clinic-report.pdf');
    }
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
      await fetch(`${apiUrl}/audit-trail`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          action: 'report generated',
          table_name: 'clinic_reports',
          new_data: { clinic_id: user.clinic_id, reports: selected, format, record_count: rows.length - 1 },
        }),
      });
    } catch (error) {
      console.error('Unable to record report export in audit trail', error);
    }
    notifySuccess('Clinic report exported successfully!', `${selected.length} report types · ${format.toUpperCase()}`);
    onClose();
  };
  return <OwnerModal onClose={onClose} width={520}>
    <div style={{ color: '#374151' }}>
      <h2 style={modalStyles.title}>Export Clinic Reports</h2>
      <p style={modalStyles.subtitle}>Choose the records and file format for your clinic report.</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 18, color: '#374151', fontSize: '.72rem' }}>
        <button type="button" onClick={() => setSelected(allSelected ? [] : reportNames)} style={{ border: 0, background: 'none', color: '#374151', cursor: 'pointer', padding: 0 }}>{allSelected ? 'Deselect All' : 'Select All'}</button>
      </div>
      <div style={{ display: 'grid', gap: 8, margin: '8px 0 18px' }}>
        {reportNames.map(report => <label key={report} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, color: '#374151', fontSize: '.8rem', cursor: 'pointer' }}><input type="checkbox" checked={selected.includes(report)} onChange={() => toggleReport(report)} />{report[0].toUpperCase() + report.slice(1)} ({reports[report].length})</label>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={{ ...modalStyles.label, color: '#374151' }}>Start Date<input type="date" style={{ ...modalStyles.input, color: '#374151' }} /></label>
        <label style={{ ...modalStyles.label, color: '#374151' }}>End Date<input type="date" style={{ ...modalStyles.input, color: '#374151' }} /></label>
      </div>
      <label style={{ ...modalStyles.label, color: '#374151' }}>File format<select value={format} onChange={event => setFormat(event.target.value)} style={{ ...modalStyles.input, color: '#374151' }}><option value="csv">CSV</option><option value="pdf">PDF</option></select></label>
      <div style={modalStyles.footer}><button type="button" onClick={onClose} style={modalStyles.cancel}>Cancel</button><button type="button" onClick={exportReport} disabled={!selected.length} style={{ ...T.primaryBtn, background: '#111827', opacity: selected.length ? 1 : .5 }}>Export Report</button></div>
    </div>
  </OwnerModal>;
}

const dashboardStyles = {
  dashboardLink: { border: 0, background: 'transparent', color: '#111827', fontSize: '.76rem', fontWeight: 600, cursor: 'pointer' },
  dashboardTableHeader: { display: 'grid', gridTemplateColumns: '70px 1.1fr 1fr 80px', gap: 9, padding: '8px 0', color: '#668096', fontSize: '.65rem', borderBottom: '1px solid #edf2f5' },
  dashboardTableRow: { display: 'grid', gridTemplateColumns: '70px 1.1fr 1fr 80px', gap: 9, alignItems: 'center', padding: '11px 0', color: '#668096', fontSize: '.7rem', borderBottom: '1px solid #f0f4f6' },
  dashboardMuted: { display: 'block', marginTop: 3, color: '#111827', fontSize: '.72rem' },
  dashboardCount: { marginLeft: 5, padding: '3px 6px', borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: '.65rem' },
  alertRow: { display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 9, alignItems: 'start', padding: '11px 0', borderBottom: '1px solid #dbe3e8', color: '#111827', fontSize: '.8rem' },
  alertDot: { width: 17, height: 17, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#fff', fontWeight: 700 },
  alertSpecies: { color: '#111827', fontWeight: 500, fontSize: '.72rem' },
  alertDetail: { display: 'block', marginTop: 3, color: '#111827', fontSize: '.68rem' },
  healthDonut: { width: 112, height: 112, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'conic-gradient(#ef5350 0deg 120deg, #f59e0b 120deg 210deg, #eab308 210deg 285deg, #087f65 285deg 360deg)', boxShadow: '0 4px 10px rgba(23,59,84,.12)', flexShrink: 0 },
  healthDonutInner: { width: 78, height: 78, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#fff', color: '#075e4d', lineHeight: 1.05, textAlign: 'center', boxShadow: 'inset 0 0 0 1px #edf2f5' },
  healthDonutTotal: { fontSize: '1.45rem', fontWeight: 800 },
  healthDonutLabel: { maxWidth: 58, marginTop: 4, color: '#668096', fontSize: '.58rem', fontWeight: 700, lineHeight: 1.15 },
  healthLine: { display: 'flex', alignItems: 'center', gap: 8, color: '#31536b', fontSize: '.82rem', lineHeight: 1.2, whiteSpace: 'nowrap' },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 },
  quickButton: { minHeight: 68, padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #cbd9e1', borderRadius: 9, background: '#fff', color: '#111827', fontSize: '.76rem', fontWeight: 600, cursor: 'pointer' },
  quickIcon: { width: 21, height: 21, display: 'flex', color: '#075e4d' },
  watchRow: { display: 'grid', gridTemplateColumns: '1.2fr .8fr .8fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #cfe2d9', color: '#111827', fontSize: '.72rem' },
  watchHeading: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  watchTitleBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
  watchTitleIcon: { display: 'inline-flex', marginRight: 5, color: '#237c64', fontWeight: 700 },
  watchFooter: { marginTop: 10, color: '#111827', fontSize: '.68rem' },
  healthyPetsCard: { display: 'flex', alignItems: 'center', gap: 10, padding: 10, minHeight: 100, background: '#eef9f2' },
  petIllustration: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 108, height: 82, borderRadius: 8, background: '#e3f0ec', overflow: 'hidden', flexShrink: 0 },
  petIllustrationImage: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' },
  pawMark: { color: '#4caf78', fontSize: '1.1rem' },
  protectedHeading: { display: 'flex', alignItems: 'center', gap: 6, color: '#17705b', fontSize: '.78rem', fontWeight: 700, marginBottom: 5 },
  learnMore: { border: 0, background: 'transparent', padding: 0, color: '#17705b', fontSize: '.62rem', cursor: 'pointer' },
};

function DashboardTab({ clients = [], pets = [], appointments = [], vaccinations = [], treatments = [], user, onViewAppointments, onViewPets, onViewDiseaseIntelligence }) {
  const [exportOpen, setExportOpen] = useState(false);
  const today = new Date();
  const todaysAppointments = appointments.filter(appointment => {
    const date = new Date(appointment.start_time);
    return date.toDateString() === today.toDateString();
  });
  const todayKey = today.toISOString().slice(0, 10);
  const mockTodayAppointments = [
    { id: 'mock-today-1', start_time: `${todayKey}T08:30:00`, pet: 'Sasad', owner: 'Yna Amante', reason: 'Post-surgery check', status: 'Checked In' },
    { id: 'mock-today-2', start_time: `${todayKey}T09:15:00`, pet: 'Milo', owner: 'Carla Reyes', reason: 'Vaccination', status: 'Confirmed' },
    { id: 'mock-today-3', start_time: `${todayKey}T10:00:00`, pet: 'Rocky', owner: 'Daniel Cruz', reason: 'General checkup', status: 'Pending' },
    { id: 'mock-today-4', start_time: `${todayKey}T11:30:00`, pet: 'Luna', owner: 'Maria Santos', reason: 'Dental consultation', status: 'Confirmed' },
    { id: 'mock-today-5', start_time: `${todayKey}T13:00:00`, pet: 'Coco', owner: 'Alex Garcia', reason: 'Laboratory follow-up', status: 'Pending' },
  ];
  const appointmentRows = todaysAppointments.length > 0 ? todaysAppointments : (appointments.length > 0 ? appointments.slice(0, 5) : mockTodayAppointments);
  const dogs = pets.filter(pet => String(pet.species || '').toLowerCase() === 'dog').length;
  const cats = pets.filter(pet => String(pet.species || '').toLowerCase() === 'cat').length;
  const pendingVaccinations = vaccinations.filter(vaccination => vaccination.next_due && new Date(vaccination.next_due) <= today).length;
  const formatAppointmentTime = value => value
    ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
  const alerts = [
    { pet: pets[0]?.name || 'Bella', species: 'Dog', text: 'Post-surgery monitoring', detail: 'Check incision, vitals, and pain level.', time: '10:45 AM', color: '#ef4444' },
    { pet: pets[1]?.name || 'Milo', species: 'Cat', text: 'Possible URI', detail: 'Sneezing and congestion. Recheck in 2 days.', time: '09:20 AM', color: '#f59e0b' },
    { pet: pets[2]?.name || 'Rocky', species: 'Dog', text: 'Lab Result Pending', detail: '5 results queued for review (2 urgent).', time: '08:15 AM', color: '#087f65' },
  ];
  const summaryCards = [
    { label: 'Waiting Patients', value: 3, sub: 'In clinic right now', icon: Icons.users, color: '#f59e0b', bg: '#fff4dc' },
    { label: 'Vaccinations Due', value: pendingVaccinations || 8, sub: '2 overdue', icon: Icons.syringe, color: '#ef4444', bg: '#ffe8e8' },
    { label: 'Lab Results Pending', value: LAB_RESULTS.filter(result => result.status === 'pending').length || 5, sub: '3 urgent', icon: Icons.file, color: '#d97706', bg: '#fff2d8' },
    { label: 'Patient Alerts', value: alerts.length, sub: 'Require attention', icon: Icons.info, color: '#dc2626', bg: '#ffe8ed' },
  ];
  const panel = { background: '#fff', border: '1px solid #e4edf3', borderRadius: 14, padding: 22 };
  const sectionTitle = { fontSize: '1rem', fontWeight: 700, color: '#075e4d' };
  const quickActions = [
    ['Add Appointment', Icons.calendar],
    ['Add Pet', Icons.pet],
    ['Add Owner', Icons.user],
    ['Record Treatment', Icons.stethoscope],
    ['Order Inventory', Icons.building],
    ['View Lab Results', Icons.file],
    ['Create Treatment Plan', Icons.clipboard],
    ['New Consultation', Icons.activity],
  ];
  return (
    <div className="clinic-dashboard">
      {exportOpen && <ExportReportsModal user={user} reports={{ owners: clients, pets, appointments, vaccinations, treatments }} onClose={() => setExportOpen(false)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div><div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#123047' }}>Good morning, Dr. {user?.name?.split(' ').slice(-1)[0] || 'Amante'}!</div><div style={{ fontSize: '.82rem', color: '#668096', marginTop: 5 }}>Here’s what needs your attention today.</div></div>
        <button type="button" onClick={() => setExportOpen(true)} style={{ ...T.primaryBtn, padding: '9px 15px', fontSize: '.78rem' }}>Export Reports</button>
      </div>
      <div className="clinic-dashboard-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
        {summaryCards.map(card => <div key={card.label} style={{ ...panel, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, background: card.bg, borderRadius: 9 }}><span style={{ width: 19, height: 19, display: 'flex' }}>{card.icon}</span></div><div><div style={{ fontSize: '.68rem', color: '#668096' }}>{card.label}</div><strong style={{ display: 'block', color: '#075e4d', fontSize: '1.45rem', lineHeight: 1.25 }}>{card.value}</strong><small style={{ color: card.color, fontSize: '.64rem' }}>{card.sub}</small></div></div>)}
      </div>
      <div className="clinic-dashboard-columns" style={{ display: 'grid', gridTemplateColumns: '1.2fr .95fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <div style={panel}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ ...sectionTitle, fontSize: '1.05rem', color: '#111827' }}>Patient Alerts <b style={dashboardStyles.dashboardCount}>{alerts.length}</b></span><button type="button" onClick={onViewPets} style={dashboardStyles.dashboardLink}>View All</button></div>{alerts.map(alert => <div key={alert.pet} style={dashboardStyles.alertRow}><span style={{ ...dashboardStyles.alertDot, background: alert.color }}>!</span><span><b style={{ fontSize: '.82rem', color: '#111827' }}>{alert.pet} <small style={dashboardStyles.alertSpecies}>({alert.species})</small></b><small style={dashboardStyles.dashboardMuted}>{alert.text}</small><small style={dashboardStyles.alertDetail}>{alert.detail}</small></span><time style={{ color: '#111827', fontSize: '.72rem', fontWeight: 500 }}>{alert.time}</time></div>)}</div>
          <div style={{ ...panel, alignSelf: 'start' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={sectionTitle}>Pet Health Risk Monitoring</span><button type="button" onClick={onViewPets} style={dashboardStyles.dashboardLink}>View Details ›</button></div><div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 16 }}><div style={dashboardStyles.healthDonut} aria-label="24 high-risk pets"><div style={dashboardStyles.healthDonutInner}><strong style={dashboardStyles.healthDonutTotal}>24</strong><small style={dashboardStyles.healthDonutLabel}>High-Risk Pets</small></div></div><div style={{ display: 'grid', gap: 11 }}>{[['Vaccination overdue', '#ef4444', pendingVaccinations || 8], ['Condition monitoring', '#f59e0b', 6], ['Missed follow-up', '#eab308', 5], ['Abnormal lab results', '#087f65', 5]].map(([label, color, count]) => <div key={label} style={dashboardStyles.healthLine}><i style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} /><b style={{ fontSize: '.86rem', color: '#075e4d' }}>{count}</b><span>{label}</span></div>)}</div></div></div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ ...panel, background: '#f1fbf7' }}><div style={dashboardStyles.watchHeading}><div style={dashboardStyles.watchTitleBlock}><div><span style={dashboardStyles.watchTitleIcon}>↗</span><span style={{ ...sectionTitle, fontSize: '1rem', color: '#111827' }}>Community Health Watch</span></div><small style={{ color: '#111827', fontSize: '.72rem', fontWeight: 600, marginLeft: 19 }}>Disease Activity</small></div><button type="button" onClick={onViewDiseaseIntelligence} style={dashboardStyles.dashboardLink}>View Trends</button></div><div style={dashboardStyles.watchRow}><b>Disease</b><b>Trend</b><b>Status</b></div>{[['Rabies', '↑ 12%', 'Moderate'], ['Parvo', '↑ 8%', 'Watch'], ['Distemper', '→ 0%', 'Stable'], ['Leptospirosis', '↓ 4%', 'Low']].map(([name, trend, status]) => <div key={name} style={dashboardStyles.watchRow}><span style={{ color: '#111827', fontWeight: 600 }}>{name}</span><span style={{ color: trend.startsWith('↑') ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{trend}</span><StatusIndicator status={status} style={{ fontSize: '.55rem' }} /> </div>)}<div style={dashboardStyles.watchFooter}>3 clinics reporting&nbsp; • &nbsp;Last updated: 10:42 AM</div></div>
          <div style={{ ...panel, ...dashboardStyles.healthyPetsCard }}><div style={dashboardStyles.petIllustration}><img style={dashboardStyles.petIllustrationImage} src="/healthy-pets.png" alt="Healthy dog and cat" /></div><div><b style={{ color: '#176b45', fontSize: '.84rem' }}>Healthy pets.<br />Safer communities.</b><p style={{ color: '#56806a', fontSize: '.68rem', lineHeight: 1.4, marginTop: 4 }}>Monitor local trends and keep every patient protected.</p><span style={dashboardStyles.pawMark}>♣</span></div></div>
          <div style={{ ...panel, background: '#f0faf8' }}><div style={dashboardStyles.protectedHeading}>▣ <span>Clinic data protected</span></div><p style={{ color: '#668096', fontSize: '.66rem' }}>Owner and patient information stays within this clinic.</p><button type="button" style={dashboardStyles.learnMore}>Learn more</button></div>
        </div>
      </div>
      <div style={{ ...panel, marginTop: 18, width: '100%' }}><span style={{ ...sectionTitle, fontSize: '1.05rem', color: '#111827' }}>Quick Actions</span><div style={dashboardStyles.quickGrid}>{quickActions.map(([label, icon]) => <button key={label} type="button" onClick={label === 'Add Appointment' ? onViewAppointments : undefined} style={dashboardStyles.quickButton}><span style={dashboardStyles.quickIcon}>{icon}</span>{label}</button>)}</div></div>
    </div>
  );
}

function LocalAuditTab({ user }) {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
    fetch(`${apiUrl}/audit-trail/filter?clinic_id=${encodeURIComponent(user.clinic_id)}&days=365`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(async response => {
        const payload = await response.json().catch(() => []);
        if (!response.ok) throw new Error(payload.error || 'Unable to load local audit history.');
        return payload;
      })
      .then(setLogs)
      .catch(loadError => setError(loadError.message));
  }, [user]);

  const filtered = logs.filter(log => [log.user, log.action, log.details, log.category]
    .some(value => String(value || '').toLowerCase().includes(search.toLowerCase())));

  return <div style={{ ...T.wrap, padding: '20px 20px 18px', borderRadius: 14 }}>
    <div style={{ ...T.hd, margin: '0 0 18px' }}>
      <div><div style={{ ...T.title, fontSize: '.9rem', fontWeight: 600 }}>Local Audit Trail</div><div style={{ color: '#64748b', fontSize: '.72rem', marginTop: 4 }}>Activity performed in this clinic only.</div></div>
    </div>
    <div style={{ ...T.searchWrap, marginBottom: 16 }}><span style={T.searchIcon}>{Icons.search}</span><input style={{ ...T.search, marginBottom: 0, padding: '8px 14px 8px 36px', border: 'none', borderRadius: 8, background: '#f1f1f3', fontSize: '.78rem', color: '#374151' }} placeholder="Search local activity..." value={search} onChange={event => setSearch(event.target.value)} /></div>
    {error && <div role="alert" style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontSize: '.78rem' }}>{error}</div>}
    <table style={{ ...T.table, tableLayout: 'fixed' }}><thead><tr>{[['Date & Time', '20%'], ['User', '18%'], ['Action', '16%'], ['Record', '22%'], ['Details', '24%']].map(([label, width]) => <th key={label} style={{ ...T.th, width, padding: '0 7px 9px' }}>{label}</th>)}</tr></thead>
      <tbody>{filtered.map(log => <tr key={log.id}><td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem' }}>{new Date(log.timestamp).toLocaleString()}</td><td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem' }}>{log.user || 'System'}</td><td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', fontWeight: 600 }}>{log.action}</td><td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem' }}>{log.category || '—'}</td><td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem' }}>{log.details || '—'}</td></tr>)}</tbody>
    </table>
    {!filtered.length && !error && <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: '.8rem' }}>No local clinic activity found.</div>}
  </div>;
}

function OwnerModal({ title, children, onClose, width = 620 }) {
  return (
    <div style={modalStyles.backdrop}>
      <div role="dialog" aria-modal="true" style={{ ...modalStyles.dialog, width }}>
        <button type="button" aria-label="Close dialog" onClick={onClose} style={modalStyles.close}>{Icons.close}</button>
        {children}
      </div>
    </div>
  );
}

function OwnerDetailsModal({ owner, onClose }) {
  const [tab, setTab] = useState('details');
  return (
    <OwnerModal onClose={onClose}>
      <div style={modalStyles.headerText}>
        <h2 style={modalStyles.title}>Owner Details</h2>
        <p style={modalStyles.subtitle}>View detailed information and audit history</p>
      </div>
      <div style={modalStyles.segmented}>
        {['details', 'audit'].map(value => <button type="button" key={value} onClick={() => setTab(value)} style={{ ...modalStyles.segment, background: tab === value ? '#fff' : 'transparent', boxShadow: tab === value ? '0 1px 3px rgba(15,23,42,.12)' : 'none' }}>{value === 'details' ? 'Details' : 'Audit History'}</button>)}
      </div>
      {tab === 'details' ? (
        <div style={modalStyles.detailGrid}>
          <div style={modalStyles.detailField}><b>Owner ID</b><span>{owner.id}</span></div>
          <div style={modalStyles.detailField}><b>Name</b><span>{owner.name}</span></div>
          <div style={modalStyles.detailField}><b>Contact</b><span>{owner.phone || '—'}</span></div>
          <div style={modalStyles.detailField}><b>Email</b><span>{owner.email || '—'}</span></div>
          <div style={{ ...modalStyles.detailField, gridColumn: '1 / -1' }}><b>Address</b><span>{owner.address || '—'}</span></div>
          <div style={{ ...modalStyles.detailField, gridColumn: '1 / -1' }}><b>Pets ({owner.pets || 0})</b><span style={modalStyles.tags}>{(owner.pet_names || []).length ? owner.pet_names.map(name => <i key={name}>{name}</i>) : <span>No pets registered</span>}</span></div>
        </div>
      ) : (
        <div>
          <h3 style={modalStyles.auditHeading}>Change History</h3>
          <div style={modalStyles.auditCard}><div style={modalStyles.auditMeta}><strong>update</strong><span>2026-04-20 14:30:00</span></div><p style={modalStyles.auditDescription}>Updated owner contact phone number</p><small style={modalStyles.auditDetail}>Field: Phone Number<br />Old: +1 555-0100<br />New: {owner.phone || '—'}</small><em style={modalStyles.auditActor}>Dr. Sarah Chen</em></div>
          <div style={modalStyles.auditCard}><div style={modalStyles.auditMeta}><strong style={{ color: '#16a34a' }}>create</strong><span>2026-03-15 10:22:00</span></div><p style={modalStyles.auditDescription}>Created new owner record for {owner.name}</p><em style={modalStyles.auditActor}>Dr. Sarah Chen</em></div>
        </div>
      )}
    </OwnerModal>
  );
}

function AddOwnerModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', street: '', province: '', city: '', barangay: '', zip: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = async event => {
    event.preventDefault();
    const { errors: nextErrors, normalized } = validateOwnerFields(form);
    if (!form.province) nextErrors.province = 'Select a province.';
    if (!form.city) nextErrors.city = 'Select a municipality.';
    if (!form.barangay) nextErrors.barangay = 'Select a barangay.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setError('Please correct the highlighted fields.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const address = [form.street, form.barangay, form.city, form.province, form.zip].filter(Boolean).join(', ');
      await onAdd({ ...normalized, address });
    } catch (submitError) {
      if (submitError.fields) setFieldErrors(submitError.fields);
      setError(submitError.message || 'Unable to save this owner.');
    } finally {
      setSaving(false);
    }
  };
  const selectedRegion = OWNER_ADDRESS_OPTIONS[0];
  const selectedProvince = selectedRegion?.provinces.find(item => item.name === form.province);
  const selectedMunicipality = selectedProvince?.municipalities.find(item => item.name === form.city);
  return <OwnerModal onClose={onClose} width={600}>
    <h2 style={modalStyles.title}>Add New Owner</h2>
    <p style={modalStyles.subtitle}>Enter the details of the new pet owner.</p>
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <label style={modalStyles.label}><span>Owner Name<span style={modalStyles.required}>*</span></span><input autoFocus value={form.name} onChange={e => update('name', e.target.value)} placeholder="John Doe" style={{ ...modalStyles.input, ...(fieldErrors.name ? modalStyles.invalidInput : {}) }} aria-invalid={Boolean(fieldErrors.name)} />{fieldErrors.name && <small style={modalStyles.fieldError}>{fieldErrors.name}</small>}</label>
        <label style={modalStyles.label}><span>Contact Number<span style={modalStyles.required}>*</span></span><input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 555-0123" style={{ ...modalStyles.input, ...(fieldErrors.phone ? modalStyles.invalidInput : {}) }} aria-invalid={Boolean(fieldErrors.phone)} />{fieldErrors.phone && <small style={modalStyles.fieldError}>{fieldErrors.phone}</small>}</label>
      </div>
      <label style={modalStyles.label}><span>Email Address<span style={modalStyles.required}>*</span></span><input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="john.doe@email.com" style={{ ...modalStyles.input, ...(fieldErrors.email ? modalStyles.invalidInput : {}) }} aria-invalid={Boolean(fieldErrors.email)} />{fieldErrors.email && <small style={modalStyles.fieldError}>{fieldErrors.email}</small>}</label>
      <label style={modalStyles.label}><span>Street / House No. <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span></span><input value={form.street} onChange={e => update('street', e.target.value)} placeholder="House number, street, subdivision, or other address details" style={modalStyles.input} /></label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <label style={modalStyles.label}><span>Province<span style={modalStyles.required}>*</span></span><select value={form.province} onChange={e => setForm(current => ({ ...current, province: e.target.value, city: '', barangay: '', zip: '' }))} style={modalStyles.input}><option value="">Select province</option>{(selectedRegion?.provinces || []).map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
        <label style={modalStyles.label}><span>Municipality<span style={modalStyles.required}>*</span></span><select value={form.city} onChange={e => setForm(current => ({ ...current, city: e.target.value, barangay: '', zip: selectedProvince?.municipalities.find(item => item.name === e.target.value)?.zip || '' }))} disabled={!selectedProvince} style={modalStyles.input}><option value="">Select municipality</option>{(selectedProvince?.municipalities || []).map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
        <label style={modalStyles.label}><span>Barangay<span style={modalStyles.required}>*</span></span><select value={form.barangay} onChange={e => update('barangay', e.target.value)} disabled={!selectedMunicipality} style={modalStyles.input}><option value="">Select barangay</option>{(selectedMunicipality?.barangays || []).map(barangay => <option key={barangay} value={barangay}>{barangay}</option>)}</select></label>
        <label style={modalStyles.label}><span>ZIP Code</span><input value={selectedMunicipality?.zip || ''} readOnly style={{ ...modalStyles.input, background: '#f8fafc' }} /></label>
      </div>
      {error && <div style={modalStyles.error}>{error}</div>}
      <div style={modalStyles.footer}><button type="button" onClick={onClose} style={modalStyles.cancel} disabled={saving}>Cancel</button><button type="submit" style={T.primaryBtn} disabled={saving}>{saving ? 'Saving...' : 'Add Owner'}</button></div>
    </form>
  </OwnerModal>;
}

const modalStyles = {
  backdrop: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  dialog: { position: 'relative', maxWidth: '100%', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', boxSizing: 'border-box', background: '#fff', borderRadius: 12, padding: '24px 24px 22px', boxShadow: '0 20px 55px rgba(15,23,42,.25)', color: '#111827' },
  close: { position: 'absolute', top: 17, right: 18, border: 0, background: 'none', color: '#4b5563', cursor: 'pointer', width: 18, height: 18, display: 'flex' },
  headerText: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', marginBottom: 18 },
  title: { margin: 0, color: '#111827', fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.25 },
  subtitle: { margin: '5px 0 0', color: '#64748b', fontSize: '.78rem', lineHeight: 1.35, textAlign: 'left' },
  segmented: { display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#e5e7eb', borderRadius: 16, padding: 3, marginBottom: 24 },
  segment: { border: 0, borderRadius: 14, padding: '7px 10px', color: '#111827', fontSize: '.78rem', cursor: 'pointer' },
  detailField: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 7, color: '#111827', fontSize: '.78rem' },
  label: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 15, color: '#111827', fontSize: '.78rem', fontWeight: 600 },
  input: { width: '100%', boxSizing: 'border-box', border: 0, borderRadius: 8, background: '#f1f1f3', padding: '9px 12px', color: '#111827', fontSize: '.78rem', outline: 'none' },
  required: { color: '#dc2626', marginLeft: 2 },
  invalidInput: { border: '1px solid #dc2626' },
  fieldError: { color: '#dc2626', fontSize: '.7rem', fontWeight: 500 },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 },
  cancel: { border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#111827', padding: '8px 15px', fontSize: '.78rem', cursor: 'pointer' },
  error: { color: '#dc2626', fontSize: '.75rem', marginTop: 4 },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, color: '#111827' },
  tags: { display: 'flex', gap: 6, marginTop: 7 },
  auditHeading: { color: '#374151', fontSize: '.82rem', margin: '0 0 14px' },
  auditCard: { border: '1px solid #dbe3ee', borderRadius: 9, padding: '12px 14px', marginBottom: 12, color: '#374151', fontSize: '.75rem' },
  auditMeta: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  auditDescription: { margin: '0 0 8px', color: '#111827' },
  auditDetail: { display: 'block', padding: '9px 11px', borderRadius: 6, background: '#f8fafc', color: '#334155', fontSize: '.82rem', lineHeight: 1.65 },
  auditActor: { display: 'block', marginTop: 9, color: '#64748b', fontStyle: 'normal' },
  vaccinationActionsDialog: { position: 'relative', width: 'min(540px, 100%)', maxWidth: '100%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxSizing: 'border-box', background: '#fff', borderRadius: 14, padding: '18px 20px 15px', boxShadow: '0 20px 55px rgba(15,23,42,.25)', color: '#111827' },
  vaccinationActionsClose: { position: 'absolute', top: 17, right: 18, border: 0, background: 'none', color: '#58708b', cursor: 'pointer', width: 18, height: 18, display: 'flex', padding: 0 },
  verifyVaccinationDialog: { position: 'relative', width: 'min(560px, 100%)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxSizing: 'border-box', padding: '22px 24px 18px', border: '1px solid #dcebe5', borderRadius: 14, background: '#fff', boxShadow: '0 20px 55px rgba(15,23,42,.25)', color: '#173d37' },
  verifyVaccinationClose: { position: 'absolute', top: 16, right: 17, display: 'grid', width: 36, height: 36, placeItems: 'center', border: 0, borderRadius: 8, background: 'transparent', color: '#526b70', cursor: 'pointer' },
  verifyVaccinationHeading: { display: 'flex', alignItems: 'center', gap: 11, paddingRight: 34 },
  verifyVaccinationIcon: { display: 'grid', width: 42, height: 42, flex: '0 0 42px', placeItems: 'center', borderRadius: 11, background: '#e7f5f2', color: '#087f65' },
  verifyVaccinationTitle: { margin: 0, color: '#111827', fontSize: '1.12rem', fontWeight: 700, lineHeight: 1.3 },
  verifyVaccinationIntro: { margin: '9px 0 15px', color: '#667085', fontSize: '.8rem', lineHeight: 1.5 },
  verifyVaccinationSummary: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', padding: 14, borderRadius: 11, background: '#f6f8fa' },
  verifyVaccinationSummaryCell: { display: 'grid', minWidth: 0, gap: 4 },
  verifyVaccinationSummaryLabel: { color: '#8292a8', fontSize: '.69rem' },
  verifyVaccinationSummaryValue: { overflowWrap: 'anywhere', color: '#26374a', fontSize: '.78rem', fontWeight: 600, lineHeight: 1.35 },
  verifyVaccinationWarning: { display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 13, padding: '11px 12px', border: '1px solid #f6d365', borderRadius: 10, background: '#fffbeb', color: '#b45309', fontSize: '.73rem', lineHeight: 1.45 },
  verifyVaccinationMeaning: { marginTop: 12, padding: '11px 12px', border: '1px solid #b7d5ff', borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', fontSize: '.72rem', lineHeight: 1.45 },
  verifyVaccinationMeaningTitle: { display: 'block', marginBottom: 4, fontSize: '.73rem' },
  verifyVaccinationAttestation: { display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 13, color: '#475569', fontSize: '.76rem', fontWeight: 600, lineHeight: 1.5, cursor: 'pointer' },
  verifyVaccinationCheckbox: { width: 18, height: 18, flex: '0 0 18px', margin: '2px 0 0', accentColor: '#087f65' },
  verifyVaccinationEvidence: { display: 'flex', alignItems: 'center', gap: 9, marginTop: 12, padding: 10, border: '1px solid #dcebe5', borderRadius: 9, background: '#f8faf9', color: '#087f65', fontSize: '.74rem' },
  verifyVaccinationEvidenceImage: { width: 48, height: 42, borderRadius: 6, objectFit: 'cover' },
  verifyVaccinationEvidenceLink: { marginLeft: 'auto', color: '#087f65', fontWeight: 650, textDecoration: 'none' },
  verifyVaccinationAudit: { margin: '12px 0 0', padding: '10px 12px', borderRadius: 9, background: '#f6f8fa', color: '#617184', fontSize: '.72rem', lineHeight: 1.45 },
  verifyVaccinationError: { marginTop: 12, padding: '9px 11px', border: '1px solid #fecaca', borderRadius: 8, background: '#fef2f2', color: '#b91c1c', fontSize: '.74rem', lineHeight: 1.45 },
  verifyVaccinationFooter: { display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 14, paddingTop: 13, borderTop: '1px solid #e7eeeb' },
  vaccinationActionsHeader: { display: 'flex', alignItems: 'center', gap: 11, marginBottom: 11, paddingRight: 25 },
  vaccinationActionsHeaderIcon: { width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: '#e7f5f2', color: '#087f65' },
  vaccinationActionsTitle: { margin: 0, color: '#075e4d', fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.1 },
  vaccinationActionsSubtitle: { marginTop: 4, color: '#55708f', fontSize: '.78rem', lineHeight: 1.3 },
  vaccinationActionsPet: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 12px', marginBottom: 11, borderRadius: 10, background: '#f2f8ff' },
  vaccinationActionsPetInfo: { display: 'flex', alignItems: 'center', gap: 11 },
  vaccinationActionsPetImage: { width: 38, height: 38, objectFit: 'cover', borderRadius: '50%' },
  vaccinationActionsPetName: { color: '#075e4d', fontSize: '.9rem', fontWeight: 800 },
  vaccinationActionsPetMeta: { marginTop: 2, color: '#55708f', fontSize: '.66rem' },
  vaccinationActionsActive: { padding: '6px 10px', borderRadius: 16, background: '#d8f4e8', color: '#087a55', fontSize: '.66rem', fontWeight: 700 },
  vaccinationActionsList: { display: 'grid', gap: 8 },
  vaccinationActionCard: { display: 'flex', alignItems: 'center', gap: 11, width: '100%', minHeight: 58, boxSizing: 'border-box', borderRadius: 10, padding: '8px 11px', textAlign: 'left', cursor: 'pointer' },
  vaccinationActionCardIcon: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: 10 },
  vaccinationActionCardText: { display: 'grid', gap: 3, flex: 1 },
  vaccinationActionCardTitle: { color: '#075e4d', fontSize: '.86rem', fontWeight: 800 },
  vaccinationActionCardDescription: { color: '#55708f', fontSize: '.65rem', lineHeight: 1.3 },
  vaccinationActionArrow: { color: '#55708f', fontSize: '1.35rem', lineHeight: 1 },
  vaccinationActionsFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, paddingTop: 10, borderTop: '1px solid #e6edf3' },
  vaccinationActionsNote: { color: '#68809b', fontSize: '.62rem', lineHeight: 1.3 },
  vaccinationActionsCancel: { border: '1px solid #cfdce9', borderRadius: 7, background: '#fff', color: '#58708b', padding: '7px 12px', fontSize: '.7rem', fontWeight: 700, cursor: 'pointer' },
  editVaccinationDialog: { position: 'relative', width: 'min(614px, 100%)', maxWidth: '100%', maxHeight: 'calc(100vh - 68px)', overflowY: 'auto', boxSizing: 'border-box', background: '#fff', borderRadius: 8, padding: '20px 20px 18px', boxShadow: '0 12px 32px rgba(15,23,42,.28)', color: '#111827' },
  editVaccinationTitle: { margin: 0, color: '#111827', fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 },
  editVaccinationIntro: { margin: '6px 0 14px', color: '#52627a', fontSize: '.75rem', lineHeight: 1.45 },
  verifiedNotice: { display: 'grid', gap: 4, marginBottom: 14, padding: '10px 12px', border: '1px solid #86efac', borderRadius: 8, background: '#f0fdf4', color: '#166534', fontSize: '.76rem', lineHeight: 1.35 },
  verifiedNoticeHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  verifiedIcon: { width: 12, height: 12, display: 'inline-flex', marginRight: 5, verticalAlign: 'middle' },
  verificationWarning: { color: '#b45309', fontSize: '.72rem' },
  removeVerification: { border: '1px solid #fca5a5', borderRadius: 6, background: '#fff', color: '#b91c1c', padding: '6px 9px', fontSize: '.68rem', cursor: 'pointer' },
  editVaccinationGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' },
  editVaccinationLabel: { display: 'flex', flexDirection: 'column', gap: 4, color: '#111827', fontSize: '.75rem', fontWeight: 700 },
  editVaccinationInput: { width: '100%', boxSizing: 'border-box', border: 0, borderRadius: 7, background: '#f1f1f3', color: '#1f2937', padding: '8px 9px', fontSize: '.75rem', outline: 'none', minHeight: 33 },
  proofImage: { marginTop: 14, padding: '10px 12px', border: '1px solid #dbe3ee', borderRadius: 9, background: '#f8fafc', color: '#075e4d', fontSize: '.68rem' },
  proofIcon: { width: 13, height: 13, display: 'inline-flex', marginRight: 5, verticalAlign: 'middle' },
  proofContent: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 },
  proofPreview: { display: 'grid', placeItems: 'center', alignContent: 'center', width: 67, height: 53, border: '1px solid #cbd5e1', borderRadius: 5, background: 'linear-gradient(135deg, #fff 0 38%, #f7d9e8 38% 48%, #fff 48% 62%, #c8e6f2 62% 72%, #fff 72%)', color: '#475569', fontSize: '.55rem', lineHeight: 1.1 },
  proofPreviewMark: { fontSize: '1.1rem', color: '#7c3aed' },
  proofCaption: { display: 'block', marginBottom: 5, color: '#334155', fontSize: '.62rem' },
  proofButtons: { display: 'flex', gap: 7 },
  smallSecondary: { border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', color: '#111827', padding: '5px 8px', fontSize: '.62rem', cursor: 'pointer' },
  editAudit: { marginTop: 13, color: '#087f65', fontSize: '.64rem' },
  editAuditEntries: { display: 'grid', gap: 3, marginTop: 7, paddingLeft: 10, borderLeft: '2px solid #dbe3ee', color: '#087f65', lineHeight: 1.3 },
  editVaccinationFooter: { display: 'flex', justifyContent: 'flex-end', gap: 7, marginTop: 16 },
  addVaccinationDialog: { position: 'relative', width: 'min(638px, 100%)', maxWidth: '100%', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', boxSizing: 'border-box', background: '#fff', borderRadius: 8, padding: '20px 22px 18px', boxShadow: '0 12px 32px rgba(15,23,42,.28)', color: '#111827' },
  addVaccinationTitle: { margin: 0, color: '#111827', fontSize: '1rem', fontWeight: 700 },
  addVaccinationIntro: { margin: '6px 0 14px', color: '#52627a', fontSize: '.72rem', lineHeight: 1.4 },
  addVaccinationGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' },
  addVaccinationLabel: { display: 'flex', flexDirection: 'column', gap: 6, color: '#111827', fontSize: '.72rem', fontWeight: 700 },
  addVaccinationLabelText: { display: 'inline-flex', alignItems: 'center', lineHeight: 1.2 },
  addVaccinationInput: { width: '100%', boxSizing: 'border-box', border: 0, borderRadius: 7, background: '#f1f1f3', color: '#1f2937', padding: '8px 9px', fontSize: '.72rem', outline: 'none', minHeight: 33 },
  captureSticker: { marginTop: 14, padding: '11px 12px', border: '1px solid #dbe3ee', borderRadius: 9, background: '#f8fafc', color: '#075e4d', fontSize: '.72rem' },
  captureStickerText: { color: '#52627a', fontSize: '.68rem' },
  captureStickerDescription: { margin: '8px 0 9px', color: '#52627a', fontSize: '.68rem', lineHeight: 1.4 },
  stickerSelected: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 9, borderTop: '1px solid #dbe3ee', color: '#334155', fontSize: '.68rem' },
  stickerPreview: { width: 42, height: 34, objectFit: 'cover', border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff' },
  removeSticker: { marginLeft: 'auto', border: 0, background: 'transparent', color: '#b91c1c', fontSize: '.66rem', cursor: 'pointer' },
  addVaccinationFooter: { display: 'flex', justifyContent: 'flex-end', gap: 7, marginTop: 16 },
  doctorAppointmentDialog: { position: 'relative', width: 'min(600px, 100%)', maxWidth: '100%', boxSizing: 'border-box', background: '#fff', borderRadius: 8, padding: '20px 22px 18px', boxShadow: '0 12px 32px rgba(15,23,42,.28)', color: '#111827' },
  doctorAppointmentTitle: { margin: 0, color: '#111827', fontSize: '1rem', fontWeight: 700 },
  doctorAppointmentIntro: { margin: '6px 0 14px', color: '#52627a', fontSize: '.75rem', lineHeight: 1.4 },
  doctorAppointmentGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' },
  doctorAppointmentLabel: { display: 'flex', flexDirection: 'column', gap: 6, color: '#111827', fontSize: '.72rem', fontWeight: 700 },
  doctorAppointmentInput: { width: '100%', boxSizing: 'border-box', border: 0, borderRadius: 7, background: '#f1f1f3', color: '#1f2937', padding: '8px 9px', fontSize: '.72rem', outline: 'none', minHeight: 33 },
  doctorAppointmentNotes: { width: '100%', height: 64, boxSizing: 'border-box', resize: 'vertical', border: 0, borderRadius: 7, background: '#f1f1f3', color: '#1f2937', padding: '9px', fontFamily: 'inherit', fontSize: '.72rem', outline: 'none' },
  doctorAppointmentFooter: { display: 'flex', justifyContent: 'flex-end', gap: 7, marginTop: 16 },
  doctorAppointmentDisabled: { background: '#d1d5db', color: '#6b7280', cursor: 'not-allowed' },
};

const vaccinationActionButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  minHeight: 48,
  boxSizing: 'border-box',
  border: '1px solid #e2e5eb',
  borderRadius: 8,
  background: '#fff',
  color: '#374151',
  padding: '10px 12px',
  fontSize: '.82rem',
  textAlign: 'left',
  cursor: 'pointer',
};

const vaccinationActionIconStyle = {
  width: 17,
  height: 17,
  display: 'flex',
  flexShrink: 0,
};

function OwnersTab({ owners, user }) {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [localOwners, setLocalOwners] = useState(null);
  const [archiveError, setArchiveError] = useState('');
  const displayedOwners = localOwners || owners || [];
  const filtered = displayedOwners.filter(o => Boolean(o.archived) === showArchived && [o.id, o.name, o.phone, o.email, o.address].some(value => String(value || '').toLowerCase().includes(search.toLowerCase())));
  const archiveOwner = async owner => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const query = user.clinic_id ? `?clinic_id=${encodeURIComponent(user.clinic_id)}` : '';
    const response = await fetch(`${apiUrl}/clinic-records/clients/${owner.id}/archive${query}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !owner.archived }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Unable to update the owner record.');
    }
    const saved = await response.json();
    setLocalOwners(displayedOwners.map(item => item.id === owner.id ? { ...item, ...saved } : item));
    notifySuccess(`${saved.name} ${saved.archived ? 'archived' : 'restored'} successfully!`, '');
  };
  const addOwner = async owner => {
    if (!user.clinic_id) {
      throw new Error('Your account is not assigned to a clinic. Ask the clinic owner to assign your clinic before adding an owner.');
    }
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
    const query = user.clinic_id ? `?clinic_id=${encodeURIComponent(user.clinic_id)}` : '';
    const response = await fetch(`${apiUrl}/clinic-records/clients${query}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(owner),
      headers: { Authorization: 'Bearer ' + user.token, 'Content-Type': 'application/json' },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload.error || Object.values(payload.fields || {})[0];
      const message = response.status === 404
        ? `Owner API route not found at ${apiUrl}. Restart the backend server and reload the admin page.`
        : detail || `Unable to save this owner (HTTP ${response.status}).`;
      const submitError = new Error(message);
      submitError.fields = payload.fields || {};
      throw submitError;
    }
    setLocalOwners([...displayedOwners, payload]);
    setAddOpen(false);
    notifySuccess('New owner added successfully!', `${payload.name} was saved. Phone verification is still pending.`);
  };
  const exportRows = filtered.length ? filtered : displayedOwners;
  const exportCsv = () => {
    const csv = [['Owner ID', 'Name', 'Contact Number', 'Email', 'Address', 'Pets'], ...exportRows.map(o => [o.id, o.name, o.phone, o.email, o.address, o.pets])].map(row => row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'owners.csv'; link.click(); URL.revokeObjectURL(url); setShowExport(false);
  };
  const exportPdf = () => {
    const pdf = new jsPDF({ orientation: 'landscape' });
    pdf.setFontSize(16); pdf.text('Owners Management', 14, 16); pdf.setFontSize(9);
    pdf.text('Owner ID   Name   Contact Number   Email   Address   Pets', 14, 26);
    exportRows.forEach((owner, index) => pdf.text(`${owner.id}   ${owner.name}   ${owner.phone || '—'}   ${owner.email || '—'}   ${owner.address || '—'}   ${owner.pets || 0}`, 14, 34 + index * 7));
    pdf.save('owners.pdf'); setShowExport(false);
  };
  return <div style={{ ...T.wrap, padding: '20px 20px 18px', borderRadius: 14 }}>
    {addOpen && <AddOwnerModal onClose={() => setAddOpen(false)} onAdd={addOwner} />}
    {selectedOwner && <OwnerDetailsModal owner={selectedOwner} onClose={() => setSelectedOwner(null)} />}
    <div style={{ ...T.hd, margin: '0 0 20px' }}>
      <div style={{ ...T.title, fontSize: '.9rem', fontWeight: 600 }}>Owners Management</div>
      <div style={{ ...T.actions, gap: 8, position: 'relative' }}>
        <button type="button" onClick={() => setShowArchived(value => !value)} style={{ ...archiveToggleStyle, ...(showArchived ? archiveToggleActiveStyle : { color: '#111827' }) }}><span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.archive}</span>{showArchived ? `Viewing Archived (${displayedOwners.filter(o => o.archived).length})` : `Show Archived (${displayedOwners.filter(o => o.archived).length})`}</button>
        <button type="button" onClick={() => setAddOpen(true)} style={{ ...T.primaryBtn, padding: '7px 13px', fontSize: '.75rem', borderRadius: 8 }}><span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>Add New Owner</button>
      </div>
    </div>
    <div style={{ ...T.searchWrap, marginBottom: 18 }}><span style={T.searchIcon}>{Icons.search}</span><input style={{ ...T.search, marginBottom: 0, padding: '8px 14px 8px 36px', border: 'none', borderRadius: 8, background: '#f1f1f3', fontSize: '.78rem', color: '#374151' }} placeholder="Search owners..." value={search} onChange={e => setSearch(e.target.value)} /></div>
    {archiveError && <div role="alert" style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontSize: '.78rem' }}>{archiveError}</div>}
    <table style={{ ...T.table, tableLayout: 'fixed' }}><thead><tr>{[['Owner ID', '8%'], ['Name', '16%'], ['Contact Number', '13%'], ['Email', '19%'], ['Address', '20%'], ['Pets', '7%'], ['Actions', '17%']].map(([h, width]) => <th key={h} style={{ ...T.th, width, textTransform: 'none', letterSpacing: 0, color: '#111827', fontSize: '.75rem', padding: '0 7px 9px' }}>{h}</th>)}</tr></thead>
      <tbody>{filtered.map(o => <tr key={o.id}>
        <td style={{ ...T.td, padding: '9px 7px', fontWeight: 600, fontSize: '.8rem', color: '#111827' }}>{o.id}</td>
        <td style={{ ...T.td, padding: '9px 7px', fontSize: '.8rem', color: '#111827' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#d8f4e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 13, height: 13, display: 'flex', color: '#087f65' }}>{Icons.user}</span></div>{o.name}</div></td>
        <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.8rem', color: '#111827' }}>{o.phone || '—'}</td><td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.8rem', color: '#111827' }}>{o.email || '—'}</td><td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.8rem', color: '#111827' }}>{o.address || '—'}</td>
        <td style={{ ...T.td, padding: '9px 7px' }}><span style={{ background: '#eef0f3', padding: '4px 8px', borderRadius: 6, fontSize: '.72rem', color: '#111827' }}>{o.pets || 0} pets</span></td>
        <td style={{ ...T.td, padding: '9px 7px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button type="button" onClick={() => setSelectedOwner(o)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', color: '#111827', fontSize: '.75rem', cursor: 'pointer' }}>View Details</button><button type="button" onClick={() => archiveOwner(o).catch(error => setArchiveError(error.message || 'Unable to update the owner record.'))} aria-label={`${showArchived ? 'Restore' : 'Archive'} ${o.name}`} title={`${showArchived ? 'Restore' : 'Archive'} ${o.name}`} style={{ ...ab.btn, color: showArchived ? '#16a34a' : '#ef4444', padding: 5, minWidth: 26, minHeight: 26, justifyContent: 'center' }}><span style={{ width: 16, height: 16, display: 'flex' }}>{showArchived ? Icons.refresh : Icons.trash}</span></button></div></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

const exportStyles = { item: { display: 'block', width: '100%', border: 0, background: '#fff', color: '#111827', textAlign: 'left', padding: '7px 9px', borderRadius: 5, fontSize: '.75rem', cursor: 'pointer' } };
const archiveToggleStyle = {
  ...T.secondaryBtn,
  padding: '6px 12px',
  fontSize: '.75rem',
};
const archiveToggleActiveStyle = {
  background: '#111827',
  borderColor: '#111827',
  color: '#fff',
};

// ── PETS TAB ───────────────────────────────────────────────────────────
function PetDetailsModal({ pet, onClose, onUploadPhoto }) {
  const [tab, setTab] = useState('details');
  const [photoError, setPhotoError] = useState('');
  const [photoSaving, setPhotoSaving] = useState(false);
  const photoInputRef = useRef(null);
  const handlePhotoSelected = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoError('');
    setPhotoSaving(true);
    try {
      await onUploadPhoto(pet, file);
    } catch (error) {
      setPhotoError(error.message || 'Unable to upload the pet photo.');
    } finally {
      setPhotoSaving(false);
    }
  };
  return <OwnerModal onClose={onClose} width={700}>
    <div style={modalStyles.headerText}><h2 style={modalStyles.title}>Pet Details</h2><p style={modalStyles.subtitle}>View detailed information and audit history</p></div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      {pet.photo_url
        ? <img src={pet.photo_url} alt={`${pet.name} profile`} style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e5e7eb' }} />
        : <div aria-hidden="true" style={{ display: 'grid', width: 76, height: 76, flex: '0 0 76px', placeItems: 'center', borderRadius: '50%', background: '#f1f5f9', color: '#475569', fontSize: 24, fontWeight: 700 }}>{pet.name?.trim()?.charAt(0)?.toUpperCase() || '?'}</div>}
      <div>
        <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoSaving} style={{ ...T.primaryBtn, padding: '8px 12px', fontSize: '.75rem' }}>
          {photoSaving ? 'Uploading photo…' : pet.photo_url ? 'Change Photo' : 'Add Photo'}
        </button>
        <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelected} style={{ display: 'none' }} />
        <div style={{ marginTop: 6, color: '#64748b', fontSize: '.7rem' }}>JPEG, PNG, or WEBP · up to 1 MB</div>
        {photoError && <div role="alert" style={{ marginTop: 5, color: '#b91c1c', fontSize: '.72rem' }}>{photoError}</div>}
      </div>
    </div>
    <div style={modalStyles.segmented}>{['details', 'audit'].map(value => <button type="button" key={value} onClick={() => setTab(value)} style={{ ...modalStyles.segment, background: tab === value ? '#fff' : 'transparent', boxShadow: tab === value ? '0 1px 3px rgba(15,23,42,.12)' : 'none' }}>{value === 'details' ? 'Details' : 'Audit History'}</button>)}</div>
    {tab === 'details' ? <div style={modalStyles.detailGrid}>
      {[
        ['Pet ID', pet.id], ['Pet name', pet.name], ['Species', pet.species], ['Breed', pet.breed],
        ['Gender', pet.sex && pet.sex !== 'unknown' ? pet.sex : 'Not recorded'],
        ['Date of birth', pet.birth_date ? String(pet.birth_date).slice(0, 10) : 'Not recorded'],
        ['Weight', pet.weight || (pet.metadata?.weight ? `${pet.metadata.weight} kg` : 'Not recorded')],
        ['Color', pet.color || 'Not recorded'],
        ['Known allergies', pet.allergies && pet.allergies !== 'Not recorded' ? pet.allergies : 'None reported'],
        ['Microchip ID', pet.microchip || 'Not recorded'], ['Owner', pet.owner || '—'],
        ['Health Status', pet.status ? <StatusBadge status={pet.status} /> : 'Not recorded'],
      ].map(([label, value]) => <div key={label} style={modalStyles.detailField}><b>{label}</b><span>{value}</span></div>)}
    </div> : <div><h3 style={modalStyles.auditHeading}>Change History</h3>
      <div style={modalStyles.auditCard}><div style={modalStyles.auditMeta}><strong>update</strong><span>2026-04-22 15:45:00</span></div><p style={modalStyles.auditDescription}>Updated pet record during checkup</p><small style={modalStyles.auditDetail}>Field: Weight<br />Old: 28 kg<br />New: {pet.weight || '30 kg'}</small><em style={modalStyles.auditActor}>Dr. Sarah Chen</em></div>
      <div style={modalStyles.auditCard}><div style={modalStyles.auditMeta}><strong style={{ color: '#16a34a' }}>create</strong><span>2026-03-15 10:30:00</span></div><p style={modalStyles.auditDescription}>Created new pet record for {pet.name}</p><em style={modalStyles.auditActor}>Dr. Sarah Chen</em></div>
    </div>}
  </OwnerModal>;
}

function AddPetModal({ owners, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', species: '', breed: '', sex: 'unknown', birth_date: '', weight: '', color: '', microchip: '', allergies: '', age: '', client_id: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = async event => {
    event.preventDefault();
    const errors = {};
    if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(form.name.trim())) errors.name = 'Enter a valid pet name.';
    if (!form.species) errors.species = 'Select a species.';
    if (!form.breed.trim()) errors.breed = 'Enter the breed.';
    if (!form.client_id) errors.client_id = 'Select a registered owner.';
    if (Object.keys(errors).length) { setError(Object.values(errors)[0]); return; }
    setSaving(true); setError('');
    try { await onAdd({ ...form, name: form.name.trim(), breed: form.breed.trim(), notes: form.notes.trim() }); }
    catch (submitError) { setError(submitError.message); }
    finally { setSaving(false); }
  };
  return <OwnerModal onClose={onClose} width={600}>
    <h2 style={modalStyles.title}>Add New Pet</h2><p style={modalStyles.subtitle}>Enter the details of the new pet.</p>
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <label style={modalStyles.label}><span>Pet Name<span style={modalStyles.required}>*</span></span><input autoFocus value={form.name} onChange={e => update('name', e.target.value)} placeholder="Max" style={modalStyles.input} /></label>
        <label style={modalStyles.label}><span>Species<span style={modalStyles.required}>*</span></span><select value={form.species} onChange={e => update('species', e.target.value)} style={modalStyles.input}><option value="">Select species</option><option>Dog</option><option>Cat</option><option>Bird</option><option>Rabbit</option><option>Other</option></select></label>
        <label style={modalStyles.label}><span>Breed<span style={modalStyles.required}>*</span></span><input value={form.breed} onChange={e => update('breed', e.target.value)} placeholder="Golden Retriever" style={modalStyles.input} /></label>
        <label style={modalStyles.label}>Gender<select value={form.sex} onChange={e => update('sex', e.target.value)} style={modalStyles.input}><option value="unknown">Not recorded</option><option value="male">Male</option><option value="female">Female</option></select></label>
        <label style={modalStyles.label}>Date of birth<input type="date" value={form.birth_date} onChange={e => update('birth_date', e.target.value)} style={modalStyles.input} /></label>
        <label style={modalStyles.label}>Weight (kg)<input type="number" min="0" step="0.1" value={form.weight} onChange={e => update('weight', e.target.value)} placeholder="e.g. 5" style={modalStyles.input} /></label>
        <label style={modalStyles.label}>Color<input value={form.color} onChange={e => update('color', e.target.value)} placeholder="White & Brown" style={modalStyles.input} /></label>
        <label style={modalStyles.label}>Microchip ID<input value={form.microchip} onChange={e => update('microchip', e.target.value)} style={modalStyles.input} /></label>
      </div>
      <label style={modalStyles.label}><span>Owner<span style={modalStyles.required}>*</span></span><select value={form.client_id} onChange={e => update('client_id', e.target.value)} style={modalStyles.input}><option value="">Select owner</option>{owners.filter(owner => !owner.archived).map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</select></label>
      <label style={modalStyles.label}>Known allergies<textarea value={form.allergies} onChange={e => update('allergies', e.target.value)} placeholder="Enter allergies, or leave blank if none reported" style={{ ...modalStyles.input, minHeight: 54, resize: 'vertical' }} /></label>
      <label style={modalStyles.label}>Medical Notes<textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Any relevant medical history..." style={{ ...modalStyles.input, minHeight: 64, resize: 'vertical' }} /></label>
      {error && <div style={modalStyles.error}>{error}</div>}
      <div style={modalStyles.footer}><button type="button" onClick={onClose} style={modalStyles.cancel}>Cancel</button><button type="submit" style={T.primaryBtn} disabled={saving}>{saving ? 'Saving...' : 'Add Pet'}</button></div>
    </form>
  </OwnerModal>;
}

function TransferPetModal({ pet, owners, onClose, onTransfer }) {
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState('');
  const currentOwner = owners.find(owner => String(owner.id) === String(pet.client_id))?.name || pet.owner || '—';
  const submit = async event => {
    event.preventDefault();
    if (!clientId || String(clientId) === String(pet.client_id)) { setError('Select a different registered owner.'); return; }
    try { await onTransfer(pet, clientId); } catch (transferError) { setError(transferError.message); }
  };
  return <OwnerModal onClose={onClose} width={520}>
    <h2 style={modalStyles.title}>Transfer Pet to New Owner</h2><p style={modalStyles.subtitle}>Transfer {pet.name} to a different registered owner.</p>
    <div style={{ margin: '16px 0', padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, color: '#92400e', fontSize: '.78rem' }}><b>Note:</b> This will update the pet's owner record. All medical history will transfer with the pet.</div>
    <div style={modalStyles.detailField}><b>Current Owner</b><span style={{ width: '100%', padding: '10px', background: '#f8fafc', borderRadius: 7 }}>{currentOwner}</span></div>
    <form onSubmit={submit}><label style={{ ...modalStyles.label, marginTop: 16 }}><span>Transfer To (New Owner)<span style={modalStyles.required}>*</span></span><select value={clientId} onChange={e => setClientId(e.target.value)} style={modalStyles.input}><option value="">Select new owner</option>{owners.filter(owner => !owner.archived && String(owner.id) !== String(pet.client_id)).map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</select></label>
      {error && <div style={modalStyles.error}>{error}</div>}<div style={modalStyles.footer}><button type="button" onClick={onClose} style={modalStyles.cancel}>Cancel</button><button type="submit" style={T.primaryBtn}>Confirm Transfer</button></div>
    </form>
  </OwnerModal>;
}

function getPetPhotoUrl(pet) {
  return pet?.photo_url || pet?.photoUrl || pet?.profile_photo_url || pet?.avatar_url || '';
}

function PetsTab({ pets, owners, user }) {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [transferPet, setTransferPet] = useState(null);
  const [localPets, setLocalPets] = useState(null);
  const ownerRows = owners || [];
  const displayedPets = localPets || pets || [];
  const selectedPetRecord = selectedPet
    ? displayedPets.find(pet => String(pet.id) === String(selectedPet.id))
    : null;
  const petDetails = selectedPetRecord
    ? { ...selectedPetRecord, ...selectedPet, photo_url: getPetPhotoUrl(selectedPet) || getPetPhotoUrl(selectedPetRecord) }
    : selectedPet;
  const filtered = displayedPets.filter(p => (
    Boolean(p.archived) === showArchived && [p.id, p.name, p.species, p.breed, p.owner, p.status]
      .some(value => String(value || '').toLowerCase().includes(search.toLowerCase()))
  ));
  const api = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const request = async (url, options) => {
    const response = await fetch(url, options);
    const responseText = await response.text();
    let body = {};
    try {
      body = responseText ? JSON.parse(responseText) : {};
    } catch {
      body = {};
    }
    if (!response.ok) {
      const fieldError = Object.values(body.fields || {}).find(value => typeof value === 'string');
      if (url.includes('/clinic-records/pets/') && url.includes('/photo') && response.status === 404 && !body.error) {
        throw new Error('The API server does not have the pet-photo upload route yet. Restart the backend server, then try again.');
      }
      throw new Error(body.error || fieldError || `Unable to save pet (HTTP ${response.status}).`);
    }
    return body;
  };
  const addPet = async pet => { if (!user.clinic_id) throw new Error('Your account is not assigned to a clinic.'); const saved = await request(`${api}/clinic-records/pets?clinic_id=${user.clinic_id}`, { method: 'POST', headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(pet) }); const owner = ownerRows.find(item => String(item.id) === String(saved.client_id)); setLocalPets([...(localPets || displayedPets), { ...saved, age: saved.age || pet.age, owner: owner?.name || 'Unknown' }]); setAddOpen(false); notifySuccess('New pet added successfully!', `${saved.name} was saved in the clinic database.`); };
  const uploadPetPhoto = async (pet, file) => {
    if (!user.clinic_id || !user.token) throw new Error('Your account is not assigned to a clinic.');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG, or WEBP image.');
    if (file.size > 1_048_576) throw new Error('Choose an image smaller than 1 MB.');
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Unable to read the selected image.'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });
    const saved = await request(`${api}/clinic-records/pets/${pet.id}/photo?clinic_id=${user.clinic_id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, content_type: file.type, data }),
    });
    const updatedPet = { ...pet, photo_url: saved.photo_url };
    setLocalPets(current => (current || displayedPets).map(item => item.id === pet.id ? updatedPet : item));
    setSelectedPet(updatedPet);
    notifySuccess('Pet photo updated', `${pet.name}'s profile photo was saved.`);
  };
  const archivePet = async pet => {
    if (!Number.isInteger(Number(pet.id))) {
      const saved = { ...pet, archived: !pet.archived };
      setLocalPets(displayedPets.map(item => item.id === pet.id ? saved : item));
      notifySuccess(`${pet.name} ${saved.archived ? 'archived' : 'restored'} successfully!`, '');
      return;
    }
    const saved = await request(`${api}/clinic-records/pets/${pet.id}/archive?clinic_id=${user.clinic_id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: !pet.archived }) });
    setLocalPets(displayedPets.map(item => item.id === pet.id ? { ...item, ...saved } : item));
    notifySuccess(`${pet.name} ${saved.archived ? 'archived' : 'restored'} successfully!`, '');
  };
  const transfer = async (pet, client_id) => { const saved = await request(`${api}/clinic-records/pets/${pet.id}?clinic_id=${user.clinic_id}`, { method: 'PUT', headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id }) }); const owner = owners.find(item => String(item.id) === String(client_id)); setLocalPets(displayedPets.map(item => item.id === pet.id ? { ...item, ...saved, owner: owner?.name || item.owner, client_id } : item)); setTransferPet(null); notifySuccess('Pet transferred successfully!', `${pet.name} is now registered to ${owner?.name || 'the new owner'}.`); };
  const exportCsv = () => {
    const rows = [['Pet ID', 'Name', 'Species', 'Breed', 'Owner', 'Health Status'],
      ...filtered.map(p => [p.id, p.name, p.species, p.breed, p.owner, p.status])];
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `pets-${showArchived ? 'archived' : 'active'}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setShowExport(false);
  };
  const exportPdf = () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const columns = [
      ['Pet ID', 14], ['Name', 34], ['Species', 62], ['Breed', 84],
      ['Owner', 132], ['Health Status', 218],
    ];
    const value = item => String(item || '—').replace(/\s+/g, ' ').slice(0, 24);
    pdf.setFontSize(16);
    pdf.text('Pets Management', 14, 16);
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${showArchived ? 'Archived' : 'Active'} records · ${filtered.length} total`, 14, 22);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    columns.forEach(([label, x]) => pdf.text(label, x, 32));
    pdf.setFont('helvetica', 'normal');
    filtered.forEach((pet, index) => {
      const y = 40 + index * 8;
      if (y > 190) {
        pdf.addPage();
        pdf.setFont('helvetica', 'bold');
        columns.forEach(([label, x]) => pdf.text(label, x, 16));
        pdf.setFont('helvetica', 'normal');
      }
      const rowY = y > 190 ? 24 : y;
      [pet.id, pet.name, pet.species, pet.breed, pet.owner, pet.status]
        .forEach((item, columnIndex) => pdf.text(value(item), columns[columnIndex][1], rowY));
    });
    pdf.save(`pets-${showArchived ? 'archived' : 'active'}.pdf`);
    setShowExport(false);
  };
  return (
    <div style={{ ...T.wrap, padding: '20px 20px 18px', borderRadius: 14 }}>
      {addOpen && <AddPetModal owners={ownerRows} onClose={() => setAddOpen(false)} onAdd={addPet} />}
      {petDetails && <PetDetailsModal pet={petDetails} onClose={() => setSelectedPet(null)} onUploadPhoto={uploadPetPhoto} />}
      {transferPet && <TransferPetModal pet={transferPet} owners={ownerRows} onClose={() => setTransferPet(null)} onTransfer={transfer} />}
      <div style={{ ...T.hd, margin: '0 0 20px' }}>
        <div style={{ ...T.title, fontSize: '.9rem', fontWeight: 600 }}>Pets Management</div>
        <div style={{ ...T.actions, gap: 8, position: 'relative' }}>
          <button type="button" onClick={() => setShowArchived(value => !value)} style={{ ...archiveToggleStyle, ...(showArchived ? archiveToggleActiveStyle : { color: '#374151' }) }}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.archive}</span>
            {showArchived ? `Viewing Archived (${displayedPets.filter(p => p.archived).length})` : `Show Archived (${displayedPets.filter(p => p.archived).length})`}
          </button>
          <button type="button" onClick={() => setAddOpen(true)} style={{ ...T.primaryBtn, padding: '7px 13px', fontSize: '.75rem', borderRadius: 8 }}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
            Add New Pet
          </button>
        </div>
      </div>
      <div style={{ ...T.searchWrap, marginBottom: 18 }}>
        <span style={T.searchIcon}>{Icons.search}</span>
        <input
          style={{ ...T.search, marginBottom: 0, padding: '8px 14px 8px 36px', border: 'none', borderRadius: 8, background: '#f1f1f3', fontSize: '.78rem', color: '#374151' }}
          placeholder="Search pets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <table style={{ ...T.table, tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {[
              ['Pet ID', '8%'],
              ['Name', '14%'],
              ['Species', '9%'],
              ['Breed', '14%'],
              ['Owner', '19%'],
              ['Health Status', '16%'],
              ['Actions', '20%'],
            ].map(([h, width]) => (
              <th key={h} style={{ ...T.th, width, textTransform: 'none', letterSpacing: 0, color: '#111827', fontSize: '.75rem', padding: '0 7px 9px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id}>
              <td style={{ ...T.td, padding: '9px 7px', fontWeight: 600, fontSize: '.8rem', color: '#111827' }}>{p.id}</td>
              <td style={{ ...T.td, padding: '9px 7px', fontSize: '.8rem', color: '#111827' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {getPetPhotoUrl(p) && <img src={getPetPhotoUrl(p)} alt="" style={{ width: 28, height: 28, flex: '0 0 28px', borderRadius: '50%', objectFit: 'cover' }} />}
                  {p.name}
                </div>
              </td>
              <td style={{ ...T.td, padding: '9px 7px', fontSize: '.8rem', color: '#111827' }}>{p.species}</td>
              <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.8rem', color: '#111827' }}>{p.breed}</td>
              <td style={{ ...T.td, padding: '9px 7px', fontSize: '.8rem', color: '#111827' }}>{p.owner || 'Unknown'}</td>
              <td style={T.td}>{p.status ? <StatusBadge status={p.status} /> : 'Not recorded'}</td>
              <td style={{ ...T.td, padding: '9px 7px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 68 }}>
                  <button type="button" onClick={() => setSelectedPet(p)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', color: '#374151', fontSize: '.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>View Details</button>
                  <button type="button" onClick={() => setTransferPet(p)} style={{ ...ab.btn, color: '#087f65', padding: 4 }} aria-label={`Transfer ${p.name}`}>{Icons.refresh}</button>
                  <button type="button" onClick={() => archivePet(p)} style={{ ...ab.btn, color: showArchived ? '#16a34a' : '#ef4444', padding: 5, minWidth: 26, minHeight: 26, justifyContent: 'center' }} aria-label={`${showArchived ? 'Restore' : 'Archive'} ${p.name}`} title={`${showArchived ? 'Restore' : 'Archive'} ${p.name}`}>
                    <span style={{ width: 16, height: 16, display: 'flex' }}>{showArchived ? Icons.refresh : Icons.trash}</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── APPOINTMENTS TAB ───────────────────────────────────────────────────
function AppointmentsTab({ appointments, user }) {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [localAppointments, setLocalAppointments] = useState(null);
  const [archiveError, setArchiveError] = useState('');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const displayedAppointments = localAppointments || (appointments && appointments.length > 0 ? appointments : APPOINTMENTS.slice(0, 3));
  const formatDateTime = appointment => {
    if (appointment.datetime) return appointment.datetime;
    if (!appointment.start_time) return '—';
    return new Date(appointment.start_time).toLocaleString([], {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };
  const archiveAppointment = async appointment => {
    try {
      if (!Number.isInteger(Number(appointment.id))) {
        const saved = { ...appointment, archived: !appointment.archived };
        setLocalAppointments(displayedAppointments.map(item => item.id === appointment.id ? saved : item));
        notifySuccess(`Appointment ${appointment.id} ${saved.archived ? 'archived' : 'restored'} successfully!`, '');
        setArchiveError('');
        return;
      }
      const saved = await updateClinicRecordArchive({ user, endpoint: '/clinic-records/appointments', record: appointment, label: 'appointment' });
      setLocalAppointments(displayedAppointments.map(item => item.id === appointment.id ? { ...item, ...saved } : item));
      notifySuccess(`Appointment ${appointment.id} ${saved.archived ? 'archived' : 'restored'} successfully!`, '');
      setArchiveError('');
    } catch (error) {
      setArchiveError(error.message || 'Unable to update the appointment record.');
    }
  };
  const filtered = displayedAppointments.filter(a =>
    Boolean(a.archived) === showArchived && [a.id, a.pet, a.owner, a.type, a.reason, a.status, a.notes, a.datetime, a.start_time]
      .some(value => String(value || '').toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div style={{ ...T.wrap, padding: '20px 20px 18px', borderRadius: 14 }}>
      <div style={{ ...T.hd, margin: '0 0 20px' }}>
        <div style={{ ...T.title, fontSize: '.9rem', fontWeight: 600 }}>Appointments Management</div>
        <div style={{ ...T.actions, gap: 8 }}>
          <button type="button" onClick={() => setShowArchived(value => !value)} style={{ ...archiveToggleStyle, ...(showArchived ? archiveToggleActiveStyle : { color: '#374151' }) }}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.archive}</span>
            {showArchived ? `Viewing Archived (${displayedAppointments.filter(item => item.archived).length})` : `Show Archived (${displayedAppointments.filter(item => item.archived).length})`}
          </button>
          <button type="button" onClick={() => setShowNewAppointment(true)} style={{ ...T.primaryBtn, padding: '7px 13px', fontSize: '.75rem', borderRadius: 8 }}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
            New Appointment
          </button>
        </div>
      </div>
      <div style={{ ...T.searchWrap, marginBottom: 18 }}>
        <span style={T.searchIcon}>{Icons.search}</span>
        <input
          style={{ ...T.search, marginBottom: 0, padding: '8px 14px 8px 36px', border: 'none', borderRadius: 8, background: '#f1f1f3', fontSize: '.78rem', color: '#374151' }}
          placeholder="Search appointments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {archiveError && <div role="alert" style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontSize: '.78rem' }}>{archiveError}</div>}
      <table style={{ ...T.table, tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {[
              ['Appt ID', '9%'],
              ['Date & Time', '23%'],
              ['Pet', '8%'],
              ['Owner', '14%'],
              ['Type', '12%'],
              ['Status', '12%'],
              ['Notes', '17%'],
              ['Actions', '5%'],
            ].map(([h, width]) => (
              <th key={h} style={{ ...T.th, width, textTransform: 'none', letterSpacing: 0, color: '#374151', fontSize: '.72rem', padding: '0 7px 9px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(a => (
            <tr key={a.id}>
              <td style={{ ...T.td, padding: '9px 7px', fontWeight: 600, fontSize: '.75rem', color: '#374151' }}>{a.id}</td>
              <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{formatDateTime(a)}</td>
              <td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{a.pet || a.pet_name || '—'}</td>
              <td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{a.owner || a.owner_name || '—'}</td>
              <td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{a.type || a.reason || '—'}</td>
              <td style={{ ...T.td, padding: '9px 7px' }}><StatusBadge status={a.status} /></td>
              <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{a.notes || '—'}</td>
              <td style={{ ...T.td, padding: '9px 7px' }}>
                <button type="button" onClick={() => archiveAppointment(a)} aria-label={`${showArchived ? 'Restore' : 'Archive'} appointment ${a.id}`} title={`${showArchived ? 'Restore' : 'Archive'} appointment ${a.id}`} style={{ ...ab.btn, color: showArchived ? '#16a34a' : '#ef4444', padding: 4 }}>
                  <span style={{ width: 14, height: 14, display: 'flex' }}>{showArchived ? Icons.refresh : Icons.trash}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showNewAppointment && (
        <DoctorNewAppointmentModal
          appointments={displayedAppointments}
          onClose={() => setShowNewAppointment(false)}
          onSchedule={(appointment) => {
            setLocalAppointments([appointment, ...displayedAppointments]);
            setShowNewAppointment(false);
          }}
        />
      )}
    </div>
  );
}

function DoctorNewAppointmentModal({ appointments, onClose, onSchedule }) {
  const [form, setForm] = useState({ pet: '', owner: '', date: '', time: '', type: '', notes: '' });
  const pets = [...new Set(appointments.map(item => item.pet).filter(Boolean))];
  const owners = [...new Set(appointments.map(item => item.owner).filter(Boolean))];
  const ready = form.pet && form.owner && form.date && form.time && form.type;
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));

  return (
    <div style={modalStyles.backdrop} onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctor-new-appointment-title"
        onClick={event => event.stopPropagation()}
        onSubmit={event => {
          event.preventDefault();
          if (!ready) return;
          onSchedule({
            id: `APT-${String(Date.now()).slice(-3)}`,
            start_time: `${form.date}T${form.time}`,
            datetime: `${form.date} ${form.time}`,
            pet: form.pet,
            owner: form.owner,
            type: form.type,
            reason: form.type,
            notes: form.notes,
            status: 'pending',
            archived: false,
          });
        }}
        style={modalStyles.doctorAppointmentDialog}
      >
        <button type="button" onClick={onClose} aria-label="Close new appointment" style={modalStyles.close}>{Icons.close}</button>
        <h2 id="doctor-new-appointment-title" style={modalStyles.doctorAppointmentTitle}>New Appointment</h2>
        <p style={modalStyles.doctorAppointmentIntro}>Schedule a new appointment.</p>
        <div style={modalStyles.doctorAppointmentGrid}>
          <label style={modalStyles.doctorAppointmentLabel}>Pet*
            <select required value={form.pet} onChange={event => update('pet', event.target.value)} style={modalStyles.doctorAppointmentInput}>
              <option value="">Select pet</option>{pets.map(pet => <option key={pet}>{pet}</option>)}
            </select>
          </label>
          <label style={modalStyles.doctorAppointmentLabel}>Owner*
            <select required value={form.owner} onChange={event => update('owner', event.target.value)} style={modalStyles.doctorAppointmentInput}>
              <option value="">Select owner</option>{owners.map(owner => <option key={owner}>{owner}</option>)}
            </select>
          </label>
          <label style={modalStyles.doctorAppointmentLabel}>Date*
            <input required type="date" value={form.date} onChange={event => update('date', event.target.value)} style={modalStyles.doctorAppointmentInput} />
          </label>
          <label style={modalStyles.doctorAppointmentLabel}>Time*
            <input required type="time" value={form.time} onChange={event => update('time', event.target.value)} style={modalStyles.doctorAppointmentInput} />
          </label>
          <label style={{ ...modalStyles.doctorAppointmentLabel, gridColumn: '1 / -1' }}>Appointment Type*
            <select required value={form.type} onChange={event => update('type', event.target.value)} style={modalStyles.doctorAppointmentInput}>
              <option value="">Select type</option><option>Checkup</option><option>Vaccination</option><option>Surgery</option><option>Dental</option><option>Follow-up</option>
            </select>
          </label>
          <label style={{ ...modalStyles.doctorAppointmentLabel, gridColumn: '1 / -1' }}>Notes
            <textarea value={form.notes} onChange={event => update('notes', event.target.value)} placeholder="Additional information..." style={modalStyles.doctorAppointmentNotes} />
          </label>
        </div>
        <div style={modalStyles.doctorAppointmentFooter}>
          <button type="button" onClick={onClose} style={modalStyles.cancel}>Cancel</button>
          <button type="submit" disabled={!ready} style={{ ...T.primaryBtn, padding: '8px 12px', fontSize: '.72rem', borderRadius: 7, ...(ready ? {} : modalStyles.doctorAppointmentDisabled) }}>Schedule Appointment</button>
        </div>
      </form>
    </div>
  );
}

// ── VACCINATIONS TAB ───────────────────────────────────────────────────
function VaccinationsTab({ vaccinations, user, pets = [], onNavigate }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [localVaccinations, setLocalVaccinations] = useState(null);
  const [archiveError, setArchiveError] = useState('');
  const [historyVaccination, setHistoryVaccination] = useState(null);
  const [selectedVaccination, setSelectedVaccination] = useState(null);
  const [actionVaccination, setActionVaccination] = useState(null);
  const [verifyVaccination, setVerifyVaccination] = useState(null);
  const [editVaccination, setEditVaccination] = useState(null);
  const [addVaccination, setAddVaccination] = useState(null);
  const [stickerImage, setStickerImage] = useState(null);
  const [editStickerImage, setEditStickerImage] = useState(null);
  const editStickerUploadRef = useRef(null);
  const [vaccinationError, setVaccinationError] = useState('');
  const stickerUploadRef = useRef(null);
  const stickerCameraRef = useRef(null);
  const displayedVaccinations = (localVaccinations || (vaccinations && vaccinations.length > 0
    ? vaccinations.map(v => ({
      ...v,
      id: v.id || v.vaccination_id,
      pet: v.pet || v.pet_name || '—',
      type: v.type || v.vaccine_name || '—',
      dateGiven: v.dateGiven || v.date_given || '—',
      nextDue: v.nextDue || v.next_due || '—',
      attendingDoctor: v.attendingDoctor || v.attending_doctor || v.administered_by || v.by || '—',
      createdBy: v.createdBy || v.created_by || v.administered_by || v.by || '—',
      lastUpdatedBy: v.lastUpdatedBy || v.last_updated_by || v.administered_by || v.by || '—',
      dateCreated: v.dateCreated || v.date_created || v.created_at || '—',
      linkedPatient: v.linkedPatient || v.linked_patient || (v.pet && v.owner ? `${v.pet} (${v.owner})` : v.pet) || '—',
      pet_id: v.pet_id,
      stickerUrl: v.sticker_url || v.stickerUrl || '',
      stickerFilename: v.sticker_filename || v.stickerFilename || '',
      verified_by_name: v.verified_by_name || '',
      verified_at: v.verified_at || '',
      shared: v.shared === true,
      status: normalizeVaccination(v).status,
      clinicVerified: v.clinicVerified ?? v.clinic_verified ?? v.verified ?? false,
    }))
    : VACCINATIONS));
  const isUsingDemoVaccinations = !localVaccinations && (!vaccinations || vaccinations.length === 0);
  const overdueVaccinations = displayedVaccinations.filter(v => !v.archived && normalizeVaccination(v).status === 'overdue');
  const overduePetGroups = [...new Map(overdueVaccinations
    .filter(v => v.pet && v.pet !== '—')
    .map(v => [`${v.pet_id || v.pet}|${v.owner_email || v.owner || ''}`, v])).values()];
  const contactOverdueOwner = () => {
    const overdueRecord = overduePetGroups.length === 1 ? overduePetGroups[0] : null;
    if (overdueRecord && !isUsingDemoVaccinations && onNavigate) {
      const pet = pets.find(item => String(item.id) === String(overdueRecord.pet_id) || item.name === overdueRecord.pet);
      const ownerName = overdueRecord.owner || overdueRecord.owner_name || pet?.owner_name || pet?.owner?.name || pet?.owner || '';
      onNavigate('inbox', {
        id: pet?.id || overdueRecord.pet_id || overdueRecord.id,
        name: ownerName,
        phone: overdueRecord.owner_phone || pet?.owner_phone || pet?.phone || '',
        pet: overdueRecord.pet,
        species: pet?.species || '',
        breed: pet?.breed || '',
        age: pet?.age || '',
        sex: pet?.sex || pet?.gender || '',
        weight: pet?.weight || '',
        staff: user?.name || 'Clinic team',
        assignedTo: user?.name || 'Clinic team',
      });
      return;
    }
    setShowArchived(false);
    setStatusFilter('overdue');
  };
  const archiveVaccination = async vaccination => {
    try {
      const saved = await updateClinicRecordArchive({ user, endpoint: '/clinic-records/vaccinations', record: vaccination, label: 'vaccination' });
      setLocalVaccinations(displayedVaccinations.map(item => item.id === vaccination.id ? normalizeVaccination({ ...item, ...saved }) : item));
      notifySuccess(`Vaccination ${saved.archived ? 'archived' : 'restored'} successfully!`, '');
      setArchiveError('');
    } catch (error) {
      setArchiveError(error.message || 'Unable to update the vaccination record.');
    }
  };
  const shareVaccination = async vaccination => {
    try {
      if (!user?.clinic_id || !user?.token) throw new Error('Your account is not assigned to a clinic.');
      if (!vaccination.clinicVerified) throw new Error('Verify this vaccination before sharing it with the owner.');
      if (vaccination.shared) throw new Error('This vaccination has already been shared with the owner.');
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
      const params = new URLSearchParams({
        clinic_id: user.clinic_id,
        pet_name: vaccination.pet,
        owner_email: vaccination.owner_email || vaccination.email || '',
      });
      const headers = { Authorization: 'Bearer ' + user.token };
      const availableResponse = await fetch(`${apiUrl}/clinic-records/shareable-records?${params.toString()}`, { headers });
      const availableBody = await availableResponse.json().catch(() => ({}));
      if (!availableResponse.ok) throw new Error(availableBody.error || 'Unable to load owner sharing details.');
      const recordId = `vaccine:${vaccination.id}`;
      const available = (availableBody.records || []).find(item => item.id === recordId);
      if (!available || !available.clinicVerified) throw new Error('This verified vaccination is no longer available to share. Refresh the record and try again.');
      if (available.shared) throw new Error('This vaccination has already been shared with the owner.');
      const response = await fetch(`${apiUrl}/clinic-records/shareable-records?clinic_id=${encodeURIComponent(user.clinic_id)}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pet_id: availableBody.pet?.id, records: [{ id: recordId }], message: '', notification_requested: false }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to share this vaccination.');
      const saved = { ...vaccination, shared: true, sharedBy: user.name, sharedAt: body.share?.createdAt };
      setLocalVaccinations(displayedVaccinations.map(item => item.id === vaccination.id ? saved : item));
      setSelectedVaccination(saved);
      notifySuccess('Vaccination shared', `${vaccination.type} is now available in the linked PetWatch account.`);
    } catch (error) {
      setArchiveError(error.message || 'Unable to share this vaccination.');
    }
  };
  const applyVaccinationVerification = payload => {
    const updated = normalizeVaccination({
      ...verifyVaccination,
      ...payload,
      stickerUrl: payload.sticker_url || verifyVaccination?.stickerUrl,
      stickerFilename: payload.sticker_filename || verifyVaccination?.stickerFilename,
    });
    setLocalVaccinations(displayedVaccinations.map(item => item.id === updated.id ? updated : item));
    setSelectedVaccination(updated);
    setVerifyVaccination(null);
    setActionVaccination(null);
    notifySuccess(`Vaccination ${updated.id} verified successfully!`, 'The clinic record is updated and may now be shared with the owner.');
  };
  const filtered = displayedVaccinations.filter(v => {
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const query = search.toLowerCase();
    return Boolean(v.archived) === showArchived && matchesStatus && [v.id, v.pet, v.type, v.dateGiven, v.nextDue, v.attendingDoctor, v.createdBy, v.lastUpdatedBy, v.dateCreated, v.linkedPatient, v.status]
      .some(value => String(value || '').toLowerCase().includes(query));
  });
  const count = status => displayedVaccinations.filter(v => v.status === status).length;
  const vaccinationPets = pets.map(pet => ({ id: pet.id, name: pet.name }));
  const submitVaccination = async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      if (!user?.clinic_id || !user?.token) throw new Error('Your account is not assigned to a clinic.');
      if (!Number.isInteger(Number(data.pet))) throw new Error('Select a registered pet before saving the vaccination.');
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
      const response = await fetch(`${apiUrl}/clinic-records/vaccinations?clinic_id=${encodeURIComponent(user.clinic_id)}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + user.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: data.pet,
          vaccine_name: data.type,
          manufacturer: data.manufacturer,
          batch_number: data.lotNumber,
          expiry_date: data.expiryDate || null,
          dose: data.dose,
          date_given: data.dateGiven,
          next_due: data.nextDue || null,
          administered_by: user.id,
          administered_by_name: data.attendingDoctor,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const fieldMessage = payload.fields ? Object.values(payload.fields)[0] : null;
        throw new Error(fieldMessage || payload.error || 'Unable to save the vaccination record.');
      }
      let saved = payload;
      if (stickerImage?.file) {
        const reader = new FileReader();
        const imageData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Unable to read the sticker image.'));
          reader.readAsDataURL(stickerImage.file);
        });
        const uploadResponse = await fetch(`${apiUrl}/clinic-records/vaccinations/${payload.id}/sticker?clinic_id=${encodeURIComponent(user.clinic_id)}`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + user.token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: stickerImage.name, content_type: stickerImage.file.type, data: imageData }),
        });
        const uploadPayload = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) throw new Error(uploadPayload.error || 'Unable to save the sticker image.');
        saved = uploadPayload;
      }
      setLocalVaccinations([...displayedVaccinations, normalizeVaccination(saved)]);
      setAddVaccination(null);
      setStickerImage(null);
      setVaccinationError('');
      notifySuccess('Vaccination added successfully!', 'The record was saved to the clinic database.');
    } catch (error) {
      setVaccinationError(error.message || 'Unable to save the vaccination record.');
    }
  };
  const selectStickerImage = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStickerImage({ name: file.name, file, url: URL.createObjectURL(file) });
    event.target.value = '';
  };
  return (
    <div style={{ ...T.wrap, width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '20px 20px 18px', borderRadius: 14 }}>
      <div style={{ ...T.hd, margin: '0 0 8px' }}>
        <div style={{ ...T.title, fontSize: '.9rem', fontWeight: 600 }}>Vaccinations Management</div>
        <div style={{ ...T.actions, gap: 8 }}>
          <button type="button" onClick={() => setShowArchived(value => !value)} style={{ ...archiveToggleStyle, ...(showArchived ? archiveToggleActiveStyle : { color: '#374151' }) }}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.archive}</span>
            {showArchived ? `Viewing Archived (${displayedVaccinations.filter(item => item.archived).length})` : `Show Archived (${displayedVaccinations.filter(item => item.archived).length})`}
          </button>
          <button type="button" onClick={() => setAddVaccination({})} style={{ ...T.primaryBtn, padding: '7px 13px', fontSize: '.75rem', borderRadius: 8 }}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
            Add Vaccination
          </button>
        </div>
        {archiveError && <div role="alert" style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontSize: '.78rem' }}>{archiveError}</div>}
      </div>
      {overdueVaccinations.length > 0 && !showArchived && <div role="status" aria-live="polite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 13, padding: '10px 13px', border: '1px solid #efd181', borderRadius: 10, background: '#fff4c9', color: '#86540a', fontSize: '.8rem', lineHeight: 1.5 }}>
        <span>
          <strong>{overdueVaccinations.length} {overdueVaccinations.length === 1 ? 'vaccine is' : 'vaccines are'} overdue:</strong>{' '}
          {overdueVaccinations.map(item => `${item.type} (${item.pet})`).join(', ')}.
          {isUsingDemoVaccinations && <span style={{ marginLeft: 6, fontSize: '.72rem' }}>Demo data</span>}
        </span>
        <button type="button" onClick={contactOverdueOwner} style={{ flex: '0 0 auto', minHeight: 36, padding: '0 12px', border: '1px solid #e3d4aa', borderRadius: 8, background: '#fff', color: '#81500a', font: 'inherit', fontSize: '.75rem', fontWeight: 650, cursor: 'pointer' }}>
          {overduePetGroups.length === 1 && !isUsingDemoVaccinations && onNavigate ? 'Contact owner' : 'View overdue'}
        </button>
      </div>}
      <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
        {[
          ['all', 'All', displayedVaccinations.length],
          ['up-to-date', 'Up to Date', count('up-to-date')],
          ['due-soon', 'Due Soon', count('due-soon')],
          ['overdue', 'Overdue', count('overdue')],
        ].map(([value, label, itemCount]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            style={{
              border: statusFilter === value ? '1px solid #1f2937' : '1px solid #e5e7eb',
              background: statusFilter === value ? '#243247' : '#fff',
              color: statusFilter === value ? '#fff' : '#64748b',
              borderRadius: 14, padding: '4px 10px', fontSize: '.7rem', cursor: 'pointer',
            }}
          >
            {label} ({itemCount})
          </button>
        ))}
      </div>
      <div style={{ ...T.searchWrap, marginBottom: 18 }}>
        <span style={T.searchIcon}>{Icons.search}</span>
        <input
          style={{ ...T.search, marginBottom: 0, padding: '8px 14px 8px 36px', border: 'none', borderRadius: 8, background: '#f1f1f3', fontSize: '.78rem', color: '#374151' }}
          placeholder="Search vaccinations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="vaccination-scroll-hint">Select a row to review its details, verification, sticker, audit history, and owner sharing.</div>
      <div className="vaccination-table-scroll" style={{ width: '100%', minWidth: 0, overflowX: 'auto', overscrollBehaviorX: 'contain' }}>
      <table className="vaccination-records-table" style={{ ...T.table, width: '100%', minWidth: 1200, tableLayout: 'auto' }}>
        <thead>
          <tr>
            {[
              ['Vacc ID', '7%'], ['Pet', '8%'], ['Type', '13%'], ['Date Given', '10%'],
              ['Next Due', '9%'], ['Status', '8%'], ['Attending Doctor', '12%'], ['Clinic Verified', '12%'], ['Sharing', '9%'], ['Actions', '7%'],
            ].map(([h, width, className]) => (
              <th key={h} className={className} style={{ ...T.th, width, whiteSpace: 'nowrap', textTransform: 'none', letterSpacing: 0, color: '#374151', fontSize: '.68rem', padding: '0 8px 9px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(v => (
            <tr
              key={v.id}
              tabIndex={0}
              aria-label={`Open vaccination details for ${v.pet}, ${v.type}`}
              onClick={() => setSelectedVaccination(v)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedVaccination(v);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <td style={{ ...T.td, padding: '10px 8px', fontWeight: 600, fontSize: '.72rem', color: '#374151', whiteSpace: 'nowrap' }}>{v.id}</td>
              <td style={{ ...T.td, padding: '10px 8px', fontSize: '.72rem', color: '#374151', whiteSpace: 'nowrap' }}>{v.pet}</td>
              <td style={{ ...T.td, padding: '10px 8px', fontSize: '.72rem', color: '#374151', whiteSpace: 'nowrap' }}>{v.type}</td>
              <td style={{ ...T.tdMuted, padding: '10px 8px', fontSize: '.72rem', color: '#374151', whiteSpace: 'nowrap' }}>{formatClinicDate(v.dateGiven)}</td>
              <td style={{ ...T.td, padding: '10px 8px', color: v.nextDueColor || (v.status === 'overdue' ? '#ef4444' : v.status === 'due-soon' ? '#f59e0b' : '#16a34a'), fontWeight: 500, fontSize: '.72rem', whiteSpace: 'nowrap' }}>{formatClinicDate(v.nextDue)}</td>
              <td style={{ ...T.td, padding: '10px 8px', whiteSpace: 'nowrap' }}><StatusBadge status={v.status} vaccination /></td>
              <td style={{ ...T.tdMuted, padding: '10px 8px', color: '#374151', fontSize: '.72rem', whiteSpace: 'nowrap' }}>{v.attendingDoctor}</td>
              <td style={{ ...T.td, padding: '10px 8px', whiteSpace: 'nowrap' }}>
                <StatusIndicator status={v.clinicVerified ? 'Clinic Verified' : 'Pending Verification'} style={{ fontSize: '.65rem' }} />
              </td>
              <td style={{ ...T.td, padding: '10px 8px', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', padding: '4px 7px', borderRadius: 99, background: v.shared ? '#e5f7f1' : '#edf4f7', color: v.shared ? '#087f65' : '#526c78', fontSize: '.65rem', fontWeight: 650 }}>{v.shared ? 'Shared' : 'Not shared'}</span>
              </td>
              <td style={{ ...T.td, padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <button
                  type="button"
                  onClick={event => { event.stopPropagation(); setActionVaccination(v); }}
                  aria-label={`Open actions for vaccination ${v.id}`}
                  title="Vaccination actions"
                  style={{ border: '1px solid #dbe3ee', borderRadius: 7, background: '#fff', color: '#374151', padding: 6, width: 29, height: 29, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', cursor: 'pointer' }}
                >
                  <span style={{ width: 15, height: 15, display: 'flex' }}>{Icons.moreVertical}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {selectedVaccination && <VaccinationRecordDrawer
        record={selectedVaccination}
        sourceLabel="All Vaccinations"
        isShared={selectedVaccination.shared}
        onClose={() => setSelectedVaccination(null)}
        onVerify={() => {
          setVerifyVaccination(selectedVaccination);
          setSelectedVaccination(null);
        }}
        onShare={() => shareVaccination(selectedVaccination)}
      />}
      {addVaccination && <div style={modalStyles.backdrop} onClick={() => setAddVaccination(null)}>
        <form role="dialog" aria-modal="true" aria-labelledby="add-vaccination-title" onClick={event => event.stopPropagation()} onSubmit={submitVaccination} style={modalStyles.addVaccinationDialog}>
          <button type="button" aria-label="Close add vaccination" onClick={() => setAddVaccination(null)} style={modalStyles.close}>{Icons.close}</button>
          <h2 id="add-vaccination-title" style={modalStyles.addVaccinationTitle}>Add Vaccination Record</h2>
          <p style={modalStyles.addVaccinationIntro}>Enter the vaccination details. You may capture a vaccine sticker to pre-fill fields.</p>
          {vaccinationError && <div role="alert" style={{ gridColumn: '1 / -1', padding: '9px 11px', border: '1px solid #fecaca', borderRadius: 7, background: '#fef2f2', color: '#b91c1c', fontSize: '.74rem' }}>{vaccinationError}</div>}
          <label style={{ ...modalStyles.addVaccinationLabel, gridColumn: '1 / -1' }}><span style={modalStyles.addVaccinationLabelText}>Pet<span style={modalStyles.required}>*</span></span><select name="pet" required defaultValue="" style={modalStyles.addVaccinationInput}><option value="" disabled>Select pet</option>{vaccinationPets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label>
          <div style={modalStyles.addVaccinationGrid}>
            <label style={modalStyles.addVaccinationLabel}><span style={modalStyles.addVaccinationLabelText}>Vaccine / Product Name<span style={modalStyles.required}>*</span></span><input name="type" required placeholder="Rabies (IMRAB 3TF)" style={modalStyles.addVaccinationInput} /></label>
            <label style={modalStyles.addVaccinationLabel}><span style={modalStyles.addVaccinationLabelText}>Manufacturer</span><input name="manufacturer" placeholder="Boehringer Ingelheim" style={modalStyles.addVaccinationInput} /></label>
            <label style={modalStyles.addVaccinationLabel}><span style={modalStyles.addVaccinationLabelText}>Lot / Batch Number</span><input name="lotNumber" placeholder="RAB-2025-F6" style={modalStyles.addVaccinationInput} /></label>
            <label style={modalStyles.addVaccinationLabel}><span style={modalStyles.addVaccinationLabelText}>Expiry Date</span><input name="expiryDate" type="date" style={modalStyles.addVaccinationInput} /></label>
            <label style={modalStyles.addVaccinationLabel}><span style={modalStyles.addVaccinationLabelText}>Dose</span><input name="dose" placeholder="1 mL IM" style={modalStyles.addVaccinationInput} /></label>
            <label style={modalStyles.addVaccinationLabel}><span style={modalStyles.addVaccinationLabelText}>Date Given<span style={modalStyles.required}>*</span></span><input name="dateGiven" type="date" required style={modalStyles.addVaccinationInput} /></label>
            <label style={modalStyles.addVaccinationLabel}><span style={modalStyles.addVaccinationLabelText}>Next Due Date</span><input name="nextDue" type="date" style={modalStyles.addVaccinationInput} /></label>
            <label style={modalStyles.addVaccinationLabel}><span style={modalStyles.addVaccinationLabelText}>Administered By<span style={modalStyles.required}>*</span></span><input name="attendingDoctor" required placeholder="Dr. Smith" style={modalStyles.addVaccinationInput} /></label>
          </div>
          <div style={modalStyles.captureSticker}><strong><span style={modalStyles.proofIcon}>{Icons.clipboard}</span>Capture Sticker <em>(Optional)</em></strong><p style={modalStyles.captureStickerDescription}>Attach the original vaccine label or product sticker. Fields can be extracted for review — never saved automatically.</p><input ref={stickerCameraRef} type="file" accept="image/*" capture="environment" onChange={selectStickerImage} style={{ display: 'none' }} /><input ref={stickerUploadRef} type="file" accept="image/*" onChange={selectStickerImage} style={{ display: 'none' }} /><div style={modalStyles.proofButtons}><button type="button" onClick={() => stickerCameraRef.current?.click()} style={modalStyles.smallSecondary}>▣ &nbsp;Take Photo</button><button type="button" onClick={() => stickerUploadRef.current?.click()} style={modalStyles.smallSecondary}>↥ &nbsp;Upload Image</button></div>{stickerImage && <div style={modalStyles.stickerSelected}><img src={stickerImage.url} alt="Selected vaccine sticker" style={modalStyles.stickerPreview} /><span>{stickerImage.name}</span><button type="button" onClick={() => setStickerImage(null)} style={modalStyles.removeSticker}>Remove</button></div>}</div>
          <div style={modalStyles.addVaccinationFooter}><button type="button" style={modalStyles.cancel} onClick={() => { setAddVaccination(null); setStickerImage(null); }}>Cancel</button><button type="submit" style={{ ...T.primaryBtn, padding: '8px 12px', fontSize: '.68rem', borderRadius: 7 }}>Add Record</button></div>
        </form>
      </div>}
      {actionVaccination && <div style={modalStyles.backdrop} onClick={() => setActionVaccination(null)}>
        <div role="dialog" aria-modal="true" aria-labelledby="vaccination-actions-title" onClick={event => event.stopPropagation()} style={modalStyles.vaccinationActionsDialog}>
          <button type="button" aria-label="Close vaccination actions" onClick={() => setActionVaccination(null)} style={modalStyles.vaccinationActionsClose}>{Icons.close}</button>
          <div style={modalStyles.vaccinationActionsHeader}>
            <div style={modalStyles.vaccinationActionsHeaderIcon}><span style={{ width: 25, height: 25, display: 'flex' }}>{Icons.syringe}</span></div>
            <div><h2 id="vaccination-actions-title" style={modalStyles.vaccinationActionsTitle}>Vaccination Actions</h2><div style={modalStyles.vaccinationActionsSubtitle}>{actionVaccination.id} — {actionVaccination.type} ({actionVaccination.pet})</div></div>
          </div>
          <div style={modalStyles.vaccinationActionsPet}>
            <div style={modalStyles.vaccinationActionsPetInfo}><img src="/healthy-pets.png" alt="" style={modalStyles.vaccinationActionsPetImage} /><div><div style={modalStyles.vaccinationActionsPetName}>{actionVaccination.pet || 'Selected Pet'}</div><div style={modalStyles.vaccinationActionsPetMeta}>🐾 Patient record&nbsp; • &nbsp;{actionVaccination.dateGiven || 'Vaccination date'}&nbsp; • &nbsp;{actionVaccination.dose || 'Dose recorded'}</div></div></div>
            <StatusIndicator status="Active" />
          </div>
          <div style={modalStyles.vaccinationActionsList}>
            <button type="button" className="vaccination-action-button" onClick={() => setHistoryVaccination(actionVaccination)} style={{ ...modalStyles.vaccinationActionCard, border: '1px solid #b7e4d7', background: '#f2fbf8' }}>
              <span style={{ ...modalStyles.vaccinationActionCardIcon, background: '#e7f5f2', color: '#087f65' }}><span style={{ width: 24, height: 24, display: 'flex' }}>{Icons.clipboard}</span></span>
              <span style={modalStyles.vaccinationActionCardText}><strong style={modalStyles.vaccinationActionCardTitle}>View Audit History</strong><small style={modalStyles.vaccinationActionCardDescription}>See the complete vaccination record and history for this pet.</small></span><span style={modalStyles.vaccinationActionArrow}>›</span>
            </button>
            <button type="button" className="vaccination-action-button" onClick={() => setEditVaccination(actionVaccination)} style={{ ...modalStyles.vaccinationActionCard, border: '1px solid #b7e4d7', background: '#f2fbf8' }}>
              <span style={{ ...modalStyles.vaccinationActionCardIcon, background: '#d9f3ea', color: '#0d8a69' }}><span style={{ width: 23, height: 23, display: 'flex' }}>{Icons.edit}</span></span>
              <span style={modalStyles.vaccinationActionCardText}><strong style={modalStyles.vaccinationActionCardTitle}>Edit Vaccination</strong><small style={modalStyles.vaccinationActionCardDescription}>Update vaccination details, batch numbers, or next due date.</small></span><span style={modalStyles.vaccinationActionArrow}>›</span>
            </button>
            {!actionVaccination.clinicVerified && <button
              type="button"
              className="vaccination-action-button"
              onClick={() => {
                setVerifyVaccination(actionVaccination);
                setActionVaccination(null);
              }}
              style={{ ...modalStyles.vaccinationActionCard, border: '1px solid #cbd9e8', background: '#f2fbf8' }}
            >
              <span style={{ ...modalStyles.vaccinationActionCardIcon, background: '#e5edf6', color: '#294563' }}><span style={{ width: 23, height: 23, display: 'flex' }}>{Icons.shieldCheck}</span></span>
              <span style={modalStyles.vaccinationActionCardText}><strong style={modalStyles.vaccinationActionCardTitle}>Verify Record</strong><small style={modalStyles.vaccinationActionCardDescription}>Confirm the vaccination is valid and properly logged in the system.</small></span><span style={modalStyles.vaccinationActionArrow}>›</span>
            </button>}
            <button type="button" className="vaccination-action-button" onClick={() => { archiveVaccination(actionVaccination); setActionVaccination(null); }} style={{ ...modalStyles.vaccinationActionCard, border: '1px solid #ffc0c8', background: '#fff5f6' }}>
              <span style={{ ...modalStyles.vaccinationActionCardIcon, background: '#ffdce1', color: '#c52e4a' }}><span style={{ width: 23, height: 23, display: 'flex' }}>{showArchived ? Icons.refresh : Icons.trash}</span></span>
              <span style={modalStyles.vaccinationActionCardText}><strong style={modalStyles.vaccinationActionCardTitle}>{showArchived ? 'Restore Vaccination' : 'Move to Trash'}</strong><small style={modalStyles.vaccinationActionCardDescription}>Remove this vaccination record from the system.</small></span><span style={modalStyles.vaccinationActionArrow}>›</span>
            </button>
          </div>
          <div style={modalStyles.vaccinationActionsFooter}><span style={modalStyles.vaccinationActionsNote}>ⓘ &nbsp;These actions only affect the selected vaccination record ({actionVaccination.id}).</span><button type="button" className="vaccination-actions-cancel" style={modalStyles.vaccinationActionsCancel} onClick={() => setActionVaccination(null)}>Cancel</button></div>
        </div>
      </div>}
      {verifyVaccination && <VaccinationVerificationDialog
        record={verifyVaccination}
        user={user}
        onClose={() => setVerifyVaccination(null)}
        onVerified={applyVaccinationVerification}
        onStickerUploaded={uploaded => {
          setLocalVaccinations(displayedVaccinations.map(item => item.id === uploaded.id ? normalizeVaccination({ ...item, ...uploaded }) : item));
        }}
      />}
      {historyVaccination && <div style={modalStyles.backdrop} onClick={() => setHistoryVaccination(null)}>
        <div role="dialog" aria-modal="true" onClick={event => event.stopPropagation()} style={{ ...modalStyles.dialog, width: 520 }}>
          <button type="button" aria-label="Close audit history" onClick={() => setHistoryVaccination(null)} style={modalStyles.close}>{Icons.close}</button>
          <div style={modalStyles.headerText}><h2 style={modalStyles.title}>Audit History</h2><div style={modalStyles.subtitle}>{historyVaccination.id} — {historyVaccination.type} ({historyVaccination.pet})</div></div>
          <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
            {[
              ['Created By', historyVaccination.createdBy],
              ['Date Created', formatClinicDate(historyVaccination.dateCreated)],
              ['Last Updated By', historyVaccination.lastUpdatedBy],
              ['Linked Patient', historyVaccination.linkedPatient],
            ].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 9, background: '#f8fafc' }}>
              <strong style={{ color: '#475569', fontSize: '.74rem' }}>{label}</strong>
              <span style={{ color: '#64748b', fontSize: '.74rem', textAlign: 'right', overflowWrap: 'anywhere' }}>{value || '—'}</span>
            </div>)}
            {[
              ['Record Created', historyVaccination.dateCreated, historyVaccination.createdBy],
              ['Vaccination Administered', historyVaccination.dateGiven, historyVaccination.attendingDoctor],
              ...(historyVaccination.clinicVerified ? [['Clinic Verified', historyVaccination.verified_at || historyVaccination.dateCreated, historyVaccination.verified_by_name || historyVaccination.lastUpdatedBy]] : []),
            ].map(([event, date, actor]) => <div key={event} style={{ padding: '11px 13px', border: '1px solid #e2e8f0', borderRadius: 9, background: '#f8fafc' }}>
              <div style={{ color: '#334155', fontSize: '.76rem', fontWeight: 700 }}>{event} <span style={{ color: '#94a3b8', fontWeight: 400 }}> {formatClinicDate(date)}</span></div>
              <div style={{ marginTop: 4, color: '#64748b', fontSize: '.72rem' }}>{actor || '—'}</div>
            </div>)}
          </div>
          <div style={modalStyles.footer}><button type="button" style={modalStyles.cancel} onClick={() => setHistoryVaccination(null)}>Back to Actions</button></div>
        </div>
      </div>}
      {editVaccination && <div style={modalStyles.backdrop} onClick={() => setEditVaccination(null)}>
        <form role="dialog" aria-modal="true" aria-labelledby="edit-vaccination-title" onClick={event => event.stopPropagation()} onSubmit={async event => {
          event.preventDefault();
          try {
            const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
            const response = await fetch(`${apiUrl}/clinic-records/vaccinations/${editVaccination.id}?clinic_id=${encodeURIComponent(user.clinic_id)}`, {
              method: 'PUT',
              headers: { Authorization: 'Bearer ' + user.token, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pet_id: editVaccination.pet_id,
                vaccine_name: editVaccination.type,
                manufacturer: editVaccination.manufacturer,
                batch_number: editVaccination.lotNumber || editVaccination.lot,
                expiry_date: editVaccination.expiryDate || editVaccination.expiry || null,
                dose: editVaccination.dose,
                date_given: editVaccination.dateGiven,
                next_due: editVaccination.nextDue || null,
                administered_by: user.id,
                administered_by_name: editVaccination.attendingDoctor,
              }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
              const fieldMessage = payload.fields ? Object.values(payload.fields)[0] : null;
              throw new Error(fieldMessage || payload.error || 'Unable to update the vaccination record.');
            }
            let saved = payload;
            if (editStickerImage) {
              const reader = new FileReader();
              const imageData = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Unable to read the sticker image.'));
                reader.readAsDataURL(editStickerImage);
              });
              const uploadResponse = await fetch(`${apiUrl}/clinic-records/vaccinations/${editVaccination.id}/sticker?clinic_id=${encodeURIComponent(user.clinic_id)}`, {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + user.token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: editStickerImage.name, content_type: editStickerImage.type, data: imageData }),
              });
              const uploadPayload = await uploadResponse.json().catch(() => ({}));
              if (!uploadResponse.ok) throw new Error(uploadPayload.error || 'Unable to save the sticker image.');
              saved = uploadPayload;
            }
            setLocalVaccinations(displayedVaccinations.map(item => item.id === editVaccination.id ? normalizeVaccination(saved) : item));
            setEditVaccination(null);
            setEditStickerImage(null);
            setVaccinationError('');
            notifySuccess(`Vaccination ${editVaccination.id} updated successfully!`, 'Changes were saved to the clinic database.');
          } catch (error) {
            setVaccinationError(error.message || 'Unable to update the vaccination record.');
          }
        }} style={modalStyles.editVaccinationDialog}>
          <button type="button" aria-label="Close edit vaccination" onClick={() => setEditVaccination(null)} style={modalStyles.close}>{Icons.close}</button>
          <h2 id="edit-vaccination-title" style={modalStyles.editVaccinationTitle}>Edit Vaccination Record</h2>
          <p style={modalStyles.editVaccinationIntro}>Update the vaccination details for {editVaccination.pet}. Changing verified fields will remove the Clinic Verified badge.</p>
          {vaccinationError && <div role="alert" style={{ marginBottom: 10, padding: '9px 11px', border: '1px solid #fecaca', borderRadius: 7, background: '#fef2f2', color: '#b91c1c', fontSize: '.74rem' }}>{vaccinationError}</div>}
          {editVaccination.clinicVerified && <div style={modalStyles.verifiedNotice}><div style={modalStyles.verifiedNoticeHeader}><strong><span style={modalStyles.verifiedIcon}>{Icons.shieldCheck}</span>Clinic Verified</strong><button type="button" onClick={async () => {
            try {
              const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
              const response = await fetch(`${apiUrl}/clinic-records/vaccinations/${editVaccination.id}/verification?clinic_id=${encodeURIComponent(user.clinic_id)}`, {
                method: 'PATCH',
                headers: { Authorization: 'Bearer ' + user.token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified: false, reason: 'Verification removed for record correction.' }),
              });
              const payload = await response.json().catch(() => ({}));
              if (!response.ok) throw new Error(payload.error || 'Unable to remove verification.');
              setLocalVaccinations(displayedVaccinations.map(item => item.id === editVaccination.id ? normalizeVaccination({ ...item, ...payload }) : item));
              setEditVaccination(payload);
              notifySuccess('Verification removed.', 'The correction is recorded in the audit trail.');
            } catch (error) {
              setVaccinationError(error.message || 'Unable to remove verification.');
            }
          }} style={modalStyles.removeVerification}>Remove Verification</button></div><span>Happy Paws Veterinary · Verified by {editVaccination.lastUpdatedBy || editVaccination.attendingDoctor || 'Clinic staff'} · {editVaccination.dateCreated || '—'}</span><small style={modalStyles.verificationWarning}>⚠ Changing vaccine name, date, lot number, expiry, dose, or sticker image will automatically remove verification.</small></div>}
          <div style={modalStyles.editVaccinationGrid}>
            <label style={{ ...modalStyles.editVaccinationLabel, gridColumn: '1 / -1' }}>Pet<select value={editVaccination.pet_id || ''} onChange={event => setEditVaccination({ ...editVaccination, pet_id: event.target.value, pet: pets.find(item => String(item.id) === event.target.value)?.name || editVaccination.pet })} style={modalStyles.editVaccinationInput}>{pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label>
            <label style={modalStyles.editVaccinationLabel}>Vaccine / Product Name<input value={editVaccination.type || ''} onChange={event => setEditVaccination({ ...editVaccination, type: event.target.value })} style={modalStyles.editVaccinationInput} /></label>
            <label style={modalStyles.editVaccinationLabel}>Manufacturer<input value={editVaccination.manufacturer || ''} onChange={event => setEditVaccination({ ...editVaccination, manufacturer: event.target.value })} style={modalStyles.editVaccinationInput} /></label>
            <label style={modalStyles.editVaccinationLabel}>Lot / Batch Number<input value={editVaccination.lotNumber || editVaccination.lot || ''} onChange={event => setEditVaccination({ ...editVaccination, lotNumber: event.target.value })} style={modalStyles.editVaccinationInput} /></label>
            <label style={modalStyles.editVaccinationLabel}>Expiry Date<input value={editVaccination.expiryDate || editVaccination.expiry || ''} onChange={event => setEditVaccination({ ...editVaccination, expiryDate: event.target.value })} style={modalStyles.editVaccinationInput} /></label>
            <label style={modalStyles.editVaccinationLabel}>Dose<input value={editVaccination.dose || ''} onChange={event => setEditVaccination({ ...editVaccination, dose: event.target.value })} style={modalStyles.editVaccinationInput} /></label>
            <label style={modalStyles.editVaccinationLabel}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                Status
                <StatusBadge status={editVaccination.status} vaccination />
              </span>
              <select value={editVaccination.status || ''} onChange={event => setEditVaccination({ ...editVaccination, status: event.target.value })} style={modalStyles.editVaccinationInput}>
                <option value="up-to-date">Up to Date</option>
                <option value="due-soon">Due Soon</option>
                <option value="overdue">Overdue</option>
              </select>
            </label>
            <label style={modalStyles.editVaccinationLabel}>Date Given<input value={editVaccination.dateGiven || ''} onChange={event => setEditVaccination({ ...editVaccination, dateGiven: event.target.value })} style={modalStyles.editVaccinationInput} /></label>
            <label style={modalStyles.editVaccinationLabel}>Next Due<input value={editVaccination.nextDue || ''} onChange={event => setEditVaccination({ ...editVaccination, nextDue: event.target.value })} style={modalStyles.editVaccinationInput} /></label>
            <label style={{ ...modalStyles.editVaccinationLabel, gridColumn: '1 / -1' }}>Administered By<input value={editVaccination.attendingDoctor || ''} onChange={event => setEditVaccination({ ...editVaccination, attendingDoctor: event.target.value })} style={modalStyles.editVaccinationInput} /></label>
          </div>
          <div style={modalStyles.proofImage}><strong><span style={modalStyles.proofIcon}>{Icons.clipboard}</span>Sticker / Proof Image</strong><input ref={editStickerUploadRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => { const file = event.target.files?.[0]; if (file) setEditStickerImage(file); event.target.value = ''; }} style={{ display: 'none' }} /><div style={modalStyles.proofContent}><div style={modalStyles.proofPreview}>{editVaccination.stickerUrl ? <img src={editVaccination.stickerUrl} alt="Current vaccine sticker" style={modalStyles.stickerPreview} /> : <><span style={modalStyles.proofPreviewMark}>▦</span><span>No sticker</span></>}</div><div><span style={modalStyles.proofCaption}>{editStickerImage?.name || editVaccination.stickerFilename || 'Current sticker image'}</span><div style={modalStyles.proofButtons}><button type="button" disabled={!editVaccination.stickerUrl} onClick={() => window.open(editVaccination.stickerUrl, '_blank', 'noopener,noreferrer')} style={modalStyles.smallSecondary}>◉ &nbsp;View Full</button><button type="button" onClick={() => editStickerUploadRef.current?.click()} style={modalStyles.smallSecondary}>↥ &nbsp;Replace</button></div></div></div></div>
          <details style={modalStyles.editAudit}><summary>Audit Log (5 entries)</summary><div style={modalStyles.editAuditEntries}><div>Sticker Uploaded · {editVaccination.createdBy || 'Clinic staff'} · {editVaccination.dateCreated || '—'}</div><div>Verified · {editVaccination.lastUpdatedBy || 'Clinic staff'} · {editVaccination.dateCreated || '—'}</div><div>Edited · {editVaccination.lastUpdatedBy || 'Clinic staff'} · {editVaccination.dateCreated || '—'}</div><div>Verified · {editVaccination.lastUpdatedBy || 'Clinic staff'} · {editVaccination.dateCreated || '—'}</div></div></details>
          <div style={modalStyles.editVaccinationFooter}>
            <button type="button" style={modalStyles.cancel} onClick={() => setEditVaccination(null)}>Cancel</button>
            <button type="submit" style={{ ...T.primaryBtn, padding: '8px 12px', fontSize: '.68rem', borderRadius: 7 }}>Save Changes</button>
          </div>
        </form>
      </div>}
    </div>
  );
}

// ── TREATMENTS TAB ─────────────────────────────────────────────────────
function TreatmentsTab({ treatments, user }) {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [localTreatments, setLocalTreatments] = useState(null);
  const [archiveError, setArchiveError] = useState('');
  const [actionTreatment, setActionTreatment] = useState(null);
  const [historyTreatment, setHistoryTreatment] = useState(null);
  const [editTreatment, setEditTreatment] = useState(null);
  const [addTreatment, setAddTreatment] = useState(false);
  const [treatmentFormError, setTreatmentFormError] = useState('');
  const sourceTreatments = localTreatments || (treatments && treatments.length > 0 ? treatments : TREATMENTS);
  const displayedTreatments = sourceTreatments.map(t => ({
    ...t,
    id: t.id || t.treatment_id,
    date: t.date || t.issued_at || '—',
    pet: t.pet || t.pet_name || '—',
    attendingDoctor: t.attendingDoctor || t.attending_doctor || t.doctor || '—',
    createdBy: t.createdBy || t.created_by || t.attendingDoctor || t.doctor || '—',
    lastUpdatedBy: t.lastUpdatedBy || t.last_updated_by || t.attendingDoctor || t.doctor || '—',
    dateCreated: t.dateCreated || t.date_created || t.created_at || t.date || '—',
    linkedPatient: t.linkedPatient || t.linked_patient || (t.pet && t.owner ? `${t.pet} (${t.owner})` : t.pet) || '—',
    status: t.status || 'finalized',
  }));
  const archiveTreatment = async treatment => {
    try {
      const saved = await updateClinicRecordArchive({ user, endpoint: '/clinic-records/treatments', record: treatment, label: 'treatment' });
      setLocalTreatments(displayedTreatments.map(item => item.id === treatment.id ? { ...item, ...saved } : item));
      notifySuccess(`Treatment ${saved.archived ? 'archived' : 'restored'} successfully!`, '');
      setArchiveError('');
    } catch (error) {
      setArchiveError(error.message || 'Unable to update the treatment record.');
    }
  };
  const filtered = displayedTreatments.filter(t =>
    Boolean(t.archived) === showArchived && [t.id, t.date, t.pet, t.diagnosis, t.treatment, t.medication, t.cost, t.attendingDoctor, t.createdBy, t.lastUpdatedBy, t.dateCreated, t.linkedPatient, t.status]
      .some(value => String(value || '').toLowerCase().includes(search.toLowerCase()))
  );
  const formatCost = value => {
    if (value === null || value === undefined || value === '') return '—';
    const raw = String(value).replace(/[₱$,\s]/g, '');
    const amount = Number(raw);
    return Number.isFinite(amount) ? `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `₱${String(value).replace(/^\$/, '')}`;
  };
  const treatmentPets = [...new Set(displayedTreatments.map(treatment => treatment.pet).filter(pet => pet && pet !== '—'))];
  const submitTreatment = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const pet = String(form.get('pet') || '').trim();
    const date = String(form.get('date') || '').trim();
    const diagnosis = String(form.get('diagnosis') || '').trim();
    const treatment = String(form.get('treatment') || '').trim();
    const cost = String(form.get('cost') || '').trim();
    if (!pet || !date || !diagnosis || !treatment || !cost) {
      setTreatmentFormError('Complete all required fields before adding the treatment record.');
      return;
    }
    const newTreatment = {
      id: `TRT-${String(Date.now()).slice(-6)}`,
      date,
      pet,
      diagnosis,
      treatment,
      medication: String(form.get('medication') || '').trim() || '—',
      cost,
      attendingDoctor: user?.name || 'Current doctor',
      createdBy: user?.name || 'Current doctor',
      lastUpdatedBy: user?.name || 'Current doctor',
      dateCreated: date,
      linkedPatient: pet,
      status: 'active',
      archived: false,
    };
    setLocalTreatments([newTreatment, ...displayedTreatments]);
    setAddTreatment(false);
    setTreatmentFormError('');
    notifySuccess(`Treatment ${newTreatment.id} added.`, 'The treatment record is now available in Treatments Management.');
  };
  return (
    <div style={{ ...T.wrap, padding: '20px 20px 18px', borderRadius: 14 }}>
      <div style={{ ...T.hd, margin: '0 0 20px' }}>
        <div style={{ ...T.title, fontSize: '.9rem', fontWeight: 600 }}>Treatments Management</div>
        <div style={{ ...T.actions, gap: 8 }}>
          <button type="button" onClick={() => setShowArchived(value => !value)} style={{ ...archiveToggleStyle, ...(showArchived ? archiveToggleActiveStyle : { color: '#374151' }) }}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.archive}</span>
            {showArchived ? `Viewing Archived (${displayedTreatments.filter(item => item.archived).length})` : `Show Archived (${displayedTreatments.filter(item => item.archived).length})`}
          </button>
          <button type="button" onClick={() => { setTreatmentFormError(''); setAddTreatment(true); }} style={{ ...T.primaryBtn, padding: '7px 13px', fontSize: '.75rem', borderRadius: 8 }}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
            Add Treatment
          </button>
        </div>
        {archiveError && <div role="alert" style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontSize: '.78rem' }}>{archiveError}</div>}
      </div>
      <div style={{ ...T.searchWrap, marginBottom: 18 }}>
        <span style={T.searchIcon}>{Icons.search}</span>
        <input
          style={{ ...T.search, marginBottom: 0, padding: '8px 14px 8px 36px', border: 'none', borderRadius: 8, background: '#f1f1f3', fontSize: '.78rem', color: '#374151' }}
          placeholder="Search treatments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <table style={{ ...T.table, tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {[
              ['Treatment ID', '9%'], ['Date', '9%'], ['Pet', '8%'], ['Diagnosis', '12%'],
              ['Treatment', '15%'], ['Medication', '11%'], ['Cost', '8%'], ['Attending Doctor', '13%'],
              ['Status', '8%'], ['Actions', '7%'],
            ].map(([h, width]) => (
              <th key={h} style={{ ...T.th, width, textTransform: 'none', letterSpacing: 0, color: '#374151', fontSize: '.72rem', padding: '0 7px 9px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(t => (
            <tr key={t.id}>
              <td style={{ ...T.td, padding: '9px 7px', fontWeight: 600, fontSize: '.75rem', color: '#374151' }}>{t.id}</td>
              <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{t.date || t.issued_at || '—'}</td>
              <td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{t.pet || t.pet_name || '—'}</td>
              <td style={{ ...T.td, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{t.diagnosis || '—'}</td>
              <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{t.treatment || t.description || '—'}</td>
              <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{t.medication || '—'}</td>
              <td style={{ ...T.td, padding: '9px 7px', fontWeight: 600, fontSize: '.75rem', color: '#374151' }}>{formatCost(t.cost || t.amount)}</td>
              <td style={{ ...T.tdMuted, padding: '9px 7px', fontSize: '.75rem', color: '#374151' }}>{t.attendingDoctor}</td>
              <td style={{ ...T.td, padding: '9px 7px', whiteSpace: 'nowrap' }}><StatusBadge status={t.status} /></td>
              <td style={{ ...T.td, padding: '9px 7px', textAlign: 'center' }}>
                <button type="button" onClick={() => setActionTreatment(t)} aria-label={`Open actions for treatment ${t.id}`} title="Treatment actions" style={{ border: '1px solid #dbe3ee', borderRadius: 7, background: '#fff', color: '#374151', padding: 6, width: 29, height: 29, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', cursor: 'pointer' }}>
                  <span style={{ width: 15, height: 15, display: 'flex' }}>{Icons.moreVertical}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {addTreatment && <div style={modalStyles.backdrop} onClick={() => setAddTreatment(false)}>
        <form role="dialog" aria-modal="true" aria-labelledby="add-treatment-title" onClick={event => event.stopPropagation()} onSubmit={submitTreatment} style={{ ...modalStyles.doctorAppointmentDialog, width: 'min(600px, 100%)', padding: '22px 24px 20px' }}>
          <button type="button" aria-label="Close add treatment" onClick={() => setAddTreatment(false)} style={modalStyles.close}>{Icons.close}</button>
          <h2 id="add-treatment-title" style={{ ...modalStyles.doctorAppointmentTitle, fontSize: '1.1rem' }}>Add Treatment Record</h2>
          <p style={modalStyles.doctorAppointmentIntro}>Enter the treatment details.</p>
          {treatmentFormError && <div role="alert" style={{ marginBottom: 12, padding: '9px 11px', border: '1px solid #fecaca', borderRadius: 7, background: '#fef2f2', color: '#b91c1c', fontSize: '.72rem' }}>{treatmentFormError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
            <label style={modalStyles.doctorAppointmentLabel}><span>Pet<span style={modalStyles.required}>*</span></span><select name="pet" required defaultValue="" style={modalStyles.doctorAppointmentInput}><option value="" disabled>Select pet</option>{treatmentPets.map(pet => <option key={pet} value={pet}>{pet}</option>)}</select></label>
            <label style={modalStyles.doctorAppointmentLabel}><span>Date<span style={modalStyles.required}>*</span></span><input name="date" type="date" required style={modalStyles.doctorAppointmentInput} /></label>
            <label style={{ ...modalStyles.doctorAppointmentLabel, gridColumn: '1 / -1' }}><span>Diagnosis<span style={modalStyles.required}>*</span></span><input name="diagnosis" required placeholder="Routine Checkup" style={modalStyles.doctorAppointmentInput} /></label>
            <label style={{ ...modalStyles.doctorAppointmentLabel, gridColumn: '1 / -1' }}><span>Treatment<span style={modalStyles.required}>*</span></span><textarea name="treatment" required placeholder="Description of treatment..." style={{ ...modalStyles.doctorAppointmentNotes, height: 76 }} /></label>
            <label style={modalStyles.doctorAppointmentLabel}><span>Medication</span><input name="medication" placeholder="Amoxicillin" style={modalStyles.doctorAppointmentInput} /></label>
            <label style={modalStyles.doctorAppointmentLabel}><span>Cost<span style={modalStyles.required}>*</span></span><input name="cost" required inputMode="decimal" placeholder="50.00" style={modalStyles.doctorAppointmentInput} /></label>
          </div>
          <div style={modalStyles.doctorAppointmentFooter}><button type="button" style={modalStyles.cancel} onClick={() => setAddTreatment(false)}>Cancel</button><button type="submit" style={{ ...T.primaryBtn, padding: '8px 13px', fontSize: '.7rem', borderRadius: 7 }}>Add Treatment</button></div>
        </form>
      </div>}
      {actionTreatment && <div style={modalStyles.backdrop} onClick={() => setActionTreatment(null)}>
        <div role="dialog" aria-modal="true" aria-labelledby="treatment-actions-title" onClick={event => event.stopPropagation()} style={modalStyles.vaccinationActionsDialog}>
          <button type="button" aria-label="Close treatment actions" onClick={() => setActionTreatment(null)} style={modalStyles.vaccinationActionsClose}>{Icons.close}</button>
          <div style={modalStyles.vaccinationActionsHeader}>
            <div style={modalStyles.vaccinationActionsHeaderIcon}><span style={{ width: 25, height: 25, display: 'flex' }}>{Icons.stethoscope}</span></div>
            <div><h2 id="treatment-actions-title" style={modalStyles.vaccinationActionsTitle}>Treatment Actions</h2><div style={modalStyles.vaccinationActionsSubtitle}>{actionTreatment.id} — {actionTreatment.diagnosis} ({actionTreatment.pet})</div></div>
          </div>
          <div style={modalStyles.vaccinationActionsPet}>
            <div style={modalStyles.vaccinationActionsPetInfo}><img src="/healthy-pets.png" alt="" style={modalStyles.vaccinationActionsPetImage} /><div><div style={modalStyles.vaccinationActionsPetName}>{actionTreatment.pet || 'Selected Pet'}</div><div style={modalStyles.vaccinationActionsPetMeta}>🐾 Patient record&nbsp; • &nbsp;{actionTreatment.diagnosis || 'Clinical treatment'}&nbsp; • &nbsp;{actionTreatment.date || 'Treatment date'}</div></div></div>
            <StatusIndicator status={actionTreatment.status === 'finalized' ? 'Finalized' : 'Active'} />
          </div>
          <div style={modalStyles.vaccinationActionsList}>
            <button type="button" onClick={() => setHistoryTreatment(actionTreatment)} style={{ ...modalStyles.vaccinationActionCard, border: '1px solid #b7e4d7', background: '#f2fbf8' }}><span style={{ ...modalStyles.vaccinationActionCardIcon, background: '#e7f5f2', color: '#087f65' }}><span style={{ width: 24, height: 24, display: 'flex' }}>{Icons.clipboard}</span></span><span style={modalStyles.vaccinationActionCardText}><strong style={modalStyles.vaccinationActionCardTitle}>View Audit History</strong><small style={modalStyles.vaccinationActionCardDescription}>See the complete treatment record and history for this pet.</small></span><span style={modalStyles.vaccinationActionArrow}>›</span></button>
            <button type="button" onClick={() => setEditTreatment(actionTreatment)} style={{ ...modalStyles.vaccinationActionCard, border: '1px solid #b7e4d7', background: '#f2fbf8' }}><span style={{ ...modalStyles.vaccinationActionCardIcon, background: '#d9f3ea', color: '#0d8a69' }}><span style={{ width: 23, height: 23, display: 'flex' }}>{Icons.edit}</span></span><span style={modalStyles.vaccinationActionCardText}><strong style={modalStyles.vaccinationActionCardTitle}>Edit Treatment</strong><small style={modalStyles.vaccinationActionCardDescription}>Update diagnosis, treatment details, medication, or cost.</small></span><span style={modalStyles.vaccinationActionArrow}>›</span></button>
            {actionTreatment.status !== 'finalized' && <button type="button" onClick={async () => {
              try {
                const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
                const response = await fetch(`${apiUrl}/clinic-records/treatments/${actionTreatment.id}/finalize?clinic_id=${encodeURIComponent(user.clinic_id)}`, {
                  method: 'PATCH',
                  headers: { Authorization: 'Bearer ' + user.token, 'Content-Type': 'application/json' },
                  body: JSON.stringify({}),
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload.error || 'Unable to finalize the treatment record.');
                setLocalTreatments(displayedTreatments.map(item => item.id === actionTreatment.id ? { ...item, ...payload, status: 'finalized' } : item));
                setActionTreatment(null);
                setArchiveError('');
                notifySuccess(`Treatment ${actionTreatment.id} finalized successfully!`, 'The record was saved to the clinic database.');
              } catch (error) {
                setArchiveError(error.message || 'Unable to finalize the treatment record.');
              }
            }} style={{ ...modalStyles.vaccinationActionCard, border: '1px solid #cbd9e8', background: '#f2fbf8' }}>
              <span style={{ ...modalStyles.vaccinationActionCardIcon, background: '#e5edf6', color: '#294563' }}><span style={{ width: 23, height: 23, display: 'flex' }}>{Icons.shieldCheck}</span></span><span style={modalStyles.vaccinationActionCardText}><strong style={modalStyles.vaccinationActionCardTitle}>Finalize Record</strong><small style={modalStyles.vaccinationActionCardDescription}>Confirm the treatment is complete and properly logged.</small></span><span style={modalStyles.vaccinationActionArrow}>›</span>
            </button>}
            <button type="button" onClick={() => { archiveTreatment(actionTreatment); setActionTreatment(null); }} style={{ ...modalStyles.vaccinationActionCard, border: '1px solid #ffc0c8', background: '#fff5f6' }}><span style={{ ...modalStyles.vaccinationActionCardIcon, background: '#ffdce1', color: '#c52e4a' }}><span style={{ width: 23, height: 23, display: 'flex' }}>{showArchived ? Icons.refresh : Icons.trash}</span></span><span style={modalStyles.vaccinationActionCardText}><strong style={modalStyles.vaccinationActionCardTitle}>{showArchived ? 'Restore Treatment' : 'Move to Trash'}</strong><small style={modalStyles.vaccinationActionCardDescription}>Remove this treatment record from the system.</small></span><span style={modalStyles.vaccinationActionArrow}>›</span></button>
          </div>
          <div style={modalStyles.vaccinationActionsFooter}><span style={modalStyles.vaccinationActionsNote}>ⓘ &nbsp;These actions only affect the selected treatment record ({actionTreatment.id}).</span><button type="button" style={modalStyles.vaccinationActionsCancel} onClick={() => setActionTreatment(null)}>Cancel</button></div>
        </div>
      </div>}
      {historyTreatment && <div style={modalStyles.backdrop} onClick={() => setHistoryTreatment(null)}>
        <div role="dialog" aria-modal="true" onClick={event => event.stopPropagation()} style={{ ...modalStyles.dialog, width: 520 }}>
          <button type="button" aria-label="Close treatment audit history" onClick={() => setHistoryTreatment(null)} style={modalStyles.close}>{Icons.close}</button>
          <div style={modalStyles.headerText}><h2 style={modalStyles.title}>Audit History</h2><div style={modalStyles.subtitle}>{historyTreatment.id} — {historyTreatment.diagnosis} ({historyTreatment.pet})</div></div>
          <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
            {[
              ['Created By', historyTreatment.createdBy],
              ['Date Created', formatClinicDate(historyTreatment.dateCreated)],
              ['Last Updated By', historyTreatment.lastUpdatedBy],
              ['Linked Patient', historyTreatment.linkedPatient],
            ].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 9, background: '#f8fafc' }}>
              <strong style={{ color: '#475569', fontSize: '.74rem' }}>{label}</strong>
              <span style={{ color: '#64748b', fontSize: '.74rem', textAlign: 'right', overflowWrap: 'anywhere' }}>{value || '—'}</span>
            </div>)}
            {[
              ['Record Created', historyTreatment.dateCreated, historyTreatment.createdBy],
              ['Treatment Recorded', historyTreatment.date, historyTreatment.attendingDoctor],
              ...(historyTreatment.status === 'finalized' ? [['Record Finalized', historyTreatment.dateCreated, historyTreatment.lastUpdatedBy]] : []),
            ].map(([event, date, actor]) => <div key={event} style={{ padding: '11px 13px', border: '1px solid #e2e8f0', borderRadius: 9, background: '#f8fafc' }}>
              <div style={{ color: '#334155', fontSize: '.76rem', fontWeight: 700 }}>{event} <span style={{ color: '#94a3b8', fontWeight: 400 }}> {formatClinicDate(date)}</span></div>
              <div style={{ marginTop: 4, color: '#64748b', fontSize: '.72rem' }}>{actor || '—'}</div>
            </div>)}
          </div>
          <div style={modalStyles.footer}><button type="button" style={modalStyles.cancel} onClick={() => setHistoryTreatment(null)}>Back to Actions</button></div>
        </div>
      </div>}
      {editTreatment && <div style={modalStyles.backdrop} onClick={() => setEditTreatment(null)}>
        <form role="dialog" aria-modal="true" aria-labelledby="edit-treatment-title" onClick={event => event.stopPropagation()} onSubmit={event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const updated = {
            ...editTreatment,
            diagnosis: String(form.get('diagnosis') || '').trim(),
            treatment: String(form.get('treatment') || '').trim(),
            medication: String(form.get('medication') || '').trim(),
            cost: String(form.get('cost') || '').trim(),
            lastUpdatedBy: user?.name || editTreatment.lastUpdatedBy,
            dateCreated: editTreatment.dateCreated,
          };
          setLocalTreatments(displayedTreatments.map(item => item.id === updated.id ? updated : item));
          setEditTreatment(null);
          setActionTreatment(updated);
          notifySuccess(`Treatment ${updated.id} updated.`, 'The edited values are now reflected in this clinic record.');
        }} style={{ ...modalStyles.dialog, width: 'min(520px, 100%)' }}>
          <button type="button" aria-label="Close edit treatment" onClick={() => setEditTreatment(null)} style={modalStyles.close}>{Icons.close}</button>
          <div style={modalStyles.headerText}><h2 id="edit-treatment-title" style={modalStyles.title}>Edit Treatment</h2><div style={modalStyles.subtitle}>{editTreatment.id} — {editTreatment.pet}</div></div>
          <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
            {[
              ['diagnosis', 'Diagnosis', editTreatment.diagnosis],
              ['treatment', 'Treatment', editTreatment.treatment || editTreatment.description],
              ['medication', 'Medication', editTreatment.medication],
              ['cost', 'Cost', editTreatment.cost || editTreatment.amount],
            ].map(([name, label, value]) => <label key={name} style={modalStyles.editVaccinationLabel}><span>{label}</span><input name={name} defaultValue={value || ''} style={modalStyles.editVaccinationInput} /></label>)}
          </div>
          <div style={modalStyles.footer}><button type="button" style={modalStyles.cancel} onClick={() => setEditTreatment(null)}>Cancel</button><button type="submit" style={{ ...T.primaryBtn, padding: '8px 12px', fontSize: '.7rem' }}>Save Changes</button></div>
        </form>
      </div>}
    </div>
  );
}

// ── MAIN LAYOUT ────────────────────────────────────────────────────────
export default function ClinicLayout({ user, onNavigate }) {
  const [tab, setTab]           = useState('dashboard');
  const [showBanner, setShowBanner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [treatments, setTreatments] = useState([]);

  const canView = canViewFeature(user.permissions, user.role, 'Pet Profiles');

  useEffect(() => {
    if (!user || !user.token) return;
    if (!canView) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const params = new URLSearchParams();
    if (user.clinic_id) params.set('clinic_id', user.clinic_id);
    const query = params.toString() ? `?${params.toString()}` : '';
    const headers = { Authorization: `Bearer ${user.token}` };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [clientsRes, petsRes, apptsRes, vaccRes, treatsRes] = await Promise.all([
          fetch(`${apiUrl}/clinic-records/clients${query}`, { headers }),
          fetch(`${apiUrl}/clinic-records/pets${query}`, { headers }),
          fetch(`${apiUrl}/clinic-records/appointments${query}`, { headers }),
          fetch(`${apiUrl}/clinic-records/vaccinations${query}`, { headers }),
          fetch(`${apiUrl}/clinic-records/treatments${query}`, { headers }),
        ]);

        if (!clientsRes.ok || !petsRes.ok || !apptsRes.ok || !vaccRes.ok || !treatsRes.ok) {
          throw new Error('Failed to load clinic records');
        }

        const [clientsData, petsData, apptsData, vaccData, treatsData] = await Promise.all([
          clientsRes.json(),
          petsRes.json(),
          apptsRes.json(),
          vaccRes.json(),
          treatsRes.json(),
        ]);

        setClients(clientsData || []);
        setPets(petsData || []);
        setAppointments(apptsData || []);
        setVaccinations(vaccData || []);
        setTreatments(treatsData || []);
      } catch (err) {
        console.error(err);
        setError('Unable to load clinic records.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, canView]);

  const tabContent = {
    dashboard:    <DashboardTab clients={clients} pets={pets} appointments={appointments} vaccinations={vaccinations} treatments={treatments} user={user} onViewAppointments={() => setTab('appointments')} onViewPets={() => setTab('pets')} onViewDiseaseIntelligence={() => onNavigate?.('disease')} />,
    owners:       <OwnersTab owners={clients} user={user} />,
    pets:         <PetsTab pets={pets} owners={clients} user={user} />,
    appointments: <AppointmentsTab appointments={appointments} user={user} />,
    vaccinations: <VaccinationsTab vaccinations={vaccinations} pets={pets} user={user} onNavigate={onNavigate} />,
    treatments:   <TreatmentsTab treatments={treatments} user={user} />,
    'lab-results': <LabResultsTab />,
    inpatient:     <InpatientTab />,
    plans:         <TreatmentPlansTab />,
    consultation:  <ConsultationTab />,
    inventory:     <InventoryTab />,
    
  };

  if (!canView) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f9' }}>
        <div style={{ maxWidth: 520, width: '100%', padding: 32, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Access denied</h2>
          <p style={{ marginTop: 12, color: '#64748b' }}>You do not have permission to view Clinical Records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clinic-records-shell" style={{ flex: 1, minWidth: 0, width: '100%', overflowY: 'auto', overflowX: 'hidden', background: '#f4f6f9', fontSize: '14px', color: '#111827' }}>
      <Topbar user={user} title="Local Clinic Records" subtitle="Patient records, vaccinations, treatments, consultations, and lab results" />
      <div className="clinic-records-content" style={{ padding: '20px 28px', minWidth: 0, boxSizing: 'border-box' }}>
        {showBanner && <PrivacyBanner onClose={() => setShowBanner(false)} />}
        <TabNav active={tab} setTab={setTab} />
        {loading && (
          <div style={{ padding: 24, background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0', color: '#64748b' }}>
            Loading clinic records...
          </div>
        )}
        {error && (
          <div style={{ padding: 24, background: '#fee2e2', borderRadius: 14, border: '1px solid #fecaca', color: '#b91c1c' }}>
            {error}
          </div>
        )}
        {!loading && !error && (tabContent[tab] || <ClinicSectionPlaceholder label={TABS.find(item => item.id === tab)?.label || 'Clinic Records'} />)}
      </div>
    </div>
  );
}
