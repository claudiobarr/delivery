'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Button from '@/components/ui/button';
import { CreditCard, Link, Unlink, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PartnerContaPage() {
  const [mpLinked, setMpLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const searchParams = useSearchParams();

  const checkStatus = async () => {
    try {
      const status = await api.getPartnerMpStatus();
      setMpLinked(status.linked);
    } catch {
      setMpLinked(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setLinking(true);
      api.linkPartnerMpAccount(code)
        .then(() => {
          toast.success('Conta Mercado Pago vinculada com sucesso!');
          setMpLinked(true);
        })
        .catch((err) => toast.error(err.message || 'Erro ao vincular conta'))
        .finally(() => setLinking(false));
    }
  }, [searchParams]);

  const handleLink = async () => {
    try {
      const { url } = await api.getPartnerMpAuthUrl();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações da Conta</h1>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-start gap-4">
            <div className="bg-primary-100 p-3 rounded-lg">
              <CreditCard size={24} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-1">Mercado Pago</h2>
              <p className="text-sm text-gray-600 mb-4">
                Vincule sua conta do Mercado Pago para receber os pagamentos das vendas diretamente na sua conta.
                As vendas serão processadas com split automático, onde a taxa da plataforma é descontada e o restante
                cai direto na sua conta Mercado Pago.
              </p>

              {linking ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 size={16} className="animate-spin" />
                  Vinculando conta...
                </div>
              ) : mpLinked ? (
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-500" />
                  <span className="text-sm text-green-700 font-medium">Conta vinculada com sucesso</span>
                </div>
              ) : (
                <Button onClick={handleLink}>
                  <Link size={16} className="mr-1" /> Vincular Conta Mercado Pago
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold text-lg mb-2">Como funciona</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="font-bold text-primary-600">1.</span>
              <span>Vincule sua conta Mercado Pago clicando no botão acima</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary-600">2.</span>
              <span>Quando um cliente fizer um pedido, o pagamento é processado com split automático</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary-600">3.</span>
              <span>O valor da venda (menos a taxa da plataforma) cai direto na sua conta Mercado Pago</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-primary-600">4.</span>
              <span>A taxa de comissão da plataforma é de {10}% sobre o valor total do pedido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
