import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { Plus, Search, Shield, Building2, UserCog, User, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';
import useParallelApi from '../../hooks/useParallelApi';
import api from '../../api';

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('admin');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // For editing

  // Fetch all users, supervisors, and agencies
  const { results } = useParallelApi([
    '/users?role=admin', '/users?role=agency', '/users?role=supervisor', '/users?role=field', '/agencies',
  ]);
  const [
    adminUsers = [], agencyUsers = [], supervisors = [], fieldUsers = [], agencies = []
  ] = results;

  const rows = { admin: adminUsers, agency: agencyUsers, supervisor: supervisors, field: fieldUsers };
  const filter = (arr) => arr.filter(u => (u.name || '').toLowerCase().includes(q.toLowerCase()));

  // Form states
  const [inviteForm, setInviteForm] = useState({ name: '', role: 'admin', email: '', phone: '', city: '', supervisor: '', agencyId: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', city: '', supervisor: '', status: '', agencyId: '' });

  const handleOpenEdit = (user) => {
    // Map current user details to edit form, matching the role
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      city: user.city || '',
      supervisor: user.supervisor || '',
      status: user.status || 'active',
      agencyId: user.agencyId || ''
    });
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.role) {
      toast({ title: 'Missing fields', description: 'Name and Role are required.' });
      return;
    }
    try {
      await api.post('/users', inviteForm);
      toast({ title: '🎉 User invited', description: `${inviteForm.name} was successfully created.` });
      setShowInviteModal(false);
      setInviteForm({ name: '', role: 'admin', email: '', phone: '', city: '', supervisor: '', agencyId: '' });
      window.location.reload();
    } catch (err) {
      toast({ title: 'Invitation failed', description: err?.response?.data?.detail || 'Try again.' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/users/${selectedUser.id}`, editForm);
      toast({ title: 'User updated', description: `${editForm.name} configuration saved.` });
      setSelectedUser(null);
      window.location.reload();
    } catch (err) {
      toast({ title: 'Update failed', description: err?.response?.data?.detail || 'Try again.' });
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm(`Are you sure you want to completely delete ${selectedUser.name}?`)) return;
    try {
      await api.delete(`/users/${selectedUser.id}`);
      toast({ title: 'User deleted', description: `${selectedUser.name} has been removed.` });
      setSelectedUser(null);
      window.location.reload();
    } catch (err) {
      toast({ title: 'Deletion failed', description: err?.response?.data?.detail || 'Try again.' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Manage every user across admins, agencies, supervisors and field executives."
        actions={
          <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-1" /> Invite user</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Invite New User</DialogTitle></DialogHeader>
              <form onSubmit={handleInviteSubmit} className="space-y-4 mt-2">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} className="mt-1" placeholder="Deepak Bansal" required />
                </div>
                <div>
                  <Label>Role *</Label>
                  <Select value={inviteForm.role} onValueChange={v => setInviteForm({...inviteForm, role: v, email: '', phone: '', city: '', supervisor: '', agencyId: ''})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Platform Admin</SelectItem>
                      <SelectItem value="agency">Agency Head</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="field">Field Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {inviteForm.role !== 'admin' && (
                  <div>
                    <Label>Agency *</Label>
                    <Select value={inviteForm.agencyId} onValueChange={v => setInviteForm({...inviteForm, agencyId: v})}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select Agency" /></SelectTrigger>
                      <SelectContent>
                        {agencies.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {inviteForm.role !== 'field' && (
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="mt-1" placeholder="user@moviq.in" required />
                  </div>
                )}

                {inviteForm.role === 'field' && (
                  <>
                    <div>
                      <Label>Phone Number *</Label>
                      <Input value={inviteForm.phone} onChange={e => setInviteForm({...inviteForm, phone: e.target.value})} className="mt-1" placeholder="+91 98123 45678" required />
                    </div>
                    <div>
                      <Label>Reports to (Supervisor)</Label>
                      <Select value={inviteForm.supervisor} onValueChange={v => setInviteForm({...inviteForm, supervisor: v})}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select Supervisor" /></SelectTrigger>
                        <SelectContent>
                          {supervisors.filter(s => s.agencyId === inviteForm.agencyId).map(s => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {(inviteForm.role === 'supervisor' || inviteForm.role === 'field') && (
                  <div>
                    <Label>City *</Label>
                    <Input value={inviteForm.city} onChange={e => setInviteForm({...inviteForm, city: e.target.value})} className="mt-1" placeholder="Delhi" required />
                  </div>
                )}

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">Create User</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="admin" className="gap-2"><Shield className="h-4 w-4" /> Platform Admins</TabsTrigger>
          <TabsTrigger value="agency" className="gap-2"><Building2 className="h-4 w-4" /> Agency Heads</TabsTrigger>
          <TabsTrigger value="supervisor" className="gap-2"><UserCog className="h-4 w-4" /> Supervisors</TabsTrigger>
          <TabsTrigger value="field" className="gap-2"><User className="h-4 w-4" /> Field Executives</TabsTrigger>
        </TabsList>

        <div className="mt-4 relative max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search users..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
        </div>

        <TabsContent value="admin" className="mt-4">
          <UserTable rows={filter(rows.admin)} cols={['name', 'email', 'role', 'status']} onEdit={handleOpenEdit} />
        </TabsContent>
        <TabsContent value="agency" className="mt-4">
          <UserTable rows={filter(rows.agency)} cols={['name', 'email', 'agency', 'status']} onEdit={handleOpenEdit} />
        </TabsContent>
        <TabsContent value="supervisor" className="mt-4">
          <UserTable rows={filter(rows.supervisor).map(s => ({ ...s, team: `${s.teamSize} executives`, status: 'active' }))} cols={['name', 'email', 'city', 'team', 'status']} onEdit={handleOpenEdit} />
        </TabsContent>
        <TabsContent value="field" className="mt-4">
          <UserTable rows={filter(rows.field).map(f => ({ ...f, quality: `${f.avgQuality}%` }))} cols={['name', 'phone', 'city', 'tasksDone', 'quality', 'status']} onEdit={handleOpenEdit} />
        </TabsContent>
      </Tabs>

      {/* ── Edit User Modal ────────────────────────────────────────────────────── */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit User Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
              <div>
                <Label>Full Name *</Label>
                <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="mt-1" required />
              </div>

              {selectedUser.role !== 'admin' && selectedUser.role !== 'field' && (
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="mt-1" required />
                </div>
              )}

              {selectedUser.phone !== undefined && (
                <div>
                  <Label>Phone Number *</Label>
                  <Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="mt-1" required />
                </div>
              )}

              {selectedUser.city !== undefined && (
                <div>
                  <Label>City *</Label>
                  <Input value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} className="mt-1" required />
                </div>
              )}

              {selectedUser.supervisor !== undefined && (
                <div>
                  <Label>Reports to (Supervisor)</Label>
                  <Select value={editForm.supervisor} onValueChange={v => setEditForm({...editForm, supervisor: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {supervisors.filter(s => s.agencyId === selectedUser.agencyId).map(s => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm({...editForm, status: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2 flex justify-between items-center w-full">
                <Button type="button" variant="destructive" onClick={handleDeleteUser} className="mr-auto">Delete User</Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">Save Changes</Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserTable({ rows, cols, onEdit }) {
  const labels = { name: 'Name', email: 'Email', role: 'Role', status: 'Status', agency: 'Agency', city: 'City', team: 'Team', phone: 'Phone', tasksDone: 'Tasks Done', quality: 'Avg Quality' };
  return (
    <Card className="p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
              {cols.map(c => <th key={c} className="py-3 px-3 font-medium">{labels[c]}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                {cols.map(c => (
                  <td key={c} className="py-3 px-3">
                    {c === 'name' ? (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-semibold text-xs">
                          {(r.name||'').split(' ').map(x => x[0]).join('').slice(0,2)}
                        </div>
                        <span className="font-medium text-slate-900">{r.name}</span>
                      </div>
                    ) : c === 'status' ? <StatusBadge status={r[c]} /> : <span className="text-slate-700">{r[c]}</span>}
                  </td>
                ))}
                <td className="py-3 px-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(r)}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
