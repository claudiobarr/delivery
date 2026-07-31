'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import { MapPin, Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [form, setForm] = useState({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '', label: '' });

  useEffect(() => {
    if (user) api.getAddresses().then(setAddresses);
  }, [user]);

  const openNewAddress = () => {
    setEditingAddress(null);
    setForm({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '', label: '' });
    setShowAddressModal(true);
  };

  const openEditAddress = (addr: any) => {
    setEditingAddress(addr);
    setForm(addr);
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    try {
      if (editingAddress) {
        await api.updateAddress(editingAddress.id, form);
        toast.success('Endereço atualizado!');
      } else {
        await api.createAddress(form);
        toast.success('Endereço adicionado!');
      }
      setShowAddressModal(false);
      const addrs = await api.getAddresses();
      setAddresses(addrs);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Remover endereço?')) return;
    await api.deleteAddress(id);
    setAddresses(addresses.filter((a) => a.id !== id));
    toast.success('Endereço removido');
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Faça login para ver seu perfil</p>
        <Link href="/login"><Button className="mt-4">Entrar</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xl font-bold">
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{user.name || 'Sem nome'}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Telefone:</span> <span>{user.phone || '-'}</span></div>
          <div><span className="text-gray-500">Tipo:</span> <span>{user.role}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><MapPin size={18} /> Endereços</h2>
          <Button size="sm" onClick={openNewAddress}><Plus size={16} className="mr-1" /> Novo</Button>
        </div>
        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum endereço cadastrado</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="flex items-start justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{addr.label || 'Endereço'}</p>
                  <p className="text-sm text-gray-600">{addr.street}, {addr.number} - {addr.neighborhood}</p>
                  <p className="text-sm text-gray-500">{addr.city}, {addr.state}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditAddress(addr)} className="p-1 hover:bg-gray-100 rounded"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteAddress(addr.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} title={editingAddress ? 'Editar Endereço' : 'Novo Endereço'}>
        <div className="space-y-3">
          <input placeholder="Rua" className="w-full rounded-lg border p-2 text-sm" value={form.street} onChange={(e) => setForm({...form, street: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Número" className="rounded-lg border p-2 text-sm" value={form.number} onChange={(e) => setForm({...form, number: e.target.value})} />
            <input placeholder="Complemento" className="rounded-lg border p-2 text-sm" value={form.complement} onChange={(e) => setForm({...form, complement: e.target.value})} />
          </div>
          <input placeholder="Bairro" className="w-full rounded-lg border p-2 text-sm" value={form.neighborhood} onChange={(e) => setForm({...form, neighborhood: e.target.value})} />
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Cidade" className="rounded-lg border p-2 text-sm" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} />
            <input placeholder="Estado" className="rounded-lg border p-2 text-sm" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} />
            <input placeholder="CEP" className="rounded-lg border p-2 text-sm" value={form.zipCode} onChange={(e) => setForm({...form, zipCode: e.target.value})} />
          </div>
          <input placeholder="Apelido (casa, trabalho...)" className="w-full rounded-lg border p-2 text-sm" value={form.label} onChange={(e) => setForm({...form, label: e.target.value})} />
          <Button className="w-full" onClick={handleSaveAddress}>{editingAddress ? 'Atualizar' : 'Salvar'}</Button>
        </div>
      </Modal>
    </div>
  );
}
