import {
  Building2,
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const kpiData = [
  {
    label: 'Total Registered Clinics',
    value: '248',
    change: '+12%',
    trend: 'up',
    icon: Building2,
    color: 'blue',
  },
  {
    label: 'Active Clinics',
    value: '231',
    change: '+8%',
    trend: 'up',
    icon: CheckCircle,
    color: 'green',
  },
  {
    label: 'Pending Approvals',
    value: '5',
    change: '-2',
    trend: 'down',
    icon: Clock,
    color: 'yellow',
  },
  {
    label: 'Suspended Clinics',
    value: '12',
    change: '+3',
    trend: 'up',
    icon: AlertCircle,
    color: 'red',
  },
  {
    label: 'Total Doctors',
    value: '1,247',
    change: '+156',
    trend: 'up',
    icon: Users,
    color: 'purple',
  },
  {
    label: 'Total Receptionists',
    value: '892',
    change: '+94',
    trend: 'up',
    icon: UserCheck,
    color: 'indigo',
  },
  {
    label: 'Total Platform Users',
    value: '2,891',
    change: '+312',
    trend: 'up',
    icon: Users,
    color: 'cyan',
  },
];

const recentActivity = [
  {
    type: 'Clinic Registration',
    description: 'PetCare Veterinary Hospital registered',
    time: '5 minutes ago',
    icon: Building2,
    color: 'blue',
  },
  {
    type: 'User Creation',
    description: 'Dr. Sarah Johnson added to Happy Paws Clinic',
    time: '12 minutes ago',
    icon: Users,
    color: 'green',
  },
  {
    type: 'Role Change',
    description: 'John Doe promoted to Clinic Owner',
    time: '1 hour ago',
    icon: UserCheck,
    color: 'purple',
  },
  {
    type: 'Account Suspension',
    description: 'Sunset Veterinary Clinic suspended for policy violation',
    time: '2 hours ago',
    icon: AlertCircle,
    color: 'red',
  },
  {
    type: 'Clinic Registration',
    description: 'Animal Care Center registered',
    time: '3 hours ago',
    icon: Building2,
    color: 'blue',
  },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  cyan: 'bg-cyan-100 text-cyan-700',
};

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform overview and key performance indicators
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{kpi.label}</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {kpi.value}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : null}
                  <span
                    className={`text-sm ${
                      kpi.trend === 'up' ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {kpi.change} from last month
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${colorMap[kpi.color]}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-lg ${colorMap[activity.color]} flex-shrink-0`}
                >
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.type}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}
