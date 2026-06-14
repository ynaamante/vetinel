import {
  Building2,
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch KPI stats
        const statsResponse = await fetch('/api/dashboard/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setKpiData(statsData.kpis || []);
        }

        // Fetch recent activity
        const activityResponse = await fetch('/api/dashboard/activity');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivity(activityData || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  const pickKpiIcon = (label: string) => {
    switch (label) {
      case 'Total Users':
        return Users;
      case 'Total Clinics':
        return Building2;
      case 'Appointments':
        return UserCheck;
      case 'Revenue':
        return TrendingUp;
      case 'Activities (24h)':
        return Clock;
      case 'Announcements':
        return AlertCircle;
      default:
        return CheckCircle;
    }
  };

  const pickActivityIcon = (activity: any) => {
    // activity.type or table_name might indicate icon; fallback to CheckCircle
    if (!activity) return CheckCircle;
    if (activity.type && activity.type.toLowerCase().includes('error')) return AlertCircle;
    return CheckCircle;
  };
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
              <div className={`p-3 rounded-lg ${colorMap[kpi.color] || colorMap.blue}`}>
                {(() => {
                  const Icon = kpi.icon || pickKpiIcon(kpi.label);
                  return <Icon className="w-6 h-6" />;
                })()}
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
                  className={`p-2 rounded-lg ${colorMap[activity.color] || colorMap.blue} flex-shrink-0`}
                >
                  {(() => {
                    const AIcon = activity.icon || pickActivityIcon(activity);
                    return <AIcon className="w-5 h-5" />;
                  })()}
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
