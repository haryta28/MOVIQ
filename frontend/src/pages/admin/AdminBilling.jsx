import React from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/Shared';
import { plans, agencies } from '../../mock/mock';
import { Check, IndianRupee, TrendingUp } from 'lucide-react';

export default function AdminBilling() {
  const totalRevenue = agencies.reduce((s, a) => s + a.revenue, 0);
  const activeSubs = agencies.filter(a => a.plan !== 'Free').length;
  const trials = agencies.filter(a => a.status === 'trial').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Plans"
        description="Manage subscription plans and view revenue."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Total Revenue</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">₹ {(totalRevenue/100000).toFixed(1)}L</div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><IndianRupee className="h-5 w-5" /></div>
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-2">+18% vs last month</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Paid subscriptions</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{activeSubs}</div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><TrendingUp className="h-5 w-5" /></div>
          </div>
          <div className="text-xs text-slate-500 mt-2">Enterprise + Growth</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Free trials</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{trials}</div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><TrendingUp className="h-5 w-5" /></div>
          </div>
          <div className="text-xs text-slate-500 mt-2">Conversion opportunity</div>
        </Card>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-4">Subscription plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p, i) => (
            <Card key={p.key} className={`p-6 relative ${i === 1 ? 'border-2 border-red-500 shadow-md' : ''}`}>
              {i === 1 && <div className="absolute -top-3 left-6 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</div>}
              <div className="text-lg font-bold text-slate-900">{p.name}</div>
              <p className="text-sm text-slate-500 mt-1">{p.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-slate-900">{p.price === 0 ? 'Free' : `₹${p.price.toLocaleString()}`}</span>
                {p.price > 0 && <span className="text-slate-500 text-sm">/month</span>}
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> {p.campaigns} campaigns</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> {p.users} users</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> GPS-verified proofs</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> AI fraud detection</li>
              </ul>
              <Button className={`w-full mt-6 ${i === 1 ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`} variant={i === 1 ? 'default' : 'outline'}>Edit plan</Button>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold text-slate-900 mb-3 px-2">Recent invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="py-3 px-3 font-medium">Invoice</th>
                <th className="py-3 px-3 font-medium">Agency</th>
                <th className="py-3 px-3 font-medium">Plan</th>
                <th className="py-3 px-3 font-medium">Amount</th>
                <th className="py-3 px-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {agencies.filter(a => a.revenue > 0).map((a, i) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono text-xs">INV-{2500 + i}</td>
                  <td className="py-3 px-3 font-medium">{a.name}</td>
                  <td className="py-3 px-3">{a.plan}</td>
                  <td className="py-3 px-3 font-semibold">₹ {(a.revenue/100000).toFixed(1)}L</td>
                  <td className="py-3 px-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Paid</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
