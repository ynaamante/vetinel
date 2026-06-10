import { useState } from 'react';
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

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');

  if (!user) {
    return <LoginPage onLogin={u => { setUser(u); setPage('dashboard'); }} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar active={page} setPage={setPage} user={user} onLogout={() => setUser(null)} />

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
