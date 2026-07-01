import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageHeader, StatusBadge, ProgressBar } from '../../components/Shared';
import { Plus, Calendar, MapPin, IndianRupee, Megaphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';
import api from '../../api';

export default function AgencyCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [brands, setBrands] = useState([]);
  const [mediaTypes, setMediaTypes] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', brand: '', mediaType: '', city: '', totalTasks: 100, budget: 100000, startDate: '', endDate: '' });

  useEffect(() => {
    (async () => {
      try {
        const [c, b, m] = await Promise.all([api.get('/campaigns'), api.get('/brands'), api.get('/media-types')]);
        setCampaigns(c.data); setBrands(b.data); setMediaTypes(m.data);
      } catch (_) {}
    })();
  }, []);

  const create = async () => {
    if (!form.title || !form.brand) { toast({ title: 'Missing fields' }); return; }
    try {
      const r = await api.post('/campaigns', form);
      setCampaigns([r.data, ...campaigns]);
      setOpen(false);
      toast({ title: 'Campaign created', description: `${r.data.title} is now live.` });
    } catch (e) {
      toast({ title: 'Failed', description: e?.response?.data?.detail || 'Try again.' });
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
          <Card key={c.id} className="p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold">
                  {(c.brand||'').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{c.title}</div>
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
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{c.startDate} → {c.endDate}</span>
              <Link to={`/agency/campaigns/${c.id}`}>
                <Button size="sm" variant="ghost" className="text-red-600">Details</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
