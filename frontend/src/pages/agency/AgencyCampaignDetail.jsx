import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, StatusBadge, ProgressBar } from '../../components/Shared';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { ArrowLeft, Calendar, MapPin, Megaphone, IndianRupee, Download, FileSpreadsheet, Users, ListChecks, ShieldAlert, Camera, TrendingUp } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import api, { API_BASE } from '../../api';

export default function AgencyCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get(`/campaigns/${id}`);
        setData(r.data);
      } catch (e) {
        toast({ title: 'Unable to load campaign', description: e?.response?.data?.detail || 'Please retry.' });
        navigate('/agency/campaigns');
      }
    })();
  }, [id, navigate]);

  const download = async (kind) => {
    setDownloading(kind);
    try {
      const token = localStorage.getItem('moviq_token');
      const res = await fetch(`${API_BASE}/campaigns/${id}/report/${kind}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moviq-report-${id}.${kind === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Download started', description: `${kind.toUpperCase()} report is downloading.` });
    } catch (e) {
      toast({ title: 'Download failed', description: 'Please try again.' });
    } finally {
      setDownloading(null);
    }
  };

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="animate-pulse text-sm">Loading campaign...</div>
      </div>
    );
  }

  const c = data.campaign;
  const total = c.totalTasks || 1;
  const completed = c.completed || 0;
  const completion = Math.round((completed / total) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/agency/campaigns" className="hover:text-slate-900 flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> All campaigns</Link>
      </div>

      <PageHeader
        title={c.title}
        description={`${c.brand || ''} · ${c.mediaType || ''} · ${c.city || ''}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => download('pdf')} disabled={!!downloading}>
              <Download className="h-4 w-4 mr-1" /> {downloading === 'pdf' ? 'Preparing...' : 'PDF Report'}
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => download('excel')} disabled={!!downloading}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> {downloading === 'excel' ? 'Preparing...' : 'Excel Report'}
            </Button>
          </div>
        }
      />

      {/* Header card */}
      <Card className="p-6">
        <div className="flex items-start gap-5">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center font-bold text-xl shrink-0">
            {(c.brand || '').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-xl font-bold text-slate-900">{c.title}</div>
              <StatusBadge status={c.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-slate-400" /><span className="text-slate-700">{c.mediaType}</span></div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /><span className="text-slate-700">{c.city}</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /><span className="text-slate-700">{c.startDate} → {c.endDate}</span></div>
              <div className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-slate-400" /><span className="text-slate-700">₹ {((c.budget||0)/100000).toFixed(1)}L budget</span></div>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="font-medium text-slate-800">Campaign progress</div>
            <div className="text-slate-500">{completed} of {total} tasks · <span className="font-semibold text-slate-900">{completion}%</span></div>
          </div>
          <ProgressBar value={completed} max={total} color={c.status === 'completed' ? 'bg-emerald-500' : 'bg-red-600'} />
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Tasks', value: total, icon: ListChecks, color: 'bg-slate-50 text-slate-700' },
          { label: 'Completed', value: completed, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Photos', value: (data.tasks || []).reduce((s,t) => s + (t.photos||0), 0), icon: Camera, color: 'bg-red-50 text-red-700' },
          { label: 'Flagged', value: c.flagged || 0, icon: ShieldAlert, color: 'bg-rose-50 text-rose-700' },
          { label: 'Team size', value: (data.team || []).length, icon: Users, color: 'bg-violet-50 text-violet-700' },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">{k.label}</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{k.value}</div>
              </div>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${k.color}`}>
                <k.icon className="h-4 w-4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="tasks">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="tasks">Tasks ({(data.tasks || []).length})</TabsTrigger>
          <TabsTrigger value="team">Team ({(data.team || []).length})</TabsTrigger>
          <TabsTrigger value="activity">Activity ({(data.activity || []).length})</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                    <th className="py-3 px-4 font-medium">Task</th>
                    <th className="py-3 px-4 font-medium">Unit</th>
                    <th className="py-3 px-4 font-medium">City</th>
                    <th className="py-3 px-4 font-medium">Executive</th>
                    <th className="py-3 px-4 font-medium">Submitted</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.tasks || []).slice(0, 30).map(t => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">{t.taskCode}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{t.unitCode}</td>
                      <td className="py-3 px-4 text-slate-700">{t.city}</td>
                      <td className="py-3 px-4 text-slate-700">{t.assignedTo}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{t.submittedAt || '—'}</td>
                      <td className="py-3 px-4"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                  {(data.tasks || []).length === 0 && (
                    <tr><td colSpan={6} className="py-10 text-center text-slate-500">No tasks yet for this campaign.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data.team || []).map(f => (
              <Card key={f.id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-xs">
                    {f.name.split(' ').map(x => x[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{f.name}</div>
                    <div className="text-xs text-slate-500">{f.phone}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{f.city} · Reports to {f.supervisor}</div>
                  </div>
                  <StatusBadge status={f.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                  <div><div className="text-xs text-slate-500">Today</div><div className="font-bold">{f.tasksToday}</div></div>
                  <div><div className="text-xs text-slate-500">Total</div><div className="font-bold">{f.tasksDone}</div></div>
                  <div><div className="text-xs text-slate-500">Quality</div><div className="font-bold text-emerald-600">{f.avgQuality}%</div></div>
                </div>
              </Card>
            ))}
            {(data.team || []).length === 0 && (
              <div className="col-span-3 py-10 text-center text-slate-500">No team members assigned yet.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="p-6">
            <div className="space-y-4">
              {(data.activity || []).length === 0 && (
                <div className="text-center py-10 text-slate-500">No activity yet.</div>
              )}
              {(data.activity || []).map(a => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${a.kind === 'fraud' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {a.kind === 'fraud' ? <ShieldAlert className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-4 border-b border-slate-100">
                    <div className="text-sm text-slate-800">{a.text}</div>
                    <div className="text-xs text-slate-500 mt-1">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-xs text-slate-500">Budget</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">₹ {((c.budget||0)/100000).toFixed(1)}L</div>
                <div className="text-xs text-slate-500 mt-1">Total allocated</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Spent</div>
                <div className="text-3xl font-bold text-red-600 mt-1">₹ {((c.spent||0)/100000).toFixed(1)}L</div>
                <div className="text-xs text-slate-500 mt-1">{c.budget ? Math.round((c.spent/c.budget)*100) : 0}% utilized</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Remaining</div>
                <div className="text-3xl font-bold text-emerald-600 mt-1">₹ {(((c.budget||0)-(c.spent||0))/100000).toFixed(1)}L</div>
                <div className="text-xs text-slate-500 mt-1">Available</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="text-slate-700">Budget utilisation</div>
                <div className="font-semibold">{c.budget ? Math.round((c.spent/c.budget)*100) : 0}%</div>
              </div>
              <ProgressBar value={c.spent || 0} max={c.budget || 1} color="bg-red-600" />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
