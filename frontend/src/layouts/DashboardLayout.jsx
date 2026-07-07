import React, { memo } from 'react';
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { LogOut, Bell, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { MOVIQ_LOGO, MOVIQ_NAME } from '../brand';
import useNotifications from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';

/**
 * DashboardLayout — shared sidebar shell for Admin and Agency portals.
 *
 * Props:
 *   nav               Array of { to, label, icon, end? }
 *   subtitle          Text shown under the logo (e.g. "Admin Console")
 *   searchPlaceholder Placeholder for the header search bar
 *   sidebarExtras     { header?, footer? } — JSX slots for layout-specific extras
 */
function DashboardLayout({ nav, subtitle, searchPlaceholder, sidebarExtras }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unread, markAllSeen } = useNotifications(30000);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 h-screen sticky top-0 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
          <img src={MOVIQ_LOGO} alt={MOVIQ_NAME} className="h-9 w-9 object-contain" />
          <div>
            <div className="font-bold text-slate-900 leading-tight">{MOVIQ_NAME}</div>
            <div className="text-[10px] text-slate-500 leading-tight">{subtitle}</div>
          </div>
        </div>

        {/* Optional header slot (e.g. agency name badge) */}
        {sidebarExtras?.header}

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-red-50 text-red-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Optional footer slot (e.g. agency upsell card) */}
        {sidebarExtras?.footer}

        {/* User profile + logout */}
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-md p-1">
            <Link to={user?.role === 'admin' ? '/admin/profile' : '/agency/profile'} className="flex items-center gap-3 flex-1 min-w-0 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-red-600 text-white text-xs">
                  {user?.avatar || (user?.name || 'A').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-semibold truncate text-slate-800">{user?.name}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email}</div>
              </div>
            </Link>
            <Button size="icon" variant="ghost" onClick={handleLogout} title="Logout" className="text-slate-400 hover:text-red-600 shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 sticky top-0 z-10">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications dropdown */}
            <DropdownMenu onOpenChange={o => o && markAllSeen()}>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="relative">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  <span className="text-xs font-normal text-slate-500">{notifications.length} total</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 && (
                  <div className="p-4 text-sm text-slate-500 text-center">No notifications yet</div>
                )}
                {notifications.slice(0, 8).map(n => (
                  <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5">
                    <div className="flex items-center gap-2 w-full">
                      <span className={`h-2 w-2 rounded-full ${n.type === 'alert' ? 'bg-red-500' : n.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium text-sm flex-1">{n.title}</span>
                      <span className="text-xs text-slate-400">{n.time}</span>
                    </div>
                    <div className="text-xs text-slate-500 pl-4">{n.description}</div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge variant="outline" className="gap-1 border-emerald-200 text-emerald-700 bg-emerald-50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
            </Badge>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default memo(DashboardLayout);
