import React from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { Plus, Phone, MapPin, ListChecks, UserCog, User } from 'lucide-react';
import { fieldExecutives, supervisors } from '../../mock/mock';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

export default function AgencyTeam() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Team"
        description="Your on-ground team hierarchy: supervisors and field executives."
        actions={<Button className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-1" /> Add member</Button>}
      />

      <Tabs defaultValue="field">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="field" className="gap-2"><User className="h-4 w-4" /> Field Executives ({fieldExecutives.length})</TabsTrigger>
          <TabsTrigger value="supervisor" className="gap-2"><UserCog className="h-4 w-4" /> Supervisors ({supervisors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="field" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fieldExecutives.map(f => (
              <Card key={f.id} className="p-5 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold">
                    {f.name.split(' ').map(x => x[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900 truncate">{f.name}</div>
                      <StatusBadge status={f.status} />
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{f.phone}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{f.city} · Reports to {f.supervisor}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
                  <div><div className="text-xs text-slate-500">Today</div><div className="font-bold text-slate-900">{f.tasksToday}</div></div>
                  <div><div className="text-xs text-slate-500">Total done</div><div className="font-bold text-slate-900">{f.tasksDone}</div></div>
                  <div><div className="text-xs text-slate-500">Quality</div><div className="font-bold text-emerald-600">{f.avgQuality}%</div></div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="supervisor" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supervisors.map(s => (
              <Card key={s.id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-purple-500 text-white flex items-center justify-center font-bold">
                    {s.name.split(' ').map(x => x[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{s.city}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                  <div><div className="text-xs text-slate-500">Team size</div><div className="font-bold text-slate-900">{s.teamSize} executives</div></div>
                  <div><div className="text-xs text-slate-500">Campaigns</div><div className="font-bold text-slate-900 flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" />{s.campaigns}</div></div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
