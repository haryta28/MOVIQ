import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { MOVIQ_LOGO, MOVIQ_NAME, MOVIQ_TAGLINE } from '../brand';
import { toast } from '../hooks/use-toast';

export default function AcceptInvite() {
  const { user, acceptInvite, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/agency', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Invalid link', description: 'Invitation email address is missing.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Weak password', description: 'Password must be at least 6 characters long.' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords mismatch', description: 'Please make sure passwords match.' });
      return;
    }

    try {
      const u = await acceptInvite(email, password);
      toast({ title: '🎉 Account Activated!', description: `Welcome ${u.name}. Your session is active.` });
      navigate(u.role === 'admin' ? '/admin' : '/agency');
    } catch (err) {
      toast({
        title: 'Activation failed',
        description: err?.response?.data?.detail || 'Try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm">
            <img src={MOVIQ_LOGO} alt="Moviq" className="h-10 w-10 object-contain" />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{MOVIQ_NAME}</h2>
        <p className="mt-1.5 text-sm text-slate-500">{MOVIQ_TAGLINE}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 border-slate-200/80 shadow-lg">
          <div className="mb-6 flex items-start gap-3 p-3 bg-red-50/50 border border-red-100/50 rounded-xl text-slate-800">
            <ShieldCheck className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Setup your account</div>
              <div className="text-xs text-slate-500 mt-0.5">Choose a secure password below to activate access.</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</Label>
              <Input type="email" value={email} disabled className="mt-1 bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Choose Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 border-slate-200 focus:border-red-500"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="mt-1 border-slate-200 focus:border-red-500"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-medium mt-2 py-5" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activating...
                </>
              ) : (
                'Activate Account & Launch'
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
