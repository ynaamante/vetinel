import { useState } from 'react';
import Topbar from '../../components/Topbar';
import { Icons } from '../../icons';

const CLIENTS = [
  { id: 'CLT-001', name: 'John Smith',    email: 'john.smith@email.com', phone: '(555) 123-4567', pets: 1, lastVisit: '2026-04-27', status: 'active' },
  { id: 'CLT-002', name: 'Sarah Johnson', email: 'sarah.j@email.com',    phone: '(555) 234-5678', pets: 2, lastVisit: '2026-04-27', status: 'active' },
  { id: 'CLT-003', name: 'Mike Davis',    email: 'mike.davis@email.com', phone: '(555) 345-6789', pets: 1, lastVisit: '2026-04-26', status: 'active' },
  { id: 'CLT-004', name: 'Emma Wilson',   email: 'emma.w@email.com',     phone: '(555) 456-7890', pets: 3, lastVisit: '2026-04-20', status: 'active' },
  { id: 'CLT-005', name: 'David Brown',   email: 'd.brown@email.com',    phone: '(555) 567-8901', pets: 1, lastVisit: '2026-04-27', status: 'active' },
  { id: 'CLT-006', name: 'Lisa Taylor',   email: 'lisa.taylor@email.com',phone: '(555) 678-9012', pets: 2, lastVisit: '2026-04-26', status: 'active' },
  { id: 'CLT-007', name: 'Tom Anderson',  email: 'tom.a@email.com',      phone: '(555) 789-0123', pets: 1, lastVisit: '2026-04-26', status: 'active' },
  { id: 'CLT-008', name: 'Jessica Lee',   email: 'jess.lee@email.com',   phone: '(555) 890-1234', pets: 1, lastVisit: '2026-04-23', status: 'active' },
  { id: 'CLT-009', name: 'Mark Wilson',   email: 'mark.wilson@email.com',phone: '(555) 901-2345', pets: 2, lastVisit: '2026-04-15', status: 'active' },
  { id: 'CLT-010', name: 'Rachel Green',  email: 'r.green@email.com',    phone: '(555) 012-3456', pets: 1, lastVisit: '2026-04-10', status: 'active' },
];

export default function ClientManagementPage({ user }) {
  const [search, setSearch] = useState('');
  const filtered = CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div style={s.main}>
      <Topbar user={user} title="Client Management" subtitle="View and manage pet owner information" />
      <div style={s.page}>

        {/* Stats */}
        <div style={s.statsGrid}>
          {[
            { label: 'Total Clients',  value: '10', icon: Icons.users,    iconBg: '#eff6ff', iconColor: '#1d4ed8' },
            { label: 'Active',         value: '9',  icon: Icons.activity, iconBg: '#f0fdf4', iconColor: '#16a34a' },
            { label: 'Total Pets',     value: '15', icon: Icons.pet,      iconBg: '#f5f3ff', iconColor: '#7c3aed' },
            { label: 'New This Month', value: '0',  icon: Icons.users,    iconBg: '#fffbeb', iconColor: '#d97706' },
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

        {/* Table */}
        <div style={s.card}>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>{Icons.search}</span>
            <input style={s.search} placeholder="Search by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={s.tableTitle}>All Clients ({filtered.length})</div>
          <table style={s.table}>
            <thead>
              <tr>{['Client ID','Name','Email','Phone','Pets','Last Visit','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{c.id}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{c.name}</td>
                  <td style={s.tdMuted}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 12, height: 12, display: 'flex', color: '#94a3b8' }}>{Icons.mail}</span>
                      {c.email}
                    </div>
                  </td>
                  <td style={s.tdMuted}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 12, height: 12, display: 'flex', color: '#94a3b8' }}>{Icons.phone}</span>
                      {c.phone}
                    </div>
                  </td>
                  <td style={s.td}>{c.pets}</td>
                  <td style={s.tdMuted}>{c.lastVisit}</td>
                  <td style={s.td}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: '#dcfce7', color: '#16a34a', fontSize: '.7rem', fontWeight: 600 }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button style={s.viewBtn}>
                      <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.eye}</span>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  card: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 24px' },
  searchWrap: { position: 'relative', marginBottom: 20 },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#94a3b8', display: 'flex' },
  search: { width: '100%', padding: '10px 14px 10px 36px', border: '1px solid #e8ecf0', borderRadius: 8, fontSize: '.82rem', background: '#f4f6f9', outline: 'none' },
  tableTitle: { fontSize: '.9rem', fontWeight: 600, color: '#0f1117', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  td: { padding: '13px 0', fontSize: '.82rem', color: '#0f1117', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  tdMuted: { padding: '13px 0', fontSize: '.82rem', color: '#94a3b8', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  viewBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '.75rem', color: '#0f1117', cursor: 'pointer' },
};