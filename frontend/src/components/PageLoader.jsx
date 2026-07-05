import React from 'react';

/**
 * PageLoader — branded pulsing skeleton shown during React.lazy load and API fetches.
 * Matches the app's slate/white/red color scheme. No spinner — purely CSS animation.
 */
export default function PageLoader() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-slate-200 rounded-md" />
          <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="h-9 w-28 bg-slate-200 rounded-md" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-9 w-9 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-7 w-16 bg-slate-200 rounded" />
            <div className="h-3 w-28 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-100">
          <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3   bg-slate-100 rounded w-1/2" />
                </div>
                <div className="h-5 w-16 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 space-y-3">
          <div className="h-5 w-28 bg-slate-200 rounded" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
