'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, statusLabels, statusColors } from '@/lib/utils';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PartnerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      const res = await api.getPartnerOrders(params.toString());
      setOrders(res.orders);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, status]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Pedidos</h1>

      <div className="flex gap-3 mb-6">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Todos</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium">Pedido</th>
                <th className="text-left p-3 font-medium">Cliente</th>
                <th className="text-left p-3 font-medium">Valor</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">#{order.id.slice(0, 8)}</td>
                  <td className="p-3">{order.user?.name || order.user?.email}</td>
                  <td className="p-3 font-medium">{formatCurrency(Number(order.totalAmount))}</td>
                  <td className="p-3"><Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge></td>
                  <td className="p-3 text-gray-500">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nenhum pedido encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">Total: {total} pedidos</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={orders.length < 20}>Próximo</Button>
        </div>
      </div>
    </div>
  );
}
