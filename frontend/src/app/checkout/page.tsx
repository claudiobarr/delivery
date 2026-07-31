'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CreditCard, QrCode, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { cart, total } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD'>('PIX');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '', label: ''
  });
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      api.getAddresses().then(setAddresses).catch(() => {});
    }
  }, [user]);

  const handleCreateAddress = async () => {
    try {
      const addr = await api.createAddress(newAddress);
      setAddresses([...addresses, addr]);
      setSelectedAddress(addr.id);
      setShowNewAddress(false);
      toast.success('Endereço adicionado!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const order = await api.createOrder({
        addressId: selectedAddress || undefined,
        paymentMethod: paymentMethod === 'PIX' ? 'MERCADO_PAGO' : paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'DEBIT_CARD',
        notes: notes || undefined,
      });

      if (paymentMethod === 'PIX') {
        const pix = await api.createPixPayment(order.id);
        setPixData(pix);
        setShowPixModal(true);
      } else {
        toast.success('Pedido realizado com sucesso!');
        router.push('/pedidos');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  const discount = cart?.coupon
    ? cart.coupon.discountType === 'PERCENTAGE'
      ? (total * Number(cart.coupon.discountValue)) / 100
      : Number(cart.coupon.discountValue)
    : 0;

  if (!cart?.items?.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Seu carrinho está vazio</p>
        <Button onClick={() => router.push('/cardapio')} className="mt-4">Ver Cardápio</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <MapPin size={20} /> Endereço de Entrega
          </h2>
          {addresses.length > 0 ? (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <label key={addr.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} />
                  <div>
                    <p className="font-medium">{addr.label || addr.street}</p>
                    <p className="text-sm text-gray-500">{addr.street}, {addr.number} - {addr.neighborhood}, {addr.city}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-3">Nenhum endereço cadastrado</p>
          )}
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNewAddress(true)}>
            + Novo Endereço
          </Button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CreditCard size={20} /> Forma de Pagamento
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'PIX', label: 'PIX', icon: QrCode },
              { value: 'CREDIT_CARD', label: 'Cartão de Crédito', icon: CreditCard },
              { value: 'DEBIT_CARD', label: 'Cartão de Débito', icon: CreditCard },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPaymentMethod(opt.value as any)}
                className={`p-4 rounded-xl border-2 text-center transition-colors ${
                  paymentMethod === opt.value ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <opt.icon size={24} className="mx-auto mb-2" />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold text-lg mb-2">Observações</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alguma observação para o pedido?"
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
          />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(total)}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Desconto</span><span>-{formatCurrency(discount)}</span></div>}
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span className="text-primary-600">{formatCurrency(total - discount)}</span>
          </div>
        </div>

        <Button size="lg" className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Processando...' : 'Confirmar Pedido'}
        </Button>
      </div>

      <Modal isOpen={showNewAddress} onClose={() => setShowNewAddress(false)} title="Novo Endereço">
        <div className="space-y-3">
          <input placeholder="Rua" className="w-full rounded-lg border p-2 text-sm" value={newAddress.street} onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Número" className="rounded-lg border p-2 text-sm" value={newAddress.number} onChange={(e) => setNewAddress({...newAddress, number: e.target.value})} />
            <input placeholder="Complemento" className="rounded-lg border p-2 text-sm" value={newAddress.complement} onChange={(e) => setNewAddress({...newAddress, complement: e.target.value})} />
          </div>
          <input placeholder="Bairro" className="w-full rounded-lg border p-2 text-sm" value={newAddress.neighborhood} onChange={(e) => setNewAddress({...newAddress, neighborhood: e.target.value})} />
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Cidade" className="rounded-lg border p-2 text-sm" value={newAddress.city} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} />
            <input placeholder="Estado" className="rounded-lg border p-2 text-sm" value={newAddress.state} onChange={(e) => setNewAddress({...newAddress, state: e.target.value})} />
            <input placeholder="CEP" className="rounded-lg border p-2 text-sm" value={newAddress.zipCode} onChange={(e) => setNewAddress({...newAddress, zipCode: e.target.value})} />
          </div>
          <input placeholder="Apelido (casa, trabalho...)" className="w-full rounded-lg border p-2 text-sm" value={newAddress.label} onChange={(e) => setNewAddress({...newAddress, label: e.target.value})} />
          <Button className="w-full" onClick={handleCreateAddress}>Salvar Endereço</Button>
        </div>
      </Modal>

      <Modal isOpen={showPixModal} onClose={() => { setShowPixModal(false); router.push('/pedidos'); }} title="Pagamento PIX" size="md">
        {pixData && (
          <div className="text-center">
            {pixData.qrCodeBase64 && (
              <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="mx-auto mb-4 w-64 h-64" />
            )}
            {pixData.qrCode && (
              <div className="bg-gray-100 rounded-lg p-3 mb-4">
                <p className="text-xs font-mono break-all">{pixData.qrCode}</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => { navigator.clipboard.writeText(pixData.qrCode); toast.success('Código copiado!'); }}>
                  Copiar Código
                </Button>
              </div>
            )}
            <p className="text-sm text-gray-600">Escaneie o QR Code ou copie o código para pagar</p>
            <Button className="mt-4" onClick={() => { setShowPixModal(false); router.push('/pedidos'); }}>
              Acompanhar Pedido
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
