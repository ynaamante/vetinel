import { useEffect, useMemo, useState } from 'react';
import Topbar from '../../components/Topbar';
import StatusIndicator from '../../components/StatusIndicator';
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

function getMockAppointments() {
  const today = new Date();
  const at = (dayOffset, hour, minute) => {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };

  return [
    { id: 'demo-1', start_time: at(0, 9, 0), pet: 'Max', owner: 'Emma Santos', reason: 'General Checkup', practitioner: 'Dr. Torres', status: 'Confirmed' },
    { id: 'demo-2', start_time: at(0, 10, 30), pet: 'Luna', owner: 'Daniel Cruz', reason: 'Vaccination', practitioner: 'Dr. Chen', status: 'Pending' },
    { id: 'demo-3', start_time: at(1, 11, 0), pet: 'Charlie', owner: 'Sofia Reyes', reason: 'Dental Cleaning', practitioner: 'Dr. Torres', status: 'Confirmed' },
    { id: 'demo-4', start_time: at(2, 14, 0), pet: 'Bella', owner: 'Noah Garcia', reason: 'Walk-in Consultation', practitioner: 'Dr. Chen', status: 'Confirmed', is_walk_in: true },
    { id: 'demo-5', start_time: at(-1, 15, 30), pet: 'Rocky', owner: 'Mia Flores', reason: 'Follow-up', practitioner: 'Dr. Torres', status: 'Completed' },
    { id: 'demo-6', start_time: at(-2, 13, 0), pet: 'Milo', owner: 'Lucas Mendoza', reason: 'General Checkup', practitioner: 'Dr. Chen', status: 'No Show' },
    { id: 'demo-7', start_time: at(3, 10, 0), pet: 'Coco', owner: 'Ava Navarro', reason: 'Reschedule Request', practitioner: 'Dr. Torres', status: 'Reschedule Request' },
    { id: 'demo-8', start_time: at(4, 16, 0), pet: 'Nala', owner: 'Ethan Ramos', reason: 'Cancel Request', practitioner: 'Dr. Chen', status: 'Cancel Request' },
  ];
}

function StatusBadge({ status }) {
  return <StatusIndicator status={status} />;
}

function GenericAppointmentTable({ tab, appointments }) {
  const titles = {
    completed: 'Completed Appointments',
    walkins: 'Walk-in Appointments',
    followups: 'Follow-up Appointments',
    'no-shows': 'No-show Appointments',
    'reschedule-requests': 'Reschedule Requests',
    'cancel-requests': 'Cancel Requests',
  };

  return (
    <>
      <div style={s.tableTitle}>{titles[tab]} ({appointments.length})</div>
      <table style={s.table}>
        <thead>
          <tr>{['Date', 'Time', 'Pet Name', 'Owner', 'Type', 'Status', 'Actions'].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {appointments.length === 0 ? (
            <tr><td colSpan={7} style={{ ...s.td, color: '#64748b' }}>No appointments found.</td></tr>
          ) : appointments.map((appt, i) => (
            <tr key={appt.id || `${i}-${appt.start_time}`}>
              <td style={s.tdMuted}>{formatDate(appt.start_time)}</td>
              <td style={{ ...s.td, fontWeight: 600 }}>{formatTime(appt.start_time)}</td>
              <td style={s.td}>{appt.pet || '—'}</td>
              <td style={s.td}>{appt.owner || '—'}</td>
              <td style={s.td}>{appt.reason || 'Appointment'}</td>
              <td style={s.td}><StatusBadge status={appt.status} /></td>
              <td style={s.td}><button type="button" style={s.iconBtn} disabled aria-label="View appointment">{Icons.eye}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function AppointmentActionsModal({ appointment, onClose, onAction }) {
  if (!appointment) return null;

  const actions = [
    ['confirm', 'Confirm', 'Mark this appointment as confirmed.', 'positive', Icons.check],
    ['checkin', 'Check In', 'Mark patient as checked in for their appointment.', 'primary', Icons.send],
    ['view', 'View Details', 'See full appointment information.', 'neutral', Icons.eye],
    ['reschedule', 'Reschedule', 'Change the appointment date and time.', 'warning', Icons.calendar],
    ['cancel', 'Cancel Appointment', 'Cancel this appointment and notify the patient.', 'danger', Icons.xCircle],
    ['noshow', 'Mark No Show', 'Mark this appointment as a no show.', 'danger', Icons.xCircle],
  ];

  return (
    <div style={s.modalBackdrop} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-actions-title"
        onClick={(event) => event.stopPropagation()}
        style={s.actionsDialog}
      >
        <button type="button" aria-label="Close appointment actions" onClick={onClose} style={s.modalClose}>
          {Icons.close}
        </button>
        <div style={s.actionsHeader}>
          <div style={s.actionsHeaderIcon}>{Icons.calendar}</div>
          <div>
            <h2 id="appointment-actions-title" style={s.actionsTitle}>Appointment Actions</h2>
            <div style={s.actionsSubtitle}>
              {appointment.pet || 'Appointment'} — {appointment.reason || 'Appointment'} ({formatTime(appointment.start_time)})
            </div>
          </div>
        </div>
        <div style={s.actionsList}>
          <div style={s.actionGrid}>
            {actions.slice(0, 3).map(([action, label, description, variant, icon]) => (
              <button key={action} type="button" onClick={() => onAction(appointment, action)} style={{ ...s.modalActionButton, ...s[`modalAction_${variant}`] }}>
                <span style={{ ...s.modalActionIcon, ...s[`modalIcon_${variant}`] }}>{icon}</span>
                <span style={s.modalActionText}><strong>{label}</strong><small>{description}</small></span>
                <span style={s.modalActionChevron}>›</span>
              </button>
            ))}
          </div>
          <div style={s.actionDivider} />
          <div style={s.actionGrid}>
            {actions.slice(3).map(([action, label, description, variant, icon]) => (
              <button key={action} type="button" onClick={() => onAction(appointment, action)} style={{ ...s.modalActionButton, ...s[`modalAction_${variant}`] }}>
                <span style={{ ...s.modalActionIcon, ...s[`modalIcon_${variant}`] }}>{icon}</span>
                <span style={s.modalActionText}><strong>{label}</strong><small>{description}</small></span>
                <span style={s.modalActionChevron}>›</span>
              </button>
            ))}
          </div>
          <div style={s.actionsNotice}>
            <span style={s.noticeIcon}>i</span>
            <span>These actions will update the appointment status and be reflected in the patient’s record.<br />For clinic-specific workflows, please refer to your clinic settings.</span>
          </div>
        </div>
        <div style={s.modalFooter}>
          <button type="button" style={s.modalCancel} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function NewAppointmentModal({ appointments, onClose, onSchedule }) {
  const pets = [...new Set(appointments.map((appointment) => appointment.pet).filter(Boolean))];
  const owners = [...new Set(appointments.map((appointment) => appointment.owner).filter(Boolean))];
  const [form, setForm] = useState({ pet: '', owner: '', date: '', time: '', type: '', notes: '' });
  const canSubmit = form.pet && form.owner && form.date && form.time && form.type;

  return (
    <div style={s.modalBackdrop} onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-appointment-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSchedule(form);
        }}
        style={s.newAppointmentDialog}
      >
        <button type="button" aria-label="Close new appointment" onClick={onClose} style={s.newAppointmentClose}>{Icons.close}</button>
        <h2 id="new-appointment-title" style={s.newAppointmentTitle}>New Appointment</h2>
        <p style={s.newAppointmentSubtitle}>Schedule a new appointment.</p>
        <div style={s.newAppointmentGrid}>
          <label style={s.newAppointmentLabel}>Pet*<select required value={form.pet} onChange={(event) => setForm({ ...form, pet: event.target.value })} style={s.newAppointmentInput}><option value="">Select pet</option>{pets.map((pet) => <option key={pet}>{pet}</option>)}</select></label>
          <label style={s.newAppointmentLabel}>Owner*<select required value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} style={s.newAppointmentInput}><option value="">Select owner</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select></label>
          <label style={s.newAppointmentLabel}>Date*<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} style={s.newAppointmentInput} /></label>
          <label style={s.newAppointmentLabel}>Time*<input required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} style={s.newAppointmentInput} /></label>
          <label style={{ ...s.newAppointmentLabel, gridColumn: '1 / -1' }}>Appointment Type*<select required value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} style={s.newAppointmentInput}><option value="">Select type</option><option>General Checkup</option><option>Vaccination</option><option>Dental Cleaning</option><option>Follow-up</option><option>Surgery</option></select></label>
          <label style={{ ...s.newAppointmentLabel, gridColumn: '1 / -1' }}>Notes<textarea placeholder="Additional information..." value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} style={s.newAppointmentNotes} /></label>
        </div>
        <div style={s.newAppointmentFooter}><button type="button" style={s.modalCancel} onClick={onClose}>Cancel</button><button type="submit" style={{ ...s.scheduleButton, ...(canSubmit ? {} : s.scheduleButtonDisabled) }} disabled={!canSubmit}>Schedule Appointment</button></div>
      </form>
    </div>
  );
}

export default function AppointmentManagementPage({ user }) {
  const [tab, setTab] = useState('today');
  const [openActionsId, setOpenActionsId] = useState(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [search, setSearch] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'walkins', label: 'Walk-ins' },
    { id: 'followups', label: 'Follow-ups' },
    { id: 'no-shows', label: 'No Shows' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'reschedule-requests', label: 'Reschedule Requests', count: 1, countColor: '#f97316' },
    { id: 'cancel-requests', label: 'Cancel Requests', count: 1, countColor: '#f43f5e' },
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
        setAppointments(Array.isArray(data) && data.length > 0 ? data : getMockAppointments());
      } catch (err) {
        console.error(err);
        setError(null);
        setAppointments(getMockAppointments());
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

  const completedAppointments = useMemo(() => {
    return filteredAppointments.filter((appt) => ['completed', 'complete'].includes(String(appt.status || '').toLowerCase()));
  }, [filteredAppointments]);

  const walkInAppointments = useMemo(() => {
    return filteredAppointments.filter((appt) => Boolean(appt.is_walk_in || appt.walk_in || String(appt.type || appt.reason || '').toLowerCase().includes('walk')));
  }, [filteredAppointments]);

  const noShowAppointments = useMemo(() => {
    return filteredAppointments.filter((appt) => ['no show', 'no-show', 'noshow'].includes(String(appt.status || '').toLowerCase()));
  }, [filteredAppointments]);

  const stats = useMemo(() => ({
    total: todayAppointments.length,
    confirmed: appointments.filter((appt) => String(appt.status || '').toLowerCase() === 'confirmed').length,
    pending: appointments.filter((appt) => String(appt.status || '').toLowerCase() === 'pending').length,
    upcoming: upcomingAppointments.length,
    completed: completedAppointments.length,
    walkIns: walkInAppointments.length,
  }), [appointments, todayAppointments.length, upcomingAppointments.length, completedAppointments.length, walkInAppointments.length]);

  const handleAppointmentAction = (appointment, action) => {
    setOpenActionsId(null);
    if (action === 'view') {
      window.alert(`${appointment.pet || 'Appointment'}\n${appointment.owner || 'Owner not available'}\n${appointment.reason || 'Appointment'}\n${formatTime(appointment.start_time)}`);
      return;
    }

    const statusByAction = {
      confirm: 'Confirmed',
      checkin: 'Checked In',
      reschedule: 'Reschedule Request',
      cancel: 'Cancelled',
      noshow: 'No Show',
    };

    const handleScheduleAppointment = (form) => {
      const startTime = new Date(`${form.date}T${form.time}`).toISOString();
      setAppointments((current) => [{
        id: `local-${Date.now()}`,
        start_time: startTime,
        pet: form.pet,
        owner: form.owner,
        reason: form.type,
        notes: form.notes,
        status: 'Pending',
      }, ...current]);
      setShowNewAppointment(false);
      setTab('today');
    };
    const nextStatus = statusByAction[action];
    if (!nextStatus) return;
    setAppointments((current) => current.map((item) => (
      item.id === appointment.id ? { ...item, status: nextStatus } : item
    )));
  };

  if (!canView) {
    return (
      <div style={s.main}>
        <Topbar user={user} title="Appointment Management" subtitle="Manage bookings, cancellations, and follow-ups" />
        <div style={s.page}>
          <div style={s.pageActions}><button type="button" style={s.primaryBtn} onClick={() => setShowNewAppointment(true)}><span style={{ width: 13, height: 13, display: 'flex' }}>{Icons.plus}</span>New Appointment</button></div>
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

        {/* Stat Cards */}
        <div style={s.statsGrid}>
          {[
            { label: "Today's Total", value: stats.total, icon: Icons.calendar, iconBg: '#e7f5f2', iconColor: '#07866a' },
            { label: 'Confirmed', value: stats.confirmed, icon: Icons.check, iconBg: '#f0fdf4', iconColor: '#16a34a' },
            { label: 'Pending', value: stats.pending, icon: Icons.clock, iconBg: '#fffbeb', iconColor: '#d97706' },
            { label: 'Upcoming', value: stats.upcoming, icon: Icons.calendarPlus, iconBg: '#f5f3ff', iconColor: '#7c3aed' },
            { label: 'Completed', value: stats.completed, icon: Icons.check, iconBg: '#ecfeff', iconColor: '#0891b2' },
            { label: 'Walk-ins', value: stats.walkIns, icon: Icons.users, iconBg: '#fff7ed', iconColor: '#ea580c' },
          ].map((c) => (
            <div key={c.label} style={s.statCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 17, height: 17, display: 'flex', color: c.iconColor }}>{c.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: '.7rem', color: '#64748b', fontWeight: 500 }}>{c.label}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.2 }}>{c.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={s.requestNotice}>
          <span style={s.requestIcon}>{Icons.clock}</span>
          <div style={{ flex: 1 }}>
            <div style={s.requestTitle}>Pending appointment requests</div>
            <div style={s.requestText}>{stats.pending} appointment request{stats.pending === 1 ? '' : 's'} need review.</div>
          </div>
          <button type="button" style={s.requestLink} onClick={() => setTab('reschedule-requests')}>View requests</button>
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
              {t.count > 0 && <span style={{ ...s.tabCount, background: t.countColor }}>{t.count}</span>}
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
                            <td style={{ ...s.td, position: 'relative' }}>
                              <button
                                type="button"
                                style={s.moreButton}
                                onClick={() => setOpenActionsId(openActionsId === appt.id ? null : appt.id)}
                                aria-label={`Actions for ${appt.pet || 'appointment'}`}
                                aria-expanded={openActionsId === appt.id}
                              >
                                {Icons.moreVertical}
                              </button>
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

              {['completed', 'walkins', 'followups', 'no-shows', 'reschedule-requests', 'cancel-requests'].includes(tab) && (
                <GenericAppointmentTable
                  tab={tab}
                  appointments={
                    tab === 'completed' ? completedAppointments :
                    tab === 'walkins' ? walkInAppointments :
                    tab === 'no-shows' ? noShowAppointments :
                    tab === 'reschedule-requests' || tab === 'cancel-requests'
                      ? filteredAppointments.filter((appt) => String(appt.status || '').toLowerCase().includes(tab === 'reschedule-requests' ? 'reschedule' : 'cancel'))
                      : filteredAppointments
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
      <AppointmentActionsModal
        appointment={todayAppointments.find((appointment) => appointment.id === openActionsId)}
        onClose={() => setOpenActionsId(null)}
        onAction={handleAppointmentAction}
      />
      {showNewAppointment && <NewAppointmentModal appointments={appointments} onClose={() => setShowNewAppointment(false)} onSchedule={handleScheduleAppointment} />}
    </div>
  );
}

const s = {
  main: { flex: 1, overflowY: 'auto', background: '#f4f6f9' },
  page: { padding: '24px 28px' },
  pageActions: { display: 'flex', justifyContent: 'flex-end', marginBottom: 14 },
  pageHd: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  pageTitle: { fontFamily: "'DM Sans',sans-serif", fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-.02em' },
  pageSub: { fontSize: '.78rem', color: '#64748b', marginTop: 3 },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#0f1117', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.82rem', fontWeight: 500, cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 14, marginBottom: 20 },
  statCard: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '16px 20px' },
  requestNotice: { display: 'flex', alignItems: 'center', gap: 12, background: '#fffdf2', border: '1px solid #f4e7b0', borderRadius: 10, padding: '12px 16px', marginBottom: 16 },
  requestIcon: { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', background: '#fef3c7', borderRadius: 8 },
  requestTitle: { fontSize: '.8rem', fontWeight: 600, color: '#713f12' },
  requestText: { fontSize: '.74rem', color: '#92400e', marginTop: 2 },
  requestLink: { border: 'none', background: 'transparent', color: '#92400e', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' },
  searchWrap: { position: 'relative', marginBottom: 16 },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#64748b', display: 'flex' },
  search: { width: '100%', padding: '10px 14px 10px 36px', border: '1px solid #e8ecf0', borderRadius: 8, fontSize: '.82rem', background: '#fff', outline: 'none' },
  tabBar: { display: 'flex', alignItems: 'center', overflowX: 'auto', background: '#e9ebf0', borderRadius: 18, padding: 3, marginBottom: 16, gap: 1, scrollbarWidth: 'none' },
  tabBtn: { flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 11px', border: 'none', borderRadius: 15, fontSize: '.78rem', color: '#171717', background: 'transparent', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' },
  tabActive: { background: '#fff', color: '#0f1117', boxShadow: '0 1px 3px rgba(0,0,0,.1)' },
  tabCount: { minWidth: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', borderRadius: 10, color: '#fff', fontSize: '.68rem', fontWeight: 700 },
  card: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 24px' },
  tableTitle: { fontSize: '.9rem', fontWeight: 600, color: '#0f1117', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  td: { padding: '13px 0', fontSize: '.82rem', color: '#0f1117', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  tdMuted: { padding: '13px 0', fontSize: '.82rem', color: '#64748b', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '.75rem', color: '#0f1117', cursor: 'pointer' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 },
  moreButton: { width: 29, height: 29, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 5, background: '#fff', color: '#374151', border: '1px solid #dbe3ee', borderRadius: 7, cursor: 'pointer' },
  modalBackdrop: { position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15, 23, 42, .38)' },
  actionsDialog: { position: 'relative', width: 610, maxWidth: 'calc(100vw - 32px)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 13, overflow: 'hidden', boxShadow: '0 20px 45px rgba(15,23,42,.25)' },
  modalClose: { position: 'absolute', top: 18, right: 20, zIndex: 1, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 6, background: 'transparent', color: '#64748b', cursor: 'pointer' },
  actionsHeader: { display: 'flex', alignItems: 'center', gap: 11, padding: '14px 19px 12px', borderBottom: '1px solid #e2e8f0' },
  actionsHeaderIcon: { width: 43, height: 43, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', color: '#fff', background: '#087c58', borderRadius: 10 },
  actionsTitle: { margin: 0, color: '#18263a', fontSize: '1.02rem', fontWeight: 700 },
  actionsSubtitle: { marginTop: 2, color: '#5f718a', fontSize: '.72rem' },
  actionsList: { padding: '20px 24px 16px' },
  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 },
  actionDivider: { display: 'block', height: 18 },
  modalActionButton: { minHeight: 84, display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', padding: '12px 10px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#f8fafc', color: '#34445b', textAlign: 'left', cursor: 'pointer' },
  modalActionIcon: { width: 29, height: 29, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', color: '#50617a', marginTop: 1 },
  modalActionText: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0, paddingTop: 1 },
  modalActionTextStrong: { fontSize: '.95rem' },
  modalActionChevron: { color: '#40536d', fontSize: '1.25rem', lineHeight: 1 },
  modalAction_positive: { borderColor: '#16a765', background: '#effaf4', color: '#08743d' },
  modalAction_primary: { borderColor: '#5b8ef0', background: '#f1f6ff', color: '#087f65' },
  modalAction_neutral: { borderColor: '#cbd5e1', background: '#f8fafc', color: '#34445b' },
  modalAction_danger: { borderColor: '#ff6674', background: '#fff1f3', color: '#a91524' },
  modalAction_primary: { borderColor: '#86d7b4', background: '#f1f6ff', color: '#087f65' },
  modalAction_positive: { borderColor: '#86d7b4', background: '#effaf4', color: '#08743d' },
  modalAction_warning: { borderColor: '#ffc65c', background: '#fff8e8', color: '#805300' },
  modalIcon_positive: { width: 29, height: 29, borderRadius: 50, background: '#139b5e', color: '#fff' },
  modalIcon_primary: { color: '#326cc2' },
  modalIcon_neutral: { color: '#50617a' },
  modalIcon_danger: { width: 29, height: 29, borderRadius: 50, background: '#c91628', color: '#fff' },
  modalIcon_warning: { width: 29, height: 29, borderRadius: 50, background: '#f59e0b', color: '#fff' },
  actionsNotice: { display: 'flex', gap: 7, paddingTop: 9, marginTop: 11, borderTop: '1px solid #e2e8f0', color: '#70829a', fontSize: '.56rem', lineHeight: 1.35 },
  noticeIcon: { width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', borderRadius: '50%', background: '#cbd7e8', color: '#fff', fontWeight: 700 },
  modalFooter: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '9px 13px', borderTop: '1px solid #e2e8f0' },
  modalCancel: { padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: 7, background: '#fff', color: '#64748b', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer' },
  newAppointmentDialog: { position: 'relative', width: 575, maxWidth: 'calc(100vw - 32px)', padding: '22px 25px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 20px 45px rgba(15,23,42,.22)' },
  newAppointmentClose: { position: 'absolute', top: 14, right: 15, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' },
  newAppointmentTitle: { margin: 0, color: '#0f172a', fontSize: '1.12rem', fontWeight: 700 },
  newAppointmentSubtitle: { margin: '6px 0 16px', color: '#64748b', fontSize: '.78rem' },
  newAppointmentGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' },
  newAppointmentLabel: { display: 'flex', flexDirection: 'column', gap: 6, color: '#1f2937', fontSize: '.76rem', fontWeight: 600 },
  newAppointmentInput: { width: '100%', minHeight: 36, boxSizing: 'border-box', padding: '8px 12px', border: '1px solid #f1f1f3', borderRadius: 8, background: '#f4f4f6', color: '#6b7280', fontSize: '.78rem', outline: 'none' },
  newAppointmentNotes: { width: '100%', height: 64, boxSizing: 'border-box', resize: 'vertical', padding: '10px 12px', border: '1px solid #f1f1f3', borderRadius: 8, background: '#f4f4f6', color: '#6b7280', fontFamily: 'inherit', fontSize: '.78rem', outline: 'none' },
  newAppointmentFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  scheduleButton: { padding: '9px 14px', border: 'none', borderRadius: 8, background: '#0f1117', color: '#fff', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' },
  scheduleButtonDisabled: { background: '#d1d5db', color: '#6b7280', cursor: 'not-allowed' },
};