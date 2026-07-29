import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { Plus, Phone, MapPin, ListChecks, UserCog, User, Car, Camera, Clock, CheckCircle, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';
import api from '../../api';
import useParallelApi from '../../hooks/useParallelApi';
import useApi from '../../hooks/useApi';

const statusColor = {
  submitted: 'bg-amber-100 text-amber-700',
  approved:  'bg-emerald-100 text-emerald-700',
  flagged:   'bg-red-100 text-red-700',
};

// ── Executive Profile Modal ────────────────────────────────────────────────────
function ExecutiveProfileModal({ exec, onClose }) {
  const { data: allSubmissions = [] } = useApi('/vehicle-submissions');
  const [selectedSub, setSelectedSub] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Normalize phone for comparison (strip spaces, dashes)
  const normalize = (p = '') => p.replace(/[\s\-\(\)]/g, '');
  const execPhone = normalize(exec?.phone || '');

  const submissions = allSubmissions.filter(s =>
    normalize(s.phone || s.driverPhone || '') === execPhone ||
    normalize(s.driverPhone || '') === execPhone
  );

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await api.patch(`/vehicle-submissions/${id}`, { status });
      toast({ title: status === 'approved' ? '✅ Approved' : '🚩 Flagged' });
      setSelectedSub(null);
    } catch {
      toast({ title: 'Error', description: 'Could not update.' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={!!exec} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {exec && !selectedSub && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-sm">
                  {exec.name.split(' ').map(x => x[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div>{exec.name}</div>
                  <div className="text-sm font-normal text-slate-500">{exec.phone} · {exec.city}</div>
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-slate-900">{submissions.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">Total Submissions</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-700">{submissions.filter(s => s.status === 'approved').length}</div>
                <div className="text-xs text-slate-500 mt-0.5">Approved</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-700">{submissions.filter(s => s.status === 'submitted').length}</div>
                <div className="text-xs text-slate-500 mt-0.5">Pending Review</div>
              </div>
            </div>

            {/* Submissions list */}
            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-700 mb-3">Vehicle Submissions</div>
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Car className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <div className="text-sm">No submissions yet from this executive</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {submissions.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSub(s)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition"
                    >
                      {/* Photo thumbnail */}
                      {(s.photos || []).length > 0 ? (
                        <img
                          src={s.photos[0].url}
                          alt="proof"
                          className="h-12 w-12 rounded-md object-cover border flex-shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Car className="h-5 w-5 text-slate-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="font-mono font-bold text-slate-900">{s.vehicle}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <Camera className="h-3 w-3" /> {(s.photos || []).length}/3 photos
                          <Clock className="h-3 w-3 ml-1" />
                          {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status] || statusColor.submitted}`}>
                          {s.status}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Submission detail drill-down */}
        {exec && selectedSub && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-slate-700 text-sm font-normal mr-1">← Back</button>
                <span className="font-mono">{selectedSub.vehicle}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[selectedSub.status] || statusColor.submitted}`}>
                  {selectedSub.status}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Driver</div>
                  <div className="font-medium">{selectedSub.driverName}</div>
                  <div className="text-slate-500">{selectedSub.driverPhone}</div>
                </div>
                {selectedSub.gps && (selectedSub.gps.lat !== 0 || selectedSub.gps.lng !== 0) && (
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">GPS</div>
                    <div className="font-mono text-xs">{Number(selectedSub.gps.lat).toFixed(5)}, {Number(selectedSub.gps.lng).toFixed(5)}</div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedSub.gps.lat},${selectedSub.gps.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-xs hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="h-3 w-3" /> Open in Maps
                    </a>
                  </div>
                )}
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Submitted</div>
                  <div>{selectedSub.submittedAt ? new Date(selectedSub.submittedAt).toLocaleString('en-IN') : '—'}</div>
                </div>
              </div>

              {/* Photos */}
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Photos ({(selectedSub.photos || []).length}/3)</div>
                <div className="space-y-2">
                  {(selectedSub.photos || []).map((p, i) => (
                    <a key={i} href={p.url} target="_blank" rel="noreferrer">
                      <img src={p.url} alt={p.label} className="w-full h-28 object-cover rounded-lg border hover:opacity-90 transition" />
                      <div className="text-xs text-slate-400 mt-0.5">{p.label}</div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {selectedSub.status !== 'approved' && (
              <div className="flex gap-3 mt-4 pt-4 border-t">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={updating}
                  onClick={() => updateStatus(selectedSub.id, 'approved')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  disabled={updating}
                  onClick={() => updateStatus(selectedSub.id, 'flagged')}
                >
                  <AlertCircle className="h-4 w-4 mr-2" /> Flag
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AgencyTeam() {
  const { results } = useParallelApi(['/users?role=field', '/users?role=supervisor']);
  const [field = [], supers = []] = results;

  const [open, setOpen]         = useState(false);
  const [selectedExec, setSelectedExec] = useState(null);
  const [form, setForm]         = useState({ name: '', role: 'field', email: '', phone: '', city: '', supervisor: '' });

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
              <Card
                key={f.id}
                className="p-5 hover:shadow-md transition cursor-pointer hover:border-slate-300 group"
                onClick={() => setSelectedExec(f)}
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {f.name.split(' ').map(x => x[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900 truncate group-hover:text-red-600 transition-colors">{f.name}</div>
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
                <div className="mt-3 text-xs text-slate-400 flex items-center gap-1 group-hover:text-red-500 transition-colors">
                  <Car className="h-3 w-3" /> Click to view vehicle submissions
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

      {/* Executive profile + submissions modal */}
      <ExecutiveProfileModal exec={selectedExec} onClose={() => setSelectedExec(null)} />
    </div>
  );
}


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
