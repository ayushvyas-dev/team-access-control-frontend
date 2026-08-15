'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
  Shield,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';

const mainNav = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
];

const settingsNav = [
  {
    label: 'Profile',
    href: '/settings/profile',
    icon: User,
  },
  {
    label: 'Security',
    href: '/settings/security',
    icon: Shield,
  },
  {
    label: 'Danger Zone',
    href: '/settings/danger',
    icon: AlertTriangle,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-50 border-r border-gray-200 flex flex-col z-30">
      {/* Logo / Brand */}
      <div className="px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 bg-black rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-semibold">T</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">TeamAccess</span>
        </Link>
      </div>

      <Separator />

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {mainNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4',
                  isActive ? 'text-gray-900' : 'text-gray-400'
                )}
              />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 pb-2">
          <span className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Settings
          </span>
        </div>

        {settingsNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4',
                  isActive ? 'text-gray-900' : 'text-gray-400',
                  item.href === '/settings/danger' && isActive
                    ? 'text-red-600'
                    : ''
                )}
              />
              <span
                className={cn(
                  item.href === '/settings/danger' && isActive
                    ? 'text-red-600'
                    : ''
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User / Logout */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors w-full"
        >
          <LogOut className="h-4 w-4 text-gray-400" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
