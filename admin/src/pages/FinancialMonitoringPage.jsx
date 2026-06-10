import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import Topbar from '../components/Topbar';
import { Icons } from '../icons';

const TREND_DATA = [
  { month: 'Sep', revenue: 20200, expenses: 12400, profit: 7800 },
  { month: 'Oct', revenue: 21000, expenses: 12800, profit: 8200 },
  { month: 'Nov', revenue: 20600, expenses: 12200, profit: 8400 },
  { month: 'Dec', revenue: 21400, expenses: 13100, profit: 8300 },
  { month: 'Jan', revenue: 23100, expenses: 13500, profit: 9600 },
  { month: 'Feb', revenue: 26300, expenses: 14200, profit: 12100 },
];

const SERVICE_DATA = [
  { service: 'Checkups', revenue: 8200 },
  { service: 'Vaccinations', revenue: 6400 },
  { service: 'Surgeries', revenue: 13500 },
  { service: 'Dental', revenue: 4100 },
  { service: 'Emergency', revenue: 3800 },
];

const TRANSACTIONS = [
  { id: 'TXN-1245', date: '2026-04-27', service: 'Surgery - Max', amount: 450, status: 'Completed' },
  { id: 'TXN-1244', date: '2026-04-27', service: 'Vaccination - Luna', amount: 85, status: 'Completed' },
  { id: 'TXN-1243', date: '2026-04-26', service: 'Checkup - Charlie', amount: 120, status: 'Completed' },
  { id: 'TXN-1242', date: '2026-04-26', service: 'Dental - Bella', amount: 280, status: 'Completed' },
  { id: 'TXN-1241', date: '2026-04-25', service: 'Emergency - Rocky', amount: 520, status: 'Completed' },
];

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: '8px 12px', fontSize: '.75rem', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
      <div style={{ color: '#64748b', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {pesoFormatter.format(p.value)}
        </div>
      ))}
    </div>
  );
};

const ServiceTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: '8px 12px', fontSize: '.75rem', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
      <div style={{ color: '#64748b', marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 600, color: '#0f1117' }}>{pesoFormatter.format(payload[0].value)}</div>
    </div>
  );
};

export default function FinancialMonitoringPage({ user }) {
  const [period, setPeriod] = useState('Monthly');

  return (
    <div style={s.main}>
      <Topbar user={user} title="Financial Monitoring" subtitle="Track income, expenses, and revenue analytics" />
      <div style={s.page}>

        {/* STAT CARDS */}
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ ...s.statIcon, background: '#f0fdf4' }}>
                <span style={{ width: 18, height: 18, display: 'flex', color: '#16a34a' }}>{Icons.dollar}</span>
              </div>
              <div>
                <div style={s.statLabel}>Today's Income</div>
                <div style={s.statValue}>₱2,450</div>
                <div style={{ ...s.statSub, color: '#16a34a' }}>↗ +15% vs yesterday</div>
              </div>
            </div>
          </div>
          <div style={s.statCard}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ ...s.statIcon, background: '#eff6ff' }}>
                <span style={{ width: 18, height: 18, display: 'flex', color: '#1d4ed8' }}>{Icons.calendar}</span>
              </div>
              <div>
                <div style={s.statLabel}>Monthly Income</div>
                <div style={s.statValue}>₱26,300</div>
                <div style={{ ...s.statSub, color: '#16a34a' }}>↗ +19% vs last month</div>
              </div>
            </div>
          </div>
          <div style={s.statCard}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ ...s.statIcon, background: '#faf5ff' }}>
                <span style={{ width: 18, height: 18, display: 'flex', color: '#7c3aed' }}>{Icons.file}</span>
              </div>
              <div>
                <div style={s.statLabel}>Yearly Income</div>
                <div style={s.statValue}>₱142,700</div>
                <div style={{ ...s.statSub, color: '#16a34a' }}>↗ +12% vs last year</div>
              </div>
            </div>
          </div>
          <div style={s.statCard}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ ...s.statIcon, background: '#fffbeb' }}>
                <span style={{ width: 18, height: 18, display: 'flex', color: '#d97706' }}>{Icons.dollar}</span>
              </div>
              <div>
                <div style={s.statLabel}>Profit Margin</div>
                <div style={s.statValue}>63.9%</div>
                <div style={{ ...s.statSub, color: '#16a34a' }}>↗ +2.1% this month</div>
              </div>
            </div>
          </div>
        </div>

        {/* PERIOD + EXPORT */}
        <div style={s.toolbar}>
          <select style={s.select} value={period} onChange={e => setPeriod(e.target.value)}>
            {['Monthly', 'Quarterly', 'Yearly'].map(p => <option key={p}>{p}</option>)}
          </select>
          <button style={s.exportBtn}>
            <span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.file}</span>
            Export Report
          </button>
        </div>

        {/* REVENUE TREND CHART */}
        <div style={s.card}>
          <div style={s.cardTitle}>Revenue, Expenses & Profit Trend</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<TrendTooltip />} />
              <Legend
                iconType="circle" iconSize={8}
                formatter={v => <span style={{ fontSize: '.75rem', color: '#64748b' }}>{v.charAt(0).toUpperCase() + v.slice(1)}</span>}
              />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} name="revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} dot={false} name="expenses" />
              <Line type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={2} dot={false} name="profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* SERVICE TYPE CHART */}
        <div style={s.card}>
          <div style={s.cardTitle}>Revenue by Service Type</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={SERVICE_DATA} barSize={72}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="service" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ServiceTooltip />} />
              <Bar dataKey="revenue" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div style={s.card}>
          <div style={{ ...s.cardTitle, marginBottom: 16 }}>Recent Transactions</div>
          <table style={s.table}>
            <thead>
              <tr>
                {['Transaction ID', 'Date', 'Service', 'Amount', 'Status'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map((t, i) => (
                <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ ...s.td, fontFamily: 'monospace', color: '#94a3b8', fontSize: '.78rem' }}>{t.id}</td>
                  <td style={{ ...s.td, color: '#64748b' }}>{t.date}</td>
                  <td style={{ ...s.td, color: '#0f1117', fontWeight: 500 }}>{t.service}</td>
                  <td style={{ ...s.td, color: '#16a34a', fontWeight: 600 }}>{pesoFormatter.format(t.amount)}</td>
                  <td style={s.td}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '.72rem', fontWeight: 600, color: '#16a34a' }}>
                      {t.status}
                    </span>
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 },
  statCard: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 22px' },
  statIcon: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel: { fontSize: '.75rem', color: '#64748b', marginBottom: 4 },
  statValue: { fontFamily: "'Syne', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#0f1117', letterSpacing: '-.03em', lineHeight: 1.1 },
  statSub: { fontSize: '.72rem', marginTop: 5 },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '14px 20px', marginBottom: 16 },
  select: { padding: '8px 12px', border: '1px solid #e8ecf0', borderRadius: 8, fontSize: '.82rem', color: '#0f1117', background: '#f4f6f9', outline: 'none', cursor: 'pointer' },
  exportBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#0f1117', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.82rem', fontWeight: 500, cursor: 'pointer' },
  card: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 22px', marginBottom: 16 },
  cardTitle: { fontSize: '.88rem', fontWeight: 600, color: '#0f1117', letterSpacing: '-.01em', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: '.72rem', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '13px 12px', fontSize: '.82rem', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
};
