'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';

export default function AdminReports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReports().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (!data) return <p>Sem dados</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Relatórios</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg"><ShoppingBag size={24} className="text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">Total de Pedidos</p><p className="text-2xl font-bold">{data.totalOrders}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg"><DollarSign size={24} className="text-green-600" /></div>
            <div><p className="text-sm text-gray-500">Receita Total</p><p className="text-2xl font-bold">{formatCurrency(Number(data.totalRevenue))}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg"><TrendingUp size={24} className="text-purple-600" /></div>
            <div><p className="text-sm text-gray-500">Produtos Mais Vendidos</p><p className="text-2xl font-bold">{data.topProducts?.length || 0}</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold mb-4">Produtos Mais Vendidos</h2>
          <div className="space-y-3">
            {data.topProducts?.map((item: any, idx: number) => (
              <div key={item.productId} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">#{idx + 1} Produto {item.productId?.slice(0, 8)}</span>
                <span className="font-medium">{item._sum?.quantity} vendas</span>
              </div>
            ))}
            {(!data.topProducts || data.topProducts.length === 0) && (
              <p className="text-gray-500 text-sm">Nenhum produto vendido ainda</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold mb-4">Pedidos por Dia (últimos 30)</h2>
          <div className="space-y-2">
            {data.ordersByDay?.map((day: any) => (
              <div key={day.date} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{new Date(day.date).toLocaleDateString('pt-BR')}</span>
                <div className="flex items-center gap-4">
                  <span>{day.count} pedidos</span>
                  <span className="font-medium text-green-600">{formatCurrency(Number(day.revenue))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
