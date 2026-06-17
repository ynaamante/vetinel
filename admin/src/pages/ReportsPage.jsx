import { useState } from 'react';
import Topbar from '../components/Topbar';
import { Icons } from '../icons';
import { canViewFeature } from '../utils/permissionUtils';
import { canExportFeature, canInteractWithFeature } from '../utils/permissionUtils';

/* ── DATA ── */
const REPORT_CARDS = [
  {
    category: 'Disease Intelligence',
    title: 'Monthly Disease Summary',
    desc: 'Comprehensive overview of disease trends and patterns',
    lastGen: 'March 1, 2026',
    size: '2.4 MB',
    status: 'fresh',   // fresh | stale | outdated
  },
  {
    category: 'Risk Analysis',
    title: 'Risk Assessment Report',
    desc: 'Community-wide risk analysis and contributing factors',
    lastGen: 'February 20, 2026',
    size: '1.8 MB',
    status: 'stale',
  },
  {
    category: 'Prevention',
    title: 'Vaccination Coverage Report',
    desc: 'Network vaccination rates and coverage gaps',
    lastGen: 'February 28, 2026',
    size: '1.2 MB',
    status: 'fresh',
  },
  {
    category: 'Surveillance',
    title: 'Outbreak Alert Summary',
    desc: 'All active and resolved outbreak alerts',
    lastGen: 'January 15, 2026',
    size: '3.1 MB',
    status: 'outdated',
  },
  {
    category: 'Network Health',
    title: 'Clinic Network Analysis',
    desc: 'Performance and participation metrics across network',
    lastGen: 'February 15, 2026',
    size: '2.7 MB',
    status: 'stale',
  },
  {
    category: 'Executive',
    title: 'Quarterly Intelligence Brief',
    desc: 'Executive summary of key trends and insights',
    lastGen: 'March 1, 2026',
    size: '4.5 MB',
    status: 'fresh',
  },
];

const REPORT_TYPES  = ['Disease Summary', 'Risk Assessment', 'Vaccination Coverage', 'Outbreak Alert', 'Clinic Network', 'Quarterly Brief'];
const DISEASE_OPTS  = ['All Diseases', 'Parvovirus', 'Kennel Cough', 'Distemper', 'Giardia', 'Leptospirosis'];
const TIME_OPTS     = ['Last 30 Days', 'Last 60 Days', 'Last 90 Days', 'Last 6 Months', 'Last Year'];
const FORMAT_OPTS   = ['PDF', 'CSV', 'Excel'];

const RECENT_REPORTS = [
  { name: 'Monthly Disease Summary - February 2026', type: 'PDF',  date: 'March 1, 2026',    size: '2.4 MB' },
  { name: 'Vaccination Coverage Report - Q1 2026',   type: 'CSV',  date: 'February 28, 2026', size: '1.2 MB' },
  { name: 'Quarterly Intelligence Brief - Q1 2026',  type: 'PDF',  date: 'March 1, 2026',    size: '4.5 MB' },
];

/* ── STATUS DOT ── */
const STATUS_COLOR = { fresh: '#16a34a', stale: '#f59e0b', outdated: '#dc2626' };

/* ── MAIN PAGE ── */
export function ReportsPage({ user }) {
  const [reportType, setReportType] = useState('Disease Summary');
  const [disease,    setDisease]    = useState('All Diseases');
  const [timeRange,  setTimeRange]  = useState('Last 30 Days');
  const [format,     setFormat]     = useState('PDF');
  const [generating, setGenerating] = useState(null);

  const canView = canViewFeature(user.permissions, user.role, 'Reports');
  const canGenerateReport = canInteractWithFeature(user.permissions, user.role, 'Reports');
  const canBuildCustomReport = canInteractWithFeature(user.permissions, user.role, 'Reports');
  const canManageReportActions = canInteractWithFeature(user.permissions, user.role, 'Reports');

  function handleGenerate(title) {
    if (!canGenerateReport) return;
    setGenerating(title);
    setTimeout(() => setGenerating(null), 1800);
  }

  if (!canView) {
    return (
      <div style={s.main}>
        <Topbar user={user} title="Reports" subtitle="Generate and manage custom reports" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Access Denied</div>
          <div style={{ fontSize: '0.95rem' }}>You don't have permission to view this feature</div>
        </div>
      </div>
    );
  }

  const previewText = `${reportType} report for ${disease} across network - ${timeRange} (${format})`;

  return (
    <div style={s.main}>
      <Topbar
        user={user}
        title="Reports"
        subtitle="Generate and manage intelligence reports"
      />
      <div style={s.page}>

        {/* REPORT CARDS GRID */}
        <div style={s.grid}>
          {REPORT_CARDS.map((r, i) => (
            <div key={i} style={s.reportCard}>
              <div style={s.reportTop}>
                <span style={s.categoryTag}>{r.category}</span>
              </div>
              <div style={s.reportTitle}>{r.title}</div>
              <div style={s.reportDesc}>{r.desc}</div>
              <div style={s.reportMeta}>
                <span style={{ ...s.statusDot, background: STATUS_COLOR[r.status] }} />
                <span style={s.metaText}>Last generated: {r.lastGen}</span>
              </div>
              <div style={s.reportSize}>Size: {r.size}</div>
              <button
                style={{
                  ...s.generateBtn,
                  opacity: !canGenerateReport ? 0.45 : generating === r.title ? 0.7 : 1,
                  cursor: canGenerateReport ? 'pointer' : 'not-allowed',
                }}
                onClick={() => handleGenerate(r.title)}
                disabled={!canGenerateReport}
              >
                <span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.file}</span>
                {generating === r.title ? 'Generating…' : 'Generate Report'}
              </button>
            </div>
          ))}
        </div>

        {/* CUSTOM REPORT BUILDER */}
        <div style={s.card}>
          <div style={s.cardTitle}>Custom Report Builder</div>
          <div style={s.cardDesc}>Create a customized report with specific parameters</div>

          <div style={s.builderRow}>
            <select
              disabled={!canBuildCustomReport}
              style={{
                ...s.select,
                background: canBuildCustomReport ? '#f4f6f9' : '#f8fafc',
                color: canBuildCustomReport ? '#0f1117' : '#94a3b8',
                cursor: canBuildCustomReport ? 'pointer' : 'not-allowed',
              }}
              value={reportType}
              onChange={e => setReportType(e.target.value)}
            >
              {REPORT_TYPES.map(r => <option key={r}>{r}</option>)}
            </select>
            <select
              disabled={!canBuildCustomReport}
              style={{
                ...s.select,
                background: canBuildCustomReport ? '#f4f6f9' : '#f8fafc',
                color: canBuildCustomReport ? '#0f1117' : '#94a3b8',
                cursor: canBuildCustomReport ? 'pointer' : 'not-allowed',
              }}
              value={disease}
              onChange={e => setDisease(e.target.value)}
            >
              {DISEASE_OPTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <select
              disabled={!canBuildCustomReport}
              style={{
                ...s.select,
                background: canBuildCustomReport ? '#f4f6f9' : '#f8fafc',
                color: canBuildCustomReport ? '#0f1117' : '#94a3b8',
                cursor: canBuildCustomReport ? 'pointer' : 'not-allowed',
              }}
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
            >
              {TIME_OPTS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select
              disabled={!canBuildCustomReport}
              style={{
                ...s.select,
                background: canBuildCustomReport ? '#f4f6f9' : '#f8fafc',
                color: canBuildCustomReport ? '#0f1117' : '#94a3b8',
                cursor: canBuildCustomReport ? 'pointer' : 'not-allowed',
              }}
              value={format}
              onChange={e => setFormat(e.target.value)}
            >
              {FORMAT_OPTS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>

          <div style={s.previewBox}>
            <div style={s.previewLabel}>Live Preview</div>
            <div style={s.previewText}>{previewText}</div>
          </div>

          <button
            style={{
              ...s.buildBtn,
              opacity: canBuildCustomReport ? 1 : 0.65,
              background: canBuildCustomReport ? '#0f1117' : '#f8fafc',
              color: canBuildCustomReport ? '#fff' : '#94a3b8',
              border: canBuildCustomReport ? 'none' : '1px solid #cbd5e1',
              cursor: canBuildCustomReport ? 'pointer' : 'not-allowed',
            }}
            disabled={!canBuildCustomReport}
          >
            Build Custom Report
          </button>
        </div>

        {/* RECENT REPORTS */}
        <div style={s.card}>
          <div style={{ ...s.cardTitle, marginBottom: 16 }}>Recent Reports</div>
          <div style={s.tableHead}>
            {['Report Name', 'Type', 'Generated Date', 'File Size', 'Actions'].map(h => (
              <div key={h} style={s.th}>{h}</div>
            ))}
          </div>
          {RECENT_REPORTS.map((r, i) => (
            <div key={i} style={{
              ...s.tableRow,
              borderBottom: i < RECENT_REPORTS.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}>
              <div style={{ ...s.td, fontWeight: 500, color: '#0f1117', fontSize: '.82rem' }}>{r.name}</div>
              <div style={s.td}>
                <span style={{
                  ...s.typeBadge,
                  background: r.type === 'PDF' ? '#0f1117' : '#3b82f6',
                }}>
                  {r.type}
                </span>
              </div>
              <div style={{ ...s.td, color: '#64748b', fontSize: '.78rem' }}>{r.date}</div>
              <div style={{ ...s.td, color: '#64748b', fontSize: '.78rem' }}>{r.size}</div>
              <div style={{ ...s.td, gap: 12 }}>
                <ActionIcon disabled={!canManageReportActions} icon="download" />
                <ActionIcon disabled={!canManageReportActions} icon="share" />
                <ActionIcon disabled={!canManageReportActions} icon="trash" color="#dc2626" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function ActionIcon({ icon, color = '#64748b', disabled = false }) {
  const ICONS = {
    download: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    share: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    ),
    trash: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
        <path d="M9 6V4h6v2"/>
      </svg>
    ),
  };
  return (
    <span
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        opacity: disabled ? 0.35 : 0.75,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {ICONS[icon]}
    </span>
  );
}

/* ── STYLES ── */
const s = {
  main: { flex: 1, overflowY: 'auto', background: '#f4f6f9' },
  page: { padding: '24px 28px' },

  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 14, marginBottom: 16,
  },
  reportCard: {
    background: '#fff', border: '1px solid #e8ecf0',
    borderRadius: 14, padding: '20px 20px',
    display: 'flex', flexDirection: 'column',
  },
  reportTop:    { marginBottom: 10 },
  categoryTag: {
    display: 'inline-block', fontSize: '.67rem', fontWeight: 600,
    color: '#64748b', background: '#f4f6f9',
    border: '1px solid #e8ecf0', borderRadius: 6,
    padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '.05em',
  },
  reportTitle: { fontSize: '.9rem', fontWeight: 600, color: '#0f1117', marginBottom: 6, letterSpacing: '-.01em' },
  reportDesc:  { fontSize: '.75rem', color: '#64748b', lineHeight: 1.5, marginBottom: 14, flex: 1 },
  reportMeta:  { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot:   { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  metaText:    { fontSize: '.72rem', color: '#64748b' },
  reportSize:  { fontSize: '.7rem', color: '#94a3b8', marginBottom: 14 },
  generateBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: '9px 0', background: '#fff',
    border: '1px solid #e8ecf0', borderRadius: 9,
    fontSize: '.8rem', fontWeight: 500, color: '#0f1117',
    cursor: 'pointer', width: '100%', transition: 'background .12s',
  },

  card: {
    background: '#fff', border: '1px solid #e8ecf0',
    borderRadius: 14, padding: '20px 22px', marginBottom: 16,
  },
  cardTitle: { fontSize: '.88rem', fontWeight: 600, color: '#0f1117', letterSpacing: '-.01em', marginBottom: 4 },
  cardDesc:  { fontSize: '.73rem', color: '#94a3b8', marginBottom: 18 },

  builderRow: { display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
  select: {
    flex: 1, minWidth: 140,
    padding: '9px 12px', border: '1px solid #e8ecf0', borderRadius: 8,
    fontSize: '.82rem', color: '#0f1117', background: '#f4f6f9',
    outline: 'none', cursor: 'pointer',
  },
  previewBox: {
    background: '#f4f6f9', border: '1px solid #e8ecf0',
    borderRadius: 8, padding: '12px 16px', marginBottom: 14,
  },
  previewLabel: { fontSize: '.7rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' },
  previewText:  { fontSize: '.82rem', color: '#64748b' },
  buildBtn: {
    width: '100%', padding: '11px 0',
    background: '#0f1117', color: '#fff',
    border: 'none', borderRadius: 9,
    fontSize: '.84rem', fontWeight: 500, cursor: 'pointer',
  },

  tableHead: {
    display: 'grid', gridTemplateColumns: '1fr 80px 160px 100px 100px',
    paddingBottom: 10, borderBottom: '1px solid #f1f5f9', gap: 12,
  },
  th: { fontSize: '.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' },
  tableRow: {
    display: 'grid', gridTemplateColumns: '1fr 80px 160px 100px 100px',
    padding: '14px 0', alignItems: 'center', gap: 12,
  },
  td: { display: 'flex', alignItems: 'center' },
  typeBadge: {
    display: 'inline-block', padding: '2px 10px',
    color: '#fff', fontSize: '.7rem', fontWeight: 700,
    borderRadius: 5, letterSpacing: '.04em',
  },
};
