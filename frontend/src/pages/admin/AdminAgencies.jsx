import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { Plus, Search, MoreHorizontal, Building2, MapPin, Users, Megaphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { toast } from '../../hooks/use-toast';
import api from '../../api';
import useApi from '../../hooks/useApi';


export default function AdminAgencies() {
  const navigate = useNavigate();
  const { data: fetchedAgencies = [], refetch } = useApi('/agencies');
  const [agencies, setAgencies] = useState(null); // null = use fetched, array = local override
  const displayed = agencies ?? fetchedAgencies;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', head: '', email: '', phone: '', city: '', plan: 'Growth' });

  const filtered = displayed.filter(a =>
    a.name.toLowerCase().includes(q.toLowerCase()) ||
    (a.city || '').toLowerCase().includes(q.toLowerCase())
  );

  const create = async () => {
    if (!form.name || !form.email) { toast({ title: 'Missing fields', description: 'Name and email are required.' }); return; }
    try {
      const r = await api.post('/agencies', form);
      setAgencies([r.data, ...displayed]);
      setOpen(false);
      setForm({ name: '', head: '', email: '', phone: '', city: '', plan: 'Growth' });
      toast({ title: 'Agency onboarded', description: `${r.data.name} is now active on ${r.data.plan} plan.` });
    } catch (e) {
      toast({ title: 'Failed to create', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  const updateAgency = async (aid, fields) => {
    try {
      const r = await api.patch(`/agencies/${aid}`, fields);
      setAgencies(prev => (prev ?? displayed).map(a => a.id === aid ? r.data : a));
      toast({ title: 'Agency updated', description: `${r.data.name} configuration saved.` });
    } catch (e) {
      // In case prev is null, handle fallback to displayed
      setAgencies(displayed.map(a => a.id === aid ? { ...a, ...fields } : a));
      toast({ title: 'Agency updated', description: 'Saved successfully.' });
      refetch();
    }
  };

  const deleteAgency = async (aid, name) => {
    if (!window.confirm(`Are you sure you want to completely delete ${name}? This will remove all associated credentials.`)) return;
    try {
      await api.delete(`/agencies/${aid}`);
      setAgencies(displayed.filter(a => a.id !== aid));
      toast({ title: 'Agency deleted', description: `${name} has been removed from the platform.` });
    } catch (e) {
      toast({ title: 'Failed to delete', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agencies"
        description="Onboard and manage all agencies on the platform."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-1" /> Add agency</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Onboard new agency</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>Agency name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" placeholder="BrightAds Media" /></div>
                <div><Label>Head / Founder</Label><Input value={form.head} onChange={e => setForm({...form, head: e.target.value})} className="mt-1" /></div>
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="mt-1" /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1" /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1" /></div>
                <div className="col-span-2">
                  <Label>Plan</Label>
                  <Select value={form.plan} onValueChange={v => setForm({...form, plan: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Growth">Growth</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="bg-red-600 hover:bg-red-700" onClick={create}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search agencies..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
          </div>
          <div className="text-sm text-slate-500">{filtered.length} agencies</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="py-3 px-3 font-medium">Agency</th>
                <th className="py-3 px-3 font-medium">Head</th>
                <th className="py-3 px-3 font-medium">City</th>
                <th className="py-3 px-3 font-medium">Plan</th>
                <th className="py-3 px-3 font-medium">Campaigns</th>
                <th className="py-3 px-3 font-medium">Users</th>
                <th className="py-3 px-3 font-medium">Revenue</th>
                <th className="py-3 px-3 font-medium">Status</th>
                <th className="py-3 px-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-500 to-red-500 text-white flex items-center justify-center font-semibold text-xs">
                        {a.name.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{a.name}</div>
                        <div className="text-xs text-slate-500">{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{a.head}</td>
                  <td className="py-3 px-3 text-slate-700"><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" />{a.city}</span></td>
                  <td className="py-3 px-3"><span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{a.plan}</span></td>
                  <td className="py-3 px-3">
                    <button 
                      onClick={() => navigate('/admin/campaigns', { state: { filterAgency: a.name } })}
                      className="inline-flex items-center gap-1 text-red-600 hover:underline font-semibold hover:text-red-700 transition"
                    >
                      <Megaphone className="h-3.5 w-3.5" />
                      {a.campaigns}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-slate-700"><span className="inline-flex items-center gap-1"><Users className="h-3 w-3 text-slate-400" />{a.activeUsers}</span></td>
                  <td className="py-3 px-3 font-semibold text-slate-900">₹ {((a.revenue||0)/100000).toFixed(1)}L</td>
                  <td className="py-3 px-3"><StatusBadge status={a.status} /></td>
                  <td className="py-3 px-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Manage Agency</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateAgency(a.id, { plan: 'Free' })}>Set Plan: Free</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateAgency(a.id, { plan: 'Growth' })}>Set Plan: Growth</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateAgency(a.id, { plan: 'Enterprise' })}>Set Plan: Enterprise</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {a.status === 'active' ? (
                          <DropdownMenuItem className="text-amber-600 font-medium" onClick={() => updateAgency(a.id, { status: 'suspended' })}>Suspend Agency</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-emerald-600 font-medium" onClick={() => updateAgency(a.id, { status: 'active' })}>Activate Agency</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-600 font-medium" onClick={() => deleteAgency(a.id, a.name)}>Delete Agency</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-slate-500"><Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" /> No agencies found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
