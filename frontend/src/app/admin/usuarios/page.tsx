'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, ToggleLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    const res = await api.getAdminUsers(params.toString());
    setUsers(res.users);
    setTotal(res.total);
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleRoleChange = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'CUSTOMER' ? 'ADMIN' : 'CUSTOMER';
    await api.updateUserRole(id, newRole);
    toast.success(`Role alterada para ${newRole}`);
    fetchUsers();
  };

  const handleToggleStatus = async (id: string) => {
    await api.toggleUserStatus(id);
    toast.success('Status alterado');
    fetchUsers();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Usuários</h1>
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers()} placeholder="Buscar usuário..." className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm" />
        </div>
        <Button variant="secondary" onClick={fetchUsers}>Buscar</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="text-left p-3">Nome</th><th className="text-left p-3">Email</th><th className="text-left p-3">Role</th><th className="text-left p-3">Ativo</th><th className="text-left p-3">Pedidos</th><th className="text-left p-3">Ações</th></tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{u.name || '-'}</td>
                <td className="p-3 text-gray-500">{u.email}</td>
                <td className="p-3"><Badge variant={u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'info' : 'default'}>{u.role}</Badge></td>
                <td className="p-3">{u.isActive ? 'Sim' : 'Não'}</td>
                <td className="p-3">{u._count?.orders || 0}</td>
                <td className="p-3 flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleRoleChange(u.id, u.role)} title="Alterar Role"><Shield size={16} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(u.id)} title="Ativar/Desativar"><ToggleLeft size={16} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
