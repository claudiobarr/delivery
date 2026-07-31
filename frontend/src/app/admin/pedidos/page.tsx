'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, statusLabels, statusColors } from '@/lib/utils';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const res = await api.getAdminOrders(params.toString());
      setOrders(res.orders);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, status]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(id, newStatus);
      toast.success('Status atualizado!');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gerenciar Pedidos</h1>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchOrders()} placeholder="Buscar pedido..." className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Todos</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <Button variant="secondary" onClick={fetchOrders}>Buscar</Button>
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
                <th className="text-left p-3 font-medium">Ações</th>
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
                  <td className="p-3">
                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                      Gerenciar
                    </Button>
                  </td>
                </tr>
              ))}
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

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Pedido #${selectedOrder?.id?.slice(0, 8)}`} size="lg">
        {selectedOrder && (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Cliente: {selectedOrder.user?.name || selectedOrder.user?.email}</p>
              <p className="text-sm text-gray-500">Total: {formatCurrency(Number(selectedOrder.totalAmount))}</p>
              <Badge className={statusColors[selectedOrder.status]}>{statusLabels[selectedOrder.status]}</Badge>
            </div>
            <div className="mb-4">
              <p className="font-medium mb-2">Itens</p>
              {selectedOrder.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span>{item.product?.name} x{item.quantity}</span>
                  <span>{formatCurrency(Number(item.unitPrice) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="font-medium mb-2">Atualizar Status</p>
              <div className="flex flex-wrap gap-2">
                {['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((s) => (
                  <Button key={s} size="sm" variant={selectedOrder.status === s ? 'primary' : 'outline'} onClick={() => handleUpdateStatus(selectedOrder.id, s)}>
                    {statusLabels[s]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
