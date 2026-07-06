import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageHeader, StatusBadge, ProgressBar } from '../../components/Shared';
import { Plus, Calendar, MapPin, IndianRupee, Megaphone, Pencil, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';
import api from '../../api';
import useParallelApi from '../../hooks/useParallelApi';

export default function AgencyCampaigns() {
  const { results, refetch } = useParallelApi(['/campaigns', '/brands', '/media-types']);
  const [fetchedCampaigns = [], brands = [], mediaTypes = []] = results;
  const [localCampaigns, setLocalCampaigns] = useState(null); // null = use fetched
  const campaigns = localCampaigns ?? fetchedCampaigns;
  
  const [open, setOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  
  const [form, setForm] = useState({ title: '', brand: '', mediaType: '', city: '', totalTasks: 100, budget: 100000, startDate: '', endDate: '' });
  const [editForm, setEditForm] = useState({ title: '', brand: '', mediaType: '', city: '', totalTasks: 0, budget: 0, startDate: '', endDate: '', status: '' });

  useEffect(() => {
    if (editingCampaign) {
      setEditForm({
        title: editingCampaign.title || '',
        brand: editingCampaign.brand || '',
        mediaType: editingCampaign.mediaType || '',
        city: editingCampaign.city || '',
        totalTasks: editingCampaign.totalTasks || 0,
        budget: editingCampaign.budget || 0,
        startDate: editingCampaign.startDate || '',
        endDate: editingCampaign.endDate || '',
        status: editingCampaign.status || 'ongoing'
      });
    }
  }, [editingCampaign]);

  const create = async () => {
    if (!form.title || !form.brand) { toast({ title: 'Missing fields' }); return; }
    try {
      const r = await api.post('/campaigns', form);
      setLocalCampaigns([r.data, ...campaigns]);
      setOpen(false);
      toast({ title: 'Campaign created', description: `${r.data.title} is now live.` });
      refetch();
    } catch (e) {
      toast({ title: 'Failed', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  const updateCampaign = async () => {
    if (!editForm.title || !editForm.brand) { toast({ title: 'Missing fields' }); return; }
    try {
      await api.patch(`/campaigns/${editingCampaign.id}`, editForm);
      toast({ title: 'Campaign updated', description: `${editForm.title} details saved.` });
      setEditingCampaign(null);
      setLocalCampaigns(null);
      refetch();
    } catch (e) {
      toast({ title: 'Update failed', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  const deleteCampaign = async () => {
    if (!window.confirm(`Are you sure you want to completely delete campaign "${editingCampaign.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/campaigns/${editingCampaign.id}`);
      toast({ title: 'Campaign deleted', description: `Campaign was successfully removed.` });
      setEditingCampaign(null);
      setLocalCampaigns(null);
      refetch();
    } catch (e) {
      toast({ title: 'Deletion failed', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Create, launch, and track every OOH campaign end-to-end."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-1" /> New campaign</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Launch a new campaign</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>Campaign title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="NoBroker Auto Blitz Q3" className="mt-1" /></div>
                <div>
                  <Label>Brand</Label>
                  <Select value={form.brand} onValueChange={v => setForm({...form, brand: v})}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Media type</Label>
                  <Select value={form.mediaType} onValueChange={v => setForm({...form, mediaType: v})}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{mediaTypes.map(m => <SelectItem key={m.key} value={m.label}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="mt-1" placeholder="Bengaluru" /></div>
                <div><Label>Total tasks</Label><Input type="number" value={form.totalTasks} onChange={e => setForm({...form, totalTasks: +e.target.value})} className="mt-1" /></div>
                <div><Label>Start date</Label><Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="mt-1" /></div>
                <div><Label>End date</Label><Input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="mt-1" /></div>
                <div className="col-span-2"><Label>Budget (₹)</Label><Input type="number" value={form.budget} onChange={e => setForm({...form, budget: +e.target.value})} className="mt-1" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="bg-red-600 hover:bg-red-700" onClick={create}>Launch campaign</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map(c => (
          <Card key={c.id} className="p-5 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold">
                    {(c.brand||'').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <Link to={`/agency/campaigns/${c.id}`} className="font-semibold text-slate-900 hover:text-red-600 transition">
                      {c.title}
                    </Link>
                    <div className="text-xs text-slate-500">{c.brand}</div>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs my-3">
                <div className="flex items-center gap-1.5 text-slate-600"><MapPin className="h-3.5 w-3.5 text-slate-400" />{c.city}</div>
                <div className="flex items-center gap-1.5 text-slate-600"><Megaphone className="h-3.5 w-3.5 text-slate-400" />{c.mediaType}</div>
                <div className="flex items-center gap-1.5 text-slate-600"><IndianRupee className="h-3.5 w-3.5 text-slate-400" />{((c.budget||0)/100000).toFixed(1)}L</div>
              </div>
              <ProgressBar value={c.completed || 0} max={c.totalTasks || 1} color="bg-red-600" />
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{c.startDate} → {c.endDate}</span>
              <div className="flex gap-2">
                <Link to={`/agency/campaigns/${c.id}`}>
                  <Button size="sm" variant="ghost" className="text-slate-600">Details</Button>
                </Link>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setEditingCampaign(c)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Edit Campaign Dialog Modal ── */}
      <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
        <DialogContent className="max-w-lg animate-in fade-in zoom-in-95 duration-150">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4.5 w-4.5 text-red-600" /> Edit Campaign Details
            </DialogTitle>
          </DialogHeader>
          
          {editingCampaign && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="col-span-2">
                <Label>Campaign title</Label>
                <Input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="mt-1" />
              </div>
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
              <div>
                <Label>Budget (₹)</Label>
                <Input type="number" value={editForm.budget} onChange={e => setEditForm({...editForm, budget: +e.target.value})} className="mt-1" />
              </div>
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
          )}

          <DialogFooter className="pt-2 flex justify-between items-center w-full sm:justify-between">
            <Button variant="destructive" onClick={deleteCampaign} className="mr-auto">
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingCampaign(null)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={updateCampaign}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
