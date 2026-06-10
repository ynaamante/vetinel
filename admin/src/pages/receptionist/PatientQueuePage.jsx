import Topbar from '../../components/Topbar';
import { Icons } from '../../icons';

const QUEUE = [
  { num: 1, time: '09:00 AM', pet: 'Max',    owner: 'John Smith',    type: 'Checkup',    doctor: 'Dr. Torres', wait: '0 min',      status: 'in-consultation' },
  { num: 2, time: '10:30 AM', pet: 'Luna',   owner: 'Sarah Johnson', type: 'Vaccination', doctor: 'Dr. Torres', wait: '15 min',     status: 'waiting'         },
  { num: 3, time: '11:00 AM', pet: 'Charlie',owner: 'Mike Davis',    type: 'Surgery',    doctor: 'Dr. Chen',   wait: '45 min',     status: 'waiting'         },
  { num: 4, time: '02:00 PM', pet: 'Bella',  owner: 'Emma Wilson',   type: 'Dental',     doctor: 'Dr. Torres', wait: '2 hr 15 min',status: 'waiting'         },
];

function QueueBadge({ status }) {
  const map = {
    'in-consultation': { bg: '#eff6ff', color: '#1d4ed8' },
    waiting:           { bg: '#fef9c3', color: '#ca8a04' },
  };
  const c = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, background: c.bg, color: c.color, fontSize: '.7rem', fontWeight: 600 }}>
      {status}
    </span>
  );
}

export default function PatientQueuePage({ user }) {
  return (
    <div style={s.main}>
      <Topbar user={user} title="Patient Queue" subtitle="Monitor currently scheduled patients" />
      <div style={s.page}>

        <div style={s.pageHd}>
          <div style={s.pageTitle}>Patient Queue</div>
          <div style={s.pageSub}>Monitor currently scheduled patients and wait times</div>
        </div>

        {/* Stats */}
        <div style={s.statsGrid}>
          {[
            { label: 'Total in Queue',   value: '4', icon: Icons.users,    iconBg: '#eff6ff', iconColor: '#1d4ed8' },
            { label: 'Waiting',          value: '3', icon: Icons.clock,    iconBg: '#fffbeb', iconColor: '#d97706' },
            { label: 'In Consultation',  value: '1', icon: Icons.check,    iconBg: '#f0fdf4', iconColor: '#16a34a' },
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

        {/* Queue Table */}
        <div style={s.card}>
          <div style={s.tableTitle}>Current Queue</div>
          <table style={s.table}>
            <thead>
              <tr>{['Queue #','Scheduled Time','Pet Name','Owner','Type','Doctor','Wait Time','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {QUEUE.map((q, i) => (
                <tr key={i}>
                  <td style={{ ...s.td, fontWeight: 700, color: '#0f1117' }}>#{q.num}</td>
                  <td style={s.td}>{q.time}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{q.pet}</td>
                  <td style={s.td}>{q.owner}</td>
                  <td style={s.td}>{q.type}</td>
                  <td style={s.td}>{q.doctor}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b' }}>
                      <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.clock}</span>
                      {q.wait}
                    </div>
                  </td>
                  <td style={s.td}><QueueBadge status={q.status} /></td>
                  <td style={s.td}>
                    {q.status === 'in-consultation'
                      ? <button style={s.completeBtn}><span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.check}</span> Complete</button>
                      : <button style={s.startBtn}><span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.arrowRight}</span> Start</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Queue Statistics */}
        <div style={{ ...s.card, marginTop: 16 }}>
          <div style={s.tableTitle}>Queue Statistics</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, paddingTop: 8 }}>
            <div>
              <div style={{ fontSize: '.75rem', color: '#94a3b8', marginBottom: 6 }}>Average Wait Time</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#0f1117' }}>32 min</div>
            </div>
            <div>
              <div style={{ fontSize: '.75rem', color: '#94a3b8', marginBottom: 6 }}>Longest Wait</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#d97706' }}>2 hr 15 min</div>
            </div>
            <div>
              <div style={{ fontSize: '.75rem', color: '#94a3b8', marginBottom: 6 }}>Patients Seen Today</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#16a34a' }}>8</div>
            </div>
          </div>
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 },
  statCard: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '16px 20px' },
  card: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 24px' },
  tableTitle: { fontSize: '.9rem', fontWeight: 600, color: '#0f1117', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  td: { padding: '13px 0', fontSize: '.82rem', color: '#0f1117', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  completeBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: '.75rem', color: '#16a34a', cursor: 'pointer', fontWeight: 500 },
  startBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '.75rem', color: '#0f1117', cursor: 'pointer', fontWeight: 500 },
};