import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import Topbar from '../components/Topbar';
import { Icons } from '../icons';
import { canViewFeature } from '../utils/permissionUtils';

/* ── DATA ── */
const DISEASE_OPTIONS  = ['All Diseases', 'Parvovirus', 'Kennel Cough', 'Distemper', 'Giardia'];
const CLINIC_OPTIONS   = ['All Clinics', 'City Pet Clinic', 'Happy Tails Vet', 'Paws & Care', 'Pet Haven', 'Animal Clinic'];
const TIME_OPTIONS     = ['Last 30 Days', 'Last 60 Days', 'Last 90 Days'];

const SCORE_DIST = [
  { label: 'Very Low',  value: 82,  color: '#16a34a' },
  { label: 'Low',       value: 142, color: '#4ade80' },
  { label: 'Moderate',  value: 128, color: '#f59e0b' },
  { label: 'High',      value: 37,  color: '#f97316' },
  { label: 'Critical',  value: 16,  color: '#dc2626' },
];

const CLINIC_RISK = [
  { name: 'City Pet',      low: 48, moderate: 32, high: 26 },
  { name: 'Happy Tails',   low: 52, moderate: 28, high: 20 },
  { name: 'Paws & Care',   low: 50, moderate: 28, high: 22 },
  { name: 'CLI-001',       low: 54, moderate: 18, high: 12 },
  { name: 'Pet Haven',     low: 58, moderate: 20, high: 10 },
  { name: 'Animal Clinic', low: 62, moderate: 14, high: 6  },
];

const RISK_FACTORS = [
  { label: 'Unvaccinated',       value: 234 },
  { label: 'Age < 1 year',       value: 148 },
  { label: 'Recent Exposure',    value: 120 },
  { label: 'Comorbidities',      value: 87  },
  { label: 'Immune Compromised', value: 63  },
];

const HIGH_RISK_CASES = [
  {
    id: 'CASE-2847', disease: 'Parvovirus', score: 85,
    factors: ['Unvaccinated', 'Age < 1yr', 'Recent Exposure'],
    clinic: 'City Pet Clinic', updated: 'March 3, 2026',
  },
  {
    id: 'CASE-2831', disease: 'Distemper', score: 78,
    factors: ['Unvaccinated', 'Comorbidities'],
    clinic: 'Happy Tails Vet', updated: 'March 2, 2026',
  },
  {
    id: 'CASE-2819', disease: 'Parvovirus', score: 72,
    factors: ['Age < 1yr', 'Immune Compromised'],
    clinic: 'Paws & Care', updated: 'March 2, 2026',
  },
];

/* ── TOOLTIPS ── */
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tt.box}>
      <div style={tt.label}>{label || payload[0].name}</div>
      <div style={tt.val}>{payload[0].value} cases</div>
    </div>
  );
};

const StackedTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tt.box}>
      <div style={{ ...tt.label, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill }} />
          <span style={{ fontSize: '.73rem', color: '#64748b' }}>{p.name}:</span>
          <span style={{ fontSize: '.73rem', fontWeight: 600, color: '#0f1117' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── SCORE BADGE ── */
function ScoreBadge({ score }) {
  const bg = score >= 80 ? '#dc2626' : score >= 70 ? '#f97316' : '#f59e0b';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: bg, color: '#fff',
      fontSize: '.72rem', fontWeight: 700,
      borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap',
    }}>
      {score}/100
    </span>
  );
}

/* ── FACTOR TAG ── */
function FactorTag({ label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: '#f4f6f9', border: '1px solid #e8ecf0',
      borderRadius: 6, padding: '2px 8px',
      fontSize: '.7rem', color: '#64748b', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

/* ── MAIN PAGE ── */
export function RiskMonitoringPage({ user }) {
  const [disease,   setDisease]   = useState('All Diseases');
  const [clinic,    setClinic]    = useState('All Clinics');
  const [timeRange, setTimeRange] = useState('Last 30 Days');

  const canView = canViewFeature(user.permissions, user.role, 'Risk Monitoring');

  if (!canView) {
    return (
      <div style={s.main}>
        <Topbar user={user} title="Risk Monitoring" subtitle="Track and analyze risk levels across the network" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Access Denied</div>
          <div style={{ fontSize: '0.95rem' }}>You don't have permission to view this feature</div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.main}>
      <Topbar
        user={user}
        title="Risk Monitoring"
        subtitle="Track and analyze risk levels across the network"
      />
      <div style={s.page}>

        {/* STAT CARDS */}
        <div style={s.statsRow}>
          <StatCard label="Total Cases"    value="405" sub="All risk levels"    color="#0f1117" />
          <StatCard label="High Risk"      value="53"  sub="13.1% of total"     color="#dc2626" />
          <StatCard label="Moderate Risk"  value="128" sub="31.6% of total"     color="#f59e0b" />
          <StatCard label="Low Risk"       value="224" sub="55.3% of total"     color="#16a34a" />
        </div>

        {/* FILTER BAR */}
        <div style={s.filterBar}>
          <div style={s.filters}>
            <select style={s.select} value={disease}   onChange={e => setDisease(e.target.value)}>
              {DISEASE_OPTIONS.map(d => <option key={d}>{d}</option>)}
            </select>
            <select style={s.select} value={clinic}    onChange={e => setClinic(e.target.value)}>
              {CLINIC_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select style={s.select} value={timeRange} onChange={e => setTimeRange(e.target.value)}>
              {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* RISK SCORE DISTRIBUTION */}
        <div style={s.card}>
          <div style={s.cardHd}>
            <div>
              <div style={s.cardTitle}>Risk Score Distribution</div>
              <div style={s.cardDesc}>
                Displays how risk scores are distributed across all cases to identify concentration in critical ranges.
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SCORE_DIST} barSize={60}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0,0,0,.03)' }} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {SCORE_DIST.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RISK LEVELS BY CLINIC */}
        <div style={s.card}>
          <div style={s.cardHd}>
            <div>
              <div style={s.cardTitle}>Risk Levels by Clinic</div>
              <div style={s.cardDesc}>
                Shows the breakdown of low, moderate, and high-risk cases at each participating clinic.
              </div>
            </div>
          </div>
          {/* Highest risk banner */}
          <div style={s.infoBanner}>
            <span style={{ width: 14, height: 14, display: 'flex', color: '#d97706', flexShrink: 0 }}>{Icons.activity}</span>
            <span style={{ fontSize: '.8rem', color: '#92400e' }}>
              <strong>Highest Risk Clinic:</strong> City Pet (+18% increase this month)
            </span>
          </div>
          <div style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CLINIC_RISK} layout="vertical" barSize={18} barCategoryGap={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={78} />
                <Tooltip content={<StackedTooltip />} cursor={{ fill: 'rgba(0,0,0,.03)' }} />
                <Legend
                  iconType="square" iconSize={8}
                  wrapperStyle={{ fontSize: '.75rem', paddingTop: 8 }}
                />
                <Bar dataKey="low"      name="Low"      stackId="a" fill="#4ade80" radius={[0, 0, 0, 0]} />
                <Bar dataKey="moderate" name="Moderate" stackId="a" fill="#f59e0b" />
                <Bar dataKey="high"     name="High"     stackId="a" fill="#dc2626" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CONTRIBUTING RISK FACTORS */}
        <div style={s.card}>
          <div style={s.cardHd}>
            <div>
              <div style={s.cardTitle}>Contributing Risk Factors</div>
              <div style={s.cardDesc}>
                Identifies the most common factors contributing to high-risk cases, helping to prioritize preventive measures.
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={RISK_FACTORS} layout="vertical" barSize={20} barCategoryGap={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0,0,0,.03)' }} />
              <Bar dataKey="value" radius={[0, 5, 5, 0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* HIGH RISK CASES TABLE */}
        <div style={s.card}>
          <div style={{ ...s.cardTitle, marginBottom: 16 }}>High Risk Cases (Anonymized)</div>
          <div style={s.table}>
            <div style={s.thead}>
              {['Case ID', 'Disease', 'Risk Score', 'Risk Factors', 'Clinic', 'Last Updated', 'Actions'].map(h => (
                <div key={h} style={s.th}>{h}</div>
              ))}
            </div>
            {HIGH_RISK_CASES.map((c, i) => (
              <div key={i} style={{ ...s.trow, borderBottom: i < HIGH_RISK_CASES.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={s.td}><span style={s.caseId}>{c.id}</span></div>
                <div style={s.td}><span style={s.tdText}>{c.disease}</span></div>
                <div style={s.td}><ScoreBadge score={c.score} /></div>
                <div style={{ ...s.td, gap: 4, flexWrap: 'wrap' }}>
                  {c.factors.map(f => <FactorTag key={f} label={f} />)}
                </div>
                <div style={s.td}><span style={s.tdText}>{c.clinic}</span></div>
                <div style={s.td}><span style={s.tdMuted}>{c.updated}</span></div>
                <div style={s.td}>
                  <button style={s.followBtn}>Flag for Follow-up</button>
                </div>
              </div>
            ))}
          </div>
          {/* Privacy note */}
          <div style={s.privacyNote}>
            <span style={{ width: 14, height: 14, display: 'flex', color: '#3b82f6', flexShrink: 0 }}>{Icons.activity}</span>
            <span style={{ fontSize: '.72rem', color: '#64748b' }}>
              All data shown is anonymized and aggregated. No individual patient or owner identifiers are displayed or transmitted.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── STAT CARD ── */
function StatCard({ label, value, sub, color }) {
  return (
    <div style={s.statCard}>
      <div style={s.statLabel}>{label}</div>
      <div style={{ ...s.statVal, color }}>{value}</div>
      <div style={s.statSub}>{sub}</div>
    </div>
  );
}

/* ── STYLES ── */
const s = {
  main: { flex: 1, overflowY: 'auto', background: '#f4f6f9' },
  page: { padding: '24px 28px' },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 },
  statCard: {
    background: '#fff', border: '1px solid #e8ecf0',
    borderRadius: 14, padding: '20px 22px',
  },
  statLabel: { fontSize: '.78rem', color: '#64748b', marginBottom: 10 },
  statVal:   { fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 700, letterSpacing: '-.03em' },
  statSub:   { fontSize: '.72rem', color: '#94a3b8', marginTop: 4 },

  filterBar: {
    display: 'flex', alignItems: 'center',
    background: '#fff', border: '1px solid #e8ecf0',
    borderRadius: 14, padding: '14px 20px', marginBottom: 16,
  },
  filters: { display: 'flex', gap: 10 },
  select: {
    padding: '8px 12px', border: '1px solid #e8ecf0', borderRadius: 8,
    fontSize: '.82rem', color: '#0f1117', background: '#f4f6f9',
    outline: 'none', cursor: 'pointer',
  },

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

  infoBanner: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: 8, padding: '10px 14px',
  },

  table: { width: '100%' },
  thead: {
    display: 'grid',
    gridTemplateColumns: '120px 110px 100px 1fr 140px 130px 150px',
    padding: '0 0 10px', borderBottom: '1px solid #f1f5f9',
    gap: 8,
  },
  th: { fontSize: '.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' },
  trow: {
    display: 'grid',
    gridTemplateColumns: '120px 110px 100px 1fr 140px 130px 150px',
    padding: '14px 0', alignItems: 'center', gap: 8,
  },
  td:      { display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  caseId:  { fontSize: '.8rem', fontWeight: 500, color: '#0f1117', fontFamily: 'monospace' },
  tdText:  { fontSize: '.8rem', color: '#0f1117' },
  tdMuted: { fontSize: '.78rem', color: '#94a3b8' },
  followBtn: {
    padding: '6px 12px', background: '#fff',
    border: '1px solid #e8ecf0', borderRadius: 7,
    fontSize: '.75rem', fontWeight: 500, color: '#0f1117',
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'background .12s',
  },

  privacyNote: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    marginTop: 18, padding: '12px 14px',
    background: '#f0f9ff', border: '1px solid #bae6fd',
    borderRadius: 8,
  },
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
