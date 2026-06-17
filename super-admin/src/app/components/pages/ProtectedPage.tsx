import { ReactNode } from 'react';
import Topbar from '../components/Topbar';

interface ProtectedPageProps {
  user: { name: string; role: string };
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function ProtectedPage({ user, title, subtitle, children }: ProtectedPageProps) {
  const normalizedRole = String(user.role || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  const isAdmin = normalizedRole === 'super_admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full">
        <Topbar user={user} title={title} subtitle={subtitle} />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <div className="text-xl font-semibold text-slate-900 mb-2">Access Denied</div>
            <div className="text-sm text-slate-500">You need System Administrator access to view this page.</div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
