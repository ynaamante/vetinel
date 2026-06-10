import { Icons } from '../icons';

export default function Topbar({ user, title, subtitle }) {
  return (
    <div style={s.bar}>
      <div>
        <h2 style={s.title}>{title}</h2>
        <p style={s.subtitle}>{subtitle}</p>
      </div>

      <div style={s.right}>
        <div style={s.search}>
          <span style={s.searchIcon}>{Icons.search}</span>
          Search...
        </div>

        <button style={s.notif}>
          <span style={s.notifIcon}>{Icons.bell}</span>
          <span style={s.pip} />
        </button>

        <div style={s.pill}>
          <div style={s.avatar}>{user.initials}</div>
          <div>
            <div style={s.pillName}>{user.name}</div>
            <div style={s.pillRole}>{user.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 28px',
    background: '#fff',
    borderBottom: '1px solid #e8ecf0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    gap: 16,
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '1.05rem',
    fontWeight: 600,
    letterSpacing: '-.01em',
    color: '#0f1117',
  },
  subtitle: { fontSize: '.72rem', color: '#64748b', marginTop: 1 },
  right: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 },
  search: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#f4f6f9',
    border: '1px solid #e8ecf0',
    borderRadius: 8,
    padding: '7px 12px',
    fontSize: '.8rem',
    color: '#94a3b8',
    width: 190,
    cursor: 'text',
  },
  searchIcon: { width: 13, height: 13, display: 'flex', flexShrink: 0 },
  notif: {
    position: 'relative',
    padding: 6,
    borderRadius: 8,
    color: '#64748b',
    display: 'flex',
  },
  notifIcon: { width: 17, height: 17, display: 'flex' },
  pip: {
    position: 'absolute',
    top: 5, right: 5,
    width: 7, height: 7,
    background: '#dc2626',
    borderRadius: '50%',
    border: '1.5px solid #fff',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '5px 10px 5px 5px',
    borderRadius: 30,
    border: '1px solid #e8ecf0',
  },
  avatar: {
    width: 28, height: 28,
    borderRadius: '50%',
    background: '#1d4ed8',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '.65rem',
    fontWeight: 600,
    letterSpacing: '.02em',
  },
  pillName: { fontSize: '.78rem', fontWeight: 500, color: '#0f1117' },
  pillRole: { fontSize: '.65rem', color: '#64748b' },
};