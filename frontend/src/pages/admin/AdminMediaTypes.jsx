import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader } from '../../components/Shared';
import { Plus, Layers, Bus, Car, Building, Home, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import api from '../../api';

const iconFor = (label) => {
  const l = label.toLowerCase();
  if (l.includes('bus')) return Bus;
  if (l.includes('auto') || l.includes('cab')) return Car;
  if (l.includes('mall') || l.includes('billboard')) return Building;
  if (l.includes('society')) return Home;
  if (l.includes('shop') || l.includes('retail')) return ShoppingBag;
  return Layers;
};

export default function AdminMediaTypes() {
  const [types, setTypes] = useState([]);
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await api.get('/media-types'); setTypes(r.data); } catch (_) {} };

  const groups = types.reduce((acc, t) => { acc[t.category] = acc[t.category] || []; acc[t.category].push(t); return acc; }, {});

  const add = async () => {
    if (!newLabel.trim()) return;
    try {
      const r = await api.post('/media-types', { label: newLabel, category: 'Custom' });
      setTypes([...types, r.data]);
      toast({ title: 'Media type added', description: `"${r.data.label}" is now available.` });
      setNewLabel('');
    } catch (e) {
      toast({ title: 'Failed', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  const remove = async (key) => {
    try {
      await api.delete(`/media-types/${key}`);
      setTypes(types.filter(t => t.key !== key));
    } catch (e) {
      toast({ title: 'Failed', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Types"
        description="Configure all offline media formats supported by the platform."
      />

      <Card className="p-5">
        <div className="flex items-center gap-3">
          <Input placeholder="e.g. Airport Advertising" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="max-w-sm" />
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={add}><Plus className="h-4 w-4 mr-1" /> Add media type</Button>
        </div>
      </Card>

      {Object.entries(groups).map(([cat, items]) => (
        <div key={cat}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{cat}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map(t => {
              const Icon = iconFor(t.label);
              return (
                <Card key={t.key} className="p-4 flex items-center gap-3 hover:shadow-md transition">
                  <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm truncate">{t.label}</div>
                    <div className="text-xs text-slate-500">{t.category}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(t.key)}><Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-600" /></Button>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
