import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { Plus, Search, MoreHorizontal, Building2, MapPin, Users, Megaphone } from 'lucide-react';
import { agencies as agenciesData } from '../../mock/mock';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';

export default function AdminAgencies() {
  const [agencies, setAgencies] = useState(agenciesData);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', head: '', email: '', phone: '', city: '', plan: 'Growth' });

  const filtered = agencies.filter(a => a.name.toLowerCase().includes(q.toLowerCase()) || a.city.toLowerCase().includes(q.toLowerCase()));

  const create = () => {
    if (!form.name || !form.email) { toast({ title: 'Missing fields', description: 'Name and email are required.' }); return; }
    const newA = { id: `a${Date.now()}`, ...form, campaigns: 0, activeUsers: 1, status: 'trial', revenue: 0, joinedAt: new Date().toISOString().slice(0,10) };
    setAgencies([newA, ...agencies]);
    setOpen(false);
    setForm({ name: '', head: '', email: '', phone: '', city: '', plan: 'Growth' });
    toast({ title: 'Agency onboarded', description: `${newA.name} is now active on ${newA.plan} plan.` });
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
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-500 to-indigo-500 text-white flex items-center justify-center font-semibold text-xs">
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
                  <td className="py-3 px-3 text-slate-700"><span className="inline-flex items-center gap-1"><Megaphone className="h-3 w-3 text-slate-400" />{a.campaigns}</span></td>
                  <td className="py-3 px-3 text-slate-700"><span className="inline-flex items-center gap-1"><Users className="h-3 w-3 text-slate-400" />{a.activeUsers}</span></td>
                  <td className="py-3 px-3 font-semibold text-slate-900">₹ {(a.revenue/100000).toFixed(1)}L</td>
                  <td className="py-3 px-3"><StatusBadge status={a.status} /></td>
                  <td className="py-3 px-3"><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></td>
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
