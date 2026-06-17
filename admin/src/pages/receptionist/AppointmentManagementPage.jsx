import { useEffect, useMemo, useState } from 'react';
import Topbar from '../../components/Topbar';
import { Icons } from '../../icons';
import { canViewFeature } from '../../utils/permissionUtils';

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isFutureDay(a, b) {
  if (a.getFullYear() !== b.getFullYear()) return a.getFullYear() > b.getFullYear();
  if (a.getMonth() !== b.getMonth()) return a.getMonth() > b.getMonth();
  return a.getDate() > b.getDate();
}

function StatusBadge({ status }) {
  const map = {
    confirmed: { bg: '#dcfce7', color: '#16a34a' },
    pending: { bg: '#fef9c3', color: '#ca8a04' },
    cancelled: { bg: '#fee2e2', color: '#b91c1c' },
  };
  const normalized = String(status || '').toLowerCase();
  const c = map[normalized] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, background: c.bg, color: c.color, fontSize: '.7rem', fontWeight: 600 }}>
      {String(status || 'Unknown')}
    </span>
  );
}

export default function AppointmentManagementPage({ user }) {
  const [tab, setTab] = useState('today');
  const [search, setSearch] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'today', label: "Today's Appointments" },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const canView = canViewFeature(user.permissions, user.role, 'Appointment Management');

  useEffect(() => {
    if (!user || !user.token) return;
    if (!canView) return;

    const apiUrl = import.meta.env.VITE_API_URL || '';
    const params = new URLSearchParams();
    if (user.clinic_id) params.set('clinic_id', user.clinic_id);
    const query = params.toString() ? `?${params.toString()}` : '';
    const headers = { Authorization: `Bearer ${user.token}` };

    const loadAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiUrl}/clinic-records/appointments${query}`, { headers });
        if (!response.ok) throw new Error('Failed to load appointments');
        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError('Unable to load appointments from the database.');
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [user, canView]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return appointments;
    return appointments.filter((appt) => {
      return [appt.pet, appt.owner, appt.reason, appt.practitioner].some((value) =>
        String(value || '').toLowerCase().includes(query)
      );
    });
  }, [appointments, search]);

  const todayAppointments = useMemo(() => {
    const today = new Date();
    return filteredAppointments.filter((appt) => {
      const date = new Date(appt.start_time);
      return !Number.isNaN(date.getTime()) && isSameDay(date, today) && String(appt.status || '').toLowerCase() !== 'cancelled';
    });
  }, [filteredAppointments]);

  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    return filteredAppointments.filter((appt) => {
      const date = new Date(appt.start_time);
      return !Number.isNaN(date.getTime()) && isFutureDay(date, today) && String(appt.status || '').toLowerCase() !== 'cancelled';
    });
  }, [filteredAppointments]);

  const cancelledAppointments = useMemo(() => {
    return filteredAppointments.filter((appt) => String(appt.status || '').toLowerCase() === 'cancelled');
  }, [filteredAppointments]);

  const stats = useMemo(() => ({
    total: todayAppointments.length,
    confirmed: appointments.filter((appt) => String(appt.status || '').toLowerCase() === 'confirmed').length,
    pending: appointments.filter((appt) => String(appt.status || '').toLowerCase() === 'pending').length,
    upcoming: upcomingAppointments.length,
  }), [appointments, todayAppointments.length, upcomingAppointments.length]);

  if (!canView) {
    return (
      <div style={s.main}>
        <Topbar user={user} title="Appointment Management" subtitle="Manage bookings, cancellations, and follow-ups" />
        <div style={s.page}>
          <div style={s.pageHd}>
            <div>
              <div style={s.pageTitle}>Appointment Management</div>
              <div style={s.pageSub}>You do not have permission to view this page.</div>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: 28, color: '#475569' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Access denied</h2>
            <p style={{ marginTop: 12 }}>Your role (<strong>{user.role}</strong>) does not currently have permission to view Appointment Management.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.main}>
      <Topbar user={user} title="Appointment Management" subtitle="Manage bookings, cancellations, and follow-ups" />
      <div style={s.page}>

        {/* Header */}
        <div style={s.pageHd}>
          <div>
            <div style={s.pageTitle}>Appointment Management</div>
            <div style={s.pageSub}>Manage today's bookings, upcoming appointments, and cancellations</div>
          </div>
          <button style={s.primaryBtn} disabled>
            <span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>
            New Appointment
          </button>
        </div>

        {/* Stat Cards */}
        <div style={s.statsGrid}>
          {[
            { label: "Today's Total", value: stats.total, icon: Icons.calendar, iconBg: '#eff6ff', iconColor: '#1d4ed8' },
            { label: 'Confirmed', value: stats.confirmed, icon: Icons.check, iconBg: '#f0fdf4', iconColor: '#16a34a' },
            { label: 'Pending', value: stats.pending, icon: Icons.clock, iconBg: '#fffbeb', iconColor: '#d97706' },
            { label: 'Upcoming', value: stats.upcoming, icon: Icons.calendarPlus, iconBg: '#f5f3ff', iconColor: '#7c3aed' },
          ].map((c) => (
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

        {/* Search */}
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>{Icons.search}</span>
          <input style={s.search} placeholder="Search by pet, owner, practitioner, or type..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Tab Bar */}
        <div style={s.tabBar}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...s.tabBtn, ...(tab === t.id ? s.tabActive : {}) }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={s.card}>
          {loading ? (
            <div style={{ padding: 40, color: '#64748b' }}>Loading appointments…</div>
          ) : error ? (
            <div style={{ padding: 40, color: '#dc2626' }}>{error}</div>
          ) : (
            <>
              {tab === 'today' && (
                <>
                  <div style={s.tableTitle}>Today's Appointments ({todayAppointments.length})</div>
                  <table style={s.table}>
                    <thead>
                      <tr>{['Time', 'Pet Name', 'Owner', 'Type', 'Status', 'Actions'].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {todayAppointments.length === 0 ? (
                        <tr><td colSpan={6} style={{ ...s.td, color: '#64748b' }}>No appointments scheduled for today.</td></tr>
                      ) : (
                        todayAppointments.map((appt, i) => (
                          <tr key={appt.id || `${i}-${appt.start_time}`}> 
                            <td style={{ ...s.td, fontWeight: 600 }}>{formatTime(appt.start_time)}</td>
                            <td style={s.td}>{appt.pet}</td>
                            <td style={s.td}>{appt.owner}</td>
                            <td style={s.td}>{appt.reason || 'Appointment'}</td>
                            <td style={s.td}><StatusBadge status={appt.status} /></td>
                            <td style={s.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button style={s.actionBtn} disabled>
                                  <span style={{ width: 13, height: 13, display: 'flex', color: '#16a34a' }}>{Icons.check}</span>
                                  {String(appt.status || '').toLowerCase() === 'pending' ? 'Confirm' : 'Complete'}
                                </button>
                                <button style={{ ...s.iconBtn, color: '#dc2626' }} disabled>
                                  <span style={{ width: 14, height: 14, display: 'flex' }}>{Icons.xCircle}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {tab === 'upcoming' && (
                <>
                  <div style={s.tableTitle}>Upcoming Appointments ({upcomingAppointments.length})</div>
                  <table style={s.table}>
                    <thead>
                      <tr>{['Date', 'Time', 'Pet Name', 'Owner', 'Type', 'Status', 'Actions'].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {upcomingAppointments.length === 0 ? (
                        <tr><td colSpan={7} style={{ ...s.td, color: '#64748b' }}>No upcoming appointments found.</td></tr>
                      ) : (
                        upcomingAppointments.map((appt, i) => (
                          <tr key={appt.id || `${i}-${appt.start_time}`}> 
                            <td style={s.tdMuted}>{formatDate(appt.start_time)}</td>
                            <td style={{ ...s.td, fontWeight: 600 }}>{formatTime(appt.start_time)}</td>
                            <td style={s.td}>{appt.pet}</td>
                            <td style={s.td}>{appt.owner}</td>
                            <td style={s.td}>{appt.reason || 'Appointment'}</td>
                            <td style={s.td}><StatusBadge status={appt.status} /></td>
                            <td style={s.td}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button style={s.iconBtn} disabled><span style={{ width: 14, height: 14, display: 'flex', color: '#64748b' }}>{Icons.edit}</span></button>
                                <button style={s.iconBtn} disabled><span style={{ width: 14, height: 14, display: 'flex', color: '#dc2626' }}>{Icons.trash}</span></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {tab === 'cancelled' && (
                <>
                  <div style={s.tableTitle}>Cancelled Appointments ({cancelledAppointments.length})</div>
                  <table style={s.table}>
                    <thead>
                      <tr>{['Date', 'Time', 'Pet Name', 'Owner', 'Type', 'Notes'].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {cancelledAppointments.length === 0 ? (
                        <tr><td colSpan={6} style={{ ...s.td, color: '#64748b' }}>No cancelled appointments.</td></tr>
                      ) : (
                        cancelledAppointments.map((appt, i) => (
                          <tr key={appt.id || `${i}-${appt.start_time}`}> 
                            <td style={s.tdMuted}>{formatDate(appt.start_time)}</td>
                            <td style={{ ...s.td, fontWeight: 600 }}>{formatTime(appt.start_time)}</td>
                            <td style={s.td}>{appt.pet}</td>
                            <td style={s.td}>{appt.owner}</td>
                            <td style={s.td}>{appt.reason || 'Appointment'}</td>
                            <td style={s.tdMuted}>{appt.notes || 'Cancelled'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  main: { flex: 1, overflowY: 'auto', background: '#f4f6f9' },
  page: { padding: '24px 28px' },
  pageHd: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  pageTitle: { fontFamily: "'Syne',sans-serif", fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-.02em' },
  pageSub: { fontSize: '.78rem', color: '#64748b', marginTop: 3 },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#0f1117', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.82rem', fontWeight: 500, cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 },
  statCard: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '16px 20px' },
  searchWrap: { position: 'relative', marginBottom: 16 },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#94a3b8', display: 'flex' },
  search: { width: '100%', padding: '10px 14px 10px 36px', border: '1px solid #e8ecf0', borderRadius: 8, fontSize: '.82rem', background: '#fff', outline: 'none' },
  tabBar: { display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 16, gap: 2 },
  tabBtn: { flex: 1, padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: '.82rem', color: '#64748b', background: 'transparent', cursor: 'pointer', fontWeight: 400 },
  tabActive: { background: '#fff', color: '#0f1117', fontWeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  card: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 24px' },
  tableTitle: { fontSize: '.9rem', fontWeight: 600, color: '#0f1117', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  td: { padding: '13px 0', fontSize: '.82rem', color: '#0f1117', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  tdMuted: { padding: '13px 0', fontSize: '.82rem', color: '#94a3b8', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '.75rem', color: '#0f1117', cursor: 'pointer' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 },
};