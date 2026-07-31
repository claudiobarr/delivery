'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Category, Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/button';
import { ShoppingBag, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function CardapioPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const { addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    api.getActiveCategories().then((data) => {
      setCategories(data);
      if (data.length > 0) setActiveCategory(data[0].id);
    });
  }, []);

  const activeProducts = categories.find((c) => c.id === activeCategory)?.products || [];

  const filteredProducts = activeProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddItem = async (product: Product) => {
    if (!user) {
      toast.error('Faça login para adicionar itens ao carrinho');
      return;
    }
    await addItem(product.id);
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Cardápio</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar no cardápio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag size={48} className="text-gray-300" />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              {product.ingredients && (
                <p className="text-sm text-gray-500 mt-1">{product.ingredients}</p>
              )}
              <div className="flex items-center justify-between mt-4">
                <div>
                  {product.discountedPrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary-600">
                        {formatCurrency(Number(product.discountedPrice))}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(Number(product.price))}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-primary-600">
                      {formatCurrency(Number(product.price))}
                    </span>
                  )}
                  {product.preparationTime && (
                    <p className="text-xs text-gray-400 mt-1">{product.preparationTime} min</p>
                  )}
                </div>
                <Button size="sm" onClick={() => handleAddItem(product)}>
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhum produto encontrado nesta categoria.
        </div>
      )}
    </div>
  );
}
