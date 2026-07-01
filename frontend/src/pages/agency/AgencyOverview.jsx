import React from 'react';
import { Card } from '../../components/ui/card';
import { KpiCard, StatusBadge, PageHeader, ProgressBar, MiniBarChart } from '../../components/Shared';
import { Megaphone, ListChecks, Users, Camera, Plus, ArrowUpRight, MapPin, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { campaigns, tasks, fieldExecutives, monthlyStats } from '../../mock/mock';
import { Link } from 'react-router-dom';

export default function AgencyOverview() {
  const myCampaigns = campaigns.filter(c => c.agencyId === 'a1');
  const myTasks = tasks;
  const completed = myCampaigns.reduce((s, c) => s + c.completed, 0);
  const total = myCampaigns.reduce((s, c) => s + c.totalTasks, 0);
  const recentTasks = myTasks.slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good morning, Saurav 👋"
        description="Here's what's happening across your campaigns today."
        actions={<Link to="/agency/campaigns"><Button className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-1" /> New campaign</Button></Link>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active campaigns" value={myCampaigns.filter(c => c.status === 'ongoing').length} icon={Megaphone} delta={8} accent="indigo" />
        <KpiCard label="Tasks completed" value={`${completed}/${total}`} icon={ListChecks} delta={15} accent="blue" />
        <KpiCard label="Field executives" value={fieldExecutives.length} icon={Users} delta={4} accent="emerald" />
        <KpiCard label="Photos verified today" value="312" icon={Camera} delta={22} accent="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Your campaigns</h3>
              <p className="text-sm text-slate-500">Progress across your active work</p>
            </div>
            <Link to="/agency/campaigns"><Button size="sm" variant="ghost" className="text-red-600">View all <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Button></Link>
          </div>
          <div className="space-y-4">
            {myCampaigns.map(c => (
              <div key={c.id} className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-red-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs">
                  {c.brand.slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-900 truncate">{c.title}</div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 mb-1.5">{c.brand} · {c.city} · {c.mediaType}</div>
                  <ProgressBar value={c.completed} max={c.totalTasks} color="bg-red-600" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Today's activity</h3>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {recentTasks.map(t => (
              <div key={t.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-slate-50">
                <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 truncate">{t.unitCode}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{t.address}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.assignedTo} · {t.submittedAt || 'awaiting'}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">Monthly execution</h3>
            <p className="text-sm text-slate-500">Task volume trend</p>
          </div>
        </div>
        <MiniBarChart data={monthlyStats} valueKey="tasks" labelKey="month" color="bg-gradient-to-t from-red-600 to-red-400" />
      </Card>
    </div>
  );
}
