'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, loading, updateItem, removeItem, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      await applyCoupon(couponCode);
      toast.success('Cupom aplicado!');
      setCouponCode('');
    } catch (err: any) {
      toast.error(err.message || 'Cupom inválido');
    }
  };

  const total = cart?.items?.reduce(
    (sum: number, item: any) => sum + Number(item.product.discountedPrice || item.product.price) * item.quantity,
    0,
  ) || 0;

  const discount = cart?.coupon
    ? cart.coupon.discountType === 'PERCENTAGE'
      ? (total * Number(cart.coupon.discountValue)) / 100
      : Number(cart.coupon.discountValue)
    : 0;

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Faça login para ver seu carrinho</h2>
        <Link href="/login" className="text-primary-600 hover:underline">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Carrinho</h1>

      {!cart?.items?.length ? (
        <div className="text-center py-12">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Seu carrinho está vazio</p>
          <Link href="/cardapio">
            <Button>Ver Cardápio</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                <p className="text-sm text-gray-500">
                  {formatCurrency(Number(item.product.discountedPrice || item.product.price))} cada
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateItem(item.id, item.quantity + 1)}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="font-semibold w-24 text-right">
                {formatCurrency(Number(item.product.discountedPrice || item.product.price) * item.quantity)}
              </p>
              <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex gap-2">
              <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Cupom de desconto" />
              <Button variant="outline" onClick={handleApplyCoupon} disabled={loading}>
                Aplicar
              </Button>
            </div>
            {cart.coupon && (
              <div className="mt-2 text-sm text-green-600 flex items-center justify-between">
                <span>Cupom {cart.coupon.code} aplicado</span>
                <button onClick={() => removeCoupon()} className="text-red-500 hover:underline">Remover</button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Desconto</span>
                <span className="text-green-600">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-primary-600">{formatCurrency(total - discount)}</span>
            </div>
          </div>

          <Link href="/checkout">
            <Button size="lg" className="w-full">
              Continuar para Pagamento
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
