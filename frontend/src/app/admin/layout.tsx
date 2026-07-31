'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Package, Users, Tags, Percent, BarChart3, Store, LogOut
} from 'lucide-react';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/pedidos', icon: Package, label: 'Pedidos' },
  { href: '/admin/produtos', icon: ShoppingBag, label: 'Produtos' },
  { href: '/admin/categorias', icon: Tags, label: 'Categorias' },
  { href: '/admin/parceiros', icon: Store, label: 'Parceiros' },
  { href: '/admin/usuarios', icon: Users, label: 'Usuários' },
  { href: '/admin/cupons', icon: Percent, label: 'Cupons' },
  { href: '/admin/relatorios', icon: BarChart3, label: 'Relatórios' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/login');
    }
  }, [user, isAdmin, loading]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p>Carregando...</p></div>;
  if (!user || !isAdmin) return null;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-64 bg-gray-900 text-white hidden lg:block">
        <div className="p-4">
          <p className="text-sm text-gray-400">Admin Panel</p>
          <p className="font-medium truncate">{user.name || user.email}</p>
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
        {children}
      </div>
    </div>
  );
}
