import React from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, ProgressBar } from '../../components/Shared';
import { Download, Share2, FileBarChart, TrendingUp } from 'lucide-react';
import { campaigns, cityStats } from '../../mock/mock';
import { toast } from '../../hooks/use-toast';

export default function AgencyReports() {
  const myCampaigns = campaigns.filter(c => c.agencyId === 'a1');

  const download = (name) => toast({ title: 'Report ready', description: `${name} PDF has been generated.` });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Auto-generated, client-ready reports in seconds."
        actions={<Button className="bg-red-600 hover:bg-red-700 text-white"><FileBarChart className="h-4 w-4 mr-1" /> New report</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {myCampaigns.map(c => (
          <Card key={c.id} className="p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-slate-500">{c.brand}</div>
                <div className="font-semibold text-slate-900">{c.title}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <FileBarChart className="h-5 w-5" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 my-3">
              <div><div className="text-xs text-slate-500">Total</div><div className="font-bold">{c.totalTasks}</div></div>
              <div><div className="text-xs text-slate-500">Done</div><div className="font-bold text-emerald-600">{c.completed}</div></div>
              <div><div className="text-xs text-slate-500">Rate</div><div className="font-bold">{Math.round((c.completed/c.totalTasks)*100)}%</div></div>
            </div>
            <ProgressBar value={c.completed} max={c.totalTasks} color="bg-red-600" />
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => download(c.title)}><Download className="h-3.5 w-3.5 mr-1" /> PDF</Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => download(c.title + ' Excel')}><Download className="h-3.5 w-3.5 mr-1" /> Excel</Button>
              <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Link copied', description: 'Client dashboard link copied to clipboard.' })}><Share2 className="h-3.5 w-3.5" /></Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">Campaign Summary Report</h3>
            <p className="text-sm text-slate-500">NoBroker Auto Blitz Q3 · Auto Branding · Jul 2025</p>
          </div>
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-slate-50"><div className="text-xs text-slate-500">Total Units</div><div className="text-2xl font-bold">1,500</div></div>
          <div className="p-4 rounded-lg bg-slate-50"><div className="text-xs text-slate-500">Installed</div><div className="text-2xl font-bold text-emerald-600">653</div></div>
          <div className="p-4 rounded-lg bg-slate-50"><div className="text-xs text-slate-500">Completion</div><div className="text-2xl font-bold">43.5%</div></div>
          <div className="p-4 rounded-lg bg-slate-50"><div className="text-xs text-slate-500">Flagged</div><div className="text-2xl font-bold text-rose-600">8</div></div>
        </div>
        <div>
          <div className="text-sm font-medium mb-3">City breakdown</div>
          <div className="space-y-2">
            {cityStats.slice(0, 5).map(c => (
              <div key={c.city} className="flex items-center gap-3">
                <div className="text-sm w-28">{c.city}</div>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${c.completion}%` }} />
                </div>
                <div className="text-xs font-semibold w-20 text-right">{c.tasks.toLocaleString()} tasks</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => download('Campaign Summary')}><Download className="h-4 w-4 mr-1" /> Download PDF</Button>
          <Button variant="outline"><Share2 className="h-4 w-4 mr-1" /> Share Link</Button>
        </div>
      </Card>
    </div>
  );
}
