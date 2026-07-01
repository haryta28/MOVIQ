import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { MapPin, Shield, Building2, MessageCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

const roles = [
  { key: 'admin', name: 'Platform Admin', desc: 'Manage all agencies & campaigns', icon: Shield, color: 'bg-blue-50 text-blue-700 border-blue-200', route: '/admin' },
  { key: 'agency', name: 'Agency', desc: 'Manage your brand campaigns', icon: Building2, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', route: '/agency' },
  { key: 'field', name: 'Field Executive (WhatsApp)', desc: 'Submit tasks on WhatsApp bot', icon: MessageCircle, color: 'bg-green-50 text-green-700 border-green-200', route: '/whatsapp' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const role = roles.find(r => r.key === selected);
    if (role.key === 'field') {
      navigate('/whatsapp');
      return;
    }
    login(role.key);
    navigate(role.route);
  };

  const prefill = (key) => {
    setSelected(key);
    if (key === 'admin') { setEmail('admin@gogig.in'); setPassword('demo1234'); }
    else if (key === 'agency') { setEmail('saurav@brightads.in'); setPassword('demo1234'); }
    else { setEmail('ramesh@field.in'); setPassword('demo1234'); }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">gOGig</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight">Track offline campaigns with online precision.</h1>
          <p className="text-blue-100 text-lg max-w-md">GPS-verified proofs, real-time dashboards, and WhatsApp-based field ops — all in one platform.</p>
          <div className="grid grid-cols-2 gap-4 max-w-md pt-4">
            {[['14,598+', 'Tasks tracked daily'], ['1000+', 'Brands trust us'], ['400+', 'Cities covered'], ['100%', 'GPS verified']].map(([n, l]) => (
              <div key={l} className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/10">
                <div className="text-2xl font-bold">{n}</div>
                <div className="text-sm text-blue-100">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-sm text-blue-100/80">ISO 27001 Certified · DPDP Compliant</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">gOGig</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
          <p className="text-slate-500 mt-1">Sign in to continue to your dashboard.</p>

          <div className="mt-8 space-y-2">
            <Label className="text-slate-700">Choose your role</Label>
            <div className="grid grid-cols-1 gap-2">
              {roles.map(r => {
                const Icon = r.icon;
                const active = selected === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => prefill(r.key)}
                    className={`flex items-center gap-3 border rounded-lg p-3 text-left transition hover:border-blue-400 ${active ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/40' : 'border-slate-200'}`}
                  >
                    <div className={`h-9 w-9 rounded-md flex items-center justify-center border ${r.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 text-sm">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.desc}</div>
                    </div>
                    {active && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.in" className="mt-1" required />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-blue-600 hover:underline">Forgot?</button>
              </div>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" required />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11">
              Sign in <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <Card className="mt-6 p-3 bg-slate-50 border-dashed">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Demo mode:</span> Click any role above to auto-fill and press Sign in.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
