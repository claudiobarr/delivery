'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Store, TrendingUp, Users, Smartphone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ParceiroPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    message: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        name: form.ownerName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        isPartner: true,
        storeName: form.restaurantName,
        storeDescription: form.message,
      });
      toast.success('Cadastro realizado com sucesso!');
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cadastro realizado com sucesso!</h1>
          <p className="text-gray-600 mb-6">
            Seu cadastro como parceiro foi enviado para aprovação. Você receberá um email quando for aprovado.
          </p>
          <Link href="/painel">
            <Button>Ir para meu Painel</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Store size={48} className="mx-auto mb-4" />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Seja um Parceiro DeliveryApp</h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto">
            Cadastre seu restaurante e aumente suas vendas com a maior plataforma de delivery da região
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: TrendingUp, title: 'Aumente suas Vendas', desc: ' Alcance milhares de clientes diariamente' },
            { icon: Users, title: 'Mais Clientes', desc: 'Clientes novos e recorrentes todos os dias' },
            { icon: Smartphone, title: 'Gestão Simples', desc: 'Gerencie seus produtos e pedidos pelo painel' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <item.icon className="text-primary-600" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastre seu Restaurante</h2>
          <p className="text-gray-600 mb-8">Crie sua conta e comece a vender hoje mesmo</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome do Restaurante"
              placeholder="Ex: Hamburgueria do João"
              value={form.restaurantName}
              onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
              required
            />
            <Input
              label="Nome do Responsável"
              placeholder="Seu nome completo"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label="Telefone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sobre o restaurante (opcional)</label>
              <textarea
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={4}
                placeholder="Conte um pouco sobre seu restaurante..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Criar Conta de Parceiro'}
            </Button>
            <p className="text-center text-sm text-gray-500">
              Já tem conta?{' '}
              <Link href="/login" className="text-primary-600 font-medium hover:underline">Faça login</Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
