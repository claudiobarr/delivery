'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function AdminPartners() {
  const [partners, setPartners] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPartners = async () => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await api.getAdminPartners(params.toString());
    setPartners(res.partners);
    setTotal(res.total);
  };

  useEffect(() => { fetchPartners(); }, [page, statusFilter]);

  const handleApprove = async (id: string) => {
    await api.approvePartner(id);
    toast.success('Parceiro aprovado!');
    fetchPartners();
  };

  const handleReject = async (id: string) => {
    await api.rejectPartner(id);
    toast.success('Parceiro recusado');
    fetchPartners();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gerenciar Parceiros</h1>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchPartners()} placeholder="Buscar parceiro..." className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="PENDING">Pendente</option>
          <option value="APPROVED">Aprovado</option>
          <option value="REJECTED">Recusado</option>
        </select>
        <Button variant="secondary" onClick={fetchPartners}>Buscar</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Loja</th>
              <th className="text-left p-3">Responsável</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Produtos</th>
              <th className="text-left p-3">Pedidos</th>
              <th className="text-left p-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {partners.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{p.storeName || '-'}</td>
                <td className="p-3">{p.name || '-'}</td>
                <td className="p-3 text-gray-500">{p.email}</td>
                <td className="p-3">
                  <Badge className={statusColors[p.partnerStatus]}>{statusLabels[p.partnerStatus]}</Badge>
                </td>
                <td className="p-3">{p._count?.products || 0}</td>
                <td className="p-3">{p._count?.orders || 0}</td>
                <td className="p-3 flex gap-2">
                  {p.partnerStatus === 'PENDING' && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => handleApprove(p.id)} title="Aprovar">
                        <CheckCircle size={16} className="text-green-500" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleReject(p.id)} title="Recusar">
                        <XCircle size={16} className="text-red-500" />
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">Total: {total} parceiros</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={partners.length < 20}>Próximo</Button>
        </div>
      </div>
    </div>
  );
}
