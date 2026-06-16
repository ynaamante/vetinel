import {
  Building2,
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  Shield,
  Settings,
  Trash2,
  Plus,
  Edit,
  Lock,
} from 'lucide-react';
import { Toast } from '../ui/Toast';
import { useEffect, useState } from 'react';

export function Dashboard() {
  const [clinicSummary, setClinicSummary] = useState({
    totalRegisteredClinics: 0,
    newClinicsLast30Days: 0,
    activeClinics: 0,
    pendingApprovals: 0,
    suspendedClinics: 0,
  });
  const [roleCounts, setRoleCounts] = useState({
    doctors: 0,
    newDoctorsLast30Days: 0,
    receptionists: 0,
    newReceptionistsLast30Days: 0,
    totalUsers: 0,
    newUsersLast30Days: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const currentUser = (() => {
    try {
      const u = localStorage.getItem('vetintel_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  })();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Helpers for activity display
  const getActivityIcon = (action: string, table: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('clinic')) return Building2;
    if (lower.includes('user')) return Users;
    if (lower.includes('role')) return Shield;
    if (lower.includes('permission')) return Lock;
    if (lower.includes('setting')) return Settings;
    if (lower.includes('announce')) return AlertCircle;
    if (lower.includes('delete')) return Trash2;
    if (lower.includes('create')) return Plus;
    if (lower.includes('update') || lower.includes('edit')) return Edit;
    return CheckCircle;
  };

  const getActivityColor = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('delete')) {
      return { bg: 'bg-red-100', icon: 'text-red-600', accent: 'bg-red-50' };
    }
    if (lower.includes('create')) {
      return { bg: 'bg-green-100', icon: 'text-green-600', accent: 'bg-green-50' };
    }
    if (lower.includes('update') || lower.includes('edit')) {
      return { bg: 'bg-blue-100', icon: 'text-blue-600', accent: 'bg-blue-50' };
    }
    if (lower.includes('clinic')) {
      return { bg: 'bg-indigo-100', icon: 'text-indigo-600', accent: 'bg-indigo-50' };
    }
    if (lower.includes('user') || lower.includes('role')) {
      return { bg: 'bg-purple-100', icon: 'text-purple-600', accent: 'bg-purple-50' };
    }
    if (lower.includes('setting') || lower.includes('permission')) {
      return { bg: 'bg-orange-100', icon: 'text-orange-600', accent: 'bg-orange-50' };
    }
    if (lower.includes('suspend') || lower.includes('account')) {
      return { bg: 'bg-red-100', icon: 'text-red-600', accent: 'bg-red-50' };
    }
    return { bg: 'bg-slate-100', icon: 'text-slate-600', accent: 'bg-slate-50' };
  };

  const getActivityTitle = (action: string, table: string) => {
    const lower = action.toLowerCase();
    
    // Clinic operations
    if (lower.includes('clinic') && lower.includes('create')) return 'Clinic Registration';
    if (lower.includes('clinic') && (lower.includes('update') || lower.includes('edit'))) return 'Clinic Updated';
    if (lower.includes('clinic') && lower.includes('delete')) return 'Clinic Removed';
    
    // User operations
    if (lower.includes('user') && lower.includes('create')) return 'User Creation';
    if (lower.includes('user') && (lower.includes('update') || lower.includes('edit'))) return 'User Updated';
    if (lower.includes('user') && lower.includes('delete')) return 'User Removed';
    if (lower.includes('soft delete') || lower.includes('suspend')) return 'Account Suspension';
    
    // Role operations
    if (lower.includes('role') && lower.includes('create')) return 'Role Created';
    if (lower.includes('role') && (lower.includes('update') || lower.includes('edit'))) return 'Role Change';
    if (lower.includes('role') && lower.includes('delete')) return 'Role Removed';
    
    // Permission operations
    if (lower.includes('permission') && lower.includes('create')) return 'Permission Added';
    if (lower.includes('permission') && (lower.includes('update') || lower.includes('edit'))) return 'Permission Updated';
    if (lower.includes('permission') && lower.includes('delete')) return 'Permission Removed';
    if (lower.includes('role_permission') && lower.includes('create')) return 'Role Permission Granted';
    if (lower.includes('role_permission') && lower.includes('delete')) return 'Role Permission Revoked';
    
    // Announcement operations
    if (lower.includes('announcement') && lower.includes('create')) return 'Announcement Published';
    if (lower.includes('announcement') && (lower.includes('update') || lower.includes('edit'))) return 'Announcement Updated';
    if (lower.includes('announcement') && lower.includes('delete')) return 'Announcement Removed';
    
    // Setting operations
    if (lower.includes('setting') && lower.includes('create')) return 'Setting Configured';
    if (lower.includes('setting') && (lower.includes('update') || lower.includes('edit'))) return 'Setting Updated';
    if (lower.includes('setting') && lower.includes('delete')) return 'Setting Removed';
    
    // Fallback mapping
    if (lower.includes('delete')) return 'Deletion';
    if (lower.includes('create')) return 'Creation';
    if (lower.includes('update') || lower.includes('edit')) return 'Update';
    
    return action;
  };

  const getActivityDescription = (activity: any) => {
    const action = activity.action || '';
    const changes = activity.changes || {};
    
    // Helper to extract clean string value
    const cleanValue = (val: any) => {
      if (!val) return 'Item';
      return String(val).replace(/^["']|["']$/g, '').trim();
    };
    
    // Clinic operations
    if (action.includes('Created clinic')) {
      const name = cleanValue(changes.name) || 'Clinic';
      const city = changes.city ? ` in ${cleanValue(changes.city)}` : '';
      return `${name}${city} registered`;
    }
    if (action.includes('Updated clinic')) {
      const name = cleanValue(changes.name) || 'Clinic';
      const fields = [];
      if (changes.address) fields.push('address');
      if (changes.contact_email) fields.push('contact info');
      if (changes.phone) fields.push('phone');
      const updates = fields.length > 0 ? ` (${fields.join(', ')})` : '';
      return `${name} updated${updates}`;
    }

    // User operations
    if (action.includes('Created user')) {
      const first = cleanValue(changes.first_name) || 'User';
      const last = changes.last_name ? ` ${cleanValue(changes.last_name)}` : '';
      return `${first}${last} added`;
    }
    if (action.includes('Updated user')) {
      const first = cleanValue(changes.first_name) || 'User';
      const last = changes.last_name ? ` ${cleanValue(changes.last_name)}` : '';
      const fields = [];
      if (changes.email) fields.push('email');
      if (changes.role_id) fields.push('role');
      if (changes.phone) fields.push('contact');
      const updates = fields.length > 0 ? ` (${fields.join(', ')})` : '';
      return `${first}${last} updated${updates}`;
    }
    if (action.includes('Soft deleted user')) {
      const first = cleanValue(changes.first_name) || 'User';
      const last = changes.last_name ? ` ${cleanValue(changes.last_name)}` : '';
      return `${first}${last} suspended`;
    }
    if (action.includes('Deleted user')) {
      const first = cleanValue(changes.first_name) || 'User';
      const last = changes.last_name ? ` ${cleanValue(changes.last_name)}` : '';
      return `${first}${last} permanently removed`;
    }

    // Role operations
    if (action.includes('Created role')) {
      const name = cleanValue(changes.name) || 'New role';
      return `${name} role created`;
    }
    if (action.includes('Updated role')) {
      const name = cleanValue(changes.name) || 'Role';
      return `${name} role updated`;
    }
    if (action.includes('Deleted role')) {
      const name = cleanValue(changes.name) || 'Role';
      return `${name} role removed`;
    }

    // Permission operations
    if (action.includes('Created permission')) {
      const name = cleanValue(changes.name) || 'Permission';
      const resource = changes.resource ? ` for ${cleanValue(changes.resource)}` : '';
      return `${name}${resource} permission added`;
    }
    if (action.includes('Updated permission')) {
      const name = cleanValue(changes.name) || 'Permission';
      return `${name} permission updated`;
    }
    if (action.includes('Deleted permission')) {
      const name = cleanValue(changes.name) || 'Permission';
      return `${name} permission removed`;
    }

    // Role-Permission mapping
    if (action.includes('Created role_permission')) {
      return `Role permission granted`;
    }
    if (action.includes('Deleted role_permission')) {
      return `Role permission revoked`;
    }

    // Announcement operations
    if (action.includes('Created announcement')) {
      const title = cleanValue(changes.title) || 'Announcement';
      return `"${title}" published`;
    }
    if (action.includes('Updated announcement')) {
      const title = cleanValue(changes.title) || 'Announcement';
      return `"${title}" updated`;
    }
    if (action.includes('Deleted announcement')) {
      const title = cleanValue(changes.title) || 'Announcement';
      return `"${title}" removed`;
    }

    // Setting operations
    if (action.includes('Created setting')) {
      const key = cleanValue(changes.key) || 'Setting';
      return `"${key}" configured`;
    }
    if (action.includes('Updated setting')) {
      const key = cleanValue(changes.key) || 'Setting';
      return `"${key}" updated`;
    }
    if (action.includes('Deleted setting')) {
      const key = cleanValue(changes.key) || 'Setting';
      return `"${key}" removed`;
    }

    // Fallback
    return action.replace(/^[A-Z]/, (c) => c.toLowerCase());
  };

  const formatTimeAgo = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) throw new Error('Failed to load dashboard stats');
        const data = await response.json();
        setClinicSummary(data.clinicSummary || {});
        setRoleCounts(data.roleCounts || {});
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch recent activity for the Recent Activity card
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch('/api/dashboard/activity');
        if (!res.ok) throw new Error('Failed to load recent activity');
        const data = await res.json();
        setRecentActivities(data || []);
      } catch (e) {
        console.error('Failed to fetch recent activity', e);
      }
    };
    fetchRecent();
  }, []);

  const formatNewMetric = (count, unit) => {
    if (count === 0) return `No new ${unit} this month`;
    return `+${count} new ${unit} this month`;
  };

  const statusCards = [
    {
      label: 'Total Registered Clinics',
      value: clinicSummary.totalRegisteredClinics,
      icon: Building2,
      color: 'bg-slate-100 text-slate-900',
      delta: formatNewMetric(clinicSummary.newClinicsLast30Days, 'clinics'),
      deltaColor: clinicSummary.newClinicsLast30Days > 0 ? 'text-emerald-600' : 'text-slate-500',
    },
    {
      label: 'Active Clinics',
      value: clinicSummary.activeClinics,
      icon: CheckCircle,
      color: 'bg-emerald-100 text-emerald-700',
      delta: 'Current active clinic count',
      deltaColor: 'text-slate-500',
    },
    {
      label: 'Pending Approvals',
      value: clinicSummary.pendingApprovals,
      icon: Clock,
      color: 'bg-amber-100 text-amber-700',
      delta: 'As of today',
      deltaColor: 'text-slate-500',
    },
    {
      label: 'Suspended Clinics',
      value: clinicSummary.suspendedClinics,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-700',
      delta: 'As of today',
      deltaColor: 'text-slate-500',
    },
  ];

  const summaryCards = [
    {
      label: 'Total Doctors',
      value: roleCounts.doctors,
      icon: UserCheck,
      color: 'bg-violet-100 text-violet-700',
      delta: formatNewMetric(roleCounts.newDoctorsLast30Days, 'doctors'),
      deltaColor: roleCounts.newDoctorsLast30Days > 0 ? 'text-emerald-600' : 'text-slate-500',
    },
    {
      label: 'Total Receptionists',
      value: roleCounts.receptionists,
      icon: Users,
      color: 'bg-indigo-100 text-indigo-700',
      delta: formatNewMetric(roleCounts.newReceptionistsLast30Days, 'receptionists'),
      deltaColor: roleCounts.newReceptionistsLast30Days > 0 ? 'text-emerald-600' : 'text-slate-500',
    },
    {
      label: 'Total Platform Users',
      value: roleCounts.totalUsers,
      icon: Building2,
      color: 'bg-cyan-100 text-cyan-700',
      delta: formatNewMetric(roleCounts.newUsersLast30Days, 'users'),
      deltaColor: roleCounts.newUsersLast30Days > 0 ? 'text-emerald-600' : 'text-slate-500',
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Platform overview and key performance indicators</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statusCards.map((card) => (
          <div key={card.label} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-3xl font-semibold text-slate-900 mt-3">{card.value}</p>
                <p className={`text-sm mt-2 ${card.deltaColor}`}>{card.delta}</p>
              </div>
              <div className={`p-3 rounded-3xl ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-3xl font-semibold text-slate-900 mt-3">{card.value}</p>
                <p className={`text-sm mt-2 ${card.deltaColor}`}>{card.delta}</p>
              </div>
              <div className={`p-3 rounded-3xl ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            {isSuperAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1.5 rounded-md bg-red-50 text-red-600 text-sm hover:bg-red-100"
                >
                  Clear Recent
                </button>
              </div>
            )}
          </div>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No recent activity yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.slice(0, 10).map((a) => {
                const Icon = getActivityIcon(a.action, a.entity_type);
                const colors = getActivityColor(a.action);
                const title = getActivityTitle(a.action, a.entity_type);
                const description = getActivityDescription(a);
                const timeAgo = formatTimeAgo(a.created_at);

                return (
                  <div
                    key={a.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl border border-slate-100 transition-all hover:border-slate-200 hover:shadow-sm ${colors.accent}`}
                  >
                    <div className={`p-3 rounded-lg ${colors.bg} flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{title}</p>
                        <p className="text-xs text-slate-400 flex-shrink-0">{timeAgo}</p>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 text-center">Clear Recent Activity</h2>
              <p className="text-sm text-gray-600 text-center mt-2">This will archive recent activity logs. Are you sure?</p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('vetintel_token');
                      const headers: any = {};
                      if (token) headers.Authorization = `Bearer ${token}`;
                      const res = await fetch('/api/dashboard/activity', { method: 'DELETE', headers });
                      if (!res.ok) throw new Error('Failed to clear recent activity');
                      setRecentActivities([]);
                      setShowClearConfirm(false);
                      setToast('Recent activity archived');
                      setTimeout(() => setToast(null), 3000);
                    } catch (e) {
                      console.error(e);
                      setToast('Failed to clear activity');
                      setTimeout(() => setToast(null), 3000);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
