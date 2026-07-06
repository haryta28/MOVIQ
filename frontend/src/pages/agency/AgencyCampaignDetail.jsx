import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageHeader, StatusBadge, ProgressBar } from '../../components/Shared';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { ArrowLeft, Calendar, MapPin, Megaphone, IndianRupee, Download, FileSpreadsheet, Users, ListChecks, ShieldAlert, Camera, TrendingUp, Pencil, Trash2, X } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import api, { API_BASE } from '../../api';
import useApi from '../../hooks/useApi';

export default function AgencyCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, refetch } = useApi(`/campaigns/${id}`);
  const { data: brands = [] } = useApi('/brands');
  const { data: mediaTypes = [] } = useApi('/media-types');
  const [downloading, setDownloading] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', brand: '', mediaType: '', city: '', totalTasks: 0, budget: 0, startDate: '', endDate: '', status: '' });

  const c = data?.campaign;

  useEffect(() => {
    if (error) {
      toast({ title: 'Unable to load campaign', description: error || 'Please retry.' });
      navigate('/agency/campaigns');
    }
  }, [error, navigate]);

  useEffect(() => {
    if (c) {
      setEditForm({
        title: c.title || '',
        brand: c.brand || '',
        mediaType: c.mediaType || '',
        city: c.city || '',
        totalTasks: c.totalTasks || 0,
        budget: c.budget || 0,
        startDate: c.startDate || '',
        endDate: c.endDate || '',
        status: c.status || 'ongoing'
      });
    }
  }, [c]);

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

  const updateCampaign = async () => {
    if (!editForm.title || !editForm.brand) { toast({ title: 'Missing fields' }); return; }
    try {
      await api.patch(`/campaigns/${id}`, editForm);
      toast({ title: 'Campaign updated', description: `${editForm.title} details saved.` });
      setShowEditModal(false);
      refetch();
    } catch (e) {
      toast({ title: 'Update failed', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  const deleteCampaign = async () => {
    if (!window.confirm(`Are you sure you want to completely delete campaign "${c.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/campaigns/${id}`);
      toast({ title: 'Campaign deleted', description: `Campaign was successfully removed.` });
      setShowEditModal(false);
      navigate('/agency/campaigns');
    } catch (e) {
      toast({ title: 'Deletion failed', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="animate-pulse text-sm">Loading campaign...</div>
      </div>
    );
  }

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
            <Button variant="outline" className="border-slate-300 hover:bg-slate-50" onClick={() => setShowEditModal(true)}>
              <Pencil className="h-4 w-4 mr-1 text-slate-500" /> Edit Campaign
            </Button>
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
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-2">
            <span>Campaign progress</span>
            <span>{completed} of {total} tasks · {completion}%</span>
          </div>
          <ProgressBar value={completed} max={total} color="bg-red-600" />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Tasks</div>
            <div className="text-2xl font-bold text-slate-950 mt-1">{total}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><ListChecks className="h-5 w-5" /></div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Completed</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{completed}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp className="h-5 w-5" /></div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Photos</div>
            <div className="text-2xl font-bold text-slate-950 mt-1">{data.stats.byStatus.submitted + data.stats.byStatus.approved + data.stats.byStatus.flagged}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Camera className="h-5 w-5" /></div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Flagged</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">{data.stats.byStatus.flagged}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><ShieldAlert className="h-5 w-5" /></div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Team size</div>
            <div className="text-2xl font-bold text-slate-950 mt-1">{data.team.length}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Users className="h-5 w-5" /></div>
        </Card>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="tasks">Tasks ({data.tasks.length})</TabsTrigger>
          <TabsTrigger value="team">Team ({data.team.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity ({data.activity.length})</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <Card className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                    <th className="py-3 px-3 font-medium">Task</th>
                    <th className="py-3 px-3 font-medium">Unit</th>
                    <th className="py-3 px-3 font-medium">City</th>
                    <th className="py-3 px-3 font-medium">Executive</th>
                    <th className="py-3 px-3 font-medium">Submitted</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tasks.map(t => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono text-xs text-slate-600">{t.taskCode}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{t.unitCode}</td>
                      <td className="py-3 px-3 text-slate-700">{t.city}</td>
                      <td className="py-3 px-3 text-slate-700">{t.assignedTo}</td>
                      <td className="py-3 px-3 text-xs text-slate-500">{t.submittedAt || '—'}</td>
                      <td className="py-3 px-3"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                  {data.tasks.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-500">No tasks yet for this campaign.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.team.map(m => (
              <Card key={m.id} className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{m.name}</div>
                  <div className="text-xs text-slate-500">{m.phone}</div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="p-4">
            <div className="space-y-4">
              {data.activity.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-sm">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${act.kind === 'fraud' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {act.kind === 'fraud' ? <ShieldAlert className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{act.text}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{act.time}</div>
                  </div>
                </div>
              ))}
              {data.activity.length === 0 && (
                <div className="py-6 text-center text-slate-500 text-sm">No activity recorded yet.</div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4 font-semibold">Budget Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm max-w-sm">
              <div className="text-slate-500">Allocated budget</div>
              <div className="font-bold text-slate-900 text-right">₹ {c.budget?.toLocaleString()}</div>
              <div className="text-slate-500">Spent to date</div>
              <div className="font-bold text-slate-900 text-right">₹ {c.spent?.toLocaleString() || '0'}</div>
              <div className="text-slate-500 border-t border-slate-100 pt-2">Remaining balance</div>
              <div className="font-bold text-emerald-600 text-right border-t border-slate-100 pt-2">₹ {(c.budget - (c.spent || 0))?.toLocaleString()}</div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Edit Campaign Dialog Modal ── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="h-4.5 w-4.5 text-red-600" /> Edit Campaign</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2"><Label>Campaign title</Label><Input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="mt-1" /></div>
            <div>
              <Label>Brand</Label>
              <Select value={editForm.brand} onValueChange={v => setEditForm({...editForm, brand: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Media type</Label>
              <Select value={editForm.mediaType} onValueChange={v => setEditForm({...editForm, mediaType: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{mediaTypes.map(m => <SelectItem key={m.key} value={m.label}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>City</Label><Input value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} className="mt-1" /></div>
            <div><Label>Total tasks</Label><Input type="number" value={editForm.totalTasks} onChange={e => setEditForm({...editForm, totalTasks: +e.target.value})} className="mt-1" /></div>
            <div><Label>Start date</Label><Input type="date" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} className="mt-1" /></div>
            <div><Label>End date</Label><Input type="date" value={editForm.endDate} onChange={e => setEditForm({...editForm, endDate: e.target.value})} className="mt-1" /></div>
            <div><Label>Budget (₹)</Label><Input type="number" value={editForm.budget} onChange={e => setEditForm({...editForm, budget: +e.target.value})} className="mt-1" /></div>
            <div>
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm({...editForm, status: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-2 flex justify-between items-center w-full sm:justify-between">
            <Button variant="destructive" onClick={deleteCampaign} className="mr-auto">
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={updateCampaign}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
