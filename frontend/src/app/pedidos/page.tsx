'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, statusLabels, statusColors } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Link from 'next/link';
import { Package, ArrowLeft, Clock } from 'lucide-react';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getMyOrders().then((res) => {
        setOrders(res.orders || []);
      }).finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Package size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Faça login para ver seus pedidos</h2>
        <Link href="/login"><Button>Entrar</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Pedidos</h1>

      {loading ? (
        <p className="text-center text-gray-500">Carregando...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Nenhum pedido ainda</p>
          <Link href="/cardapio"><Button>Fazer Pedido</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/pedidos/${order.id}`}>
              <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">Pedido #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {order.items?.slice(0, 3).map((item: any) => item.product?.name).join(', ')}
                    {order.items?.length > 3 && ' ...'}
                  </div>
                  <p className="font-bold text-primary-600">{formatCurrency(Number(order.totalAmount))}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
