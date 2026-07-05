import React from 'react';
import { Card } from '../../components/ui/card';
import { PageHeader, MiniBarChart } from '../../components/Shared';
import { Button } from '../../components/ui/button';
import { TrendingUp, Users, ListChecks, ShieldCheck, Camera, MapPin } from 'lucide-react';
import useParallelApi from '../../hooks/useParallelApi';


export default function AdminAnalytics() {
  const { results } = useParallelApi(['/analytics/overview', '/brands']);
  const [analyticsRaw, brandsRaw] = results;
  const analytics = analyticsRaw || { monthlyStats: [], cityStats: [] };
  const brands = brandsRaw || [];

  const maxCityTasks = Math.max(1, ...(analytics.cityStats.map(c => c.tasks) || [1]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Deep dive into platform-wide performance metrics."
        actions={<div className="flex gap-2"><Button variant="outline">Last 30 days</Button><Button variant="outline">Export</Button></div>}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tasks tracked', value: '14,598', delta: '+22%', icon: ListChecks, color: 'text-red-600 bg-red-50' },
          { label: 'GPS accuracy', value: '99.4%', delta: '+0.2%', icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Photos verified', value: '38,214', delta: '+31%', icon: Camera, color: 'text-red-600 bg-red-50' },
          { label: 'Fraud blocked', value: '1,284', delta: '+12%', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50' },
        ].map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">{k.label}</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{k.value}</div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">{k.delta}</div>
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${k.color}`}>
                <k.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Revenue trend</h3>
              <p className="text-sm text-slate-500">Monthly recurring revenue growth</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          {analytics.monthlyStats.length > 0 && <MiniBarChart data={analytics.monthlyStats} valueKey="revenue" labelKey="month" color="bg-gradient-to-t from-emerald-500 to-emerald-300" />}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Campaigns per month</h3>
              <p className="text-sm text-slate-500">Volume of active campaigns</p>
            </div>
            <Users className="h-5 w-5 text-red-600" />
          </div>
          {analytics.monthlyStats.length > 0 && <MiniBarChart data={analytics.monthlyStats} valueKey="campaigns" labelKey="month" color="bg-gradient-to-t from-red-600 to-red-400" />}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Top cities by task volume</h3>
          <div className="space-y-3">
            {(analytics.cityStats || []).map(c => (
              <div key={c.city} className="flex items-center gap-3">
                <div className="text-sm w-28 text-slate-700">{c.city}</div>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${(c.tasks/maxCityTasks)*100}%` }} />
                </div>
                <div className="text-sm font-semibold w-16 text-right">{c.tasks.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Top brands by spend</h3>
          <div className="space-y-3">
            {[...brands].sort((a,b) => b.spend - a.spend).map(b => (
              <div key={b.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-lg">{b.logo}</div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{b.name}</div>
                  <div className="text-xs text-slate-500">{b.category} · {b.campaigns} campaigns</div>
                </div>
                <div className="text-sm font-bold text-slate-900">₹ {(b.spend/100000).toFixed(1)}L</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
