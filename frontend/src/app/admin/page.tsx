'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, Package, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (!data) return <p>Erro ao carregar dashboard</p>;

  const stats = [
    { label: 'Total de Pedidos', value: data.stats.totalOrders, icon: Package, color: 'bg-blue-500' },
    { label: 'Receita Total', value: formatCurrency(Number(data.stats.totalRevenue)), icon: DollarSign, color: 'bg-green-500' },
    { label: 'Usuários', value: data.stats.totalUsers, icon: Users, color: 'bg-purple-500' },
    { label: 'Produtos', value: data.stats.totalProducts, icon: ShoppingBag, color: 'bg-orange-500' },
  ];

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500', CONFIRMED: 'bg-blue-500', PREPARING: 'bg-orange-500',
    READY: 'bg-purple-500', OUT_FOR_DELIVERY: 'bg-indigo-500', DELIVERED: 'bg-green-500', CANCELLED: 'bg-red-500',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold mb-4">Pedidos por Status</h2>
          <div className="space-y-3">
            {Object.entries(data.ordersByStatus).map(([status, count]: any) => (
              <div key={status} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusColors[status] || 'bg-gray-500'}`} />
                <span className="flex-1 text-sm">{status}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold mb-4">Pedidos Recentes</h2>
          <div className="space-y-3">
            {data.recentOrders?.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">#{order.id.slice(0, 8)}</span>
                <span>{order.user?.name || 'N/A'}</span>
                <span className="font-medium">{formatCurrency(Number(order.totalAmount))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
