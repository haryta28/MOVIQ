import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, StatusBadge, ProgressBar } from '../../components/Shared';
import { Building2, ArrowLeft, Megaphone, Users, Camera, MapPin, Mail, Phone, Calendar, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { toast } from '../../hooks/use-toast';
import useApi from '../../hooks/useApi';
import api from '../../api';

export default function AdminAgencyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('campaigns');

  const { data: agency, loading: agencyLoading, refetch: refetchAgency } = useApi(`/agencies/${id}`);
  const { data: campaigns = [] } = useApi(`/campaigns?agency_id=${id}`);
  const { data: allSubmissions = [] } = useApi('/vehicle-submissions');
  const { data: allUsers = [] } = useApi('/users?role=agency');

  if (agencyLoading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <Building2 className="h-10 w-10 mx-auto animate-pulse text-slate-400 mb-2" />
        Loading agency records...
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="py-20 text-center text-slate-500 space-y-4">
        <ShieldAlert className="h-12 w-12 mx-auto text-rose-500" />
        <div className="text-lg font-semibold text-slate-900">Agency Record Not Found</div>
        <p className="text-sm text-slate-500">The requested agency record could not be found.</p>
        <Button variant="outline" onClick={() => navigate('/admin/agencies')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Agencies
        </Button>
      </div>
    );
  }

  const isDeleted = agency.status === 'deleted';
  const isSuspended = agency.status === 'suspended';

  const updateStatus = async (newStatus) => {
    try {
      await api.patch(`/agencies/${id}`, { status: newStatus });
      toast({
        title: 'Status Updated',
        description: `${agency.name} is now ${newStatus}.`,
      });
      refetchAgency();
    } catch (e) {
      toast({ title: 'Failed to update status', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  // Filter submissions matching this agency's campaigns or agency name
  const agencyCampaignIds = new Set(campaigns.map(c => c.id));
  const agencySubmissions = allSubmissions.filter(s =>
    agencyCampaignIds.has(s.campaignId) ||
    (s.agencyName || '').toLowerCase() === agency.name.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Top back button + Header */}
      <div>
        <Button size="sm" variant="ghost" className="mb-2 text-slate-600" onClick={() => navigate('/admin/agencies')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Agencies
        </Button>
        
        <div className="flex flex-wrap items-start justify-between gap-4 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className={`h-14 w-14 rounded-xl ${isDeleted ? 'bg-slate-400' : 'bg-gradient-to-br from-red-500 to-red-600'} text-white flex items-center justify-center font-bold text-lg shrink-0`}>
              {agency.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{agency.name}</h1>
                <StatusBadge status={agency.status} />
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {agency.plan} Plan
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-slate-400" /> Head: <strong className="text-slate-700">{agency.head || 'N/A'}</strong></span>
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400" /> {agency.email}</span>
                {agency.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" /> {agency.phone}</span>}
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {agency.city || 'N/A'}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /> Joined {agency.joinedAt || '2025'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDeleted ? (
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateStatus('active')}>
                <RotateCcw className="h-4 w-4 mr-1.5" /> Restore Agency
              </Button>
            ) : isSuspended ? (
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateStatus('active')}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Reactivate Access
              </Button>
            ) : (
              <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => updateStatus('suspended')}>
                Suspend Access
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Total Campaigns</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-2">
            {campaigns.length}
            <span className="text-xs text-slate-400 font-normal">/ {agency.campaignLimit || 10} max</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Active Users</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{agency.activeUsers || 1}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Media Submissions</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{agencySubmissions.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Tracked Revenue</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">₹ {((agency.revenue || 0) / 100000).toFixed(1)}L</div>
        </Card>
      </div>

      {/* Detail Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="campaigns" className="gap-2">
            <Megaphone className="h-4 w-4" /> Campaigns ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2">
            <Camera className="h-4 w-4" /> Media Proofs ({agencySubmissions.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Campaigns */}
        <TabsContent value="campaigns" className="mt-4 space-y-4">
          <Card className="p-4">
            <div className="font-semibold text-slate-900 mb-3">Agency Campaigns</div>
            {campaigns.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No campaign records stored for this agency.
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {(c.brand || 'CG').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{c.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{c.brand} · {c.city} · {c.mediaType}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 hidden sm:block">
                        <div className="text-xs text-slate-500 mb-1 flex justify-between">
                          <span>Progress</span>
                          <span>{c.completed || 0}/{c.totalTasks || 0}</span>
                        </div>
                        <ProgressBar value={c.completed || 0} max={c.totalTasks || 1} color="bg-red-600" />
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 2: Media Submissions */}
        <TabsContent value="submissions" className="mt-4">
          <Card className="p-4">
            <div className="font-semibold text-slate-900 mb-3">WhatsApp & Field Proofs</div>
            {agencySubmissions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No photo proofs submitted yet for this agency.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {agencySubmissions.map(s => (
                  <div key={s.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-900">{s.vehicle}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="text-xs text-slate-500">Driver: {s.driverName} ({s.driverPhone})</div>
                    {(s.photos || []).length > 0 && (
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        {s.photos.map((p, idx) => (
                          <img key={idx} src={p.url} alt="proof" className="h-16 w-full rounded object-cover border" />
                        ))}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400">Submitted: {new Date(s.submittedAt).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
