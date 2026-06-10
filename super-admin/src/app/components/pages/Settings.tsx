import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Mail,
  Save,
} from 'lucide-react';

export function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure platform-wide settings and preferences
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Notification Settings
              </h2>
              <p className="text-sm text-gray-500">
                Manage system notifications and alerts
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">
                Receive email notifications for important events
              </p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  emailNotifications ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Security Alerts</p>
              <p className="text-sm text-gray-500">
                Get notified about security-related events
              </p>
            </div>
            <button
              onClick={() => setSecurityAlerts(!securityAlerts)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                securityAlerts ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  securityAlerts ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Security Settings
              </h2>
              <p className="text-sm text-gray-500">
                Configure security and access controls
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              defaultValue={30}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Login Attempts
            </label>
            <input
              type="number"
              defaultValue={5}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Expiry (days)
            </label>
            <input
              type="number"
              defaultValue={90}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <SettingsIcon className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                System Settings
              </h2>
              <p className="text-sm text-gray-500">
                General system configuration
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Maintenance Mode</p>
              <p className="text-sm text-gray-500">
                Enable maintenance mode to restrict access
              </p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                maintenanceMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  maintenanceMode ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Name
            </label>
            <input
              type="text"
              defaultValue="VetIntel"
              className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Email
            </label>
            <input
              type="email"
              defaultValue="support@vetintel.com"
              className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Database Settings */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Database className="w-5 h-5 text-yellow-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Database & Backup
              </h2>
              <p className="text-sm text-gray-500">
                Configure database and backup settings
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Automatic Backups</p>
              <p className="text-sm text-gray-500">
                Automatically backup database daily
              </p>
            </div>
            <button
              onClick={() => setAutoBackup(!autoBackup)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoBackup ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  autoBackup ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Retention (days)
            </label>
            <input
              type="number"
              defaultValue={30}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="pt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Backup Now
            </button>
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Mail className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Email Configuration
              </h2>
              <p className="text-sm text-gray-500">
                Configure SMTP and email settings
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Host
            </label>
            <input
              type="text"
              defaultValue="smtp.vetintel.com"
              className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Port
              </label>
              <input
                type="number"
                defaultValue={587}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email
              </label>
              <input
                type="email"
                defaultValue="noreply@vetintel.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="pt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Test Email Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
