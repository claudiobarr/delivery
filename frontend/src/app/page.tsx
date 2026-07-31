'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import Button from '@/components/ui/button';
import { ShoppingBag, Clock, Truck, CreditCard } from 'lucide-react';

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    api.getFeaturedProducts().then(setFeatured).catch(() => {});
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Os melhores lanches <br />da sua região
          </h1>
          <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Peça hambúrgueres artesanais, pizzas, bebidas e muito mais. Entrega rápida direto na sua casa.
          </p>
          <Link
            href="/cardapio"
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-xl text-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            <ShoppingBag size={20} />
            Ver Cardápio
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Clock, title: 'Rápido', desc: 'Entrega em até 30 min' },
            { icon: Truck, title: 'Delivery Grátis', desc: 'A partir de R$ 29,90' },
            { icon: CreditCard, title: 'Pagamento Fácil', desc: 'Cartão, PIX ou dinheiro' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl p-6 shadow-md flex items-center gap-4">
              <div className="bg-primary-100 p-3 rounded-lg">
                <item.icon className="text-primary-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Destaques do Cardápio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag size={48} />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <span className="text-lg font-bold text-primary-600">{formatCurrency(Number(product.price))}</span>
                      {product.discountedPrice && (
                        <span className="text-sm text-gray-400 line-through ml-2">{formatCurrency(Number(product.discountedPrice))}</span>
                      )}
                    </div>
                    <Button size="sm" onClick={() => addItem(product.id)}>
                      + Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Quer fazer parte?</h2>
          <p className="text-gray-400 mb-6">Seja um parceiro DeliveryApp e aumente suas vendas</p>
          <Link href="/parceiro">
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900">
              Seja um Parceiro
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
