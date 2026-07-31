'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Button from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', description: '' });

  const fetchData = async () => {
    setCoupons(await api.getCoupons());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setEditing(null); setForm({ code: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', description: '' }); setShowModal(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ code: c.code, discountType: c.discountType, discountValue: String(c.discountValue), maxUses: c.maxUses ? String(c.maxUses) : '', description: c.description || '' }); setShowModal(true); };

  const handleSave = async () => {
    try {
      const data = { ...form, discountValue: Number(form.discountValue), maxUses: form.maxUses ? Number(form.maxUses) : undefined };
      if (editing) {
        await api.updateCoupon(editing.id, data);
        toast.success('Cupom atualizado!');
      } else {
        await api.createCoupon(data);
        toast.success('Cupom criado!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar cupom?')) return;
    await api.deleteCoupon(id);
    toast.success('Cupom deletado');
    fetchData();
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cupons</h1>
        <Button onClick={openNew}><Plus size={18} className="mr-1" /> Novo Cupom</Button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="text-left p-3">Código</th><th className="text-left p-3">Tipo</th><th className="text-left p-3">Valor</th><th className="text-left p-3">Usos</th><th className="text-left p-3">Ativo</th><th className="text-left p-3">Ações</th></tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{c.code}</td>
                <td className="p-3">{c.discountType === 'PERCENTAGE' ? '%' : 'R$'}</td>
                <td className="p-3">{c.discountValue}</td>
                <td className="p-3">{c.usedCount}/{c.maxUses || '∞'}</td>
                <td className="p-3">{c.isActive ? 'Sim' : 'Não'}</td>
                <td className="p-3 flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Edit2 size={16} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 size={16} className="text-red-500" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Cupom' : 'Novo Cupom'}>
        <div className="space-y-3">
          <input placeholder="Código" className="w-full rounded-lg border p-2 text-sm" value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} />
          <div className="grid grid-cols-2 gap-3">
            <select className="rounded-lg border p-2 text-sm" value={form.discountType} onChange={(e) => setForm({...form, discountType: e.target.value})}>
              <option value="PERCENTAGE">Percentual (%)</option>
              <option value="FIXED">Valor Fixo (R$)</option>
            </select>
            <input placeholder="Valor" type="number" step="0.01" className="rounded-lg border p-2 text-sm" value={form.discountValue} onChange={(e) => setForm({...form, discountValue: e.target.value})} />
          </div>
          <input placeholder="Limite de usos (opcional)" type="number" className="w-full rounded-lg border p-2 text-sm" value={form.maxUses} onChange={(e) => setForm({...form, maxUses: e.target.value})} />
          <textarea placeholder="Descrição" className="w-full rounded-lg border p-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
          <Button className="w-full" onClick={handleSave}>{editing ? 'Atualizar' : 'Criar'}</Button>
        </div>
      </Modal>
    </div>
  );
}
