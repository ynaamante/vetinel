import { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import Topbar from '../components/Topbar';
import { Icons } from '../icons';

/* ── DATA ── */
const VACC_TREND = [
  { month: 'Sep', rate: 80 },
  { month: 'Oct', rate: 78 },
  { month: 'Nov', rate: 72 },
  { month: 'Dec', rate: 69 },
  { month: 'Jan', rate: 66 },
  { month: 'Feb', rate: 63 },
];

const SPREAD_COEFF = [
  { month: 'Sep', value: 2.0 },
  { month: 'Oct', value: 2.3 },
  { month: 'Nov', value: 2.6 },
  { month: 'Dec', value: 2.9 },
  { month: 'Jan', value: 3.1 },
  { month: 'Feb', value: 3.5 },
];

const AVG_RISK = [
  { month: 'Sep', score: 32 },
  { month: 'Oct', score: 35 },
  { month: 'Nov', score: 40 },
  { month: 'Dec', score: 44 },
  { month: 'Jan', score: 48 },
  { month: 'Feb', score: 51 },
];

const MONTHLY_REPORTS = [
  {
    month: 'February',
    items: [
      { label: 'New Cases Reported',         value: '234',  change: '+28%',  up: true  },
      { label: 'Vaccination Rate',            value: '63%',  change: '−5%',   up: false },
      { label: 'High Risk Cases Resolved',    value: '89',   change: '+12%',  up: true  },
      { label: 'Avg Days to Resolution',      value: '4.2',  change: '−0.8',  up: true  },
    ],
  },
  {
    month: 'January',
    items: [
      { label: 'New Cases Reported',         value: '189',  change: '+14%',  up: true  },
      { label: 'Vaccination Rate',            value: '66%',  change: '−3%',   up: false },
      { label: 'High Risk Cases Resolved',    value: '74',   change: '+6%',   up: true  },
      { label: 'Avg Days to Resolution',      value: '5.0',  change: '+0.4',  up: false },
    ],
  },
];

const INSIGHTS = [
  {
    title: 'Declining Vaccination Rates',
    desc: 'Vaccination coverage has dropped 15% over 6 months, correlating with rising disease spread.',
    action: 'Coordinate community vaccination drives across all clinics.',
    color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fca5a5',
    icon: 'activity',
  },
  {
    title: 'Rising Disease Transmission',
    desc: 'Spread coefficient increased 66.7%, indicating higher transmission across the network.',
    action: 'Increase surveillance frequency and alert connected clinics.',
    color: '#d97706', bgColor: '#fffbeb', borderColor: '#fde68a',
    icon: 'activity',
  },
  {
    title: 'Community Risk Escalating',
    desc: 'Average risk score rose 59% community-wide — early intervention window is narrowing.',
    action: 'Prioritize high-risk case follow-ups across all clinics.',
    color: '#f97316', bgColor: '#fff7ed', borderColor: '#fed7aa',
    icon: 'shield',
  },
];

/* ── TOOLTIP ── */
const ChartTooltip = ({ active, payload, label, suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tt.box}>
      <div style={tt.label}>{label}</div>
      <div style={tt.val}>{payload[0].value}{suffix}</div>
    </div>
  );
};

/* ── MAIN PAGE ── */
export function CommunityAnalyticsPage({ user }) {
  const [openMonth, setOpenMonth] = useState('February');

  return (
    <div style={s.main}>
      <Topbar
        user={user}
        title="Community Analytics"
        subtitle="Population-level health trends and insights"
      />
      <div style={s.page}>

        {/* TOP STATS */}
        <div style={s.statsRow}>
          <StatCard
            label="Vaccination Coverage"
            value="63%"
            change="−15% decrease"
            changeUp={false}
          />
          <StatCard
            label="Disease Spread Rate"
            value="3.5"
            change="+66.7% increase"
            changeUp={false}
          />
          <StatCard
            label="Average Risk Score"
            value="51"
            change="+59% increase"
            changeUp={false}
          />
        </div>

        {/* VACCINATION COVERAGE TREND */}
        <div style={s.card}>
          <div style={s.cardHd}>
            <div>
              <div style={s.cardTitle}>Vaccination Coverage Trend</div>
              <div style={s.cardDesc}>
                Monitors the percentage of vaccinated animals over time, with the herd immunity threshold highlighted to assess community protection.
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={VACC_TREND}>
              <defs>
                <linearGradient id="vaccGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip suffix="%" />} />
              <ReferenceLine
                y={70} stroke="#fca5a5" strokeDasharray="5 4"
                label={{ value: 'Herd Immunity Threshold', position: 'insideTopRight', fontSize: 10, fill: '#dc2626' }}
              />
              <Area
                type="monotone" dataKey="rate"
                stroke="#3b82f6" strokeWidth={2}
                fill="url(#vaccGrad)"
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div style={s.warningBanner}>
            <span style={{ width: 14, height: 14, display: 'flex', color: '#d97706', flexShrink: 0 }}>{Icons.activity}</span>
            <span style={{ fontSize: '.78rem', color: '#92400e' }}>
              <strong>Dropped below herd immunity threshold</strong> — November 2025
            </span>
          </div>
        </div>

        {/* DISEASE SPREAD COEFFICIENT */}
        <div style={s.card}>
          <div style={s.cardHd}>
            <div>
              <div style={s.cardTitle}>Disease Spread Coefficient</div>
              <div style={s.cardDesc}>
                Tracks the rate at which diseases spread across the network, where values above 2.0 indicate elevated transmission risk.
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={SPREAD_COEFF}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine
                y={2} stroke="#4ade80" strokeDasharray="5 4"
                label={{ value: 'Safe below 2.0', position: 'insideTopLeft', fontSize: 10, fill: '#16a34a' }}
              />
              <Line
                type="monotone" dataKey="value"
                stroke="#f59e0b" strokeWidth={2.5}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={s.currentBadge}>
            Current: <strong>3.5</strong>
            <span style={{ width: 14, height: 14, display: 'flex', color: '#dc2626', marginLeft: 4 }}>{Icons.activity}</span>
          </div>
        </div>

        {/* AVERAGE RISK SCORE TREND */}
        <div style={s.card}>
          <div style={s.cardHd}>
            <div>
              <div style={s.cardTitle}>Average Risk Score Trend</div>
              <div style={s.cardDesc}>
                Displays the community-wide average risk score over time, showing whether overall health conditions are improving or deteriorating.
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={AVG_RISK}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone" dataKey="score"
                stroke="#dc2626" strokeWidth={2}
                dot={{ r: 4, fill: '#dc2626', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* KEY INSIGHTS */}
        <div style={s.insightsRow}>
          {INSIGHTS.map((ins, i) => (
            <div key={i} style={{
              ...s.insightCard,
              borderTop: `3px solid ${ins.color}`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: ins.bgColor, border: `1px solid ${ins.borderColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12, flexShrink: 0,
              }}>
                <span style={{ width: 16, height: 16, display: 'flex', color: ins.color }}>
                  {Icons[ins.icon]}
                </span>
              </div>
              <div style={s.insightTitle}>{ins.title}</div>
              <div style={s.insightDesc}>{ins.desc}</div>
              <div style={s.insightActionLabel}>Recommended Action:</div>
              <div style={s.insightAction}>{ins.action}</div>
            </div>
          ))}
        </div>

        {/* MONTHLY REPORTS ACCORDION */}
        {MONTHLY_REPORTS.map(report => (
          <div key={report.month} style={s.accordion}>
            <div style={s.accordionHd} onClick={() => setOpenMonth(openMonth === report.month ? null : report.month)}>
              <span style={s.accordionTitle}>{report.month}</span>
              <span style={{
                width: 16, height: 16, display: 'flex', color: '#94a3b8',
                transform: openMonth === report.month ? 'rotate(180deg)' : 'none',
                transition: 'transform .2s',
              }}>
                {Icons.arrowRight /* repurposed as chevron */}
              </span>
            </div>
            {openMonth === report.month && (
              <div style={s.accordionBody}>
                <div style={s.metricsGrid}>
                  {report.items.map((item, i) => (
                    <div key={i} style={s.metricItem}>
                      <div style={s.metricLabel}>{item.label}</div>
                      <div style={s.metricVal}>{item.value}</div>
                      <div style={{
                        ...s.metricChange,
                        color: item.up ? '#16a34a' : '#dc2626',
                      }}>
                        {item.up ? '↑' : '↓'} {item.change}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}

/* ── STAT CARD ── */
function StatCard({ label, value, change, changeUp }) {
  return (
    <div style={s.statCard}>
      <div style={s.statLabel}>{label}</div>
      <div style={{ ...s.statVal, color: changeUp ? '#0f1117' : '#dc2626' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
        <span style={{ fontSize: '.72rem', color: changeUp ? '#16a34a' : '#dc2626' }}>
          {changeUp ? '↑' : '↓'} {change}
        </span>
      </div>
    </div>
  );
}

/* ── STYLES ── */
const s = {
  main: { flex: 1, overflowY: 'auto', background: '#f4f6f9' },
  page: { padding: '24px 28px' },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 },
  statCard: {
    background: '#fff', border: '1px solid #e8ecf0',
    borderRadius: 14, padding: '20px 22px',
  },
  statLabel: { fontSize: '.78rem', color: '#64748b', marginBottom: 10 },
  statVal:   { fontFamily: "'Syne', sans-serif", fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-.03em' },

  card: {
    background: '#fff', border: '1px solid #e8ecf0',
    borderRadius: 14, padding: '20px 22px', marginBottom: 16,
  },
  cardHd: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 16, gap: 12,
  },
  cardTitle: { fontSize: '.88rem', fontWeight: 600, color: '#0f1117', letterSpacing: '-.01em' },
  cardDesc:  { fontSize: '.7rem', color: '#94a3b8', marginTop: 3, lineHeight: 1.5 },

  warningBanner: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: 8, padding: '10px 14px', marginTop: 14,
  },

  currentBadge: {
    textAlign: 'center', marginTop: 8,
    fontSize: '.88rem', color: '#dc2626', fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  insightsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 },
  insightCard: {
    background: '#fff', border: '1px solid #e8ecf0',
    borderRadius: 14, padding: '18px 18px',
  },
  insightTitle:       { fontSize: '.85rem', fontWeight: 600, color: '#0f1117', marginBottom: 8 },
  insightDesc:        { fontSize: '.77rem', color: '#64748b', lineHeight: 1.55, marginBottom: 14 },
  insightActionLabel: { fontSize: '.72rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 },
  insightAction:      { fontSize: '.77rem', color: '#64748b', lineHeight: 1.5 },

  accordion: {
    background: '#fff', border: '1px solid #e8ecf0',
    borderRadius: 14, marginBottom: 10, overflow: 'hidden',
  },
  accordionHd: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', cursor: 'pointer',
  },
  accordionTitle: { fontSize: '.86rem', fontWeight: 500, color: '#0f1117' },
  accordionBody:  { padding: '4px 20px 20px', borderTop: '1px solid #f1f5f9' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 16 },
  metricItem:  {},
  metricLabel: { fontSize: '.72rem', color: '#94a3b8', marginBottom: 6 },
  metricVal:   { fontFamily: "'Syne', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: '#0f1117', letterSpacing: '-.02em' },
  metricChange:{ fontSize: '.72rem', marginTop: 4 },
};

const tt = {
  box: {
    background: '#fff', border: '1px solid #e8ecf0',
    borderRadius: 8, padding: '8px 12px',
    fontSize: '.75rem', boxShadow: '0 2px 8px rgba(0,0,0,.08)',
  },
  label: { color: '#64748b', marginBottom: 3 },
  val:   { fontWeight: 600, color: '#0f1117' },
};
