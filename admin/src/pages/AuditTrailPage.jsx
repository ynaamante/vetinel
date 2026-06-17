import { useState } from 'react';
import Topbar from '../components/Topbar';
import { Icons } from '../icons';
import { canViewFeature } from '../utils/permissionUtils';

const ACTION_META = {
  'alert acknowledged': { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  update: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  'report generated': { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
  create: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  'data sync': { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  login: { color: '#64748b', bg: '#f4f6f9', border: '#e8ecf0' },
  logout: { color: '#64748b', bg: '#f4f6f9', border: '#e8ecf0' },
  delete: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  'settings changed': { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
};

const AUDIT_LOGS = [
  { id: 'AUD-1045', timestamp: '2026-04-24 14:23:15', user: 'Dr. Sarah Chen', action: 'alert acknowledged', description: 'Acknowledged Parvovirus threshold alert', entity: 'Alert #ALT-2847', ip: '192.168.1.45' },
  { id: 'AUD-1044', timestamp: '2026-04-24 13:45:32', user: 'Dr. Sarah Chen', action: 'update', description: 'Updated pet vaccination record', entity: 'Pet #PET-1023', ip: '192.168.1.45' },
  { id: 'AUD-1043', timestamp: '2026-04-24 12:18:09', user: 'Dr. Sarah Chen', action: 'report generated', description: 'Generated Monthly Disease Summary report', entity: 'Report #RPT-789', ip: '192.168.1.45' },
  { id: 'AUD-1042', timestamp: '2026-04-24 11:30:22', user: 'Dr. Sarah Chen', action: 'create', description: 'Created new appointment for Max Johnson', entity: 'Appointment #APT-445', ip: '192.168.1.45' },
  { id: 'AUD-1041', timestamp: '2026-04-24 10:52:41', user: 'Dr. Sarah Chen', action: 'data sync', description: 'Synchronized 47 records with intelligence network', entity: '—', ip: '192.168.1.45' },
  { id: 'AUD-1040', timestamp: '2026-04-24 09:15:03', user: 'Dr. Sarah Chen', action: 'login', description: 'User logged in successfully', entity: '—', ip: '192.168.1.45' },
  { id: 'AUD-1039', timestamp: '2026-04-23 18:30:44', user: 'Dr. Sarah Chen', action: 'logout', description: 'User logged out', entity: '—', ip: '192.168.1.45' },
  { id: 'AUD-1038', timestamp: '2026-04-23 17:22:18', user: 'Dr. Sarah Chen', action: 'delete', description: 'Deleted cancelled appointment', entity: 'Appointment #APT-442', ip: '192.168.1.45' },
  { id: 'AUD-1037', timestamp: '2026-04-23 16:45:09', user: 'Dr. Sarah Chen', action: 'settings changed', description: 'Updated privacy settings for data sharing', entity: '—', ip: '192.168.1.45' },
  { id: 'AUD-1036', timestamp: '2026-04-23 15:12:33', user: 'Dr. Sarah Chen', action: 'update', description: 'Updated owner contact information', entity: 'Owner #OWN-234', ip: '192.168.1.45' },
];

const ActionBadge = ({ action }) => {
  const m = ACTION_META[action] || ACTION_META.login;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: m.bg, border: `1px solid ${m.border}`,
      fontSize: '.72rem', fontWeight: 600, color: m.color,
      whiteSpace: 'nowrap',
    }}>
      {action}
    </span>
  );
};

/* ── VIEW DETAILS MODAL ── */
function DetailModal({ log, onClose }) {
  if (!log) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 100 }} />
      <div style={m.panel}>
        <div style={m.header}>
          <div>
            <div style={m.headerTitle}>Audit Log Details</div>
            <div style={m.headerSub}>{log.id}</div>
          </div>
          <button style={m.closeBtn} onClick={onClose}>
            <span style={{ width: 18, height: 18, display: 'flex', color: '#64748b' }}>{Icons.close}</span>
          </button>
        </div>
        <div style={m.divider} />
        <div style={m.body}>
          {[
            ['Audit ID', log.id],
            ['Timestamp', log.timestamp],
            ['User', log.user],
            ['IP Address', log.ip],
            ['Entity', log.entity],
            ['Description', log.description],
          ].map(([label, val]) => (
            <div key={label} style={m.row}>
              <div style={m.rowLabel}>{label}</div>
              <div style={m.rowVal}>{val}</div>
            </div>
          ))}
          <div style={m.row}>
            <div style={m.rowLabel}>Action</div>
            <div><ActionBadge action={log.action} /></div>
          </div>
        </div>
        <div style={m.divider} />
        <div style={m.footer}>
          <button style={m.secondaryBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}

export default function AuditTrailPage({ user }) {
  const [search, setSearch] = useState('');
  const [actionFilter, setAction] = useState('All Actions');
  const [userFilter, setUser] = useState('All Users');
  const [dateFilter, setDate] = useState('Last 7 Days');
  const [modal, setModal] = useState(null);

  const canView = canViewFeature(user.permissions, user.role, 'Audit Trail');

  if (!canView) {
    return (
      <div style={s.main}>
        <Topbar user={user} title="Audit Trail" subtitle="System-wide activity logs and security monitoring" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Access Denied</div>
          <div style={{ fontSize: '0.95rem' }}>You don't have permission to view this feature</div>
        </div>
      </div>
    );
  }

  const filtered = AUDIT_LOGS.filter(l => {
    const matchSearch = !search || l.description.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'All Actions' || l.action === actionFilter.toLowerCase();
    const matchUser = userFilter === 'All Users' || l.user === userFilter;
    return matchSearch && matchAction && matchUser;
  });

  return (
    <div style={s.main}>
      <Topbar user={user} title="Audit Trail" subtitle="System-wide activity logs and security monitoring" />
      <div style={s.page}>

        {/* STAT CARDS */}
        <div style={s.statsGrid}>
          {[
            { iconBg: '#eff6ff', label: 'Active Users', value: '1' },
            { iconBg: '#f0fdf4', label: 'Total Actions', value: '1,045' },
            { iconBg: '#fffbeb', label: "Today's Activity", value: '6' },
            { iconBg: '#faf5ff', label: 'Critical Actions', value: '2' },
          ].map((c, i) => (
            <div key={i} style={s.statCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ ...s.statIcon, background: c.iconBg }}>
                  <span style={{ width: 18, height: 18, display: 'flex' }}>{Icons.users}</span>
                </div>
                <div>
                  <div style={s.statLabel}>{c.label}</div>
                  <div style={s.statValue}>{c.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FILTER BAR */}
        <div style={s.filterBar}>
          <div style={s.searchWrap}>
            <span style={{ fontSize: 14, color: '#94a3b8', flexShrink: 0 }}>🔍</span>
            <input
              style={s.searchInput}
              placeholder="Search by description or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select style={s.select} value={actionFilter} onChange={e => setAction(e.target.value)}>
            {['All Actions', 'Alert Acknowledged', 'Update', 'Report Generated', 'Create', 'Data Sync', 'Login', 'Logout', 'Delete', 'Settings Changed'].map(a => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select style={s.select} value={userFilter} onChange={e => setUser(e.target.value)}>
            {['All Users', 'Dr. Sarah Chen', 'Dr. Michael Torres', 'Emily Rodriguez'].map(u => (
              <option key={u}>{u}</option>
            ))}
          </select>
          <select style={s.select} value={dateFilter} onChange={e => setDate(e.target.value)}>
            {['Last 7 Days', 'Last 30 Days', 'Last 90 Days'].map(d => <option key={d}>{d}</option>)}
          </select>
          <button style={s.exportBtn}>
            <span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.file}</span>
            Export
          </button>
        </div>

        {/* TABLE */}
        <div style={s.card}>
          <div style={{ ...s.cardTitle, marginBottom: 16 }}>Activity Log ({filtered.length} entries)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Audit ID', 'Timestamp', 'User', 'Action', 'Description', 'Entity', 'IP Address', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ ...s.td, fontFamily: 'monospace', color: '#94a3b8', fontSize: '.76rem' }}>{log.id}</td>
                    <td style={{ ...s.td, color: '#64748b', whiteSpace: 'nowrap', fontSize: '.78rem' }}>{log.timestamp}</td>
                    <td style={{ ...s.td, fontWeight: 500, color: '#0f1117', whiteSpace: 'nowrap' }}>{log.user}</td>
                    <td style={s.td}><ActionBadge action={log.action} /></td>
                    <td style={{ ...s.td, color: '#374151', maxWidth: 280 }}>{log.description}</td>
                    <td style={{ ...s.td, fontFamily: 'monospace', color: '#64748b', fontSize: '.76rem', whiteSpace: 'nowrap' }}>{log.entity}</td>
                    <td style={{ ...s.td, fontFamily: 'monospace', color: '#94a3b8', fontSize: '.76rem', whiteSpace: 'nowrap' }}>{log.ip}</td>
                    <td style={s.td}>
                      <button
                        style={s.detailsBtn}
                        onClick={() => setModal(log)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '.84rem' }}>
              No logs match your filters.
            </div>
          )}
        </div>

      </div>

      <DetailModal log={modal} onClose={() => setModal(null)} />
    </div>
  );
}

const s = {
  main: { flex: 1, overflowY: 'auto', background: '#f4f6f9' },
  page: { padding: '24px 28px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 },
  statCard: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 22px' },
  statIcon: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel: { fontSize: '.75rem', color: '#64748b', marginBottom: 4 },
  statValue: { fontFamily: "'Syne', sans-serif", fontSize: '1.9rem', fontWeight: 700, color: '#0f1117', letterSpacing: '-.03em' },
  filterBar: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '14px 20px', marginBottom: 16, flexWrap: 'wrap' },
  searchWrap: { flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: '#f4f6f9', border: '1px solid #e8ecf0', borderRadius: 8, padding: '8px 12px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '.82rem', color: '#0f1117', width: '100%' },
  select: { padding: '8px 10px', border: '1px solid #e8ecf0', borderRadius: 8, fontSize: '.8rem', color: '#0f1117', background: '#f4f6f9', outline: 'none', cursor: 'pointer' },
  exportBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#0f1117', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.82rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' },
  card: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 22px' },
  cardTitle: { fontSize: '.88rem', fontWeight: 600, color: '#0f1117' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: '.72rem', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' },
  td: { padding: '12px 12px', fontSize: '.8rem', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  detailsBtn: { padding: '6px 12px', background: '#fff', border: '1px solid #e8ecf0', borderRadius: 7, fontSize: '.76rem', fontWeight: 500, color: '#0f1117', cursor: 'pointer', whiteSpace: 'nowrap' },
};

const m = {
  panel: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 16, width: 480, maxWidth: '90vw', zIndex: 101, boxShadow: '0 20px 60px rgba(0,0,0,.15)' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 22px 16px' },
  headerTitle: { fontSize: '.95rem', fontWeight: 600, color: '#0f1117' },
  headerSub: { fontSize: '.73rem', color: '#94a3b8', marginTop: 3, fontFamily: 'monospace' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' },
  divider: { height: 1, background: '#f1f5f9' },
  body: { padding: '20px 22px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #f8fafc', gap: 16 },
  rowLabel: { fontSize: '.78rem', fontWeight: 500, color: '#64748b', flexShrink: 0, width: 110 },
  rowVal: { fontSize: '.82rem', color: '#0f1117', textAlign: 'right', wordBreak: 'break-word' },
  footer: { display: 'flex', gap: 10, padding: '16px 22px 20px', justifyContent: 'flex-end' },
  secondaryBtn: { padding: '9px 20px', background: '#fff', color: '#0f1117', border: '1px solid #e8ecf0', borderRadius: 9, fontSize: '.84rem', fontWeight: 500, cursor: 'pointer' },
};
