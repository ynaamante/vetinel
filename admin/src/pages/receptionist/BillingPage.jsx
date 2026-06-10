import Topbar from '../../components/Topbar';
import { Icons } from '../../icons';

const CHARGES = [
  { id: 'CHG-001', date: '2026-04-27', pet: 'Max',    owner: 'John Smith',    service: 'Checkup',    doctor: 'Dr. Torres', amount: '₱85',   status: 'pending' },
  { id: 'CHG-002', date: '2026-04-27', pet: 'Luna',   owner: 'Sarah Johnson', service: 'Vaccination', doctor: 'Dr. Torres', amount: '₱65',   status: 'pending' },
  { id: 'CHG-003', date: '2026-04-26', pet: 'Charlie',owner: 'Mike Davis',    service: 'Surgery',    doctor: 'Dr. Chen',   amount: '₱450',  status: 'pending' },
  { id: 'CHG-004', date: '2026-04-20', pet: 'Bella',  owner: 'Emma Wilson',   service: 'Dental',     doctor: 'Dr. Torres', amount: '₱280',  status: 'overdue' },
];

const PAYMENTS = [
  { id: 'PAY-101', date: '2026-04-27', pet: 'Rocky', owner: 'David Brown',  amount: '₱120', method: 'Credit Card' },
  { id: 'PAY-102', date: '2026-04-26', pet: 'Daisy', owner: 'Lisa Taylor',  amount: '₱95',  method: 'Cash'        },
  { id: 'PAY-103', date: '2026-04-26', pet: 'Cooper',owner: 'Tom Anderson', amount: '₱200', method: 'Debit Card'  },
];

function ChargeBadge({ status }) {
  const map = {
    pending: { bg: '#fef9c3', color: '#ca8a04' },
    overdue: { bg: '#fee2e2', color: '#dc2626' },
    paid:    { bg: '#dcfce7', color: '#16a34a' },
  };
  const c = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return <span style={{ padding: '3px 10px', borderRadius: 20, background: c.bg, color: c.color, fontSize: '.7rem', fontWeight: 600 }}>{status}</span>;
}

export default function BillingPage({ user }) {
  return (
    <div style={s.main}>
      <Topbar user={user} title="Billing & Payment Processing" subtitle="Process payments and generate receipts" />
      <div style={s.page}>

        <div style={s.pageHd}>
          <div style={s.pageTitle}>Billing & Payment Processing</div>
          <div style={s.pageSub}>Process payments and generate receipts</div>
        </div>

        {/* Stats */}
        <div style={s.statsGrid}>
          {[
            { label: 'Pending',        value: '₱880', icon: Icons.clock,  iconBg: '#fffbeb', iconColor: '#d97706' },
            { label: "Today's Revenue",value: '₱120', icon: Icons.dollar, iconBg: '#f0fdf4', iconColor: '#16a34a' },
            { label: 'Overdue',        value: '1',    icon: Icons.file,   iconBg: '#fef2f2', iconColor: '#dc2626' },
            { label: 'Processed Today',value: '1',    icon: Icons.check,  iconBg: '#eff6ff', iconColor: '#1d4ed8' },
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

        {/* Pending Charges */}
        <div style={{ ...s.card, marginBottom: 16 }}>
          <div style={s.tableTitle}>Pending Charges ({CHARGES.length})</div>
          <table style={s.table}>
            <thead>
              <tr>{['Charge ID','Date','Pet Name','Owner','Service','Doctor','Amount','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {CHARGES.map((c, i) => (
                <tr key={i}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{c.id}</td>
                  <td style={s.tdMuted}>{c.date}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{c.pet}</td>
                  <td style={s.td}>{c.owner}</td>
                  <td style={s.td}>{c.service}</td>
                  <td style={s.tdMuted}>{c.doctor}</td>
                  <td style={{ ...s.td, color: '#16a34a', fontWeight: 600 }}>{c.amount}</td>
                  <td style={s.td}><ChargeBadge status={c.status} /></td>
                  <td style={s.td}>
                    <button style={s.processBtn}>
                      <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.dollar}</span>
                      Process
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Payments */}
        <div style={s.card}>
          <div style={s.tableTitle}>Recent Payments</div>
          <table style={s.table}>
            <thead>
              <tr>{['Payment ID','Date','Pet Name','Owner','Amount','Method','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {PAYMENTS.map((p, i) => (
                <tr key={i}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{p.id}</td>
                  <td style={s.tdMuted}>{p.date}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{p.pet}</td>
                  <td style={s.td}>{p.owner}</td>
                  <td style={{ ...s.td, color: '#16a34a', fontWeight: 600 }}>{p.amount}</td>
                  <td style={s.tdMuted}>{p.method}</td>
                  <td style={s.td}>
                    <button style={s.receiptBtn}>
                      <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.file}</span>
                      Receipt
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
  pageHd: { marginBottom: 20 },
  pageTitle: { fontFamily: "'Syne',sans-serif", fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-.02em' },
  pageSub: { fontSize: '.78rem', color: '#64748b', marginTop: 3 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 },
  statCard: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '16px 20px' },
  card: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 24px' },
  tableTitle: { fontSize: '.9rem', fontWeight: 600, color: '#0f1117', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  td: { padding: '13px 0', fontSize: '.82rem', color: '#0f1117', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  tdMuted: { padding: '13px 0', fontSize: '.82rem', color: '#94a3b8', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  processBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '.75rem', color: '#0f1117', cursor: 'pointer' },
  receiptBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '.75rem', color: '#0f1117', cursor: 'pointer' },
};