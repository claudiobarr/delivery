'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { toast } from 'sonner';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const { login, loginWithGoogle, loginWithBiometry } = useAuth();
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !googleBtnRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            await loginWithGoogle(response.credential);
            toast.success('Login realizado com Google!');
            router.push('/cardapio');
          } catch (err: any) {
            toast.error(err.message || 'Erro ao fazer login com Google');
          }
        },
      });
      window.google?.accounts.id.renderButton(googleBtnRef.current!, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'continue_with',
        size: 'large',
        width: 400,
      });
    };
    document.head.appendChild(script);
  }, []);

  const handleBiometricLogin = async () => {
    setBioLoading(true);
    try {
      await loginWithBiometry();
      toast.success('Login com biometria realizado!');
      router.push('/cardapio');
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        toast.error('Autenticação biométrica cancelada');
      } else if (err?.message?.includes('Not registered') || err?.message?.includes('Challenge')) {
        toast.error('Nenhuma biometria cadastrada. Entre com senha e cadastre no perfil.');
      } else {
        toast.error(err.message || 'Erro no login por biometria');
      }
    } finally {
      setBioLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      router.push('/cardapio');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Entrar</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">ou continue com</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button variant="outline" onClick={handleBiometricLogin} disabled={bioLoading} className="w-full">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 11c0 2-1.5 3-3 3s-3-1-3-3 1.5-3 3-3 3 1 3 3z"/><path d="M6 18c-1.5-1.5-2-3.5-2-5.5C4 8.5 7.5 5 12 5s8 3.5 8 7.5c0 2-.5 4-2 5.5"/><path d="M9 20c1.5 1 3.5 1.5 5.5 1.5"/></svg>
            {bioLoading ? 'Autenticando...' : 'Entrar com biometria / Face ID'}
          </Button>
          <div ref={googleBtnRef} className="flex justify-center" />
          <Button variant="outline" onClick={() => toast.error('Apple ID configuracão pendente')} className="w-full">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Apple
          </Button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-primary-600 font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
