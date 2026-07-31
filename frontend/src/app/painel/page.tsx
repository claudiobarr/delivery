'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, Package, DollarSign, CreditCard, AlertCircle } from 'lucide-react';

export default function PartnerDashboard() {
  const [data, setData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mpStatus, setMpStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getPartnerDashboard(),
      api.getPartnerProfile(),
      api.getPartnerMpStatus().catch(() => ({ linked: false })),
    ]).then(([d, p, mp]) => {
      setData(d);
      setProfile(p);
      setMpStatus(mp);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (!data) return <p>Erro ao carregar dashboard</p>;

  const stats = [
    { label: 'Meus Produtos', value: data.stats.totalProducts, icon: ShoppingBag, color: 'bg-orange-500' },
    { label: 'Total de Pedidos', value: data.stats.totalOrders, icon: Package, color: 'bg-blue-500' },
    { label: 'Receita Bruta', value: formatCurrency(Number(data.stats.totalRevenue)), icon: DollarSign, color: 'bg-green-500' },
    { label: 'Disponível', value: formatCurrency(Number(data.stats.totalEarnings || 0)), icon: DollarSign, color: 'bg-emerald-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {profile && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold mb-1">{profile.storeName || 'Minha Loja'}</h2>
              {profile.storeDescription && (
                <p className="text-sm text-gray-600">{profile.storeDescription}</p>
              )}
              <div className="flex gap-4 mt-3 text-sm text-gray-500">
                <span>Produtos: {profile._count?.products || 0}</span>
                <span>Pedidos: {profile._count?.orders || 0}</span>
                {profile.commissionRate && <span>Comissão: {profile.commissionRate}%</span>}
              </div>
            </div>
            {mpStatus && !mpStatus.linked && (
              <Link
                href="/painel/conta"
                className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-4 py-2 rounded-lg hover:bg-yellow-100"
              >
                <AlertCircle size={16} />
                Vincular Mercado Pago
              </Link>
            )}
            {mpStatus?.linked && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg">
                <CreditCard size={16} />
                MP vinculado
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
