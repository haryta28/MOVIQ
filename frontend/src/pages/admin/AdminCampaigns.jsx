import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader, StatusBadge, ProgressBar } from '../../components/Shared';
import { Search, Filter, Download, Eye, Megaphone, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';
import useParallelApi from '../../hooks/useParallelApi';
import api from '../../api';

// ── Create Campaign Modal ──────────────────────────────────────────────────────
const BLANK_FORM = {
  title: '', brand: '', brandId: '', mediaType: '', city: '',
  totalTasks: '', budget: '', startDate: '', endDate: '', agencyId: ''
};

function Field({ label, name, type = 'text', placeholder = '', value, onChange, error }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <Input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`mt-1 bg-slate-50 border-slate-200/80 focus:bg-white transition ${error ? 'border-rose-500 focus:ring-rose-500' : ''}`}
      />
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

function NewCampaignModal({ open, onClose, onCreated, agencies = [] }) {
  const [form, setForm]     = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  if (!open) return null;

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())     e.title     = 'Title is required';
    if (!form.brand.trim())     e.brand     = 'Brand is required';
    if (!form.mediaType.trim()) e.mediaType = 'Media type is required';
    if (!form.city.trim())      e.city      = 'City is required';
    if (!form.agencyId)         e.agencyId  = 'Agency is required';
    if (!form.totalTasks || isNaN(form.totalTasks)) e.totalTasks = 'Enter a valid number';
    if (!form.budget     || isNaN(form.budget))     e.budget     = 'Enter a valid number';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/campaigns', {
        ...form,
        totalTasks: Number(form.totalTasks),
        budget:     Number(form.budget),
      });
      toast({ title: '🎉 Campaign created', description: `${data.title} is now live.` });
      onCreated(data);
      setForm(BLANK_FORM);
      setErrors({});
      onClose();
    } catch (err) {
      toast({
        title: 'Failed to create campaign',
        description: err?.response?.data?.detail || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">New Campaign</h2>
              <p className="text-xs text-slate-500">All fields marked required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Campaign Title *" name="title"     placeholder="e.g. NoBroker Auto Blitz Q3" value={form.title}     onChange={set('title')}     error={errors.title} />
            <Field label="Brand *"          name="brand"     placeholder="e.g. NoBroker"               value={form.brand}     onChange={set('brand')}     error={errors.brand} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Brand ID"         name="brandId"   placeholder="e.g. b1 (optional)"          value={form.brandId}   onChange={set('brandId')}   error={errors.brandId} />
            <Field label="Media Type *"     name="mediaType" placeholder="e.g. Auto Branding"          value={form.mediaType} onChange={set('mediaType')} error={errors.mediaType} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City *"           name="city"       placeholder="e.g. Bengaluru"             value={form.city}       onChange={set('city')}       error={errors.city} />
            <Field label="Total Tasks *"    name="totalTasks" type="number" placeholder="e.g. 1500"    value={form.totalTasks} onChange={set('totalTasks')} error={errors.totalTasks} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Budget (₹) *"    name="budget"    type="number" placeholder="e.g. 500000"   value={form.budget}    onChange={set('budget')}    error={errors.budget} />
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agency *</Label>
              <Select value={form.agencyId} onValueChange={v => setForm(f => ({ ...f, agencyId: v }))}>
                <SelectTrigger className="mt-1 bg-slate-50 border-slate-200"><SelectValue placeholder="Select Agency" /></SelectTrigger>
                <SelectContent>
                  {agencies.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.agencyId && <p className="text-xs text-rose-500 mt-1">{errors.agencyId}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start Date" name="startDate" type="date" value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
            <Field label="End Date"   name="endDate"   type="date" value={form.endDate}   onChange={set('endDate')}   error={errors.endDate} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
              disabled={saving}
            >
              {saving ? 'Creating…' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Campaign Modal ────────────────────────────────────────────────────────
function EditCampaignModal({ open, campaign, onClose, onUpdated, agencies = [] }) {
  const [form, setForm]     = useState({ title: '', brand: '', brandId: '', mediaType: '', city: '', totalTasks: '', budget: '', startDate: '', endDate: '', status: '', agencyId: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (campaign) {
      setForm({
        title: campaign.title || '',
        brand: campaign.brand || '',
        brandId: campaign.brandId || '',
        mediaType: campaign.mediaType || '',
        city: campaign.city || '',
        totalTasks: campaign.totalTasks || '',
        budget: campaign.budget || '',
        startDate: campaign.startDate || '',
        endDate: campaign.endDate || '',
        status: campaign.status || 'ongoing',
        agencyId: campaign.agencyId || '',
      });
    }
  }, [campaign]);

  if (!open) return null;

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())     e.title     = 'Title is required';
    if (!form.brand.trim())     e.brand     = 'Brand is required';
    if (!form.mediaType.trim()) e.mediaType = 'Media type is required';
    if (!form.city.trim())      e.city      = 'City is required';
    if (!form.totalTasks || isNaN(form.totalTasks)) e.totalTasks = 'Enter a valid number';
    if (!form.budget     || isNaN(form.budget))     e.budget     = 'Enter a valid number';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const { data } = await api.patch(`/campaigns/${campaign.id}`, {
        ...form,
        totalTasks: Number(form.totalTasks),
        budget:     Number(form.budget),
      });
      toast({ title: 'Campaign updated', description: `${data.title} was successfully updated.` });
      onUpdated();
      onClose();
    } catch (err) {
      toast({
        title: 'Failed to update campaign',
        description: err?.response?.data?.detail || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to completely delete campaign "${campaign.title}"?`)) return;
    try {
      await api.delete(`/campaigns/${campaign.id}`);
      toast({ title: 'Campaign deleted', description: `Campaign was removed successfully.` });
      onUpdated();
      onClose();
    } catch (err) {
      toast({
        title: 'Failed to delete campaign',
        description: err?.response?.data?.detail || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
              <Pencil className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Edit Campaign</h2>
              <p className="text-xs text-slate-500">Modify campaign details</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Campaign Title *" name="title" placeholder="e.g. NoBroker Auto Blitz Q3" value={form.title} onChange={set('title')} error={errors.title} />
            <Field label="Brand *"          name="brand" placeholder="e.g. NoBroker"               value={form.brand} onChange={set('brand')} error={errors.brand} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Brand ID"         name="brandId" placeholder="e.g. b1"                   value={form.brandId} onChange={set('brandId')} error={errors.brandId} />
            <Field label="Media Type *"     name="mediaType" placeholder="e.g. Auto Branding"       value={form.mediaType} onChange={set('mediaType')} error={errors.mediaType} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City *"           name="city" placeholder="e.g. Bengaluru"               value={form.city} onChange={set('city')} error={errors.city} />
            <Field label="Total Tasks *"    name="totalTasks" type="number" placeholder="1500"     value={form.totalTasks} onChange={set('totalTasks')} error={errors.totalTasks} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Budget (₹) *"    name="budget" type="number" placeholder="500000"        value={form.budget} onChange={set('budget')} error={errors.budget} />
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1 bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {agencies.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agency *</Label>
                <Select value={form.agencyId} onValueChange={v => setForm(f => ({ ...f, agencyId: v }))}>
                  <SelectTrigger className="mt-1 bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {agencies.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start Date" name="startDate" type="date" value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
            <Field label="End Date"   name="endDate"   type="date" value={form.endDate}   onChange={set('endDate')}   error={errors.endDate} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete Campaign
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Campaign Details Modal ──────────────────────────────────────────────────────
function CampaignDetailsModal({ open, campaign, onClose }) {
  if (!open || !campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-250">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold">
              {(campaign.brand || '').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{campaign.title}</h2>
              <p className="text-xs text-slate-500">{campaign.brand} · {campaign.agency}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable details */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</div>
              <div className="mt-1"><StatusBadge status={campaign.status} /></div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">City</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{campaign.city}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Media Type</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{campaign.mediaType}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Budget</div>
              <div className="mt-1 text-sm font-bold text-slate-900">₹ {((campaign.budget || 0) / 100000).toFixed(1)} Lakh</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Start Date</div>
              <div className="mt-1 text-sm font-medium text-slate-700">{campaign.startDate || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">End Date</div>
              <div className="mt-1 text-sm font-medium text-slate-700">{campaign.endDate || '—'}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Campaign Execution Progress</div>
            <ProgressBar
              value={campaign.completed || 0}
              max={campaign.totalTasks || 1}
              color={campaign.status === 'completed' ? 'bg-emerald-500' : 'bg-red-600'}
            />
          </div>

          {campaign.flagged > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
              <span className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-rose-800">Flagged submissions alert</div>
                <div className="text-xs text-rose-700 mt-1">There are {campaign.flagged} executions currently flagged. Please head to the Fraud dashboard to review GPS or picture anomalies.</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={onClose}>
            Close Details
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminCampaigns() {
  const { results, refetch } = useParallelApi(['/campaigns', '/agencies']);
  const [fetchedCampaigns = [], agencies = []] = results;
  const [localCampaigns, setLocalCampaigns] = useState(null);
  const campaigns = localCampaigns ?? fetchedCampaigns;

  const location = useLocation();
  const [q, setQ]           = useState('');
  const [status, setStatus] = useState('all');
  const [selectedAgency, setSelectedAgency] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);

  // Set the agency filter if passed via react-router location state
  useEffect(() => {
    if (location.state?.filterAgency) {
      setSelectedAgency(location.state.filterAgency);
    }
  }, [location.state]);

  const agenciesList = Array.from(new Set(campaigns.map(c => c.agency).filter(Boolean)));

  const filtered = campaigns.filter(c =>
    (status === 'all' || c.status === status) &&
    (selectedAgency === 'all' || c.agency === selectedAgency) &&
    (
      (c.title  || '').toLowerCase().includes(q.toLowerCase()) ||
      (c.brand  || '').toLowerCase().includes(q.toLowerCase()) ||
      (c.city   || '').toLowerCase().includes(q.toLowerCase())
    )
  );

  const handleCreated = (newCampaign) => {
    setLocalCampaigns(prev => [newCampaign, ...(prev ?? fetchedCampaigns)]);
    refetch();
  };

  const handleUpdated = () => {
    setLocalCampaigns(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="All campaigns across every agency on the platform."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-1" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" /> New campaign
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search campaigns, brands, cities..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Agencies" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agencies</SelectItem>
              {agenciesList.map(a => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Filter className="h-4 w-4 mr-1" /> More filters</Button>
          <div className="ml-auto text-sm text-slate-500">{filtered.length} campaigns</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold text-xs">
                    {(c.brand || '').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{c.title}</div>
                    <div className="text-xs text-slate-500">{c.brand} · {c.agency}</div>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-slate-500 mb-3">
                <div><div className="text-slate-400">City</div><div className="text-slate-800 font-medium">{c.city}</div></div>
                <div><div className="text-slate-400">Media</div><div className="text-slate-800 font-medium">{c.mediaType}</div></div>
                <div><div className="text-slate-400">Budget</div><div className="text-slate-800 font-medium">₹ {((c.budget || 0) / 100000).toFixed(1)}L</div></div>
              </div>
              <ProgressBar
                value={c.completed || 0}
                max={c.totalTasks || 1}
                color={c.status === 'completed' ? 'bg-emerald-500' : 'bg-red-600'}
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  {c.flagged > 0 ? <span className="text-rose-600 font-medium">{c.flagged} flagged</span> : 'No flags'}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setSelectedCampaign(c)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                  <Button size="sm" variant="ghost" className="text-slate-600" onClick={() => setEditingCampaign(c)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 py-10 text-center text-slate-500">
              <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No campaigns match
            </div>
          )}
        </div>
      </Card>

      <NewCampaignModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
        agencies={agencies}
      />

      <EditCampaignModal
        open={!!editingCampaign}
        campaign={editingCampaign}
        onClose={() => setEditingCampaign(null)}
        onUpdated={handleUpdated}
        agencies={agencies}
      />

      <CampaignDetailsModal
        open={!!selectedCampaign}
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
      />
    </div>
  );
}
