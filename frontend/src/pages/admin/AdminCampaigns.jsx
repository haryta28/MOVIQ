import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader, StatusBadge, ProgressBar } from '../../components/Shared';
import { Search, Filter, Download, Eye, Megaphone } from 'lucide-react';
import { campaigns } from '../../mock/mock';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export default function AdminCampaigns() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const filtered = campaigns.filter(c => (status === 'all' || c.status === status) && (c.title.toLowerCase().includes(q.toLowerCase()) || c.brand.toLowerCase().includes(q.toLowerCase()) || c.city.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="All campaigns across every agency on the platform."
        actions={<Button variant="outline"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>}
      />

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search campaigns, brands, cities..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Filter className="h-4 w-4 mr-1" /> More filters</Button>
          <div className="ml-auto text-sm text-slate-500">{filtered.length} campaigns</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                    {c.brand.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{c.title}</div>
                    <div className="text-xs text-slate-500">{c.brand} · {c.agency}</div>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-slate-500 mb-3">
                <div><div className="text-slate-400">City</div><div className="text-slate-800 font-medium">{c.city}</div></div>
                <div><div className="text-slate-400">Media</div><div className="text-slate-800 font-medium">{c.mediaType}</div></div>
                <div><div className="text-slate-400">Budget</div><div className="text-slate-800 font-medium">₹ {(c.budget/100000).toFixed(1)}L</div></div>
              </div>
              <ProgressBar value={c.completed} max={c.totalTasks} color={c.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'} />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">{c.flagged > 0 ? <span className="text-rose-600 font-medium">{c.flagged} flagged</span> : 'No flags'}</div>
                <Button size="sm" variant="ghost" className="text-blue-600"><Eye className="h-3.5 w-3.5 mr-1" /> View</Button>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 py-10 text-center text-slate-500"><Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" /> No campaigns match</div>
          )}
        </div>
      </Card>
    </div>
  );
}
