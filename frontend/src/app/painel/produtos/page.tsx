'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import { GalleryButton } from '@/components/uploads/GalleryPicker';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function PartnerProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', price: '', categoryId: '', description: '', imageUrl: '', discountedPrice: '', preparationTime: '15', ingredients: '' });

  const fetchData = async () => {
    try {
      const [p, c] = await Promise.all([api.getPartnerProducts(), api.getCategories()]);
      setProducts(p.products);
      setCategories(c);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', price: '', categoryId: categories[0]?.id || '', description: '', imageUrl: '', discountedPrice: '', preparationTime: '15', ingredients: '' }); setShowModal(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, price: String(p.price), categoryId: p.categoryId, description: p.description || '', imageUrl: p.imageUrl || '', discountedPrice: p.discountedPrice ? String(p.discountedPrice) : '', preparationTime: String(p.preparationTime || 15), ingredients: p.ingredients || '' }); setShowModal(true); };

  const handleSave = async () => {
    try {
      const data = { ...form, price: Number(form.price), discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : undefined, preparationTime: Number(form.preparationTime) };
      if (editing) {
        await api.updatePartnerProduct(editing.id, data);
        toast.success('Produto atualizado!');
      } else {
        await api.createPartnerProduct(data);
        toast.success('Produto criado!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar produto?')) return;
    await api.deletePartnerProduct(id);
    toast.success('Produto deletado');
    fetchData();
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meus Produtos</h1>
        <Button onClick={openNew}><Plus size={18} className="mr-1" /> Novo Produto</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr><th className="text-left p-3">Nome</th><th className="text-left p-3">Categoria</th><th className="text-left p-3">Preço</th><th className="text-left p-3">Ativo</th><th className="text-left p-3">Ações</th></tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">{p.category?.name}</td>
                  <td className="p-3">{formatCurrency(Number(p.price))}</td>
                  <td className="p-3">{p.isActive ? 'Sim' : 'Não'}</td>
                  <td className="p-3 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit2 size={16} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 size={16} className="text-red-500" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Produto' : 'Novo Produto'} size="lg">
        <div className="space-y-3">
          <input placeholder="Nome" className="w-full rounded-lg border p-2 text-sm" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Preço" type="number" step="0.01" className="rounded-lg border p-2 text-sm" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} />
            <input placeholder="Preço Promocional" type="number" step="0.01" className="rounded-lg border p-2 text-sm" value={form.discountedPrice} onChange={(e) => setForm({...form, discountedPrice: e.target.value})} />
          </div>
          <select className="w-full rounded-lg border p-2 text-sm" value={form.categoryId} onChange={(e) => setForm({...form, categoryId: e.target.value})}>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <textarea placeholder="Descrição" className="w-full rounded-lg border p-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <input placeholder="URL da Imagem" className="w-full rounded-lg border p-2 text-sm" value={form.imageUrl} onChange={(e) => setForm({...form, imageUrl: e.target.value})} />
            </div>
            <GalleryButton onSelect={(url) => setForm({...form, imageUrl: url})} />
          </div>
          {form.imageUrl && (
            <div className="rounded-lg overflow-hidden border h-32">
              <img src={form.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          <input placeholder="Ingredientes" className="w-full rounded-lg border p-2 text-sm" value={form.ingredients} onChange={(e) => setForm({...form, ingredients: e.target.value})} />
          <div className="flex items-center gap-3">
            <input placeholder="Tempo de Preparo (min)" type="number" className="rounded-lg border p-2 text-sm w-40" value={form.preparationTime} onChange={(e) => setForm({...form, preparationTime: e.target.value})} />
          </div>
          <Button className="w-full" onClick={handleSave}>{editing ? 'Atualizar' : 'Criar'}</Button>
        </div>
      </Modal>
    </div>
  );
}
