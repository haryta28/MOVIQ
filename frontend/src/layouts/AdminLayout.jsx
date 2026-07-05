import React from 'react';
import { LayoutDashboard, Building2, Megaphone, Users, ShieldAlert, BarChart3, Layers } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const NAV = [
  { to: '/admin',             label: 'Overview',     icon: LayoutDashboard, end: true },
  { to: '/admin/agencies',    label: 'Agencies',     icon: Building2 },
  { to: '/admin/campaigns',   label: 'Campaigns',    icon: Megaphone },
  { to: '/admin/users',       label: 'Users',        icon: Users },
  { to: '/admin/fraud',       label: 'Fraud Alerts', icon: ShieldAlert },
  { to: '/admin/analytics',   label: 'Analytics',    icon: BarChart3 },
  { to: '/admin/media-types', label: 'Media Types',  icon: Layers },
];

export default function AdminLayout() {
  return (
    <DashboardLayout
      nav={NAV}
      subtitle="Admin Console"
      searchPlaceholder="Search agencies, campaigns, vehicles..."
    />
  );
}
