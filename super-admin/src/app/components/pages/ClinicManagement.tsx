import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  Search,
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
  Plus,
} from 'lucide-react';
import { Toast } from '../ui/Toast';

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

export function ClinicManagement() {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<number | null>(null);
  const [clinics, setClinics] = useState<ClinicRecord[]>([]);
  const [editingClinic, setEditingClinic] = useState<ClinicRecord | null>(null);
  const [editForm, setEditForm] = useState({ name: '', owner: '', email: '', phone: '', address: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState<number | null>(null);
  const [createClinicForm, setCreateClinicForm] = useState({ name: '', owner: '', email: '', phone: '', address: '', timezone: 'UTC' });
  const [toast, setToast] = useState<string | null>(null);

  const exportToCSV = () => {
    if (clinics.length === 0) {
      setToast('No clinics to export');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const headers = ['ID', 'Name', 'Owner', 'Email', 'Phone', 'Address', 'Status', 'Total Staff', 'Registration Date'];
    const csvContent = [
      headers.join(','),
      ...clinics.map(clinic =>
        [
          clinic.id,
          `"${clinic.name}"`,
          `"${clinic.owner}"`,
          `"${clinic.email || ''}"`,
          `"${clinic.phone || ''}"`,
          `"${clinic.address || ''}"`,
          clinic.status,
          clinic.totalStaff,
          clinic.registrationDate,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clinic-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Log export to audit trail
    fetch('/api/clinics/export/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': localStorage.getItem('userId') || '1',
      },
      body: JSON.stringify({ format: 'CSV' }),
    }).catch((err) => console.error('Failed to log export:', err));
    
    setToast('Report exported successfully');
    setTimeout(() => setToast(null), 3000);
  };

  const exportToPDF = () => {
    if (clinics.length === 0) {
      setToast('No clinics to export');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;

    const brand = [8, 91, 166];
    const cardBg = [247, 250, 255];
    const textDark = [17, 24, 39];
    const textGray = [75, 85, 99];
    const badgeActive = [34, 197, 94];
    const badgePending = [234, 179, 8];
    const badgeSuspended = [239, 68, 68];

    const headerHeight = 128;
    doc.setFillColor(...brand);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('VetIntel', margin, 48);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Clinic performance and status summary', margin, 68);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Clinic Report', pageWidth - margin, 50, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(238, 242, 255);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 68, { align: 'right' });

    const statusCounts = {
      active: clinics.filter((c) => c.status === 'active').length,
      pending: clinics.filter((c) => c.status === 'pending').length,
      suspended: clinics.filter((c) => c.status === 'suspended').length,
    };

    let y = headerHeight + 24;
    const metricBoxHeight = 66;
    const metricWidth = (contentWidth - 16) / 3;

    ['active', 'pending', 'suspended'].forEach((status, index) => {
      const x = margin + index * (metricWidth + 8);
      doc.setFillColor(...cardBg);
      doc.roundedRect(x, y, metricWidth, metricBoxHeight, 12, 12, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, metricWidth, metricBoxHeight, 12, 12, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...textDark);
      doc.text(String(statusCounts[status as 'active' | 'pending' | 'suspended']), x + 14, y + 26);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...textGray);
      doc.text(`${status.charAt(0).toUpperCase() + status.slice(1)}`, x + 14, y + 44);
    });

    y += metricBoxHeight + 24;

    clinics.forEach((clinic, index) => {
      if (y + 190 > pageHeight - 80) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...textGray);
        doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 30, { align: 'right' });
        doc.addPage();
        y = margin;
      }

      const cardHeight = 178;
      doc.setFillColor(...cardBg);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 16, 16, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 16, 16, 'S');

      const titleBoxWidth = 90;
      doc.setFillColor(...brand);
      doc.roundedRect(margin + 16, y + 16, titleBoxWidth, 28, 10, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(`Clinic ${String(index + 1).padStart(2, '0')}`, margin + 16 + titleBoxWidth / 2, y + 34, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...textDark);
      doc.text(clinic.name, margin + 120, y + 34);

      const labelX = margin + 26;
      const valueX = margin + 112;
      const labelX2 = margin + contentWidth / 2 + 10;
      const valueX2 = labelX2 + 90;
      let rowY = y + 64;
      const rowGap = 18;

      const drawPair = (label: string, value: string | number, x: number, vx: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...textGray);
        doc.text(label, x, rowY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...textDark);
        doc.text(`${value}`, vx, rowY);
      };

      drawPair('ID', clinic.id, labelX, valueX);
      drawPair('Address', clinic.address || 'N/A', labelX2, valueX2);
      rowY += rowGap;
      drawPair('Owner', clinic.owner, labelX, valueX);
      drawPair('Email', clinic.email || 'N/A', labelX2, valueX2);
      rowY += rowGap;
      drawPair('Phone', clinic.phone || 'N/A', labelX, valueX);
      drawPair('Registration', clinic.registrationDate, labelX2, valueX2);
      rowY += rowGap;
      drawPair('Total Staff', clinic.totalStaff, labelX, valueX);
      drawPair('Status', clinic.status.toUpperCase(), labelX2, valueX2);

      const badgeColor = clinic.status === 'active' ? badgeActive : clinic.status === 'pending' ? badgePending : badgeSuspended;
      doc.setFillColor(...badgeColor);
      doc.roundedRect(pageWidth - margin - 104, y + 20, 88, 24, 12, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(clinic.status.toUpperCase(), pageWidth - margin - 60, y + 36, { align: 'center' });

      y += cardHeight + 20;
    });

    const footerY = pageHeight - 48;
    doc.setFillColor(...brand);
    doc.rect(0, footerY, pageWidth, 48, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('www.vetintel.com', margin, footerY + 18);
    doc.text('info@vetintel.com', margin, footerY + 32);
    doc.text('123-456-7890', pageWidth - margin, footerY + 25, { align: 'right' });
    doc.setTextColor(255, 255, 255);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin, footerY + 32, { align: 'right' });

    const filename = `clinic-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    // Log export to audit trail
    fetch('/api/clinics/export/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': localStorage.getItem('userId') || '1',
      },
      body: JSON.stringify({ format: 'PDF' }),
    }).catch((err) => console.error('Failed to log export:', err));
    
    setToast('Report exported successfully');
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch clinics from API on mount
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await fetch('/api/clinics');
        if (!response.ok) throw new Error('Failed to fetch clinics');
        const data = await response.json();
        // Map database clinics to component ClinicRecord type
        setClinics(data.map((clinic: any) => {
          const status = clinic.status || clinic.metadata?.status || 'active';
          return {
            id: clinic.id,
            name: clinic.name,
            owner: clinic.owner || 'Unknown',
            email: clinic.email,
            phone: clinic.phone,
            address: clinic.address,
            registrationDate: new Date(clinic.created_at).toLocaleDateString(),
            doctors: clinic.doctors || 0,
            receptionists: clinic.receptionists || 0,
            totalStaff: clinic.total_users || 0,
            status: (status === 'pending' ? 'pending' : status === 'suspended' ? 'suspended' : 'active') as 'active' | 'pending' | 'suspended',
          };
        }));
      } catch (error) {
        console.error('Failed to fetch clinics:', error);
        setToast('Failed to load clinics');
        setTimeout(() => setToast(null), 3000);
      }
    };

    fetchClinics();
  }, []);

  function openEditModal(clinic: ClinicRecord) {
    setEditForm({ name: clinic.name, owner: clinic.owner, email: clinic.email ?? '', phone: clinic.phone ?? '', address: clinic.address ?? '' });
    setEditingClinic(clinic);
    setShowActionMenu(null);
  }

  async function saveEdit() {
    if (!editingClinic) return;

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/clinics/${editingClinic.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: editForm.name,
          owner: editForm.owner,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setToast(errorData.error || 'Failed to update clinic');
        setTimeout(() => setToast(null), 3000);
        return;
      }

      const updatedClinic = await response.json();
      setClinics(prev => prev.map(c =>
        c.id === updatedClinic.id
          ? {
              ...c,
              name: updatedClinic.name,
              owner: updatedClinic.owner || c.owner,
              email: updatedClinic.email,
              phone: updatedClinic.phone,
              address: updatedClinic.address,
              status: updatedClinic.status || c.status,
            }
          : c
      ));
      setEditingClinic(null);
      setToast('Clinic information updated successfully.');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Failed to update clinic:', error);
      setToast('Failed to update clinic');
      setTimeout(() => setToast(null), 3000);
    }
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

  const handleApprove = async () => {
    if (!selectedClinic) return;

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/clinics/${selectedClinic}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'active' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setToast(errorData.error || 'Failed to approve clinic');
        setTimeout(() => setToast(null), 3000);
        return;
      }

      const updatedClinic = await response.json();
      setClinics((prev) => prev.map((clinic) =>
        clinic.id === updatedClinic.id
          ? { ...clinic, status: updatedClinic.status || 'active' }
          : clinic
      ));
      setShowApproveModal(false);
      setSelectedClinic(null);
      setToast('Clinic approved successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Failed to approve clinic:', error);
      setToast('Failed to approve clinic');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSuspend = async () => {
    if (!selectedClinic) return;

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/clinics/${selectedClinic}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'suspended' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setToast(errorData.error || 'Failed to suspend clinic');
        setTimeout(() => setToast(null), 3000);
        return;
      }

      const updatedClinic = await response.json();
      setClinics((prev) => prev.map((clinic) =>
        clinic.id === updatedClinic.id
          ? { ...clinic, status: updatedClinic.status || 'suspended' }
          : clinic
      ));
      setShowSuspendModal(false);
      setSelectedClinic(null);
      setToast('Clinic suspended successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Failed to suspend clinic:', error);
      setToast('Failed to suspend clinic');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleReactivate = async (clinicId: number) => {
    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/clinics/${clinicId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'active' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setToast(errorData.error || 'Failed to reactivate clinic');
        setTimeout(() => setToast(null), 3000);
        return;
      }

      const updatedClinic = await response.json();
      setClinics((prev) => prev.map((clinic) =>
        clinic.id === updatedClinic.id
          ? { ...clinic, status: updatedClinic.status || 'active' }
          : clinic
      ));
      setToast('Clinic reactivated successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Failed to reactivate clinic:', error);
      setToast('Failed to reactivate clinic');
      setTimeout(() => setToast(null), 3000);
    }
  };

  async function handleCreateClinic() {
    if (!createClinicForm.name.trim()) {
      setToast('Clinic name is required');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/clinics', {
        method: 'POST',
        headers,
        body: JSON.stringify(createClinicForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setToast(errorData.error || 'Failed to add clinic');
        setTimeout(() => setToast(null), 3000);
        return;
      }

      const newClinic = await response.json();
      setClinics(prev => [
        {
          id: newClinic.id,
          name: newClinic.name,
          owner: newClinic.owner || 'Unknown',
          email: newClinic.email,
          phone: newClinic.phone,
          address: newClinic.address,
          registrationDate: new Date(newClinic.created_at).toLocaleDateString(),
          doctors: 0,
          receptionists: 0,
          totalStaff: 0,
          status: (newClinic.status || 'active') as 'active' | 'pending' | 'suspended',
        },
        ...prev,
      ]);
      setCreateClinicForm({ name: '', owner: '', email: '', phone: '', address: '', timezone: 'UTC' });
      setShowCreateModal(false);
      setToast('Clinic added successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Failed to create clinic:', error);
      setToast('Failed to add clinic');
      setTimeout(() => setToast(null), 3000);
    }
  }

  const handleDeleteClinic = async () => {
    if (!clinicToDelete) return;
    try {
      const token = localStorage.getItem('vetintel_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/clinics/${clinicToDelete}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        setToast(err?.error || 'Failed to archive clinic');
        setTimeout(() => setToast(null), 3000);
        return;
      }

      setClinics((prev) => prev.filter((c) => c.id !== clinicToDelete));
      setClinicToDelete(null);
      setShowDeleteConfirm(false);
      setToast('Clinic archived successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Failed to delete clinic:', error);
      setToast('Failed to delete clinic');
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Clinic Management
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Clinic
          </button>
          <button 
            onClick={exportToPDF}
            className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
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
          <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
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
              All ({clinics.length})
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
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
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === clinic.id ? null : clinic.id)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {showActionMenu === clinic.id && (
                          <div className="absolute right-0 top-full mt-2 min-w-[12rem] bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
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
                                <button
                                  onClick={() => {
                                    handleReactivate(clinic.id);
                                    setShowActionMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  Reactivate Clinic
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  openEditModal(clinic);
                                  setShowActionMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Information
                              </button>
                              <button
                                onClick={() => {
                                  setClinicToDelete(clinic.id);
                                  setShowDeleteConfirm(true);
                                  setShowActionMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                <X className="w-4 h-4" />
                                Delete Clinic
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
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && clinicToDelete !== null && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 text-center">Archive Clinic</h2>
              <p className="text-sm text-gray-600 text-center mt-2">Are you sure you want to archive this clinic? Archived clinics are hidden from lists.</p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setClinicToDelete(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClinic}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Clinic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Add New Clinic</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                <input
                  name="name"
                  type="text"
                  value={createClinicForm.name}
                  onChange={e => setCreateClinicForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Clinic name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={createClinicForm.email}
                  onChange={e => setCreateClinicForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="clinic@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Owner</label>
                <input
                  name="owner"
                  type="text"
                  value={createClinicForm.owner}
                  onChange={e => setCreateClinicForm(p => ({ ...p, owner: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Owner name"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    name="phone"
                    type="text"
                    value={createClinicForm.phone}
                    onChange={e => setCreateClinicForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(123) 456-7890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <input
                    name="timezone"
                    type="text"
                    value={createClinicForm.timezone}
                    onChange={e => setCreateClinicForm(p => ({ ...p, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="UTC"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  rows={3}
                  value={createClinicForm.address}
                  onChange={e => setCreateClinicForm(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Clinic address"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClinic}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Save Clinic
              </button>
            </div>
          </div>
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
