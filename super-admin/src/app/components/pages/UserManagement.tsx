import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Users,
  UserPlus,
  MoreVertical,
  Edit,
  Shield,
  Ban,
  Key,
  CheckCircle,
  XCircle,
  Trash2,
  Archive,
  RotateCcw,
  X,
  AlertTriangle,
  Clock,
  CheckCheck,
} from 'lucide-react';

type UserStatus = 'Active' | 'Disabled';

type User = {
  id: number;
  name: string;
  email: string;
  clinic: string;
  role: string;
  status: UserStatus;
  lastLogin: string;
};

type ArchivedUser = User & {
  deletedAt: Date;
  expiresAt: Date;
};

function daysLeft(expiresAt: Date) {
  const ms = expiresAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  return (
    <div className={`w-${size} h-${size} bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-sm text-white">{initials}</span>
    </div>
  );
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [archived, setArchived] = useState<ArchivedUser[]>([]);
  const [availableClinics, setAvailableClinics] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [actionMenuRect, setActionMenuRect] = useState<DOMRect | null>(null);
  const actionButtonsRef = useRef<Record<number, HTMLButtonElement | null>>({});
  const actionMenuContentRef = useRef<HTMLDivElement | null>(null);

  const clinicExists = (clinicName: string) => availableClinics.includes(clinicName);
  const [activeTab, setActiveTab] = useState<'users' | 'archive'>('users');

  // Modals
  const [editUser, setEditUser] = useState<User | null>(null);
  const [assignRoleUser, setAssignRoleUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [disableConfirmUser, setDisableConfirmUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [restoreConfirmUser, setRestoreConfirmUser] = useState<ArchivedUser | null>(null);
  const [permanentDeleteUser, setPermanentDeleteUser] = useState<ArchivedUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [editForm, setEditForm] = useState({ name: '', email: '', clinic: '', role: '' });
  const [newRole, setNewRole] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', email: '', clinic: '', role: '', password: '' });

  // Fetch users from API on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        // Map database users to component User type
        setUsers(data.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          clinic: user.clinic || 'Unassigned',
          role: user.role || 'Unassigned',
          status: user.is_active ? 'Active' : 'Disabled',
          lastLogin: new Date(user.updated_at).toLocaleDateString(),
        })));
      } catch (error) {
        console.error('Failed to fetch users:', error);
        showToast('Failed to load users', 'error');
      }
    };

    const fetchClinics = async () => {
      try {
        const response = await fetch('/api/clinics');
        if (!response.ok) throw new Error('Failed to fetch clinics');
        const data = await response.json();
        setAvailableClinics(data.map((clinic: any) => clinic.name));
      } catch (error) {
        console.error('Failed to fetch clinics:', error);
      }
    };

    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles');
        if (!response.ok) throw new Error('Failed to fetch roles');
        const data = await response.json();
        setAvailableRoles(data.map((role: any) => role.name));
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };

    fetchUsers();
    fetchClinics();
    fetchRoles();
  }, []);

  // Purge expired archived users
  useEffect(() => {
    const interval = setInterval(() => {
      setArchived(prev => prev.filter(u => u.expiresAt.getTime() > Date.now()));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close action menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        actionMenuContentRef.current?.contains(e.target as Node) ||
        Object.values(actionButtonsRef.current).some(button => button?.contains(e.target as Node))
      ) {
        return;
      }
      setShowActionMenu(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (showActionMenu === null) return;
    function updatePosition() {
      const button = actionButtonsRef.current[showActionMenu as number];
      if (button) {
        setActionMenuRect(button.getBoundingClientRect());
      }
    }
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showActionMenu]);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const clinics = Array.from(new Set(users.map(u => u.clinic)));

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.clinic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesClinic = selectedClinic === 'all' || user.clinic === selectedClinic;
    return matchesSearch && matchesRole && matchesClinic;
  });

  // --- Actions ---
  function openEdit(user: User) {
    setEditForm({ name: user.name, email: user.email, clinic: user.clinic, role: user.role });
    setEditUser(user);
    setShowActionMenu(null);
  }

  async function saveEdit() {
    if (!editUser) return;

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          clinic_name: editForm.clinic,
          role_name: editForm.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to update user.', 'error');
        return;
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(u =>
        u.id === updatedUser.id
          ? {
              ...u,
              name: updatedUser.name,
              email: updatedUser.email,
              clinic: updatedUser.clinic,
              role: updatedUser.role,
              status: updatedUser.is_active ? 'Active' : 'Disabled',
            }
          : u
      ));
      setEditUser(null);
      showToast('User updated successfully.');
    } catch (error) {
      console.error('Failed to update user:', error);
      showToast('Failed to update user.', 'error');
    }
  }

  function openAssignRole(user: User) {
    setNewRole(user.role);
    setAssignRoleUser(user);
    setShowActionMenu(null);
  }

  async function saveAssignRole() {
    if (!assignRoleUser) return;

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/users/${assignRoleUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role_name: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to assign role.', 'error');
        return;
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(u =>
        u.id === updatedUser.id
          ? { ...u, role: updatedUser.role }
          : u
      ));
      setAssignRoleUser(null);
      showToast(`Role updated to "${newRole}".`);
    } catch (error) {
      console.error('Failed to assign role:', error);
      showToast('Failed to assign role.', 'error');
    }
  }

  function openResetPassword(user: User) {
    setNewPassword('');
    setConfirmPassword('');
    setResetPasswordUser(user);
    setShowActionMenu(null);
  }

  async function saveResetPassword() {
    if (newPassword !== confirmPassword) { showToast('Passwords do not match.', 'error'); return; }
    if (newPassword.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return; }
    if (!resetPasswordUser) return;

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/users/${resetPasswordUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to reset password.', 'error');
        return;
      }

      setResetPasswordUser(null);
      showToast(`Password reset for ${resetPasswordUser.name}.`);
    } catch (error) {
      console.error('Failed to reset password:', error);
      showToast('Failed to reset password.', 'error');
    }
  }

  function confirmDisable(user: User) {
    setDisableConfirmUser(user);
    setShowActionMenu(null);
  }

  async function executeDisable() {
    if (!disableConfirmUser) return;
    const nextActive = disableConfirmUser.status === 'Active' ? false : true;

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/users/${disableConfirmUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ is_active: nextActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to update user status.', 'error');
        return;
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(u =>
        u.id === updatedUser.id
          ? { ...u, status: updatedUser.is_active ? 'Active' : 'Disabled' }
          : u
      ));
      setDisableConfirmUser(null);
      showToast(`User ${updatedUser.is_active ? 'enabled' : 'disabled'} successfully.`);
    } catch (error) {
      console.error('Failed to update user status:', error);
      showToast('Failed to update user status.', 'error');
    }
  }

  function confirmDelete(user: User) {
    setDeleteConfirmUser(user);
    setShowActionMenu(null);
  }

  async function executeDelete() {
    if (!deleteConfirmUser) return;

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/users/${deleteConfirmUser.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to delete user.', 'error');
        return;
      }

      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setArchived(prev => [...prev, { ...deleteConfirmUser, deletedAt: now, expiresAt: expires }]);
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
      showToast(`${deleteConfirmUser.name} moved to archive. Restoreable for 30 days.`);
      setDeleteConfirmUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      showToast('Failed to delete user.', 'error');
    }
  }

  function confirmRestore(user: ArchivedUser) {
    setRestoreConfirmUser(user);
  }

  async function executeRestore() {
    if (!restoreConfirmUser) return;

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/users/${restoreConfirmUser.id}/restore`, {
        method: 'PUT',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to restore user.', 'error');
        return;
      }

      const restoredUser = await response.json();
      setUsers(prev => [...prev, { ...restoredUser, status: restoredUser.is_active ? 'Active' : 'Disabled' }]);
      setArchived(prev => prev.filter(u => u.id !== restoreConfirmUser.id));
      showToast(`${restoredUser.name} restored successfully.`);
      setRestoreConfirmUser(null);
    } catch (error) {
      console.error('Failed to restore user:', error);
      showToast('Failed to restore user.', 'error');
    }
  }

  function confirmPermanentDelete(user: ArchivedUser) {
    setPermanentDeleteUser(user);
  }

  async function executePermanentDelete() {
    if (!permanentDeleteUser) return;

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/users/${permanentDeleteUser.id}/permanent`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to permanently delete user.', 'error');
        return;
      }

      setArchived(prev => prev.filter(u => u.id !== permanentDeleteUser.id));
      showToast(`${permanentDeleteUser.name} permanently deleted.`);
      setPermanentDeleteUser(null);
    } catch (error) {
      console.error('Failed to permanently delete user:', error);
      showToast('Failed to permanently delete user.', 'error');
    }
  }

  async function createUser() {
if (!createForm.name || !createForm.email || !createForm.clinic || !createForm.role || !createForm.password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (!availableClinics.includes(createForm.clinic)) {
      showToast('Please create the clinic first before assigning a user to it.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          clinic_name: createForm.clinic,
          role_name: createForm.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to create user.', 'error');
        return;
      }

      const user = await response.json();
      setUsers(prev => [...prev, {
        id: user.id,
        name: user.name,
        email: user.email,
        clinic: createForm.clinic,
        role: createForm.role,
        status: user.is_active ? 'Active' : 'Disabled',
        lastLogin: 'Never',
      }] as User[]);
      setCreateForm({ name: '', email: '', clinic: '', role: '' });
      setShowCreateModal(false);
      showToast(`${user.name} created successfully.`);
    } catch (error) {
      console.error('Failed to create user:', error);
      showToast('Failed to create user.', 'error');
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all users across all clinics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(activeTab === 'archive' ? 'users' : 'archive')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm border ${activeTab === 'archive' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            <Archive className="w-4 h-4" />
            Archive
            {archived.length > 0 && (
              <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{archived.length}</span>
            )}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: users.length, icon: <Users className="w-6 h-6 text-blue-700" />, bg: 'bg-blue-100' },
          { label: 'Active Users', value: users.filter(u => u.status === 'Active').length, icon: <CheckCircle className="w-6 h-6 text-green-700" />, bg: 'bg-green-100' },
          { label: 'Clinic Owners', value: users.filter(u => u.role === 'Clinic Owner').length, icon: <Shield className="w-6 h-6 text-purple-700" />, bg: 'bg-purple-100' },
          { label: 'Disabled Users', value: users.filter(u => u.status === 'Disabled').length, icon: <XCircle className="w-6 h-6 text-red-700" />, bg: 'bg-red-100' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`p-3 ${card.bg} rounded-lg`}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or clinic..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Roles</option>
                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={selectedClinic} onChange={e => setSelectedClinic(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Clinics</option>
                {clinics.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Name', 'Email', 'Clinic', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">No users found.</td></tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} />
                          <span className="text-sm font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.clinic}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.lastLogin}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* Edit icon */}
                          <button onClick={() => openEdit(user)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit User">
                            <Edit className="w-4 h-4" />
                          </button>
                          {/* Delete icon */}
                          <button onClick={() => confirmDelete(user)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete User">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {/* More actions */}
                          <div className="relative inline-block">
                            <button
                              ref={(el) => { actionButtonsRef.current[user.id] = el; }}
                              onClick={() => {
                                const rect = actionButtonsRef.current[user.id]?.getBoundingClientRect();
                                if (rect) setActionMenuRect(rect);
                                setShowActionMenu(showActionMenu === user.id ? null : user.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {showActionMenu === user.id && actionMenuRect && createPortal(
                              <div
                                ref={actionMenuContentRef}
                                style={{
                                  position: 'fixed',
                                  top: actionMenuRect.bottom + 8,
                                  left: Math.min(actionMenuRect.right - 192, window.innerWidth - 208),
                                  width: 192,
                                  zIndex: 9999,
                                }}
                              >
                                <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                                  <button onClick={() => openEdit(user)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    <Edit className="w-4 h-4" /> Edit User
                                  </button>
                                  <button onClick={() => openAssignRole(user)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    <Shield className="w-4 h-4" /> Assign Role
                                  </button>
                                  <button onClick={() => openResetPassword(user)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    <Key className="w-4 h-4" /> Reset Password
                                  </button>
                                  <div className="border-t border-gray-100 my-1" />
                                  <button onClick={() => confirmDisable(user)} className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${user.status === 'Active' ? 'text-red-600' : 'text-green-600'}`}>
                                    <Ban className="w-4 h-4" />
                                    {user.status === 'Active' ? 'Disable User' : 'Enable User'}
                                  </button>
                                  <button onClick={() => confirmDelete(user)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" /> Delete User
                                  </button>
                                </div>
                              </div>,
                              document.body
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Archive Tab */
        <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-200 bg-amber-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-amber-900">Archived Users</h2>
              <span className="text-sm text-amber-600">— Deleted users are automatically purged after 30 days</span>
            </div>
            <button onClick={() => setActiveTab('users')} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          {archived.length === 0 ? (
            <div className="py-16 text-center">
              <Archive className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No archived users</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['User', 'Email', 'Clinic', 'Role', 'Deleted On', 'Time Remaining', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {archived.map(user => {
                    const days = daysLeft(user.expiresAt);
                    const urgent = days <= 7;
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm text-white">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-500">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.clinic}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {user.deletedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center gap-1.5 text-sm font-medium ${urgent ? 'text-red-600' : 'text-amber-600'}`}>
                            <Clock className="w-4 h-4" />
                            {days} day{days !== 1 ? 's' : ''} left
                          </div>
                          <div className="mt-1 w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${urgent ? 'bg-red-500' : 'bg-amber-400'}`}
                              style={{ width: `${(days / 30) * 100}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => confirmRestore(user)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Restore
                            </button>
                            <button
                              onClick={() => confirmPermanentDelete(user)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Forever
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}

      {/* Create User */}
      {showCreateModal && (
        <Modal title="Create New User" onClose={() => setShowCreateModal(false)}>
          <div className="space-y-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Dr. John Doe' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'john.doe@clinic.com' },
              { label: 'Password', key: 'password', type: 'password', placeholder: 'Create a secure password' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  name={f.key}
                  type={f.type}
                  value={(createForm as any)[f.key]}
                  onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinic</label>
              <select name="clinic" value={createForm.clinic} onChange={e => setCreateForm(p => ({ ...p, clinic: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select clinic</option>
                {availableClinics.length === 0 ? (
                  <option value="" disabled>No clinics available. Add a clinic first.</option>
                ) : (
                  availableClinics.map(c => <option key={c} value={c}>{c}</option>)
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={createForm.role}
                onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                disabled={!createForm.clinic || !clinicExists(createForm.clinic) || availableRoles.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Select role</option>
                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {availableRoles.length === 0 && (
                <p className="text-xs text-red-600 mt-2">No roles available. Create roles first on the Roles & Permissions page.</p>
              )}
              {!createForm.clinic && (
                <p className="text-xs text-red-600 mt-2">Please choose a clinic before selecting a role.</p>
              )}
              {createForm.clinic && !clinicExists(createForm.clinic) && (
                <p className="text-xs text-red-600 mt-2">Clinic does not exist. Add the clinic first.</p>
              )}
            </div>
          </div>
          <ModalFooter onCancel={() => setShowCreateModal(false)} onConfirm={createUser} confirmLabel="Create User" confirmClass="bg-blue-600 hover:bg-blue-700 text-white" />
        </Modal>
      )}

      {/* Edit User */}
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-lg">
            <Avatar name={editUser.name} />
            <div>
              <p className="text-sm font-medium text-gray-900">{editUser.name}</p>
              <p className="text-xs text-gray-500">{editUser.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type={f.type}
                  value={(editForm as any)[f.key]}
                  onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinic</label>
              <select value={editForm.clinic} onChange={e => setEditForm(p => ({ ...p, clinic: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {clinics.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <ModalFooter onCancel={() => setEditUser(null)} onConfirm={saveEdit} confirmLabel="Save Changes" confirmClass="bg-blue-600 hover:bg-blue-700 text-white" />
        </Modal>
      )}

      {/* Assign Role */}
      {assignRoleUser && (
        <Modal title="Assign Role" onClose={() => setAssignRoleUser(null)}>
          <p className="text-sm text-gray-600 mb-4">Select a new role for <span className="font-medium text-gray-900">{assignRoleUser.name}</span>.</p>
          <div className="space-y-2">
            {availableRoles.length === 0 ? (
              <p className="text-sm text-red-600">No roles available. Create roles first in Roles & Permissions.</p>
            ) : availableRoles.map(r => (
              <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${newRole === r ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="role" value={r} checked={newRole === r} onChange={() => setNewRole(r)} className="text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{r}</p>
                </div>
              </label>
            ))}
          </div>
          <ModalFooter onCancel={() => setAssignRoleUser(null)} onConfirm={saveAssignRole} confirmLabel="Assign Role" confirmClass="bg-blue-600 hover:bg-blue-700 text-white" />
        </Modal>
      )}

      {/* Reset Password */}
      {resetPasswordUser && (
        <Modal title="Reset Password" onClose={() => setResetPasswordUser(null)}>
          <p className="text-sm text-gray-600 mb-4">Set a new password for <span className="font-medium text-gray-900">{resetPasswordUser.name}</span>.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Passwords do not match.</p>
            )}
          </div>
          <ModalFooter onCancel={() => setResetPasswordUser(null)} onConfirm={saveResetPassword} confirmLabel="Reset Password" confirmClass="bg-blue-600 hover:bg-blue-700 text-white" />
        </Modal>
      )}

      {/* Disable / Enable Confirm */}
      {disableConfirmUser && (
        <Modal title={disableConfirmUser.status === 'Active' ? 'Disable User' : 'Enable User'} onClose={() => setDisableConfirmUser(null)} icon={<Ban className="w-6 h-6 text-red-600" />} iconBg="bg-red-100">
          <p className="text-sm text-gray-600">
            {disableConfirmUser.status === 'Active'
              ? <>Are you sure you want to disable <span className="font-medium text-gray-900">{disableConfirmUser.name}</span>? They will lose access to the system immediately.</>
              : <>Re-enable <span className="font-medium text-gray-900">{disableConfirmUser.name}</span>? They will regain access to the system.</>
            }
          </p>
          <ModalFooter
            onCancel={() => setDisableConfirmUser(null)}
            onConfirm={executeDisable}
            confirmLabel={disableConfirmUser.status === 'Active' ? 'Disable User' : 'Enable User'}
            confirmClass={disableConfirmUser.status === 'Active' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirmUser && (
        <Modal title="Delete User" onClose={() => setDeleteConfirmUser(null)} icon={<Trash2 className="w-6 h-6 text-red-600" />} iconBg="bg-red-100">
          <p className="text-sm text-gray-600 mb-3">
            Are you sure you want to delete <span className="font-medium text-gray-900">{deleteConfirmUser.name}</span>?
          </p>
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Archive className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">This user will be moved to the archive and can be restored within <span className="font-semibold">30 days</span> before being permanently deleted.</p>
          </div>
          <ModalFooter onCancel={() => setDeleteConfirmUser(null)} onConfirm={executeDelete} confirmLabel="Delete & Archive" confirmClass="bg-red-600 hover:bg-red-700 text-white" />
        </Modal>
      )}

      {/* Restore Confirm */}
      {restoreConfirmUser && (
        <Modal title="Restore User" onClose={() => setRestoreConfirmUser(null)} icon={<RotateCcw className="w-6 h-6 text-green-600" />} iconBg="bg-green-100">
          <p className="text-sm text-gray-600">
            Restore <span className="font-medium text-gray-900">{restoreConfirmUser.name}</span> to active users? They will regain access with their previous role and clinic.
          </p>
          <ModalFooter onCancel={() => setRestoreConfirmUser(null)} onConfirm={executeRestore} confirmLabel="Restore User" confirmClass="bg-green-600 hover:bg-green-700 text-white" />
        </Modal>
      )}

      {/* Permanent Delete Confirm */}
      {permanentDeleteUser && (
        <Modal title="Permanently Delete" onClose={() => setPermanentDeleteUser(null)} icon={<AlertTriangle className="w-6 h-6 text-red-600" />} iconBg="bg-red-100">
          <p className="text-sm text-gray-600 mb-3">
            Permanently delete <span className="font-medium text-gray-900">{permanentDeleteUser.name}</span>? This action <span className="font-semibold text-red-600">cannot be undone</span>.
          </p>
          <ModalFooter onCancel={() => setPermanentDeleteUser(null)} onConfirm={executePermanentDelete} confirmLabel="Delete Forever" confirmClass="bg-red-600 hover:bg-red-700 text-white" />
        </Modal>
      )}
    </div>
  );
}

// ── Shared modal primitives ──

function Modal({ title, children, onClose, icon, iconBg }: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  icon?: React.ReactNode;
  iconBg?: string;
}) {
  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {icon && <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, confirmLabel, confirmClass }: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmClass: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
        Cancel
      </button>
      <button onClick={onConfirm} className={`flex-1 px-4 py-2 rounded-lg text-sm ${confirmClass}`}>
        {confirmLabel}
      </button>
    </div>
  );
}
