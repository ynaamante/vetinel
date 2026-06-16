import { useEffect, useState } from 'react';
import './styles/global.css';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DiseaseMonitoringPage from './pages/DiseaseMonitoringPage';
import ClinicLayout from './pages/clinic/ClinicLayout';
import PlaceholderPage from './pages/PlaceholderPage';
import AppointmentManagementPage from './pages/receptionist/AppointmentManagementPage';
import PatientQueuePage          from './pages/receptionist/PatientQueuePage';
import BillingPage               from './pages/receptionist/BillingPage';
import ClientManagementPage      from './pages/receptionist/ClientManagementPage';
import RemindersPage             from './pages/receptionist/RemindersPage';
import { RiskMonitoringPage } from './pages/RiskMonitoringPage';
import { CommunityAnalyticsPage } from './pages/CommunityAnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { DataSyncPage } from './pages/DataSyncPage';
import ClinicOverviewPage from './pages/ClinicOverviewPage';
import UserRoleManagementPage from './pages/UserRoleManagementPage';
import FinancialMonitoringPage from './pages/FinancialMonitoringPage';
import AuditTrailPage from './pages/AuditTrailPage';
import { hasPermissionForFeature } from './utils/permissionUtils';

const DEDICATED = [
  'dashboard',
  'disease',
  'clinic',
  'appointments-ops',
  'patient-queue',
  'billing',
  'client-mgmt',
  'reminders',
  'risk',
  'analytics',
  'reports',
  'sync',
  'clinics',
  'users',
  'financial',
  'audit',
];

const PAGE_FEATURE_MAP = {
  dashboard: 'Intelligence Dashboard',
  disease: 'Disease Monitoring',
  clinic: 'Clinic Overview',
  'appointments-ops': 'Appointment Management',
  'patient-queue': 'Patient Queue',
  billing: 'Billing & Payments',
  'client-mgmt': 'Client Management',
  reminders: 'Due Dates & Reminders',
  risk: 'Risk Monitoring',
  analytics: 'Community Analytics',
  reports: 'Reports',
  sync: 'Data Sync Status',
  clinics: 'Clinic Overview',
  users: 'User & Role Management',
  financial: 'Financial Monitoring',
  audit: 'Audit Trail',
};

const normalizeRoleName = (role) =>
  String(role || '').trim().toLowerCase().replace(/[-\s]+/g, '_');


const getFirstAllowedPage = (permissions, role) => {
  const normalizedRole = normalizeRoleName(role);
  const priorityPages = normalizedRole === 'clinic_owner' || normalizedRole === 'super_admin'
    ? ['clinics', 'users', 'financial', 'audit', 'dashboard']
    : normalizedRole === 'receptionist'
    ? ['appointments-ops', 'patient-queue', 'billing', 'client-mgmt', 'reminders', 'dashboard']
    : normalizedRole === 'doctor'
    ? ['clinic', 'dashboard']
    : ['dashboard'];

  for (const page of priorityPages) {
    const feature = PAGE_FEATURE_MAP[page];
    if (feature && hasPermissionForFeature(permissions, role, feature)) {
      return page;
    }
  }

  return 'dashboard';
};

const canAccessPage = (pageKey, permissions, role) => {
  const feature = PAGE_FEATURE_MAP[pageKey];
  return feature ? hasPermissionForFeature(permissions, role, feature) : false;
};

const loadRolePermissions = async (roleName) => {
  if (!roleName) return null;
  try {
    const response = await fetch('/api/roles');
    if (!response.ok) return null;
    const roles = await response.json();
    const normalizedRole = normalizeRoleName(roleName);
    return (
      roles.find((role) => {
        const candidate = normalizeRoleName(role.name);
        return candidate === normalizedRole || candidate === normalizedRole.replace(/[-\s]+/g, '_');
      })?.permissions ?? null
    );
  } catch (e) {
    console.error('Failed to load role permissions', e);
    return null;
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('vetintel_token');
    const userData = localStorage.getItem('vetintel_user');
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        const cachedUser = { ...parsed, token };
        setUser(cachedUser);
        setPermissionsLoaded(false);

        if (parsed.role) {
          loadRolePermissions(parsed.role).then((permissions) => {
            if (permissions) {
              const updated = { ...parsed, token, permissions };
              setUser(updated);
              localStorage.setItem('vetintel_user', JSON.stringify(updated));
              setPage(getFirstAllowedPage(permissions, parsed.role));
            }
            setPermissionsLoaded(true);
          }).catch(() => {
            setPermissionsLoaded(true);
          });
        } else {
          setPermissionsLoaded(true);
        }
      } catch (e) {
        localStorage.removeItem('vetintel_user');
        localStorage.removeItem('vetintel_token');
        setPermissionsLoaded(true);
      }
    } else {
      setPermissionsLoaded(true);
    }
  }, []);

  function handleLogin(userData) {
    const { token, ...rest } = userData;
    const userWithToken = { ...rest, token };
    localStorage.setItem('vetintel_token', token);
    localStorage.setItem('vetintel_user', JSON.stringify(rest));
    setUser(userWithToken);
    setPermissionsLoaded(false);
    setPage('dashboard');

    if (rest.role) {
      loadRolePermissions(rest.role).then((permissions) => {
        if (permissions) {
          const updated = { ...userWithToken, permissions };
          setUser(updated);
          localStorage.setItem('vetintel_user', JSON.stringify(updated));
          const redirected = getFirstAllowedPage(permissions, rest.role);
          setPage(redirected);
        }
        setPermissionsLoaded(true);
      }).catch(() => {
        setPermissionsLoaded(true);
      });
    } else {
      setPermissionsLoaded(true);
    }
  }

  function handleLogout() {
    localStorage.removeItem('vetintel_token');
    localStorage.removeItem('vetintel_user');
    setUser(null);
    setPage('dashboard');
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (!permissionsLoaded) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#64748b' }}>Loading permissions…</div>;
  }

  const currentPage = canAccessPage(page, user.permissions || null, user.role)
    ? page
    : getFirstAllowedPage(user.permissions || null, user.role);

  if (currentPage !== page) {
    setPage(currentPage);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar active={page} setPage={setPage} user={user} onLogout={handleLogout} />

      {/* Intelligence pages */}
      {page === 'dashboard'         && <DashboardPage user={user} />}
      {page === 'disease'           && <DiseaseMonitoringPage user={user} />}

      {/* Doctor pages */}
      {page === 'clinic'            && <ClinicLayout user={user} />}

      {/* Receptionist pages */}
      {page === 'appointments-ops'  && <AppointmentManagementPage user={user} />}
      {page === 'patient-queue'     && <PatientQueuePage user={user} />}
      {page === 'billing'           && <BillingPage user={user} />}
      {page === 'client-mgmt'       && <ClientManagementPage user={user} />}
      {page === 'reminders'         && <RemindersPage user={user} />}

      {/* Shared intelligence pages */}
      {page === 'risk'      && <RiskMonitoringPage user={user} />}
      {page === 'analytics' && <CommunityAnalyticsPage user={user} />}
      {page === 'reports'   && <ReportsPage user={user} />}
      {page === 'sync'      && <DataSyncPage user={user} />}

      {/* Owner pages */}
      {page === 'clinics'   && <ClinicOverviewPage user={user} />}
      {page === 'users'     && <UserRoleManagementPage user={user} />}
      {page === 'financial' && <FinancialMonitoringPage user={user} />}
      {page === 'audit'     && <AuditTrailPage user={user} />}

      {/* Fallback placeholder */}
      {!DEDICATED.includes(page) && (
        <PlaceholderPage user={user} />
      )}
    </div>
  );
}
