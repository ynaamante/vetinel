import { useState } from 'react';
import { Megaphone, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

const announcements = [
  {
    id: 1,
    title: 'Platform Maintenance Scheduled',
    message:
      'The VetIntel platform will undergo scheduled maintenance on June 5, 2026 from 2:00 AM to 4:00 AM PST. During this time, all services will be temporarily unavailable.',
    targetAudience: 'All Clinics',
    priority: 'high',
    status: 'active',
    createdBy: 'Super Admin',
    createdAt: '2026-05-25',
  },
  {
    id: 2,
    title: 'New Feature: Disease Analytics Dashboard',
    message:
      'We are excited to announce the launch of our new Disease Analytics Dashboard. This powerful tool provides real-time insights into disease trends across your community.',
    targetAudience: 'All Clinics',
    priority: 'medium',
    status: 'active',
    createdBy: 'Super Admin',
    createdAt: '2026-05-20',
  },
  {
    id: 3,
    title: 'Security Update Required',
    message:
      'All clinic owners must update their security settings by May 31, 2026 to comply with new data protection regulations.',
    targetAudience: 'Clinic Owners',
    priority: 'high',
    status: 'active',
    createdBy: 'Super Admin',
    createdAt: '2026-05-18',
  },
  {
    id: 4,
    title: 'Training Webinar: Advanced Reporting',
    message:
      'Join us for a complimentary training webinar on June 10, 2026 at 10:00 AM PST to learn about advanced reporting features.',
    targetAudience: 'All Users',
    priority: 'low',
    status: 'draft',
    createdBy: 'Super Admin',
    createdAt: '2026-05-15',
  },
];

const priorityColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
};

export function SystemAnnouncements() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            System Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage platform-wide announcements and notifications
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Announcement
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {announcements.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Megaphone className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {announcements.filter((a) => a.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {announcements.filter((a) => a.priority === 'high').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Megaphone className="w-6 h-6 text-red-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Drafts</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {announcements.filter((a) => a.status === 'draft').length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <EyeOff className="w-6 h-6 text-gray-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {announcement.title}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      priorityColors[announcement.priority as keyof typeof priorityColors]
                    }`}
                  >
                    {announcement.priority.toUpperCase()}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      announcement.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {announcement.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {announcement.message}
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    <span>{announcement.targetAudience}</span>
                  </div>
                  <div>
                    Created by {announcement.createdBy} on{' '}
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Create New Announcement
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter announcement title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter announcement message"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>All Clinics</option>
                      <option>Clinic Owners</option>
                      <option>Doctors</option>
                      <option>Receptionists</option>
                      <option>All Users</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  Save as Draft
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
