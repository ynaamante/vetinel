import { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Building2,
  Users,
  Shield,
  Settings,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
} from 'lucide-react';

const auditLogs = [
  {
    id: 1,
    action: 'Clinic Approved',
    user: 'Super Admin',
    details: 'PetCare Veterinary Hospital approved and activated',
    clinic: 'PetCare Veterinary Hospital',
    timestamp: '2026-05-29 10:30 AM',
    category: 'Clinic Management',
    severity: 'info',
    icon: CheckCircle,
  },
  {
    id: 2,
    action: 'User Created',
    user: 'Super Admin',
    details: 'New doctor account created for Dr. Sarah Johnson',
    clinic: 'Happy Paws Veterinary Clinic',
    timestamp: '2026-05-29 09:45 AM',
    category: 'User Management',
    severity: 'info',
    icon: Users,
  },
  {
    id: 3,
    action: 'Role Changed',
    user: 'Super Admin',
    details: 'John Doe role changed from Doctor to Clinic Owner',
    clinic: 'Companion Animal Clinic',
    timestamp: '2026-05-29 08:15 AM',
    category: 'Role Management',
    severity: 'warning',
    icon: Shield,
  },
  {
    id: 4,
    action: 'Clinic Suspended',
    user: 'Super Admin',
    details: 'Sunset Veterinary Clinic suspended for policy violation',
    clinic: 'Sunset Veterinary Clinic',
    timestamp: '2026-05-28 05:30 PM',
    category: 'Clinic Management',
    severity: 'error',
    icon: AlertCircle,
  },
  {
    id: 5,
    action: 'Permission Updated',
    user: 'Super Admin',
    details: 'Doctor role permissions updated for Medical Records',
    clinic: 'All Clinics',
    timestamp: '2026-05-28 03:20 PM',
    category: 'Role Management',
    severity: 'info',
    icon: Shield,
  },
  {
    id: 6,
    action: 'User Disabled',
    user: 'Super Admin',
    details: 'Dr. Robert Kim account disabled',
    clinic: 'Sunset Veterinary Clinic',
    timestamp: '2026-05-28 02:45 PM',
    category: 'User Management',
    severity: 'warning',
    icon: Users,
  },
  {
    id: 7,
    action: 'Clinic Registered',
    user: 'System',
    details: 'New clinic registration: City Pet Hospital',
    clinic: 'City Pet Hospital',
    timestamp: '2026-05-28 11:30 AM',
    category: 'Clinic Management',
    severity: 'info',
    icon: Building2,
  },
  {
    id: 8,
    action: 'Settings Modified',
    user: 'Super Admin',
    details: 'System notification settings updated',
    clinic: 'Platform',
    timestamp: '2026-05-27 04:15 PM',
    category: 'System Settings',
    severity: 'info',
    icon: Settings,
  },
];

const categories = [
  'All Categories',
  'Clinic Management',
  'User Management',
  'Role Management',
  'System Settings',
];

const severityColors = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};

export function AuditTrail() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.clinic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All Categories' ||
      log.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete history of all administrative actions
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Logs
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Actions</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {auditLogs.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {
                  auditLogs.filter((log) =>
                    log.timestamp.includes('2026-05-29')
                  ).length
                }
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {auditLogs.filter((log) => log.severity === 'warning').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {auditLogs.filter((log) => log.severity === 'error').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action, user, clinic, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clinic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          severityColors[log.severity as keyof typeof severityColors]
                        }`}
                      >
                        <log.icon className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {log.action}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.clinic}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
