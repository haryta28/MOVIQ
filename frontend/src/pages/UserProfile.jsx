import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PageHeader } from '../components/Shared';
import { User, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import api from '../api';

export default function UserProfile() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Invalid name', description: 'Name field cannot be blank.' });
      return;
    }
    setSavingProfile(true);
    try {
      await api.patch('/auth/profile', { name, phone });
      await refreshUser();
      toast({ title: '🎉 Profile updated', description: 'Your personal details have been saved.' });
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err?.response?.data?.detail || 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: 'Weak password', description: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords mismatch', description: 'Please make sure new passwords match.' });
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast({ title: '🔒 Password changed', description: 'A confirmation email was sent to your inbox.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err?.response?.data?.detail || 'Verify your current password.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const getRoleLabel = (r) => {
    if (r === 'admin') return 'Platform Admin';
    if (r === 'agency') return 'Agency Head';
    return r;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="My Profile"
        description="Manage your personal details, supervisor relationships, and security settings."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card className="p-6 border-slate-200/80 shadow-md">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <User className="h-4.5 w-4.5 text-red-600" /> Personal Details
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Role</Label>
              <Input value={getRoleLabel(user?.role)} disabled className="mt-1 bg-slate-50 border-slate-200 text-slate-500 font-medium capitalize cursor-not-allowed" />
            </div>

            {user?.role === 'agency' && (
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Agency</Label>
                <Input value={user?.agencyName} disabled className="mt-1 bg-slate-50 border-slate-200 text-slate-500 font-medium cursor-not-allowed" />
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</Label>
              <Input type="email" value={user?.email} disabled className="mt-1 bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</Label>
              <Input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="mt-1 border-slate-200 focus:border-red-500"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</Label>
              <Input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1 border-slate-200 focus:border-red-500"
              />
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 mt-2" disabled={savingProfile}>
              {savingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6 border-slate-200/80 shadow-md">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Lock className="h-4.5 w-4.5 text-red-600" /> Security Credentials
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="mt-1 border-slate-200 focus:border-red-500"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="mt-1 border-slate-200 focus:border-red-500"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="mt-1 border-slate-200 focus:border-red-500"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 mt-2" disabled={updatingPassword}>
              {updatingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
