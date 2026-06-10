import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Topbar from '../components/Topbar';
import { Icons } from '../icons';

const APPT_TREND = [
  { month: 'January', appointments: 242 },
  { month: 'February', appointments: 278 },
  { month: 'March', appointments: 312 },
  { month: 'April', appointments: 295 },
];

const REVENUE_DATA = [
  { month: 'Jan', revenue: 18500 },
  { month: 'Feb', revenue: 21200 },
  { month: 'Mar', revenue: 25800 },
  { month: 'Apr', revenue: 19800 },
];

const RECENT_ACTIVITY = [
  { name: 'Dr. Michael Torres', action: 'Completed consultation', time: '10 mins ago' },
  { name: 'Emily Rodriguez', action: 'Scheduled new appointment', time: '25 mins ago' },
  { name: 'Dr. Sarah Chen', action: 'Updated vaccination record', time: '1 hour ago' },
  { name: 'Dr. Michael Torres', action: 'Generated monthly report', time: '2 hours ago' },
];

const StatCard = ({ icon, iconBg, label, value, sub, subColor }) => (
  <div style={s.statCard}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ ...s.statIcon, background: iconBg }}>
        <span style={{ width: 18, height: 18, display: 'flex' }}>{icon}</span>
      </div>
      <div>
        <div style={s.statLabel}>{label}</div>
        <div style={s.statValue}>{value}</div>
        {sub && <div style={{ ...s.statSub, color: subColor || '#16a34a' }}>{sub}</div>}
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: '8px 12px', fontSize: '.75rem', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
      <div style={{ color: '#64748b', marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 600, color: '#1d4ed8' }}>{payload[0].name} : {payload[0].value}</div>
    </div>
  );
};

const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, padding: '8px 12px', fontSize: '.75rem', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
      <div style={{ color: '#64748b', marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 600, color: '#0f1117' }}>${payload[0].value.toLocaleString()}</div>
    </div>
  );
};

export default function ClinicOverviewPage({ user }) {
  return (
    <div style={s.main}>
      <Topbar user={user} title="Clinic Overview" subtitle="Comprehensive clinic performance and activity dashboard" />
      <div style={s.page}>

        {/* STAT CARDS */}
        <div style={s.statsGrid}>
          <StatCard
            iconBg="#eff6ff" icon={Icons.users}
            label="Total Patients" value="1,247"
            sub="↗ +12% this month" subColor="#16a34a"
          />
          <StatCard
            iconBg="#f0fdf4" icon={Icons.calendar}
            label="Appointments" value="298"
            sub="↘ -5% vs last month" subColor="#dc2626"
          />
          <StatCard
            iconBg="#faf5ff" icon={Icons.users}
            label="Active Users" value="4"
            sub="2 Doctors, 2 Staff" subColor="#64748b"
          />
          <StatCard
            iconBg="#fffbeb" icon={Icons.bell}
            label="Pending Vaccinations" value="43"
            sub="Due within 7 days" subColor="#d97706"
          />
        </div>

        {/* CHARTS ROW */}
        <div style={s.chartsRow}>
          {/* Appointment Trend */}
          <div style={{ ...s.card, flex: 1 }}>
            <div style={s.cardTitle}>Appointment Trend</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={APPT_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="appointments" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Overview */}
          <div style={{ ...s.card, flex: 1 }}>
            <div style={s.cardTitle}>Revenue Overview</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={REVENUE_DATA} barSize={52}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<RevenueTooltip />} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div style={s.chartsRow}>
          {/* Today's Overview */}
          <div style={{ ...s.card, flex: 1 }}>
            <div style={{ ...s.cardTitle, marginBottom: 16 }}>Today's Overview</div>
            <div style={s.todayItem}>
              <div style={s.todayLeft}>
                <div style={{ ...s.todayIcon, background: '#eff6ff' }}>
                  <span style={{ width: 16, height: 16, display: 'flex', color: '#1d4ed8' }}>{Icons.calendar}</span>
                </div>
                <div>
                  <div style={s.todayLabel}>Today's Appointments</div>
                  <div style={s.todayVal}>12</div>
                </div>
              </div>
              <button style={s.todayBtn}>View Schedule</button>
            </div>
            <div style={s.todayItem}>
              <div style={s.todayLeft}>
                <div style={{ ...s.todayIcon, background: '#f0fdf4' }}>
                  <span style={{ width: 16, height: 16, display: 'flex', color: '#16a34a' }}>{Icons.dollar}</span>
                </div>
                <div>
                  <div style={s.todayLabel}>Today's Revenue</div>
                  <div style={s.todayVal}>$2,450</div>
                </div>
              </div>
              <button style={s.todayBtn}>View Details</button>
            </div>
            <div style={{ ...s.todayItem, borderBottom: 'none' }}>
              <div style={s.todayLeft}>
                <div style={{ ...s.todayIcon, background: '#faf5ff' }}>
                  <span style={{ width: 16, height: 16, display: 'flex', color: '#7c3aed' }}>{Icons.users}</span>
                </div>
                <div>
                  <div style={s.todayLabel}>New Patients</div>
                  <div style={s.todayVal}>3</div>
                </div>
              </div>
              <button style={s.todayBtn}>View List</button>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ ...s.card, flex: 1 }}>
            <div style={{ ...s.cardTitle, marginBottom: 16 }}>Recent Activity</div>
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} style={{ ...s.activityItem, borderBottom: i < RECENT_ACTIVITY.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={s.activityIcon}>
                  <span style={{ width: 13, height: 13, display: 'flex', color: '#94a3b8' }}>{Icons.activity}</span>
                </div>
                <div>
                  <div style={s.activityName}>{a.name}</div>
                  <div style={s.activityAction}>{a.action}</div>
                  <div style={s.activityTime}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={s.card}>
          <div style={{ ...s.cardTitle, marginBottom: 16 }}>Quick Actions</div>
          <div style={s.quickActions}>
            <button style={s.qaBtn}>
              <span style={{ width: 15, height: 15, display: 'flex' }}>{Icons.calendar}</span>
              View All Appointments
            </button>
            <button style={s.qaOutlineBtn}>
              <span style={{ width: 15, height: 15, display: 'flex' }}>{Icons.users}</span>
              Manage Users
            </button>
            <button style={s.qaOutlineBtn}>
              <span style={{ width: 15, height: 15, display: 'flex' }}>{Icons.dollar}</span>
              Financial Reports
            </button>
            <button style={s.qaOutlineBtn}>
              <span style={{ width: 15, height: 15, display: 'flex' }}>{Icons.activity}</span>
              System Health
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 },
  statCard: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 22px' },
  statIcon: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel: { fontSize: '.75rem', color: '#64748b', marginBottom: 4 },
  statValue: { fontFamily: "'Syne', sans-serif", fontSize: '1.9rem', fontWeight: 700, color: '#0f1117', letterSpacing: '-.03em', lineHeight: 1 },
  statSub: { fontSize: '.72rem', marginTop: 5 },
  chartsRow: { display: 'flex', gap: 14, marginBottom: 16 },
  card: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 22px' },
  cardTitle: { fontSize: '.88rem', fontWeight: 600, color: '#0f1117', letterSpacing: '-.01em', marginBottom: 16 },
  todayItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f1f5f9' },
  todayLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  todayIcon: { width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  todayLabel: { fontSize: '.75rem', color: '#64748b' },
  todayVal: { fontSize: '1.1rem', fontWeight: 600, color: '#0f1117', marginTop: 1 },
  todayBtn: { padding: '7px 14px', background: '#fff', border: '1px solid #e8ecf0', borderRadius: 8, fontSize: '.78rem', fontWeight: 500, color: '#0f1117', cursor: 'pointer' },
  activityItem: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0' },
  activityIcon: { width: 28, height: 28, borderRadius: 7, background: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  activityName: { fontSize: '.82rem', fontWeight: 500, color: '#0f1117' },
  activityAction: { fontSize: '.75rem', color: '#64748b', marginTop: 1 },
  activityTime: { fontSize: '.68rem', color: '#94a3b8', marginTop: 2 },
  quickActions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  qaBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#0f1117', color: '#fff', border: 'none', borderRadius: 9, fontSize: '.82rem', fontWeight: 500, cursor: 'pointer' },
  qaOutlineBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#fff', color: '#0f1117', border: '1px solid #e8ecf0', borderRadius: 9, fontSize: '.82rem', fontWeight: 500, cursor: 'pointer' },
};
