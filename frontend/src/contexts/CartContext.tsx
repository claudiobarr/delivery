'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: any | null;
  loading: boolean;
  itemCount: number;
  total: number;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number, notes?: string) => Promise<void>;
  updateItem: (itemId: string, quantity: number, notes?: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      const data = await api.getCart();
      setCart(data);
    } catch {
      setCart(null);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const itemCount = cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  const total = cart?.items?.reduce(
    (sum: number, item: any) =>
      sum + (item.product.discountedPrice || item.product.price) * item.quantity,
    0,
  ) || 0;

  const addItem = async (productId: string, quantity = 1, notes?: string) => {
    setLoading(true);
    try {
      const data = await api.addToCart(productId, quantity, notes);
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId: string, quantity: number, notes?: string) => {
    setLoading(true);
    try {
      const data = await api.updateCartItem(itemId, quantity, notes);
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      const data = await api.removeFromCart(itemId);
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    await api.clearCart();
    setCart(null);
  };

  const applyCoupon = async (code: string) => {
    setLoading(true);
    try {
      const data = await api.applyCoupon(code);
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = async () => {
    setLoading(true);
    try {
      const data = await api.removeCoupon();
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        total,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
