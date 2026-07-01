import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { Plus, Search, Shield, Building2, UserCog, User } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import api from '../../api';

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('admin');
  const [rows, setRows] = useState({ admin: [], agency: [], supervisor: [], field: [] });

  useEffect(() => {
    (async () => {
      const roles = ['admin', 'agency', 'supervisor', 'field'];
      const results = await Promise.all(roles.map(r => api.get(`/users?role=${r}`).catch(() => ({ data: [] }))));
      const next = {};
      roles.forEach((r, i) => { next[r] = results[i].data; });
      setRows(next);
    })();
  }, []);

  const filter = (arr) => arr.filter(u => (u.name || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Manage every user across admins, agencies, supervisors and field executives."
        actions={<Button className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-1" /> Invite user</Button>}
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
          <UserTable rows={filter(rows.admin)} cols={['name', 'email', 'role', 'status']} />
        </TabsContent>
        <TabsContent value="agency" className="mt-4">
          <UserTable rows={filter(rows.agency)} cols={['name', 'email', 'agency', 'status']} />
        </TabsContent>
        <TabsContent value="supervisor" className="mt-4">
          <UserTable rows={filter(rows.supervisor).map(s => ({ ...s, team: `${s.teamSize} executives`, status: 'active' }))} cols={['name', 'email', 'city', 'team', 'status']} />
        </TabsContent>
        <TabsContent value="field" className="mt-4">
          <UserTable rows={filter(rows.field).map(f => ({ ...f, quality: `${f.avgQuality}%` }))} cols={['name', 'phone', 'city', 'tasksDone', 'quality', 'status']} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserTable({ rows, cols }) {
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
                <td className="py-3 px-3"><Button size="sm" variant="ghost">Edit</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
