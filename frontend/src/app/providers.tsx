'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/Header';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main>{children}</main>
        </div>
        <Toaster position="top-right" richColors />
      </CartProvider>
    </AuthProvider>
  );
}
