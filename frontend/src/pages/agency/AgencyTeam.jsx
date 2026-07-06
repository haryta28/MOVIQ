import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { Plus, Phone, MapPin, ListChecks, UserCog, User } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';
import api from '../../api';
import useParallelApi from '../../hooks/useParallelApi';

export default function AgencyTeam() {
  const { results } = useParallelApi(['/users?role=field', '/users?role=supervisor']);
  const [field = [], supers = []] = results;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', role: 'field', email: '', phone: '', city: '', supervisor: '' });

  const create = async () => {
    if (!form.name || !form.role || !form.city) {
      toast({ title: 'Missing fields', description: 'Name, Role and City are required.' });
      return;
    }
    if (form.role === 'field' && !form.phone) {
      toast({ title: 'Missing fields', description: 'Phone is required for Field Executives.' });
      return;
    }
    if (form.role === 'supervisor' && !form.email) {
      toast({ title: 'Missing fields', description: 'Email is required for Supervisors.' });
      return;
    }
    try {
      await api.post('/users', form);
      setOpen(false);
      setForm({ name: '', role: 'field', email: '', phone: '', city: '', supervisor: '' });
      toast({ title: 'Member added', description: `${form.name} was successfully registered.` });
      // Reload the page to refresh the team lists
      window.location.reload();
    } catch (e) {
      toast({ title: 'Failed to add member', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Team"
        description="Your on-ground team hierarchy: supervisors and field executives."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-1" /> Add member</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Full Name *</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" placeholder="Manoj Yadav" />
                </div>
                <div className="col-span-2">
                  <Label>Role *</Label>
                  <Select value={form.role} onValueChange={v => setForm({...form, role: v, email: '', phone: '', supervisor: ''})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="field">Field Executive</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.role === 'field' && (
                  <>
                    <div>
                      <Label>Phone Number *</Label>
                      <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1" placeholder="+91 98123 45674" />
                    </div>
                    <div>
                      <Label>Reports to (Supervisor)</Label>
                      <Select value={form.supervisor} onValueChange={v => setForm({...form, supervisor: v})}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select Supervisor" /></SelectTrigger>
                        <SelectContent>
                          {supers.map(s => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {form.role === 'supervisor' && (
                  <div className="col-span-2">
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1" placeholder="kundan@brightads.in" />
                  </div>
                )}
                <div className="col-span-2">
                  <Label>City *</Label>
                  <Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="mt-1" placeholder="Delhi" />
                </div>
              </div>
              <DialogFooter className="mt-4 gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={create}>Add Member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="field">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="field" className="gap-2"><User className="h-4 w-4" /> Field Executives ({field.length})</TabsTrigger>
          <TabsTrigger value="supervisor" className="gap-2"><UserCog className="h-4 w-4" /> Supervisors ({supers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="field" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {field.map(f => (
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
            {supers.map(s => (
              <Card key={s.id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold">
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
