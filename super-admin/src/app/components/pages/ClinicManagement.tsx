import { useState } from 'react';
import { Link } from 'react-router';
import {
  Search,
  Filter,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Eye,
  CheckSquare,
  Pause,
  PlayCircle,
  Edit,
  Download,
  Users,
  X,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
};

export type ClinicRecord = {
  id: number;
  name: string;
  owner: string;
  email?: string;
  phone?: string;
  address?: string;
  registrationDate: string;
  doctors: number;
  receptionists: number;
  totalStaff: number;
  status: 'active' | 'pending' | 'suspended';
};

const clinicsData: ClinicRecord[] = [
  { id: 1, name: 'Happy Paws Veterinary Clinic', owner: 'Dr. Michael Chen', email: 'michael.chen@happypaws.com', phone: '+1 (555) 123-4567', address: '123 Main Street, San Francisco, CA 94102', registrationDate: '2024-01-15', doctors: 8, receptionists: 4, totalStaff: 12, status: 'active' as const },
  { id: 2, name: 'PetCare Animal Hospital', owner: 'Dr. Sarah Johnson', email: 'sarah.johnson@petcare.com', phone: '+1 (555) 234-5678', address: '456 Oak Avenue, Los Angeles, CA 90001', registrationDate: '2024-03-22', doctors: 12, receptionists: 6, totalStaff: 18, status: 'active' as const },
  { id: 3, name: 'Sunrise Veterinary Services', owner: 'Dr. James Rodriguez', email: 'james.rodriguez@sunrise.com', phone: '+1 (555) 345-6789', address: '789 Elm Street, San Diego, CA 92101', registrationDate: '2024-05-10', doctors: 5, receptionists: 2, totalStaff: 7, status: 'pending' as const },
  { id: 4, name: 'Companion Animal Clinic', owner: 'Dr. Emily Watson', email: 'emily.watson@companion.com', phone: '+1 (555) 456-7890', address: '321 Pine Road, Sacramento, CA 95814', registrationDate: '2023-11-08', doctors: 10, receptionists: 5, totalStaff: 15, status: 'active' as const },
  { id: 5, name: 'Sunset Veterinary Clinic', owner: 'Dr. Robert Kim', email: 'robert.kim@sunset.com', phone: '+1 (555) 567-8901', address: '654 Cedar Lane, San Jose, CA 95101', registrationDate: '2023-08-19', doctors: 6, receptionists: 3, totalStaff: 9, status: 'suspended' as const },
  { id: 6, name: 'Animal Care Center', owner: 'Dr. Lisa Anderson', email: 'lisa.anderson@animalcare.com', phone: '+1 (555) 678-9012', address: '987 Maple Drive, Fresno, CA 93701', registrationDate: '2024-04-05', doctors: 7, receptionists: 3, totalStaff: 10, status: 'active' as const },
  { id: 7, name: 'City Pet Hospital', owner: 'Dr. David Lee', email: 'david.lee@citypet.com', phone: '+1 (555) 789-0123', address: '147 Birch Blvd, Long Beach, CA 90802', registrationDate: '2024-05-28', doctors: 4, receptionists: 2, totalStaff: 6, status: 'pending' as const },
  { id: 8, name: 'Healing Paws Veterinary', owner: 'Dr. Maria Garcia', email: 'maria.garcia@healingpaws.com', phone: '+1 (555) 890-1234', address: '258 Walnut St, Oakland, CA 94601', registrationDate: '2024-02-14', doctors: 9, receptionists: 5, totalStaff: 14, status: 'active' as const },
];

export function ClinicManagement() {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<number | null>(null);
  const [clinics, setClinics] = useState<ClinicRecord[]>(clinicsData);
  const [editingClinic, setEditingClinic] = useState<ClinicRecord | null>(null);
  const [editForm, setEditForm] = useState({ name: '', owner: '', email: '', phone: '', address: '' });
  const [toast, setToast] = useState<string | null>(null);

  function openEditModal(clinic: ClinicRecord) {
    setEditForm({ name: clinic.name, owner: clinic.owner, email: clinic.email ?? '', phone: clinic.phone ?? '', address: clinic.address ?? '' });
    setEditingClinic(clinic);
    setShowActionMenu(null);
  }

  function saveEdit() {
    if (!editingClinic) return;
    setClinics(prev => prev.map(c => c.id === editingClinic.id ? { ...c, ...editForm } : c));
    setEditingClinic(null);
    setToast('Clinic information updated successfully.');
    setTimeout(() => setToast(null), 3000);
  }

  const filteredClinics = clinics.filter((clinic) => {
    const matchesStatus =
      selectedStatus === 'all' || clinic.status === selectedStatus;
    const matchesSearch =
      clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.owner.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const summaryCards = [
    { label: 'Total Clinics', value: clinics.length, icon: Building2, color: 'blue' },
    { label: 'Active Clinics', value: clinics.filter((c) => c.status === 'active').length, icon: CheckCircle, color: 'green' },
    { label: 'Pending Approval', value: clinics.filter((c) => c.status === 'pending').length, icon: Clock, color: 'yellow' },
    { label: 'Suspended Clinics', value: clinics.filter((c) => c.status === 'suspended').length, icon: XCircle, color: 'red' },
  ];

  const handleApprove = () => {
    setShowApproveModal(false);
    setSelectedClinic(null);
    // Show success notification
  };

  const handleSuspend = () => {
    setShowSuspendModal(false);
    setSelectedClinic(null);
    // Show success notification
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Clinic Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {clinicsData.length} clinics registered in VetIntel
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Clinics Overview
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'detailed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Detailed View
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {card.value}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  card.color === 'blue'
                    ? 'bg-blue-100 text-blue-700'
                    : card.color === 'green'
                    ? 'bg-green-100 text-green-700'
                    : card.color === 'yellow'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Clinics Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Filters and Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clinics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedStatus === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedStatus('active')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedStatus === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setSelectedStatus('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setSelectedStatus('suspended')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedStatus === 'suspended'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Suspended
                </button>
              </div>
            </div>
          </div>

          {/* Clinics Overview Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clinic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClinics.map((clinic) => (
                    <tr key={clinic.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-blue-700" />
                          </div>
                          <div className="ml-4">
                            <Link
                              to={`/clinics/${clinic.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              {clinic.name}
                            </Link>
                            <div className="text-xs text-gray-500">
                              {clinic.owner}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {clinic.totalStaff}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusColors[clinic.status]
                          }`}
                        >
                          {clinic.status.charAt(0).toUpperCase() +
                            clinic.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(clinic.registrationDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Detailed View Tab */}
      {activeTab === 'detailed' && (
        <>
          {/* Filters and Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by clinic name or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedStatus === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({clinicsData.length})
            </button>
            <button
              onClick={() => setSelectedStatus('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedStatus === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setSelectedStatus('suspended')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedStatus === 'suspended'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Suspended
            </button>
          </div>
        </div>
      </div>

      {/* Clinics Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clinic Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clinic Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receptionists
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Staff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClinics.map((clinic) => (
                <tr key={clinic.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {clinic.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {clinic.owner}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(clinic.registrationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {clinic.doctors}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {clinic.receptionists}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {clinic.totalStaff}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[clinic.status]
                      }`}
                    >
                      {clinic.status.charAt(0).toUpperCase() +
                        clinic.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowActionMenu(
                            showActionMenu === clinic.id ? null : clinic.id
                          )
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {showActionMenu === clinic.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <Link
                            to={`/clinics/${clinic.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowActionMenu(null)}
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </Link>
                          {clinic.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedClinic(clinic.id);
                                setShowApproveModal(true);
                                setShowActionMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <CheckSquare className="w-4 h-4" />
                              Approve Clinic
                            </button>
                          )}
                          {clinic.status === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedClinic(clinic.id);
                                setShowSuspendModal(true);
                                setShowActionMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Pause className="w-4 h-4" />
                              Suspend Clinic
                            </button>
                          )}
                          {clinic.status === 'suspended' && (
                            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <PlayCircle className="w-4 h-4" />
                              Reactivate Clinic
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(clinic)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Information
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm bg-green-600">
          <CheckCircle className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Edit Information Modal */}
      {editingClinic && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Edit className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Edit Clinic Information</h2>
              </div>
              <button onClick={() => setEditingClinic(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Owner</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={editForm.owner}
                    onChange={e => setEditForm(p => ({ ...p, owner: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    rows={2}
                    value={editForm.address}
                    onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setEditingClinic(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 text-center mt-4">
                Approve Clinic
              </h2>
              <p className="text-sm text-gray-600 text-center mt-2">
                Are you sure you want to approve this clinic? This will activate
                their account and allow them to access the platform.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Pause className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 text-center mt-4">
                Suspend Clinic
              </h2>
              <p className="text-sm text-gray-600 text-center mt-2">
                Are you sure you want to suspend this clinic? They will lose
                access to the platform immediately.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for suspension
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter reason..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspend}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Suspend
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
