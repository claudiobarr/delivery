'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, statusLabels, statusColors } from '@/lib/utils';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyOrder(params.id as string).then((data) => {
      setOrder(data);
    }).catch(() => {
      router.push('/pedidos');
    }).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-500">Carregando...</div>;
  if (!order) return null;

  const statusSequence = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentIdx = statusSequence.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/pedidos" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft size={16} className="mr-1" /> Voltar
      </Link>

      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
          <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-gray-400" />
          {order.estimatedTime && (
            <span className="text-sm text-gray-600">Tempo estimado: {order.estimatedTime} min</span>
          )}
        </div>

        <div className="space-y-1">
          {statusSequence.map((status, idx) => (
            <div key={status} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${idx <= currentIdx ? 'bg-primary-600' : 'bg-gray-300'}`} />
              <span className={`text-sm ${idx <= currentIdx ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                {statusLabels[status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="font-semibold mb-4">Itens do Pedido</h2>
        <div className="space-y-3">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.product?.name}</p>
                <p className="text-sm text-gray-500">Qtd: {item.quantity} x {formatCurrency(Number(item.unitPrice))}</p>
              </div>
              <p className="font-semibold">{formatCurrency(Number(item.unitPrice) * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 mt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(Number(order.totalAmount) + Number(order.discountAmount))}</span>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto</span>
              <span>-{formatCurrency(Number(order.discountAmount))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary-600">{formatCurrency(Number(order.totalAmount))}</span>
          </div>
        </div>
      </div>

      {order.address && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold mb-2">Endereço de Entrega</h2>
          <p className="text-sm text-gray-600">
            {order.address.street}, {order.address.number}
            {order.address.complement && ` - ${order.address.complement}`}
          </p>
          <p className="text-sm text-gray-600">{order.address.neighborhood}, {order.address.city} - {order.address.state}</p>
        </div>
      )}
    </div>
  );
}
