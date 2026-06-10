import { useState } from 'react';
import Topbar from '../../components/Topbar';
import { Icons } from '../../icons';

const REMINDERS = [
  { id: 'REM-001', pet: 'Max',    owner: 'John Smith',    email: 'john.smith@email.com',  phone: '(555) 123-4567', type: 'vaccination', desc: 'Rabies Booster',        due: '2026-04-25', status: 'overdue'  },
  { id: 'REM-002', pet: 'Bella',  owner: 'Emma Wilson',   email: 'emma.w@email.com',      phone: '(555) 456-7890', type: 'followup',    desc: 'Post-Dental Checkup',   due: '2026-04-28', status: 'due-soon' },
  { id: 'REM-003', pet: 'Charlie',owner: 'Mike Davis',    email: 'mike.davis@email.com',  phone: '(555) 345-6789', type: 'followup',    desc: 'Surgery Follow-up',     due: '2026-04-29', status: 'due-soon' },
  { id: 'REM-004', pet: 'Luna',   owner: 'Sarah Johnson', email: 'sarah.j@email.com',     phone: '(555) 234-5678', type: 'vaccination', desc: 'DHPP Vaccine',          due: '2026-04-30', status: 'due-soon' },
  { id: 'REM-005', pet: 'Rocky',  owner: 'David Brown',   email: 'd.brown@email.com',     phone: '(555) 567-8901', type: 'checkup',     desc: 'Annual Wellness Exam',  due: '2026-05-05', status: 'upcoming' },
  { id: 'REM-006', pet: 'Daisy',  owner: 'Lisa Taylor',   email: 'lisa.taylor@email.com', phone: '(555) 678-9012', type: 'vaccination', desc: 'Bordetella Vaccine',    due: '2026-05-10', status: 'upcoming' },
  { id: 'REM-007', pet: 'Cooper', owner: 'Tom Anderson',  email: 'tom.a@email.com',       phone: '(555) 789-0123', type: 'vaccination', desc: 'Leptospirosis Vaccine', due: '2026-05-12', status: 'upcoming' },
  { id: 'REM-008', pet: 'Milo',   owner: 'Jessica Lee',   email: 'jess.lee@email.com',    phone: '(555) 890-1234', type: 'checkup',     desc: '6-Month Checkup',       due: '2026-05-15', status: 'upcoming' },
];

const TYPE_COLORS = {
  vaccination: { bg: '#f5f3ff', color: '#7c3aed' },
  followup:    { bg: '#dcfce7', color: '#16a34a' },
  checkup:     { bg: '#eff6ff', color: '#1d4ed8' },
};

const STATUS_COLORS = {
  overdue:  { bg: '#fee2e2', color: '#dc2626' },
  'due-soon':{ bg: '#fef9c3', color: '#ca8a04' },
  upcoming: { bg: '#eff6ff', color: '#1d4ed8' },
};

function TypeBadge({ type }) {
  const c = TYPE_COLORS[type] || { bg: '#f1f5f9', color: '#64748b' };
  return <span style={{ padding: '3px 10px', borderRadius: 20, background: c.bg, color: c.color, fontSize: '.7rem', fontWeight: 600 }}>{type}</span>;
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#64748b' };
  return <span style={{ padding: '3px 10px', borderRadius: 20, background: c.bg, color: c.color, fontSize: '.7rem', fontWeight: 600 }}>{status}</span>;
}

export default function RemindersPage({ user }) {
  const [tab, setTab] = useState('all');

  const filtered = tab === 'all' ? REMINDERS : REMINDERS.filter(r => r.status === tab);
  const tabs = [
    { id: 'all',      label: 'All Reminders' },
    { id: 'overdue',  label: 'Overdue'       },
    { id: 'due-soon', label: 'Due Soon'      },
    { id: 'upcoming', label: 'Upcoming'      },
  ];

  return (
    <div style={s.main}>
      <Topbar user={user} title="Due Dates & Reminders" subtitle="Vaccination reminders and follow-up schedules" />
      <div style={s.page}>

        {/* Stats */}
        <div style={s.statsGrid}>
          {[
            { label: 'Overdue',  value: '1', icon: Icons.shield,   iconBg: '#fef2f2', iconColor: '#dc2626' },
            { label: 'Due Soon', value: '3', icon: Icons.calendar, iconBg: '#fffbeb', iconColor: '#d97706' },
            { label: 'Upcoming', value: '4', icon: Icons.file,     iconBg: '#eff6ff', iconColor: '#1d4ed8' },
            { label: 'Total',    value: '8', icon: Icons.check,    iconBg: '#f0fdf4', iconColor: '#16a34a' },
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

        {/* Tab Bar */}
        <div style={s.tabBar}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...s.tabBtn, ...(tab === t.id ? s.tabActive : {}) }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={s.card}>
          <div style={s.tableTitle}>All Reminders ({filtered.length})</div>
          <table style={s.table}>
            <thead>
              <tr>{['ID','Pet Name','Owner','Contact','Type','Description','Due Date','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{r.id}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{r.pet}</td>
                  <td style={s.td}>{r.owner}</td>
                  <td style={s.tdMuted}>
                    <div style={{ fontSize: '.75rem' }}>{r.email}</div>
                    <div style={{ fontSize: '.72rem', marginTop: 2 }}>{r.phone}</div>
                  </td>
                  <td style={s.td}><TypeBadge type={r.type} /></td>
                  <td style={s.td}>{r.desc}</td>
                  <td style={s.tdMuted}>{r.due}</td>
                  <td style={s.td}><StatusBadge status={r.status} /></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={s.emailBtn}>
                        <span style={{ width: 12, height: 12, display: 'flex' }}>{Icons.mail}</span>
                        Email
                      </button>
                      <button style={s.smsBtn}>
                        <span style={{ width: 12, height: 12, display: 'flex' }}>{Icons.bell}</span>
                        SMS
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div style={{ ...s.card, marginTop: 16 }}>
          <div style={s.tableTitle}>Quick Actions</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={s.quickBtn}>
              <span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.mail}</span>
              Send All Overdue Reminders
            </button>
            <button style={s.quickBtn}>
              <span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.bell}</span>
              Send All Due Soon Reminders
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const s = {
  main: { flex: 1, overflowY: 'auto', background: '#f4f6f9' },
  page: { padding: '24px 28px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 },
  statCard: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '16px 20px' },
  tabBar: { display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 16, gap: 2 },
  tabBtn: { flex: 1, padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: '.82rem', color: '#64748b', background: 'transparent', cursor: 'pointer' },
  tabActive: { background: '#fff', color: '#0f1117', fontWeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  card: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 24px' },
  tableTitle: { fontSize: '.9rem', fontWeight: 600, color: '#0f1117', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  td: { padding: '13px 0', fontSize: '.82rem', color: '#0f1117', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  tdMuted: { padding: '13px 0', fontSize: '.72rem', color: '#94a3b8', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  emailBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '.72rem', color: '#0f1117', cursor: 'pointer' },
  smsBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '.72rem', color: '#0f1117', cursor: 'pointer' },
  quickBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, fontSize: '.82rem', color: '#0f1117', cursor: 'pointer' },
};