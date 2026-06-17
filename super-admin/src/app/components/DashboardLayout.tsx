import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  FileText,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  CheckCheck,
  Trash2,
  AlertCircle,
  UserPlus,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { isSystemAdmin } from '../../utils/permissionUtils';

type Notification = {
  id: number;
  type: 'alert' | 'user' | 'security' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
};

// TODO: Fetch from /api/notifications or WebSocket for real-time updates
const initialNotifications: Notification[] = [];

const notificationIcons: Record<Notification['type'], React.ReactNode> = {
  alert: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  user: <UserPlus className="w-5 h-5 text-blue-500" />,
  security: <ShieldAlert className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-gray-400" />,
};

const navigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Clinic Management', path: '/clinics', icon: Building2 },
  { name: 'User Management', path: '/users', icon: Users },
  { name: 'Roles & Permissions', path: '/roles', icon: Shield },
  { name: 'Audit Trail', path: '/audit', icon: FileText },
];

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('vetintel_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        if (!isSystemAdmin(data.role)) {
          throw new Error('Unauthorized');
        }
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem('vetintel_token');
        localStorage.removeItem('vetintel_user');
        navigate('/login');
      });
  }, [navigate]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const markRead = (id: number) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const deleteNotification = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const visibleNotifications = activeFilter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then(regs => regs.forEach(r => r.unregister()))
        .catch(() => {});
    }
    navigate('/login');
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const initials = (user.name || 'SA')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center ring-1 ring-white/10">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white">VetIntel</div>
              <div className="text-xs text-slate-400">Super Admin</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-3xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_10px_30px_-15px_rgba(59,130,246,0.35)]'
                    : 'text-slate-300 hover:bg-white/20 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 px-3 py-4">
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-3xl text-sm font-medium text-slate-200 hover:bg-white hover:text-slate-900"
          >
            <Settings className="w-5 h-5 text-slate-200" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-3xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-600"
          >
            <LogOut className="w-5 h-5 text-red-400" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search bar */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clinics, users, or settings..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-gray-600 hover:text-gray-900"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex border-b border-gray-200">
                    {(['all', 'unread'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`flex-1 py-2 text-sm capitalize ${activeFilter === f ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {f === 'unread' ? `Unread (${unreadCount})` : 'All'}
                      </button>
                    ))}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {visibleNotifications.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-400">
                        No notifications
                      </div>
                    ) : (
                      visibleNotifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="mt-0.5 shrink-0">{notificationIcons[n.type]}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {n.title}
                              </p>
                              <button
                                onClick={(e) => deleteNotification(n.id, e)}
                                className="shrink-0 text-gray-300 hover:text-red-400 mt-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                          </div>
                          {!n.read && (
                            <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-200 text-center">
                      <button
                        onClick={() => { setNotifications([]); setShowNotifications(false); }}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Clear all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative pl-4 border-l border-gray-200 hidden md:flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-sm text-white">{initials}</span>
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">{user.name || 'User'}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
