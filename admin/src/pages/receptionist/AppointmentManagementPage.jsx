import { useState } from 'react';
import Topbar from '../../components/Topbar';
import { Icons } from '../../icons';

const TODAY_APPTS = [
  { time: '09:00 AM', pet: 'Max',    owner: 'John Smith',    type: 'Checkup',    status: 'confirmed' },
  { time: '10:30 AM', pet: 'Luna',   owner: 'Sarah Johnson', type: 'Vaccination', status: 'confirmed' },
  { time: '11:00 AM', pet: 'Charlie',owner: 'Mike Davis',    type: 'Surgery',    status: 'pending'   },
  { time: '02:00 PM', pet: 'Bella',  owner: 'Emma Wilson',   type: 'Dental',     status: 'confirmed' },
  { time: '03:30 PM', pet: 'Rocky',  owner: 'David Brown',   type: 'Checkup',    status: 'confirmed' },
];

const UPCOMING_APPTS = [
  { date: '2026-04-28', time: '09:00 AM', pet: 'Daisy',  owner: 'Lisa Taylor',   type: 'Follow-up',   status: 'confirmed' },
  { date: '2026-04-28', time: '10:00 AM', pet: 'Cooper', owner: 'Tom Anderson',  type: 'Vaccination', status: 'pending'   },
  { date: '2026-04-29', time: '02:30 PM', pet: 'Milo',   owner: 'Jessica Lee',   type: 'Checkup',     status: 'confirmed' },
];

const CANCELLED_APPTS = [
  { date: '2026-04-26', time: '01:00 PM', pet: 'Oscar', owner: 'Mark Wilson',  type: 'Checkup', notes: 'Owner called to cancel' },
  { date: '2026-04-25', time: '03:00 PM', pet: 'Zoe',   owner: 'Rachel Green', type: 'Dental',  notes: 'Rescheduled'           },
];

function StatusBadge({ status }) {
  const map = {
    confirmed: { bg: '#dcfce7', color: '#16a34a' },
    pending:   { bg: '#fef9c3', color: '#ca8a04' },
  };
  const c = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, background: c.bg, color: c.color, fontSize: '.7rem', fontWeight: 600 }}>
      {status}
    </span>
  );
}

export default function AppointmentManagementPage({ user }) {
  const [tab,    setTab]    = useState('today');
  const [search, setSearch] = useState('');

  const tabs = [
    { id: 'today',    label: "Today's Appointments" },
    { id: 'upcoming', label: 'Upcoming'             },
    { id: 'cancelled',label: 'Cancelled'            },
  ];

  return (
    <div style={s.main}>
      <Topbar user={user} title="Appointment Management" subtitle="Manage bookings, cancellations, and follow-ups" />
      <div style={s.page}>

        {/* Header */}
        <div style={s.pageHd}>
          <div>
            <div style={s.pageTitle}>Appointment Management</div>
            <div style={s.pageSub}>Manage today's bookings, upcoming appointments, and cancellations</div>
          </div>
          <button style={s.primaryBtn}>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
            New Appointment
          </button>
        </div>

        {/* Stat Cards */}
        <div style={s.statsGrid}>
          {[
            { label: "Today's Total", value: '5', icon: Icons.calendar, iconBg: '#eff6ff', iconColor: '#1d4ed8' },
            { label: 'Confirmed',     value: '4', icon: Icons.check,    iconBg: '#f0fdf4', iconColor: '#16a34a' },
            { label: 'Pending',       value: '1', icon: Icons.clock,    iconBg: '#fffbeb', iconColor: '#d97706' },
            { label: 'Upcoming',      value: '3', icon: Icons.calendarPlus, iconBg: '#f5f3ff', iconColor: '#7c3aed' },
          ].map(c => (
            <div key={c.label} style={s.statCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 17, height: 17, display: 'flex', color: c.iconColor }}>{c.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: '.7rem', color: '#64748b', fontWeight: 500 }}>{c.label}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.2 }}>{c.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>{Icons.search}</span>
          <input style={s.search} placeholder="Search by pet name or owner..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Tab Bar */}
        <div style={s.tabBar}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...s.tabBtn, ...(tab === t.id ? s.tabActive : {}) }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={s.card}>
          {tab === 'today' && (
            <>
              <div style={s.tableTitle}>Today's Appointments ({TODAY_APPTS.length})</div>
              <table style={s.table}>
                <thead>
                  <tr>{['Time','Pet Name','Owner','Type','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {TODAY_APPTS.filter(a => a.pet.toLowerCase().includes(search.toLowerCase()) || a.owner.toLowerCase().includes(search.toLowerCase())).map((a, i) => (
                    <tr key={i}>
                      <td style={{ ...s.td, fontWeight: 600 }}>{a.time}</td>
                      <td style={s.td}>{a.pet}</td>
                      <td style={s.td}>{a.owner}</td>
                      <td style={s.td}>{a.type}</td>
                      <td style={s.td}><StatusBadge status={a.status} /></td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button style={s.actionBtn}>
                            <span style={{ width: 13, height: 13, display: 'flex', color: '#16a34a' }}>{Icons.check}</span>
                            {a.status === 'pending' ? 'Confirm' : 'Complete'}
                          </button>
                          <button style={{ ...s.iconBtn, color: '#dc2626' }}>
                            <span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.xCircle}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'upcoming' && (
            <>
              <div style={s.tableTitle}>Upcoming Appointments ({UPCOMING_APPTS.length})</div>
              <table style={s.table}>
                <thead>
                  <tr>{['Date','Time','Pet Name','Owner','Type','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {UPCOMING_APPTS.map((a, i) => (
                    <tr key={i}>
                      <td style={s.tdMuted}>{a.date}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{a.time}</td>
                      <td style={s.td}>{a.pet}</td>
                      <td style={s.td}>{a.owner}</td>
                      <td style={s.td}>{a.type}</td>
                      <td style={s.td}><StatusBadge status={a.status} /></td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={s.iconBtn}><span style={{ width: 14, height: 14, display: 'flex', color: '#64748b' }}>{Icons.edit}</span></button>
                          <button style={s.iconBtn}><span style={{ width: 14, height: 14, display: 'flex', color: '#dc2626' }}>{Icons.trash}</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'cancelled' && (
            <>
              <div style={s.tableTitle}>Cancelled Appointments ({CANCELLED_APPTS.length})</div>
              <table style={s.table}>
                <thead>
                  <tr>{['Date','Time','Pet Name','Owner','Type','Notes'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {CANCELLED_APPTS.map((a, i) => (
                    <tr key={i}>
                      <td style={s.tdMuted}>{a.date}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{a.time}</td>
                      <td style={s.td}>{a.pet}</td>
                      <td style={s.td}>{a.owner}</td>
                      <td style={s.td}>{a.type}</td>
                      <td style={s.tdMuted}>{a.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  main: { flex: 1, overflowY: 'auto', background: '#f4f6f9' },
  page: { padding: '24px 28px' },
  pageHd: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  pageTitle: { fontFamily: "'Syne',sans-serif", fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-.02em' },
  pageSub: { fontSize: '.78rem', color: '#64748b', marginTop: 3 },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#0f1117', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.82rem', fontWeight: 500, cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 },
  statCard: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '16px 20px' },
  searchWrap: { position: 'relative', marginBottom: 16 },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#94a3b8', display: 'flex' },
  search: { width: '100%', padding: '10px 14px 10px 36px', border: '1px solid #e8ecf0', borderRadius: 8, fontSize: '.82rem', background: '#fff', outline: 'none' },
  tabBar: { display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 16, gap: 2 },
  tabBtn: { flex: 1, padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: '.82rem', color: '#64748b', background: 'transparent', cursor: 'pointer', fontWeight: 400 },
  tabActive: { background: '#fff', color: '#0f1117', fontWeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  card: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 24px' },
  tableTitle: { fontSize: '.9rem', fontWeight: 600, color: '#0f1117', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  td: { padding: '13px 0', fontSize: '.82rem', color: '#0f1117', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  tdMuted: { padding: '13px 0', fontSize: '.82rem', color: '#94a3b8', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '.75rem', color: '#0f1117', cursor: 'pointer' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 },
};