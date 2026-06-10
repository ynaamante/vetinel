import { useState } from 'react';
import Topbar from '../../components/Topbar';
import { Icons } from '../../icons';

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

const VACCINATIONS = [
  { id: 'VAC-001', pet: 'Max',     type: 'Rabies',    dateGiven: 'Dec 1, 2025',  nextDue: 'Dec 1, 2026',  nextDueColor: '#16a34a', status: 'up-to-date', by: 'Dr. Smith'   },
  { id: 'VAC-002', pet: 'Luna',    type: 'Distemper', dateGiven: 'Oct 15, 2025', nextDue: 'Feb 15, 2026', nextDueColor: '#dc2626', status: 'overdue',    by: 'Dr. Johnson' },
  { id: 'VAC-003', pet: 'Charlie', type: 'Rabies',    dateGiven: 'Jun 10, 2025', nextDue: 'Mar 10, 2026', nextDueColor: '#d97706', status: 'due-soon',   by: 'Dr. Smith'   },
];

const TREATMENTS = [
  { id: 'TRT-001', date: 'March 1, 2026',   dateColor: '#94a3b8', pet: 'Max',     diagnosis: 'Routine Checkup', treatment: 'General examination',  medication: 'None',        cost: '$50.00'  },
  { id: 'TRT-002', date: 'Feb 28, 2026',    dateColor: '#94a3b8', pet: 'Luna',    diagnosis: 'Parvovirus',      treatment: 'IV fluids, antibiotics', medication: 'Amoxicillin', cost: '$350.00' },
  { id: 'TRT-003', date: 'Jan 15, 2026',    dateColor: '#94a3b8', pet: 'Charlie', diagnosis: 'Kennel Cough',    treatment: 'Rest and medication',   medication: 'Doxycycline', cost: '$125.00' },
];

// ── STATUS BADGES ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    confirmed:   { bg: '#1d4ed8', color: '#fff',     label: 'confirmed'   },
    pending:     { bg: '#f59e0b', color: '#fff',     label: 'pending'     },
    'up-to-date':{ bg: '#16a34a', color: '#fff',     label: 'Up to Date'  },
    'high-risk': { bg: '#dc2626', color: '#fff',     label: 'High Risk'   },
    moderate:    { bg: '#f59e0b', color: '#fff',     label: 'Moderate'    },
    overdue:     { bg: '#dc2626', color: '#fff',     label: 'Overdue'     },
    'due-soon':  { bg: '#f59e0b', color: '#fff',     label: 'Due Soon'    },
  };
  const c = map[status] || { bg: '#e2e8f0', color: '#64748b', label: status };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20,
      background: c.bg, color: c.color,
      fontSize: '.7rem', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  );
}

// ── ACTION BUTTONS ─────────────────────────────────────────────────────
function ActionBtns() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button style={{ ...ab.btn, color: '#64748b' }}>
        <span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.edit}</span>
      </button>
      <button style={{ ...ab.btn, color: '#dc2626' }}>
        <span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.trash}</span>
      </button>
    </div>
  );
}
const ab = {
  btn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' },
};

// ── SHARED TABLE STYLES ────────────────────────────────────────────────
const T = {
  wrap:    { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 24px' },
  hd:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title:   { fontSize: '.95rem', fontWeight: 600, color: '#0f1117' },
  actions: { display: 'flex', gap: 10 },
  search:  {
    width: '100%', padding: '9px 14px 9px 36px',
    border: '1px solid #e8ecf0', borderRadius: 8,
    fontSize: '.82rem', color: '#0f1117',
    background: '#f4f6f9', outline: 'none', marginBottom: 20,
  },
  searchWrap: { position: 'relative', marginBottom: 20 },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#94a3b8', display: 'flex' },
  table:   { width: '100%', borderCollapse: 'collapse' },
  th:      { textAlign: 'left', fontSize: '.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  td:      { padding: '13px 0', fontSize: '.82rem', color: '#0f1117', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  tdMuted: { padding: '13px 0', fontSize: '.82rem', color: '#94a3b8', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  secondaryBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', border: '1px solid #e8ecf0',
    borderRadius: 8, fontSize: '.78rem', color: '#64748b',
    background: '#fff', cursor: 'pointer',
  },
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', border: 'none',
    borderRadius: 8, fontSize: '.78rem', color: '#fff',
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
];

function TabNav({ active, setTab }) {
  return (
    <div style={{
      display: 'flex', gap: 4,
      background: '#fff', border: '1px solid #e8ecf0',
      borderRadius: 10, padding: 4, marginBottom: 20,
      width: 'fit-content',
    }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 7, border: 'none',
            fontSize: '.8rem', fontWeight: active === t.id ? 500 : 400,
            background: active === t.id ? '#0f1117' : 'transparent',
            color: active === t.id ? '#fff' : '#64748b',
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

// ── DASHBOARD TAB ──────────────────────────────────────────────────────
function DashboardTab() {
  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: "Today's Appointments", value: '12',  sub: '3 pending, 9 confirmed',  iconBg: '#eff6ff', iconColor: '#1d4ed8', icon: Icons.calendar },
          { label: 'Total Pets',           value: '247', sub: '185 dogs, 62 cats',        iconBg: '#f5f3ff', iconColor: '#7c3aed', icon: Icons.pet      },
          { label: 'Registered Owners',    value: '189', sub: '+7 this month',            iconBg: '#f0fdf4', iconColor: '#16a34a', icon: Icons.users    },
          { label: 'Pending Vaccinations', value: '34',  sub: 'Overdue: 12',             iconBg: '#fffbeb', iconColor: '#d97706', icon: Icons.syringe, valueColor: '#d97706', alert: true },
        ].map(c => (
          <div key={c.label} style={{
            background: '#fff',
            border: c.alert ? '1.5px solid #fde68a' : '1px solid #e8ecf0',
            borderTop: c.alert ? '3px solid #d97706' : undefined,
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ fontSize: '.7rem', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>{c.label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '2rem', fontWeight: 600, letterSpacing: '-.03em', color: c.valueColor || '#0f1117' }}>{c.value}</div>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 16, height: 16, display: 'flex', color: c.iconColor }}>{c.icon}</span>
              </div>
            </div>
            <div style={{ fontSize: '.7rem', color: c.alert ? '#d97706' : '#64748b', marginTop: 8 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Pet Health Monitoring */}
      <div style={{ ...T.wrap, marginBottom: 20 }}>
        <div style={{ fontSize: '.9rem', fontWeight: 600, color: '#0f1117', marginBottom: 18 }}>Pet Health Monitoring</div>
        {[
          { label: 'Up to Date',    color: '#16a34a', pct: 65, text: '65% (161 pets)' },
          { label: 'Moderate Risk', color: '#f59e0b', pct: 25, text: '25% (62 pets)'  },
          { label: 'High Risk',     color: '#dc2626', pct: 10, text: '10% (24 pets)'  },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: 110, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
              <span style={{ fontSize: '.78rem', color: '#0f1117' }}>{r.label}</span>
            </div>
            <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ width: r.pct + '%', height: '100%', background: r.color, borderRadius: 10 }} />
            </div>
            <span style={{ fontSize: '.72rem', color: '#64748b', minWidth: 90, textAlign: 'right' }}>{r.text}</span>
          </div>
        ))}
      </div>

      {/* Today's Appointments */}
      <div style={T.wrap}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={T.title}>Today's Appointments</div>
          <button style={T.secondaryBtn}>View All</button>
        </div>
        {APPOINTMENTS.map(a => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 10, marginBottom: 8,
            border: '1px solid #f1f5f9', background: '#fafbfc',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 14, height: 14, display: 'flex', color: '#1d4ed8' }}>{Icons.calendar}</span>
              </div>
              <div>
                <div style={{ fontSize: '.84rem', fontWeight: 500, color: '#0f1117' }}>{a.pet} - {a.owner}</div>
                <div style={{ fontSize: '.72rem', color: '#94a3b8', marginTop: 1 }}>{a.type}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: '.8rem', color: '#64748b' }}>{a.datetime.split(' ').slice(-2).join(' ')}</div>
              <StatusBadge status={a.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── OWNERS TAB ─────────────────────────────────────────────────────────
function OwnersTab() {
  const [search, setSearch] = useState('');
  const filtered = OWNERS.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={T.wrap}>
      <div style={T.hd}>
        <div style={T.title}>Owners Management</div>
        <div style={T.actions}>
          <button style={T.secondaryBtn}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.archive}</span>
            Show Archived (0)
          </button>
          <button style={T.secondaryBtn}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.file}</span>
            Export PDF
          </button>
          <button style={T.primaryBtn}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
            Add New Owner
          </button>
        </div>
      </div>
      <div style={T.searchWrap}>
        <span style={T.searchIcon}>{Icons.search}</span>
        <input style={T.search} placeholder="Search owners..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <table style={T.table}>
        <thead>
          <tr>
            {['Owner ID','Name','Contact Number','Email','Address','Pets','Actions'].map(h => (
              <th key={h} style={T.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(o => (
            <tr key={o.id}>
              <td style={{ ...T.td, fontWeight: 600 }}>{o.id}</td>
              <td style={T.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ width: 12, height: 12, display: 'flex', color: '#1d4ed8' }}>{Icons.users}</span>
                  </div>
                  {o.name}
                </div>
              </td>
              <td style={T.tdMuted}>{o.phone}</td>
              <td style={T.tdMuted}>{o.email}</td>
              <td style={T.tdMuted}>{o.address}</td>
              <td style={T.td}>
                <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontSize: '.72rem', color: '#64748b' }}>{o.pets} pets</span>
              </td>
              <td style={T.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button style={{ fontSize: '.75rem', color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>View Details</button>
                  <ActionBtns />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── PETS TAB ───────────────────────────────────────────────────────────
function PetsTab() {
  const [search, setSearch] = useState('');
  const filtered = PETS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={T.wrap}>
      <div style={T.hd}>
        <div style={T.title}>Pets Management</div>
        <div style={T.actions}>
          <button style={T.secondaryBtn}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.archive}</span>
            Show Archived (0)
          </button>
          <button style={T.secondaryBtn}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.file}</span>
            Export PDF
          </button>
          <button style={T.primaryBtn}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
            Add New Pet
          </button>
        </div>
      </div>
      <div style={T.searchWrap}>
        <span style={T.searchIcon}>{Icons.search}</span>
        <input style={T.search} placeholder="Search pets..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <table style={T.table}>
        <thead>
          <tr>
            {['Pet ID','Name','Species','Breed','Owner','Age','Last Visit','Health Status','Actions'].map(h => (
              <th key={h} style={T.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id}>
              <td style={{ ...T.td, fontWeight: 600 }}>{p.id}</td>
              <td style={T.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 14, height: 14, display: 'flex', color: '#7c3aed' }}>{Icons.pet}</span>
                  {p.name}
                </div>
              </td>
              <td style={T.td}>{p.species}</td>
              <td style={T.tdMuted}>{p.breed}</td>
              <td style={T.td}>{p.owner}</td>
              <td style={T.tdMuted}>{p.age}</td>
              <td style={T.tdMuted}>{p.lastVisit}</td>
              <td style={T.td}><StatusBadge status={p.status} /></td>
              <td style={T.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button style={{ fontSize: '.75rem', color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>View Details</button>
                  <ActionBtns />
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
function AppointmentsTab() {
  const [search, setSearch] = useState('');
  const filtered = APPOINTMENTS.filter(a =>
    a.pet.toLowerCase().includes(search.toLowerCase()) ||
    a.owner.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={T.wrap}>
      <div style={T.hd}>
        <div style={T.title}>Appointments Management</div>
        <button style={T.primaryBtn}>
          <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
          New Appointment
        </button>
      </div>
      <div style={T.searchWrap}>
        <span style={T.searchIcon}>{Icons.search}</span>
        <input style={T.search} placeholder="Search appointments..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <table style={T.table}>
        <thead>
          <tr>
            {['Appt ID','Date & Time','Pet','Owner','Type','Status','Notes','Actions'].map(h => (
              <th key={h} style={T.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(a => (
            <tr key={a.id}>
              <td style={{ ...T.td, fontWeight: 600 }}>{a.id}</td>
              <td style={T.tdMuted}>{a.datetime}</td>
              <td style={T.td}>{a.pet}</td>
              <td style={T.td}>{a.owner}</td>
              <td style={T.td}>{a.type}</td>
              <td style={T.td}><StatusBadge status={a.status} /></td>
              <td style={T.tdMuted}>{a.notes}</td>
              <td style={T.td}><ActionBtns /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── VACCINATIONS TAB ───────────────────────────────────────────────────
function VaccinationsTab() {
  const [search, setSearch] = useState('');
  const filtered = VACCINATIONS.filter(v => v.pet.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={T.wrap}>
      <div style={T.hd}>
        <div style={T.title}>Vaccinations Management</div>
        <div style={T.actions}>
          <button style={T.secondaryBtn}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.file}</span>
            Export PDF
          </button>
          <button style={T.primaryBtn}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
            Add Vaccination
          </button>
        </div>
      </div>
      <div style={T.searchWrap}>
        <span style={T.searchIcon}>{Icons.search}</span>
        <input style={T.search} placeholder="Search vaccinations..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <table style={T.table}>
        <thead>
          <tr>
            {['Vacc ID','Pet','Type','Date Given','Next Due','Status','Administered By','Actions'].map(h => (
              <th key={h} style={T.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(v => (
            <tr key={v.id}>
              <td style={{ ...T.td, fontWeight: 600 }}>{v.id}</td>
              <td style={T.td}>{v.pet}</td>
              <td style={T.td}>{v.type}</td>
              <td style={T.tdMuted}>{v.dateGiven}</td>
              <td style={{ ...T.td, color: v.nextDueColor, fontWeight: 500 }}>{v.nextDue}</td>
              <td style={T.td}><StatusBadge status={v.status} /></td>
              <td style={T.tdMuted}>{v.by}</td>
              <td style={T.td}><ActionBtns /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── TREATMENTS TAB ─────────────────────────────────────────────────────
function TreatmentsTab() {
  const [search, setSearch] = useState('');
  const filtered = TREATMENTS.filter(t => t.pet.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={T.wrap}>
      <div style={T.hd}>
        <div style={T.title}>Treatments Management</div>
        <div style={T.actions}>
          <button style={T.secondaryBtn}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.file}</span>
            Export PDF
          </button>
          <button style={T.primaryBtn}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
            Add Treatment
          </button>
        </div>
      </div>
      <div style={T.searchWrap}>
        <span style={T.searchIcon}>{Icons.search}</span>
        <input style={T.search} placeholder="Search treatments..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <table style={T.table}>
        <thead>
          <tr>
            {['Treatment ID','Date','Pet','Diagnosis','Treatment','Medication','Cost','Actions'].map(h => (
              <th key={h} style={T.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(t => (
            <tr key={t.id}>
              <td style={{ ...T.td, fontWeight: 600 }}>{t.id}</td>
              <td style={T.tdMuted}>{t.date}</td>
              <td style={T.td}>{t.pet}</td>
              <td style={T.td}>{t.diagnosis}</td>
              <td style={T.tdMuted}>{t.treatment}</td>
              <td style={T.tdMuted}>{t.medication}</td>
              <td style={{ ...T.td, fontWeight: 600 }}>{t.cost}</td>
              <td style={T.td}><ActionBtns /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── MAIN LAYOUT ────────────────────────────────────────────────────────
export default function ClinicLayout({ user }) {
  const [tab, setTab]           = useState('dashboard');
  const [showBanner, setShowBanner] = useState(true);

  const tabContent = {
    dashboard:    <DashboardTab />,
    owners:       <OwnersTab />,
    pets:         <PetsTab />,
    appointments: <AppointmentsTab />,
    vaccinations: <VaccinationsTab />,
    treatments:   <TreatmentsTab />,
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#f4f6f9' }}>
      <Topbar user={user} title="Local Clinic Records" subtitle="Disease Intelligence Platform" />
      <div style={{ padding: '20px 28px' }}>
        {showBanner && <PrivacyBanner onClose={() => setShowBanner(false)} />}
        <TabNav active={tab} setTab={setTab} />
        {tabContent[tab]}
      </div>
    </div>
  );
}