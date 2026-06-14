import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Mail,
  Save,
} from 'lucide-react';

type SettingKey =
  | 'emailNotifications'
  | 'securityAlerts'
  | 'maintenanceMode'
  | 'autoBackup'
  | 'sessionTimeout'
  | 'maxLoginAttempts'
  | 'passwordExpiryDays'
  | 'platformName'
  | 'supportEmail'
  | 'smtpHost'
  | 'smtpPort'
  | 'fromEmail'
  | 'backupRetentionDays';

type SettingsState = {
  emailNotifications: boolean;
  securityAlerts: boolean;
  maintenanceMode: boolean;
  autoBackup: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordExpiryDays: number;
  platformName: string;
  supportEmail: string;
  smtpHost: string;
  smtpPort: number;
  fromEmail: string;
  backupRetentionDays: number;
};

type ClinicOption = {
  id: number;
  name: string;
};

const initialSettings: SettingsState = {
  emailNotifications: true,
  securityAlerts: true,
  maintenanceMode: false,
  autoBackup: true,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordExpiryDays: 90,
  platformName: 'VetIntel',
  supportEmail: 'support@vetintel.com',
  smtpHost: 'smtp.vetintel.com',
  smtpPort: 587,
  fromEmail: 'noreply@vetintel.com',
  backupRetentionDays: 30,
};

const initialSettingIds: Record<SettingKey, number | null> = {
  emailNotifications: null,
  securityAlerts: null,
  maintenanceMode: null,
  autoBackup: null,
  sessionTimeout: null,
  maxLoginAttempts: null,
  passwordExpiryDays: null,
  platformName: null,
  supportEmail: null,
  smtpHost: null,
  smtpPort: null,
  fromEmail: null,
  backupRetentionDays: null,
};

const apiKeyMap: Record<SettingKey, string> = {
  emailNotifications: 'email_notifications',
  securityAlerts: 'security_alerts',
  maintenanceMode: 'maintenance_mode',
  autoBackup: 'automatic_backups',
  sessionTimeout: 'session_timeout_minutes',
  maxLoginAttempts: 'max_login_attempts',
  passwordExpiryDays: 'password_expiry_days',
  platformName: 'platform_name',
  supportEmail: 'support_email',
  smtpHost: 'smtp_host',
  smtpPort: 'smtp_port',
  fromEmail: 'smtp_from_email',
  backupRetentionDays: 'backup_retention_days',
};

const getApiKey = (key: SettingKey) => apiKeyMap[key];
const apiKeyToState = Object.fromEntries(
  Object.entries(apiKeyMap).map(([stateKey, apiKey]) => [apiKey, stateKey])
) as Record<string, SettingKey>;

export function Settings() {
  const [settings, setSettings] = useState<SettingsState>(initialSettings);
  const [globalSettingIds, setGlobalSettingIds] = useState<Record<SettingKey, number | null>>(initialSettingIds);
  const [clinicSettingIds, setClinicSettingIds] = useState<Record<SettingKey, number | null>>(initialSettingIds);
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await fetch('/api/clinics');
        if (!response.ok) throw new Error('Failed to fetch clinics');
        const data = (await response.json()) as any[];
        setClinics(data.map((clinic: any) => ({ id: clinic.id, name: clinic.name })));
      } catch (error) {
        console.error('Failed to load clinics:', error);
      }
    };

    fetchClinics();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = (await response.json()) as any[];

        const loadedGlobalIds = { ...initialSettingIds };
        const loadedClinicIds = { ...initialSettingIds };
        const globalValues: Record<string, any> = {};
        const clinicValues: Record<string, any> = {};

        data.forEach((row: any) => {
          const stateKey = apiKeyToState[row.key];
          if (!stateKey) return;
          if (row.clinic_id == null) {
            loadedGlobalIds[stateKey] = row.id;
            globalValues[stateKey] = row.value;
          } else if (selectedClinic && Number(row.clinic_id) === Number(selectedClinic)) {
            loadedClinicIds[stateKey] = row.id;
            clinicValues[stateKey] = row.value;
          }
        });

        const loadedSettings: SettingsState = { ...initialSettings };
        Object.keys(globalValues).forEach((k) => (loadedSettings as Record<string, any>)[k] = globalValues[k]);
        Object.keys(clinicValues).forEach((k) => (loadedSettings as Record<string, any>)[k] = clinicValues[k]);

        setSettings(loadedSettings);
        setGlobalSettingIds(loadedGlobalIds);
        setClinicSettingIds(loadedClinicIds);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setLoadError('Failed to load settings. Please check your server connection.');
      }
    };

    loadSettings();
  }, [selectedClinic]);

  const updateSetting = (key: SettingKey, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);

    try {
      const entries = Object.entries(settings) as [SettingKey, string | number | boolean][];
      const results = await Promise.all(
        entries.map(async ([stateKey, value]) => {
          const apiKey = getApiKey(stateKey);
          const body = { key: apiKey, value };

          if (selectedClinic) {
            const clinicId = clinicSettingIds[stateKey];
            if (clinicId) {
              const res = await fetch(`/api/settings/${clinicId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              if (!res.ok) throw new Error('Failed to update clinic setting');
              return { stateKey, payload: await res.json(), scope: 'clinic' };
            }
            const res = await fetch('/api/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clinic_id: selectedClinic, ...body }),
            });
            if (!res.ok) throw new Error('Failed to create clinic setting');
            return { stateKey, payload: await res.json(), scope: 'clinic' };
          } else {
            const globalId = globalSettingIds[stateKey];
            if (globalId) {
              const res = await fetch(`/api/settings/${globalId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              if (!res.ok) throw new Error('Failed to update global setting');
              return { stateKey, payload: await res.json(), scope: 'global' };
            }
            const res = await fetch('/api/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clinic_id: null, ...body }),
            });
            if (!res.ok) throw new Error('Failed to create global setting');
            return { stateKey, payload: await res.json(), scope: 'global' };
          }
        })
      );

      const updatedGlobal = { ...globalSettingIds };
      const updatedClinic = { ...clinicSettingIds };
      results.forEach(({ stateKey, payload, scope }: any) => {
        if (!payload?.id) return;
        const sk = stateKey as SettingKey;
        if (scope === 'clinic') updatedClinic[sk] = payload.id;
        else updatedGlobal[sk] = payload.id;
      });
      setGlobalSettingIds(updatedGlobal);
      setClinicSettingIds(updatedClinic);

      alert('Settings saved successfully.');
    } catch (error) {
      console.error('Save settings failed:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Clinic</label>
          <select
            value={selectedClinic ?? ''}
            onChange={(e) => setSelectedClinic(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Global</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isSaving ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      {loadError && (
        <div className="text-sm text-red-600">{loadError}</div>
      )}

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
              onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.emailNotifications ? 'translate-x-6' : ''
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
              onClick={() => updateSetting('securityAlerts', !settings.securityAlerts)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.securityAlerts ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.securityAlerts ? 'translate-x-6' : ''
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
              value={settings.sessionTimeout}
              onChange={(e) => updateSetting('sessionTimeout', Number(e.target.value))}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Login Attempts
            </label>
            <input
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) => updateSetting('maxLoginAttempts', Number(e.target.value))}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Expiry (days)
            </label>
            <input
              type="number"
              value={settings.passwordExpiryDays}
              onChange={(e) => updateSetting('passwordExpiryDays', Number(e.target.value))}
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
              onClick={() => updateSetting('maintenanceMode', !settings.maintenanceMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.maintenanceMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.maintenanceMode ? 'translate-x-6' : ''
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
              value={settings.platformName}
              onChange={(e) => updateSetting('platformName', e.target.value)}
              className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Email
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => updateSetting('supportEmail', e.target.value)}
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
              onClick={() => updateSetting('autoBackup', !settings.autoBackup)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.autoBackup ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.autoBackup ? 'translate-x-6' : ''
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
              value={settings.backupRetentionDays}
              onChange={(e) => updateSetting('backupRetentionDays', Number(e.target.value))}
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
              value={settings.smtpHost}
              onChange={(e) => updateSetting('smtpHost', e.target.value)}
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
                value={settings.smtpPort}
                onChange={(e) => updateSetting('smtpPort', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email
              </label>
              <input
                type="email"
                value={settings.fromEmail}
                onChange={(e) => updateSetting('fromEmail', e.target.value)}
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
