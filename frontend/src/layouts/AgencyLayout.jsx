import React from 'react';
import { LayoutDashboard, Megaphone, ListChecks, Users, Images, FileBarChart, Map, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';

const NAV = [
  { to: '/agency',           label: 'Overview',    icon: LayoutDashboard, end: true },
  { to: '/agency/campaigns', label: 'Campaigns',   icon: Megaphone },
  { to: '/agency/tasks',     label: 'Tasks',       icon: ListChecks },
  { to: '/agency/live-map',  label: 'Live Map',    icon: Map },
  { to: '/agency/team',      label: 'Field Team',  icon: Users },
  { to: '/agency/proofs',    label: 'Media Proofs',icon: Images },
  { to: '/agency/reports',   label: 'Reports',     icon: FileBarChart },
];

function AgencyHeaderSlot({ agencyName }) {
  return (
    <div className="px-4 py-3 border-b border-slate-100">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Agency</div>
      <div className="text-sm font-semibold text-slate-800 truncate">{agencyName || 'Agency'}</div>
    </div>
  );
}

function AgencyUpsellSlot() {
  return (
    <div className="mx-3 mb-3 p-3 rounded-lg border border-red-100 bg-gradient-to-br from-red-50 to-white">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-red-600" />
        <div className="text-sm font-semibold text-slate-800">Need more capacity?</div>
      </div>
      <p className="text-xs text-slate-500 mt-1">Reach out to your Moviq account manager for enterprise features.</p>
      <Button size="sm" className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white h-8">Contact us</Button>
    </div>
  );
}

export default function AgencyLayout() {
  const { user } = useAuth();
  return (
    <DashboardLayout
      nav={NAV}
      subtitle="Agency Portal"
      searchPlaceholder="Search campaigns, vehicles, drivers..."
      sidebarExtras={{
        header: <AgencyHeaderSlot agencyName={user?.agencyName} />,
        footer: <AgencyUpsellSlot />,
      }}
    />
  );
}
