import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader, StatusBadge, ProgressBar } from '../../components/Shared';
import { Search, Filter, Download, Eye, Megaphone, Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';
import useApi from '../../hooks/useApi';
import api from '../../api';

// ── Create Campaign Modal ──────────────────────────────────────────────────────
const BLANK_FORM = {
  title: '', brand: '', brandId: '', mediaType: '', city: '',
  totalTasks: '', budget: '', startDate: '', endDate: '',
};

// Field MUST live at module scope — defining it inside a component causes
// React to treat it as a new component on every render, unmounting the
// input and losing focus after each keypress.
function Field({ label, name, type = 'text', placeholder = '', value, onChange, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={error ? 'border-rose-400 focus-visible:ring-rose-400' : ''}
      />
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

function NewCampaignModal({ open, onClose, onCreated }) {
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
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
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
            <div /> {/* spacer */}
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

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminCampaigns() {
  const { data: fetchedCampaigns = [], refetch } = useApi('/campaigns');
  const [localCampaigns, setLocalCampaigns] = useState(null);
  const campaigns = localCampaigns ?? fetchedCampaigns;

  const [q, setQ]           = useState('');
  const [status, setStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const filtered = campaigns.filter(c =>
    (status === 'all' || c.status === status) &&
    (
      (c.title  || '').toLowerCase().includes(q.toLowerCase()) ||
      (c.brand  || '').toLowerCase().includes(q.toLowerCase()) ||
      (c.city   || '').toLowerCase().includes(q.toLowerCase())
    )
  );

  const handleCreated = (newCampaign) => {
    // Optimistically prepend the new campaign, then trigger a background refetch
    setLocalCampaigns(prev => [newCampaign, ...(prev ?? fetchedCampaigns)]);
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
            {/* New Campaign button — temporarily disabled
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setShowModal(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> New Campaign
            </Button>
            */}
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
                <Button size="sm" variant="ghost" className="text-red-600">
                  <Eye className="h-3.5 w-3.5 mr-1" /> View
                </Button>
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
      />
    </div>
  );
}
