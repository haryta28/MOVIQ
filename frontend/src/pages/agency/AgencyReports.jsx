import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, ProgressBar, StatusBadge } from '../../components/Shared';
import { Download, FileBarChart, FileSpreadsheet, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { API_BASE } from '../../api';
import useParallelApi from '../../hooks/useParallelApi';

export default function AgencyReports() {
  const { results } = useParallelApi(['/campaigns', '/analytics/overview']);
  const [campaigns = [], analyticsRaw = {}] = results;
  const cityStats = analyticsRaw?.cityStats || [];
  const [downloading, setDownloading] = useState(null); // "{id}-pdf" or "{id}-excel"

  const download = async (cid, kind, title) => {
    const key = `${cid}-${kind}`;
    setDownloading(key);
    try {
      const token = localStorage.getItem('moviq_token');
      const res = await fetch(`${API_BASE}/campaigns/${cid}/report/${kind}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moviq-${(title||cid).replace(/\s+/g,'-').toLowerCase()}.${kind === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Report Downloaded', description: `${kind.toUpperCase()} report generated.` });
    } catch (e) {
      toast({ title: 'Download failed', description: 'Please try again.' });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Auto-generated, client-ready campaign execution reports in PDF and Excel format."
      />

      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <FileBarChart className="h-10 w-10 mx-auto mb-2 text-slate-400 opacity-60" />
            <div className="font-semibold text-slate-700">No campaigns found</div>
            <p className="text-sm text-slate-500 mt-1">Reports will be available once campaigns are created.</p>
          </Card>
        ) : (
          campaigns.map(c => {
            const completionPct = c.totalTasks ? Math.round(((c.completed || 0) / c.totalTasks) * 100) : 0;
            return (
              <Card key={c.id} className="p-6 hover:shadow-sm transition">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {(c.brand || 'CG').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-lg">{c.title}</h3>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{c.brand} · {c.mediaType} · {c.city}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={downloading === `${c.id}-pdf`}
                      onClick={() => download(c.id, 'pdf', c.title)}
                    >
                      {downloading === `${c.id}-pdf` ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
                      Download PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={downloading === `${c.id}-excel`}
                      onClick={() => download(c.id, 'excel', c.title)}
                    >
                      {downloading === `${c.id}-excel` ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-1.5" />}
                      Download Excel
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Total Units</div>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">{c.totalTasks || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Completed</div>
                    <div className="text-xl font-bold text-emerald-600 mt-0.5">{c.completed || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Completion Rate</div>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">{completionPct}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Flagged</div>
                    <div className={`text-xl font-bold mt-0.5 ${c.flagged > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {c.flagged || 0}
                    </div>
                  </div>
                </div>

                <ProgressBar value={c.completed || 0} max={c.totalTasks || 1} color={c.status === 'completed' ? 'bg-emerald-500' : 'bg-red-600'} />
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
