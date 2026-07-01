import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Megaphone, ListChecks, Users, Images, FileBarChart, Map, LogOut, Bell, Search, Sparkles } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { MOVIQ_LOGO, MOVIQ_NAME } from '../brand';
import useNotifications from '../hooks/useNotifications';

const nav = [
  { to: '/agency', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/agency/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/agency/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/agency/live-map', label: 'Live Map', icon: Map },
  { to: '/agency/team', label: 'Field Team', icon: Users },
  { to: '/agency/proofs', label: 'Media Proofs', icon: Images },
  { to: '/agency/reports', label: 'Reports', icon: FileBarChart },
];

export default function AgencyLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unread, markAllSeen } = useNotifications(30000);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
          <img src={MOVIQ_LOGO} alt={MOVIQ_NAME} className="h-9 w-9 object-contain" />
          <div>
            <div className="font-bold text-slate-900 leading-tight">{MOVIQ_NAME}</div>
            <div className="text-[10px] text-slate-500 leading-tight">Agency Portal</div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-100">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Agency</div>
          <div className="text-sm font-semibold text-slate-800 truncate">{user?.agencyName || 'BrightAds Media'}</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-red-50 text-red-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mx-3 mb-3 p-3 rounded-lg border border-red-100 bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-red-600" />
            <div className="text-sm font-semibold text-slate-800">Need more capacity?</div>
          </div>
          <p className="text-xs text-slate-500 mt-1">Reach out to your Moviq account manager for enterprise features.</p>
          <Button size="sm" className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white h-8">Contact us</Button>
        </div>

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-md p-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-red-600 text-white text-xs">{user?.avatar || 'A'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => { logout(); navigate('/login'); }} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 sticky top-0 z-10">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search campaigns, vehicles, drivers..." className="pl-9 bg-slate-50 border-slate-200" />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu onOpenChange={(o) => o && markAllSeen()}>
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

        <main className="flex-1 p-6 fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
