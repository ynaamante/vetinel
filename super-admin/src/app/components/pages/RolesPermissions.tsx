import { Fragment, useState, useEffect } from 'react';
import { Shield, Save, X, CheckCircle, AlertTriangle, Plus, Trash2 } from 'lucide-react';

type PermissionType = 'view' | 'create' | 'edit' | 'delete' | 'export';

interface RolePermissions {
  [feature: string]: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
  };
}

interface Role {
  id?: number;
  name: string;
  description: string;
  permissions: RolePermissions;
}

const featureCategories = {
  'Disease Intelligence': [
    'Intelligence Dashboard',
    'Disease Monitoring',
    'Risk Monitoring',
    'Community Analytics',
    'Reports',
    'Data Sync Status',
  ],
  'Clinic Management': [
    'Clinic Overview',
    'User & Role Management',
    'Financial Monitoring',
    'Audit Trail',
  ],
  'Operations': [
    'Appointment Management',
    'Patient Queue',
    'Billing & Payments',
    'Client Management',
    'Due Dates & Reminders',
  ],
  'Clinical Records': [
    'Pet Profiles',
    'Medical Records',
    'Vaccination Records',
    'Treatment Records',
  ],
};

// TODO: Fetch from /api/roles
const initialRoles: Role[] = [];

export function RolesPermissions() {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPermissionWarning, setShowPermissionWarning] = useState(false);
  const [pendingPermission, setPendingPermission] = useState<{
    feature: string;
    type: PermissionType;
  } | null>(null);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  // Fetch roles from API on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles');
        if (!response.ok) throw new Error('Failed to fetch roles');
        const data = await response.json();
        setRoles(data || []);
        if (data && data.length > 0) setSelectedRole(data[0].name);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        alert('Failed to load roles. Please check your server connection.');
      }
    };
    fetchRoles();
  }, []);

  const getCurrentRole = (): Role | undefined => {
    return roles.find((role) => role.name === selectedRole);
  };

  const getPermissionCount = (type: PermissionType) => {
    const role = getCurrentRole();
    if (!role) return 0;
    return Object.values(role.permissions).filter((p) => p[type]).length;
  };

  const togglePermission = (feature: string, type: PermissionType) => {
    const currentRole = getCurrentRole();
    if (!currentRole) return;
    const currentValue = currentRole.permissions[feature][type];

    // Show warning for critical permissions
    const criticalFeatures = ['User & Role Management', 'Financial Monitoring', 'Audit Trail'];
    const criticalTypes: PermissionType[] = ['delete', 'edit'];

    if (criticalFeatures.includes(feature) && criticalTypes.includes(type) && !currentValue) {
      setPendingPermission({ feature, type });
      setShowPermissionWarning(true);
      return;
    }

    applyPermissionToggle(feature, type);
  };

  const applyPermissionToggle = (feature: string, type: PermissionType) => {
    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.name === selectedRole) {
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [feature]: {
                ...role.permissions[feature],
                [type]: !role.permissions[feature][type],
              },
            },
          };
        }
        return role;
      })
    );
  };

  const confirmPermissionChange = () => {
    if (pendingPermission) {
      applyPermissionToggle(pendingPermission.feature, pendingPermission.type);
    }
    setShowPermissionWarning(false);
    setPendingPermission(null);
  };

  const handleSaveChanges = async () => {
    setShowSaveModal(true);
  };

  const confirmSaveChanges = async () => {
    setShowSaveModal(false);
    const currentRole = getCurrentRole();
    if (!currentRole || currentRole.id == null) {
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
      return;
    }

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/roles/${currentRole.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: currentRole.name,
          description: currentRole.description,
          permissions: currentRole.permissions,
        }),
      });
      if (!response.ok) throw new Error('Failed to save role');
      const updatedRole = await response.json();
      setRoles((prevRoles) =>
        prevRoles.map((role) => (role.id === updatedRole.id ? updatedRole : role))
      );
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save role:', error);
      alert('Failed to save role. Please try again.');
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;

    const allFeatures = Object.values(featureCategories).flat();
    const defaultPermissions: RolePermissions = {};

    allFeatures.forEach((feature) => {
      defaultPermissions[feature] = {
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      };
    });

    const newRole: Role = {
      name: newRoleName,
      description: newRoleDescription || 'Custom role',
      permissions: defaultPermissions,
    };

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch('/api/roles', {
        method: 'POST',
        headers,
        body: JSON.stringify(newRole),
      });
      if (!response.ok) throw new Error('Failed to create role');
      const createdRole = await response.json();
      setRoles([...roles, createdRole]);
      setSelectedRole(createdRole.name);
      setShowAddRoleModal(false);
      setNewRoleName('');
      setNewRoleDescription('');
    } catch (error) {
      console.error('Failed to create role:', error);
      alert('Failed to create role. Please try again.');
    }
  };

  const handleDeleteRole = async () => {
    const currentRole = getCurrentRole();
    if (!currentRole) return;
    if (roles.length <= 1) {
      alert('Cannot delete the last role');
      return;
    }

    if (!currentRole.id) {
      setRoles(roles.filter((r) => r.name !== selectedRole));
      setSelectedRole(roles[0].name === selectedRole ? roles[1].name : roles[0].name);
      setShowDeleteRoleModal(false);
      return;
    }

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/roles/${currentRole.id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete role');
      setRoles(roles.filter((r) => r.name !== selectedRole));
      setSelectedRole(roles[0].name === selectedRole ? roles[1].name : roles[0].name);
      setShowDeleteRoleModal(false);
    } catch (error) {
      console.error('Failed to delete role:', error);
      alert('Failed to delete role. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure role-based access control for the platform
          </p>
        </div>
        <button
          onClick={handleSaveChanges}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Select Role */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Select Role
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddRoleModal(true)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Role
            </button>
            <button
              onClick={() => setShowDeleteRoleModal(true)}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete Role
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role) => (
            <button
              key={role.name}
              onClick={() => setSelectedRole(role.name)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedRole === role.name
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-semibold text-gray-900">{role.name}</div>
                  <div className="text-sm text-gray-500">{role.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Permission Matrix - {selectedRole}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Toggle permissions for each feature module
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  View
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Create
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Edit
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delete
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Export
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!getCurrentRole() ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No roles available. Create a new role to get started.
                  </td>
                </tr>
              ) : (
                Object.entries(featureCategories).map(([category, features]) => (
                  <>
                    <tr key={category} className="bg-gray-50">
                      <td
                        colSpan={6}
                        className="px-6 py-3 text-sm font-semibold text-gray-900"
                      >
                        {category}
                      </td>
                    </tr>
                    {features.map((feature) => {
                      const currentRole = getCurrentRole();
                      const permissions = currentRole?.permissions[feature];
                      return (
                        <tr key={feature} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-blue-600">
                          {feature}
                        </td>
                        {(['view', 'create', 'edit', 'delete', 'export'] as PermissionType[]).map(
                          (type) => (
                            <td key={type} className="px-6 py-4 text-center">
                              <button
                                onClick={() => togglePermission(feature, type)}
                                className={`w-6 h-6 rounded flex items-center justify-center transition-all hover:scale-110 ${
                                  permissions[type]
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                              >
                                {permissions[type] ? (
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                )}
                              </button>
                            </td>
                          )
                        )}
                      </tr>
                    );
                  })}
                </>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Summary */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Permission Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(['view', 'create', 'edit', 'delete', 'export'] as PermissionType[]).map((type) => (
            <div
              key={type}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="text-sm text-gray-500 capitalize">{type}</div>
              <div className="text-3xl font-semibold text-gray-900 mt-1">
                {getPermissionCount(type)}
              </div>
              <div className="text-xs text-gray-500 mt-1">features enabled</div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Changes Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Save className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 text-center mt-4">
                Save Changes?
              </h2>
              <p className="text-sm text-gray-600 text-center mt-2">
                Are you sure you want to save all permission changes? This will update the role
                configuration for all users with this role.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSaveChanges}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 text-center mt-4">
                Changes Saved!
              </h2>
              <p className="text-sm text-gray-600 text-center mt-2">
                All permission changes have been successfully saved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Permission Warning Modal */}
      {showPermissionWarning && pendingPermission && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 text-center mt-4">
                Critical Permission Change
              </h2>
              <p className="text-sm text-gray-600 text-center mt-2">
                You are about to grant <strong>{pendingPermission.type}</strong> access to{' '}
                <strong>{pendingPermission.feature}</strong>. This is a sensitive permission that
                should only be granted to trusted roles.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPermissionWarning(false);
                    setPendingPermission(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPermissionChange}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Add New Role</h2>
                <button
                  onClick={() => setShowAddRoleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g., Nurse"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    placeholder="e.g., Medical assistant role"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddRoleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRole}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Role Modal */}
      {showDeleteRoleModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 text-center mt-4">
                Delete Role?
              </h2>
              <p className="text-sm text-gray-600 text-center mt-2">
                Are you sure you want to delete the <strong>{selectedRole}</strong> role? This
                action cannot be undone and will affect all users assigned to this role.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteRoleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRole}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
