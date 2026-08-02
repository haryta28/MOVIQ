import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { Plus, Search, MoreHorizontal, Building2, MapPin, Users, Megaphone, Copy, Check, AlertTriangle, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { toast } from '../../hooks/use-toast';
import api from '../../api';
import useApi from '../../hooks/useApi';

// ── Credentials Modal ─────────────────────────────────────────────────────────
function CredentialsModal({ creds, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!creds) return null;

  const copyAll = () => {
    const text = `MOVIQ Login Credentials\nAgency: ${creds.agencyName}\nLogin: moviq-bwz.vercel.app\nEmail: ${creds.email}\nPassword: ${creds.password}\n\nPlease change your password after first login.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={!!creds} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <Check className="h-5 w-5 bg-emerald-100 rounded-full p-0.5" />
            Agency Created — Credentials Ready
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 font-mono text-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Agency</span>
            <span className="font-semibold text-slate-800">{creds.agencyName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Login URL</span>
            <span className="text-indigo-600">moviq-bwz.vercel.app</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Email</span>
            <span className="font-semibold text-slate-800">{creds.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Password</span>
            <span className="font-bold text-rose-600 tracking-widest">{creds.password}</span>
          </div>
        </div>

        {creds.sentViaWhatsApp && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
            <Phone className="h-4 w-4 shrink-0" />
            Credentials automatically sent to {creds.phone} via WhatsApp
          </div>
        )}

        <p className="text-xs text-slate-500">
          These credentials are shown <strong>only once</strong>. Share them securely with the agency head via WhatsApp, SMS, or email.
        </p>

        <div className="flex gap-2">
          <Button className="flex-1" variant="outline" onClick={copyAll}>
            {copied ? <Check className="h-4 w-4 mr-2 text-emerald-600" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy credentials'}
          </Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Status Filter Tabs ────────────────────────────────────────────────────────
const STATUS_FILTERS = ['all', 'active', 'trial', 'suspended', 'deleted'];

export default function AdminAgencies() {
  const navigate = useNavigate();
  const { data: fetchedAgencies = [], refetch } = useApi('/agencies');
  const [agencies, setAgencies] = useState(null);
  const displayed = agencies ?? fetchedAgencies;

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [credentials, setCredentials] = useState(null); // show after create
  const [form, setForm] = useState({
    name: '', head: '', email: '', phone: '', city: '', plan: 'Growth', campaignLimit: 10
  });

  // Filter by search + status tab (deleted agencies always visible to admin)
  const filtered = displayed.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(q.toLowerCase()) ||
      (a.city || '').toLowerCase().includes(q.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const STATUS_COUNTS = STATUS_FILTERS.reduce((acc, s) => {
    acc[s] = s === 'all' ? displayed.length : displayed.filter(a => a.status === s).length;
    return acc;
  }, {});

  const create = async () => {
    if (!form.name || !form.email) {
      toast({ title: 'Missing fields', description: 'Agency name and email are required.' });
      return;
    }
    try {
      const r = await api.post('/agencies', { ...form, campaignLimit: Number(form.campaignLimit) });
      setAgencies([r.data, ...displayed]);
      setOpen(false);
      setForm({ name: '', head: '', email: '', phone: '', city: '', plan: 'Growth', campaignLimit: 10 });
      // Show credentials modal if a temp password was generated
      if (r.data.tempPassword) {
        setCredentials({
          agencyName: r.data.name,
          email: r.data.email,
          password: r.data.tempPassword,
          phone: form.phone || null,
          sentViaWhatsApp: !!form.phone,
        });
      } else {
        toast({ title: 'Agency onboarded', description: `${r.data.name} is now on ${r.data.plan} plan.` });
      }
    } catch (e) {
      toast({ title: 'Failed to create', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  const updateAgency = async (aid, fields) => {
    try {
      const r = await api.patch(`/agencies/${aid}`, fields);
      setAgencies((prev ?? displayed).map(a => a.id === aid ? r.data : a));
      const label = fields.status === 'suspended' ? 'suspended — users blocked from login'
        : fields.status === 'active' ? 'reactivated — user access restored'
        : 'updated';
      toast({ title: 'Agency updated', description: `${r.data.name} ${label}.` });
    } catch (e) {
      setAgencies(displayed.map(a => a.id === aid ? { ...a, ...fields } : a));
      toast({ title: 'Saved', description: 'Agency configuration updated.' });
      refetch();
    }
  };

  const softDeleteAgency = async (aid, name) => {
    if (!window.confirm(
      `Delete ${name}?\n\n✅ Historical records (campaigns, tasks, media) are preserved.\n❌ All agency users will lose login access.\n\nThis can be reversed by the admin.`
    )) return;
    try {
      await api.delete(`/agencies/${aid}`);
      setAgencies(displayed.map(a => a.id === aid ? { ...a, status: 'deleted' } : a));
      toast({ title: 'Agency deleted', description: `${name} removed. User access revoked. Records preserved.` });
    } catch (e) {
      toast({ title: 'Failed to delete', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  const hardDeleteAgency = async (aid, name) => {
    const confirmed = window.confirm(
      `⚠️ PERMANENT DELETE: ${name}\n\nThis will erase the agency AND all associated users permanently. All historical records will be lost.\n\nType "DELETE" to confirm.`
    );
    if (!confirmed) return;
    try {
      await api.delete(`/agencies/${aid}/hard`);
      setAgencies(displayed.filter(a => a.id !== aid));
      toast({ title: 'Agency permanently erased', variant: 'destructive' });
    } catch (e) {
      toast({ title: 'Failed', description: e?.response?.data?.detail || 'Try again.' });
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
                <div className="col-span-2">
                  <Label>Agency name</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" placeholder="BrightAds Media" />
                </div>
                <div><Label>Head / Founder</Label><Input value={form.head} onChange={e => setForm({...form, head: e.target.value})} className="mt-1" /></div>
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="mt-1" /></div>
                <div><Label>Email (login)</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1" /></div>
                <div>
                  <Label className="flex items-center gap-1">
                    Phone <Phone className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-normal text-slate-400 ml-1">for WhatsApp invite</span>
                  </Label>
                  <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1" placeholder="+919876543210" />
                </div>
                <div>
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
                <div>
                  <Label className="flex items-center gap-1">
                    Campaign limit
                    <span className="text-xs font-normal text-slate-400 ml-1">max simultaneous</span>
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={form.campaignLimit}
                    onChange={e => setForm({...form, campaignLimit: e.target.value})}
                    className="mt-1"
                    placeholder="10"
                  />
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
        {/* Search + Status filter row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search agencies..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
          </div>
          {/* Status filter pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition border ${
                  statusFilter === s
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {STATUS_COUNTS[s] > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${statusFilter === s ? 'bg-white/20' : 'bg-slate-100'}`}>
                    {STATUS_COUNTS[s]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="text-sm text-slate-500 ml-auto">{filtered.length} agencies</div>
        </div>

        {/* Table */}
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
              {filtered.map(a => {
                const isDeleted = a.status === 'deleted';
                const isSuspended = a.status === 'suspended';
                const limit = a.campaignLimit || '∞';
                const usedCampaigns = a.campaigns || 0;
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-slate-100 transition ${
                      isDeleted ? 'opacity-50 bg-slate-50/80' : isSuspended ? 'opacity-70 bg-amber-50/30' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg ${isDeleted ? 'bg-slate-400' : 'bg-gradient-to-br from-red-500 to-red-600'} text-white flex items-center justify-center font-semibold text-xs`}>
                          {a.name.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <Link to={`/admin/agencies/${a.id}`} className={`font-medium hover:underline ${isDeleted ? 'line-through text-slate-400' : 'text-slate-900 hover:text-red-600'}`}>
                            {a.name}
                          </Link>
                          <div className="text-xs text-slate-500">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{a.head}</td>
                    <td className="py-3 px-3 text-slate-700">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" />{a.city}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{a.plan}</span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => navigate('/admin/campaigns', { state: { filterAgency: a.name } })}
                        className="inline-flex items-center gap-1 font-semibold hover:underline transition"
                        title={`${usedCampaigns} used of ${limit} allowed`}
                      >
                        <Megaphone className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-red-600">{usedCampaigns}</span>
                        <span className="text-slate-400 text-xs font-normal">/ {limit}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3 text-slate-400" />{a.activeUsers}</span>
                    </td>
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
                          <DropdownMenuItem onClick={() => navigate('/admin/agencies/' + a.id)}>View records</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateAgency(a.id, { plan: 'Free' })}>Set Plan: Free</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateAgency(a.id, { plan: 'Growth' })}>Set Plan: Growth</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateAgency(a.id, { plan: 'Enterprise' })}>Set Plan: Enterprise</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {a.status === 'deleted' ? (
                            <DropdownMenuItem className="text-emerald-600 font-medium" onClick={() => updateAgency(a.id, { status: 'active' })}>
                              Restore Agency
                            </DropdownMenuItem>
                          ) : a.status === 'suspended' ? (
                            <>
                              <DropdownMenuItem className="text-emerald-600 font-medium" onClick={() => updateAgency(a.id, { status: 'active' })}>
                                Reactivate Agency
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-rose-600 font-medium" onClick={() => softDeleteAgency(a.id, a.name)}>
                                Delete Agency
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem className="text-amber-600 font-medium" onClick={() => updateAgency(a.id, { status: 'suspended' })}>
                                Suspend Agency
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-rose-600 font-medium" onClick={() => softDeleteAgency(a.id, a.name)}>
                                Delete Agency
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-rose-800 font-medium text-xs" onClick={() => hardDeleteAgency(a.id, a.name)}>
                            ⚠️ Permanently erase
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-slate-500">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No agencies found
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Credentials modal after agency creation */}
      <CredentialsModal creds={credentials} onClose={() => setCredentials(null)} />
    </div>
  );
}
