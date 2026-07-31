'use client';

import Link from 'next/link';
import { ShoppingCart, User, Menu, LogOut, Package, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export function Header() {
  const { user, logout, isAdmin, isPartner } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary-600">
          DeliveryApp
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/cardapio" className="text-sm font-medium text-gray-700 hover:text-primary-600">
            Cardápio
          </Link>
          <Link href="/parceiro" className="text-sm font-medium text-gray-700 hover:text-primary-600">
            Seja Parceiro
          </Link>
          {user && (
            <Link href="/pedidos" className="text-sm font-medium text-gray-700 hover:text-primary-600">
              Meus Pedidos
            </Link>
          )}
          {isPartner && (
            <Link href="/painel" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Painel
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/carrinho"
            className="relative p-2 rounded-lg hover:bg-gray-100"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/perfil"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <User size={20} />
                <span className="text-sm hidden md:block">{user.name || user.email}</span>
              </Link>
              <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
