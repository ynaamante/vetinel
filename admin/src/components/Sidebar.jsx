import { Icons } from '../icons';
import { hasPermissionForFeature } from '../utils/permissionUtils';

const DISEASE_NAV = [
  { id: 'dashboard', label: 'Intelligence Dashboard', icon: 'grid',     section: 'Disease Intelligence' },
  { id: 'disease',   label: 'Disease Monitoring',     icon: 'activity', dot: true },
  { id: 'risk',      label: 'Risk Monitoring',         icon: 'shield'   },
  { id: 'analytics', label: 'Community Analytics',    icon: 'users'    },
  { id: 'reports',   label: 'Reports',                icon: 'file'     },
  { id: 'sync',      label: 'Data Sync Status',       icon: 'refresh'  },
];

const ADMIN_NAV = [
  { id: 'clinics',   label: 'Clinic Overview',         icon: 'building', section: 'Administrator' },
  { id: 'users',     label: 'User & Role Management', icon: 'lock'     },
  { id: 'financial', label: 'Financial Monitoring',   icon: 'dollar'   },
  { id: 'audit',     label: 'Audit Trail',            icon: 'list'     },
];

const DOCTOR_NAV = [
  { id: 'clinic', label: 'Local Clinic Records', icon: 'building', section: 'Clinic' },
];

const RECEPTIONIST_NAV = [
  { id: 'appointments-ops', label: 'Appointment Management', icon: 'calendar',  section: 'Operations' },
  { id: 'patient-queue',    label: 'Patient Queue',          icon: 'users'                             },
  { id: 'billing',          label: 'Billing & Payments',     icon: 'dollar'                            },
  { id: 'client-mgmt',      label: 'Client Management',      icon: 'users'                             },
  { id: 'reminders',        label: 'Due Dates & Reminders',  icon: 'bell'                              },
];

export default function Sidebar({ active, setPage, user, onLogout }) {
  const rawRole = String(user.role || '').trim().toLowerCase();
  const roleName = rawRole.replace(/[-\s]+/g, '_');
  const isOwner = roleName === 'clinic_owner' || roleName === 'super_admin';
  const isReceptionist = roleName === 'receptionist';

  const permissions = user.permissions || {};

  const canAccessPage = (feature) => {
    if (roleName === 'super_admin') return true;
    return hasPermissionForFeature(permissions, user.role, feature);
  };

  const NAV = [
    ...DISEASE_NAV,
    ...(isOwner ? ADMIN_NAV : isReceptionist ? RECEPTIONIST_NAV : DOCTOR_NAV),
  ].filter((item) => canAccessPage(item.label));
  return (
    <div style={s.sidebar}>
      <div style={s.brand}>VetIntel</div>
      <div style={s.brandSub}>Disease Intelligence</div>

      {NAV.map(item => (
        <div key={item.id}>
          {item.section && <div style={s.section}>{item.section}</div>}
          <div
            style={{ ...s.item, ...(active === item.id ? s.itemActive : {}) }}
            onClick={() => setPage(item.id)}
          >
            <span style={s.icon}>{Icons[item.icon]}</span>
            <span>{item.label}</span>
            {item.dot && <span style={s.badge} />}
          </div>
        </div>
      ))}

      <div style={{ flex: 1 }} />

      <div style={s.clinicBox}>
        <div style={s.clinicName}>Happy Paws Veterinary</div>
        <div style={s.clinicId}>CLI-001</div>
        <div style={s.status}>
          <span style={s.statusDot} />
          Connected
        </div>
      </div>
      <div style={s.userBox}>
        <div style={s.userName}>{user.name}</div>
        <div style={s.userRole}>{user.role}</div>
      </div>
      <div style={s.actions}>
        <div style={s.action}>
          <span style={s.icon}>{Icons.settings}</span>
          Settings
        </div>
        <div style={s.action} onClick={onLogout}>
          <span style={s.icon}>{Icons.logout}</span>
          Sign out
        </div>
      </div>
    </div>
  );
}

const s = {
  sidebar:    { width: 216, minHeight: '100vh', background: '#0f1117', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' },
  brand:      { padding: '24px 18px 2px', fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#fff', letterSpacing: '-.01em' },
  brandSub:   { padding: '0 18px 20px', fontSize: '.6rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 500 },
  section:    { padding: '16px 18px 4px', fontSize: '.6rem', fontWeight: 600, color: '#334155', letterSpacing: '.1em', textTransform: 'uppercase' },
  item:       { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', margin: '1px 6px', borderRadius: 8, color: '#64748b', fontSize: '.8rem', cursor: 'pointer', position: 'relative', transition: 'background .12s, color .12s' },
  itemActive: { background: 'rgba(29,78,216,.18)', color: '#93c5fd' },
  icon:       { width: 15, height: 15, flexShrink: 0, display: 'flex', alignItems: 'center', opacity: .7 },
  badge:      { width: 6, height: 6, background: '#dc2626', borderRadius: '50%', position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' },
  clinicBox:  { padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,.05)' },
  clinicName: { fontSize: '.78rem', fontWeight: 500, color: '#cbd5e0' },
  clinicId:   { fontSize: '.68rem', color: '#334155', marginTop: 1 },
  status:     { display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '.7rem', color: '#4ade80' },
  statusDot:  { width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0 },
  userBox:    { padding: '8px 18px 4px' },
  userName:   { fontSize: '.78rem', color: '#94a3b8' },
  userRole:   { fontSize: '.68rem', color: '#334155', marginTop: 1 },
  actions:    { padding: '6px 6px 18px' },
  action:     { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8, color: '#475569', fontSize: '.78rem', cursor: 'pointer' },
};