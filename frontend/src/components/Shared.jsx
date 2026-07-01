import React from 'react';
import { Card } from './ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function KpiCard({ label, value, icon: Icon, delta, deltaLabel = 'vs last month', accent = 'blue' }) {
  const accentMap = {
    blue: 'text-red-600 bg-red-50',
    indigo: 'text-red-600 bg-red-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50',
    violet: 'text-violet-600 bg-violet-50',
  };
  const isUp = typeof delta === 'number' ? delta >= 0 : true;
  return (
    <Card className="p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
        </div>
        {Icon && (
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {delta !== undefined && (
        <div className="flex items-center gap-1 mt-3 text-xs">
          {isUp ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-600" />}
          <span className={isUp ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>{isUp ? '+' : ''}{delta}%</span>
          <span className="text-slate-500">{deltaLabel}</span>
        </div>
      )}
    </Card>
  );
}

export function StatusBadge({ status }) {
  const map = {
    ongoing: 'bg-red-50 text-red-700 border-red-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-slate-100 text-slate-700 border-slate-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    submitted: 'bg-red-50 text-red-700 border-red-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    flagged: 'bg-rose-50 text-rose-700 border-rose-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    trial: 'bg-violet-50 text-violet-700 border-violet-200',
    high: 'bg-rose-50 text-rose-700 border-rose-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  const label = status.replace('_', ' ');
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${map[status] || map.pending}`}>
      {label}
    </span>
  );
}

export function ProgressBar({ value, max = 100, color = 'bg-red-600' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full">
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>{value.toLocaleString()} / {max.toLocaleString()}</span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MiniBarChart({ data, valueKey, labelKey, color = 'bg-red-500' }) {
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="flex items-end gap-3 h-48">
      {data.map((d, i) => {
        const h = Math.max(8, Math.round((d[valueKey] / max) * 100));
        return (
          <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
            <div className={`w-full ${color} rounded-md transition-all hover:opacity-90 group relative cursor-pointer`} style={{ height: `${h}%` }}>
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition bg-white px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                {typeof d[valueKey] === 'number' && d[valueKey] > 999 ? (d[valueKey]/1000).toFixed(1) + 'K' : d[valueKey]}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">{d[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}
