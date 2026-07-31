'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Button from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', orderIndex: '0' });

  const fetchData = async () => {
    const data = await api.getAdminCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', orderIndex: '0' }); setShowModal(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, description: c.description || '', orderIndex: String(c.orderIndex) }); setShowModal(true); };

  const handleSave = async () => {
    try {
      const data = { ...form, orderIndex: Number(form.orderIndex) };
      if (editing) {
        await api.updateCategory(editing.id, data);
        toast.success('Categoria atualizada!');
      } else {
        await api.createCategory(data);
        toast.success('Categoria criada!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar categoria?')) return;
    await api.deleteCategory(id);
    toast.success('Categoria deletada');
    fetchData();
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={openNew}><Plus size={18} className="mr-1" /> Nova Categoria</Button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="text-left p-3">Nome</th><th className="text-left p-3">Produtos</th><th className="text-left p-3">Ordem</th><th className="text-left p-3">Ações</th></tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c._count?.products || 0}</td>
                <td className="p-3">{c.orderIndex}</td>
                <td className="p-3 flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Edit2 size={16} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 size={16} className="text-red-500" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Categoria' : 'Nova Categoria'}>
        <div className="space-y-3">
          <input placeholder="Nome" className="w-full rounded-lg border p-2 text-sm" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
          <textarea placeholder="Descrição" className="w-full rounded-lg border p-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
          <input placeholder="Ordem" type="number" className="w-full rounded-lg border p-2 text-sm" value={form.orderIndex} onChange={(e) => setForm({...form, orderIndex: e.target.value})} />
          <Button className="w-full" onClick={handleSave}>{editing ? 'Atualizar' : 'Criar'}</Button>
        </div>
      </Modal>
    </div>
  );
}
