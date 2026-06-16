import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  FileText,
  Search,
  Download,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

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
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const response = await fetch('/api/audit-trail');
        if (!response.ok) throw new Error('Failed to fetch audit logs');
        const data = await response.json();
        setAuditLogs(data || []);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      }
    };

    fetchAuditLogs();
  }, []);

  const exportToCSV = () => {
    if (auditLogs.length === 0) {
      setToast('No audit logs to export');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const headers = ['ID', 'Entity Type', 'Entity ID', 'Action', 'User', 'Timestamp', 'Changes', 'Severity'];
    const csvContent = [
      headers.join(','),
      ...auditLogs.map(log =>
        [
          log.id || '',
          `"${log.entity_type || ''}"`,
          log.entity_id || '',
          `"${log.action || ''}"`,
          `"${log.user_id || ''}"`,
          `"${log.timestamp || ''}"`,
          `"${log.changes ? JSON.stringify(log.changes).replace(/"/g, '""') : ''}"`,
          `"${log.severity || 'info'}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast('Audit logs exported successfully');
    setTimeout(() => setToast(null), 3000);
  };

  const exportToPDF = () => {
    if (auditLogs.length === 0) {
      setToast('No audit logs to export');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const doc = new jsPDF();
    const title = 'Audit Logs';
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    let y = 38;
    auditLogs.forEach((log, index) => {
      if (y > doc.internal.pageSize.height - 30) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.text(`Entry ${index + 1}: ${log.action || 'Unknown action'}`, 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`User: ${log.user || log.user_id || 'Unknown'}`, 14, y);
      y += 6;
      doc.text(`Entity: ${log.entity_type || 'N/A'} #${log.entity_id || 'N/A'}`, 14, y);
      y += 6;
      doc.text(`Timestamp: ${log.timestamp || 'N/A'}`, 14, y);
      y += 6;
      doc.text(`Severity: ${log.severity || 'info'}`, 14, y);
      y += 6;
      doc.text(`Changes: ${log.changes ? JSON.stringify(log.changes) : 'N/A'}`, 14, y, { maxWidth: doc.internal.pageSize.width - 28 });
      y += 12;
      doc.setLineWidth(0.2);
      doc.line(14, y, doc.internal.pageSize.width - 14, y);
      y += 10;
    });

    doc.save(`audit-logs-${new Date().toISOString().split('T')[0]}.pdf`);
    setToast('Audit logs exported successfully');
    setTimeout(() => setToast(null), 3000);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.changes && JSON.stringify(log.changes).toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'All Categories' ||
      log.entity_type === selectedCategory;
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
        <button 
          onClick={exportToPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
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
