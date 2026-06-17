import { useState } from 'react';
import Topbar from '../components/Topbar';
import { Icons } from '../icons';
import { canViewFeature } from '../utils/permissionUtils';

const INITIAL_USERS = [
  { id: 'USR-001', name: 'Dr. Sarah Chen', email: 'owner@happypaws.com', role: 'owner', status: 'Active', created: '2025-01-15', lastLogin: '2026-04-27 09:15:03' },
  { id: 'USR-002', name: 'Dr. Michael Torres', email: 'doctor@happypaws.com', role: 'doctor', status: 'Active', created: '2025-02-20', lastLogin: '2026-04-26 16:45:22' },
  { id: 'USR-003', name: 'Emily Rodriguez', email: 'receptionist@happypaws.com', role: 'receptionist', status: 'Active', created: '2025-03-10', lastLogin: '2026-04-27 08:30:11' },
];

const ROLE_META = {
  owner: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: Icons.shield },
  doctor: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Icons.activity },
  receptionist: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: Icons.users },
};

const RoleBadge = ({ role }) => {
  const m = ROLE_META[role] || {};
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: m.bg, border: `1px solid ${m.border}`,
      fontSize: '.72rem', fontWeight: 600, color: m.color,
    }}>
      <span style={{ width: 11, height: 11, display: 'flex' }}>{m.icon}</span>
      {role}
    </span>
  );
};

const StatusBadge = ({ status }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    fontSize: '.72rem', fontWeight: 600, color: '#16a34a',
  }}>
    {status}
  </span>
);

/* ── ADD USER MODAL ── */
function AddUserModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'doctor' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    onAdd(form);
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 100 }} />
      <div style={m.panel}>
        <div style={m.header}>
          <div style={m.headerTitle}>Add New User</div>
          <button style={m.closeBtn} onClick={onClose}>
            <span style={{ width: 18, height: 18, display: 'flex', color: '#64748b' }}>{Icons.close}</span>
          </button>
        </div>
        <div style={m.divider} />
        <div style={m.body}>
          <div style={m.field}>
            <label style={m.label}>Full Name</label>
            <input style={m.input} placeholder="e.g. Dr. John Smith" value={form.name} onChange={set('name')} />
          </div>
          <div style={m.field}>
            <label style={m.label}>Email Address</label>
            <input style={m.input} placeholder="email@happypaws.com" value={form.email} onChange={set('email')} />
          </div>
          <div style={m.field}>
            <label style={m.label}>Role</label>
            <select style={m.input} value={form.role} onChange={set('role')}>
              <option value="owner">Owner</option>
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>
        </div>
        <div style={m.divider} />
        <div style={m.footer}>
          <button style={m.primaryBtn} onClick={handleSubmit}>Add User</button>
          <button style={m.secondaryBtn} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </>
  );
}

export default function UserRoleManagementPage({ user }) {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRole] = useState('All Roles');
  const [statusFilter, setStatus] = useState('All Status');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', email: '', role: 'doctor', status: 'Active' });

  const canView = canViewFeature(user.permissions, user.role, 'User & Role Management');

  if (!canView) {
    return (
      <div style={s.main}>
        <Topbar user={user} title="User & Role Management" subtitle="Manage clinic staff and their roles" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Access Denied</div>
          <div style={{ fontSize: '0.95rem' }}>You don't have permission to view this feature</div>
        </div>
      </div>
    );
  }

  const counts = {
    active: users.filter(u => u.status === 'Active').length,
    owners: users.filter(u => u.role === 'owner').length,
    doctors: users.filter(u => u.role === 'doctor').length,
    receptionists: users.filter(u => u.role === 'receptionist').length,
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All Roles' || u.role === roleFilter.toLowerCase();
    const matchStatus = statusFilter === 'All Status' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleAdd = ({ name, email, role }) => {
    const newId = `USR-00${users.length + 1}`;
    setUsers(prev => [...prev, {
      id: newId, name, email, role, status: 'Active',
      created: new Date().toISOString().slice(0, 10),
      lastLogin: '—',
    }]);
  };

  const openEdit = user => {
    setEditForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setShowEdit(true);
  };

  const handleUpdate = () => {
    if (!editForm.name || !editForm.email) return;
    setUsers(prev => prev.map(u =>
      u.id === editForm.id ? { ...u, name: editForm.name, email: editForm.email, role: editForm.role, status: editForm.status } : u
    ));
    setShowEdit(false);
  };

  const setEditField = key => e => setEditForm(f => ({ ...f, [key]: e.target.value }));

  const handleDeactivate = id => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
  };

  return (
    <div style={s.main}>
      <Topbar user={user} title="User & Role Management" subtitle="Manage users, roles, and account permissions" />
      <div style={s.page}>

        {/* STAT CARDS */}
        <div style={s.statsGrid}>
          {[
            { iconBg: '#eff6ff', label: 'Active Users', value: counts.active },
            { iconBg: '#fffbeb', label: 'Owners', value: counts.owners },
            { iconBg: '#eff6ff', label: 'Doctors', value: counts.doctors },
            { iconBg: '#f0fdf4', label: 'Receptionists', value: counts.receptionists },
          ].map((c, i) => (
            <div key={i} style={s.statCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ ...s.statIcon, background: c.iconBg }}>
                  <span style={{ width: 18, height: 18, display: 'flex' }}>{Icons.users}</span>
                </div>
                <div>
                  <div style={s.statLabel}>{c.label}</div>
                  <div style={s.statValue}>{c.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FILTER BAR */}
        <div style={s.filterBar}>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>{Icons.search || '🔍'}</span>
            <input
              style={s.searchInput}
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select style={s.select} value={roleFilter} onChange={e => setRole(e.target.value)}>
            {['All Roles', 'Owner', 'Doctor', 'Receptionist'].map(r => <option key={r}>{r}</option>)}
          </select>
          <select style={s.select} value={statusFilter} onChange={e => setStatus(e.target.value)}>
            {['All Status', 'Active', 'Inactive'].map(r => <option key={r}>{r}</option>)}
          </select>
          <button style={s.addBtn} onClick={() => setShowAdd(true)}>
            + Add User
          </button>
        </div>

        {/* TABLE */}
        <div style={s.card}>
          <div style={{ ...s.cardTitle, marginBottom: 16 }}>User Accounts ({filtered.length})</div>
          <table style={s.table}>
            <thead>
              <tr>
                {['User ID', 'Name', 'Email', 'Role', 'Status', 'Created Date', 'Last Login', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={s.td}><span style={s.idText}>{u.id}</span></td>
                  <td style={{ ...s.td, fontWeight: 500, color: '#0f1117' }}>{u.name}</td>
                  <td style={{ ...s.td, color: '#64748b' }}>{u.email}</td>
                  <td style={s.td}><RoleBadge role={u.role} /></td>
                  <td style={s.td}><StatusBadge status={u.status} /></td>
                  <td style={{ ...s.td, color: '#64748b' }}>{u.created}</td>
                  <td style={{ ...s.td, color: '#64748b' }}>{u.lastLogin}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button style={s.iconBtn} title="Edit" onClick={() => openEdit(u)}>
                        <span style={{ width: 15, height: 15, display: 'flex', color: '#64748b' }}>{Icons.edit || Icons.settings}</span>
                      </button>
                      <button style={s.iconBtn} title={u.status === 'Active' ? 'Deactivate' : 'Activate'} onClick={() => handleDeactivate(u.id)}>
                        <span style={{ width: 15, height: 15, display: 'flex', color: '#dc2626' }}>{Icons.logout}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '.84rem' }}>
              No users match your filters.
            </div>
          )}
        </div>

      </div>

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {showEdit && (
        <EditUserModal
          user={editForm}
          onClose={() => setShowEdit(false)}
          onSave={handleUpdate}
          onChange={setEditField}
        />
      )}
    </div>
  );
}

function EditUserModal({ user, onClose, onSave, onChange }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 100 }} />
      <div style={m.panel}>
        <div style={m.header}>
          <div style={m.headerTitle}>Edit User</div>
          <button style={m.closeBtn} onClick={onClose}>
            <span style={{ width: 18, height: 18, display: 'flex', color: '#64748b' }}>{Icons.close}</span>
          </button>
        </div>
        <div style={m.divider} />
        <div style={m.body}>
          <div style={m.field}>
            <label style={m.label}>Full Name</label>
            <input style={m.input} placeholder="e.g. Dr. John Smith" value={user.name} onChange={onChange('name')} />
          </div>
          <div style={m.field}>
            <label style={m.label}>Email Address</label>
            <input style={m.input} placeholder="email@happypaws.com" value={user.email} onChange={onChange('email')} />
          </div>
          <div style={m.field}>
            <label style={m.label}>Role</label>
            <select style={m.input} value={user.role} onChange={onChange('role')}>
              <option value="owner">Owner</option>
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>
          <div style={m.field}>
            <label style={m.label}>Status</label>
            <select style={m.input} value={user.status} onChange={onChange('status')}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div style={m.divider} />
        <div style={m.footer}>
          <button style={m.secondaryBtn} onClick={onClose}>Cancel</button>
          <button style={m.primaryBtn} onClick={onSave}>Save Changes</button>
        </div>
      </div>
    </>
  );
}

const s = {
  main: { flex: 1, overflowY: 'auto', background: '#f4f6f9' },
  page: { padding: '24px 28px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 },
  statCard: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 22px' },
  statIcon: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel: { fontSize: '.75rem', color: '#64748b', marginBottom: 4 },
  statValue: { fontFamily: "'Syne', sans-serif", fontSize: '1.9rem', fontWeight: 700, color: '#0f1117', letterSpacing: '-.03em' },
  filterBar: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '14px 20px', marginBottom: 16 },
  searchWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#f4f6f9', border: '1px solid #e8ecf0', borderRadius: 8, padding: '8px 12px' },
  searchIcon: { width: 15, height: 15, display: 'flex', color: '#94a3b8', flexShrink: 0, fontSize: 14 },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '.82rem', color: '#0f1117', width: '100%' },
  select: { padding: '8px 12px', border: '1px solid #e8ecf0', borderRadius: 8, fontSize: '.82rem', color: '#0f1117', background: '#f4f6f9', outline: 'none', cursor: 'pointer' },
  addBtn: { padding: '9px 18px', background: '#0f1117', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.82rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' },
  card: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '20px 22px' },
  cardTitle: { fontSize: '.88rem', fontWeight: 600, color: '#0f1117' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: '.72rem', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' },
  td: { padding: '13px 12px', fontSize: '.8rem', color: '#374151', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  idText: { fontFamily: 'monospace', fontSize: '.78rem', color: '#94a3b8' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' },
};

const m = {
  panel: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 16, width: 440, maxWidth: '90vw', zIndex: 101, boxShadow: '0 20px 60px rgba(0,0,0,.15)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px 16px' },
  headerTitle: { fontSize: '.95rem', fontWeight: 600, color: '#0f1117' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' },
  divider: { height: 1, background: '#f1f5f9' },
  body: { padding: '20px 22px' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: '.78rem', fontWeight: 500, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #e8ecf0', borderRadius: 8, fontSize: '.84rem', color: '#0f1117', outline: 'none', background: '#fff', boxSizing: 'border-box' },
  footer: { display: 'flex', gap: 10, padding: '16px 22px 20px' },
  primaryBtn: { flex: 1, padding: '10px 16px', background: '#0f1117', color: '#fff', border: 'none', borderRadius: 9, fontSize: '.84rem', fontWeight: 500, cursor: 'pointer' },
  secondaryBtn: { padding: '10px 16px', background: '#fff', color: '#0f1117', border: '1px solid #e8ecf0', borderRadius: 9, fontSize: '.84rem', fontWeight: 500, cursor: 'pointer' },
};
