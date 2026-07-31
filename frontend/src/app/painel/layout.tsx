'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Package, Store, CreditCard, LogOut
} from 'lucide-react';

const navItems = [
  { href: '/painel', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/painel/produtos', icon: ShoppingBag, label: 'Produtos' },
  { href: '/painel/pedidos', icon: Package, label: 'Pedidos' },
  { href: '/painel/conta', icon: CreditCard, label: 'Conta' },
];

export default function PartnerLayout({ children }: { children: ReactNode }) {
  const { user, isPartner, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isPartner)) {
      router.push('/login');
    }
  }, [user, isPartner, loading]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p>Carregando...</p></div>;
  if (!user || !isPartner) return null;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-64 bg-gray-900 text-white hidden lg:block">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Store size={18} className="text-primary-400" />
            <p className="text-sm text-gray-400">Painel do Parceiro</p>
          </div>
          <p className="font-medium truncate">{user.storeName || user.name || user.email}</p>
          {user.partnerStatus === 'PENDING' && (
            <p className="text-xs text-yellow-400 mt-1">Aguardando aprovação</p>
          )}
        </div>
        <nav className="px-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 bg-gray-50 p-6 overflow-auto">
        {user.partnerStatus === 'PENDING' && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 mb-6">
            Seu cadastro como parceiro está pendente de aprovação. Você pode gerenciar seus produtos, mas eles só ficarão visíveis após a aprovação.
          </div>
        )}
        {user.partnerStatus === 'REJECTED' && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6">
            Seu cadastro como parceiro foi recusado. Entre em contato conosco para mais informações.
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
