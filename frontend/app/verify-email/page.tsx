'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { applyActionCode, getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import Swal from 'sweetalert2';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = getAuth(app);
  
  const oobCode = searchParams.get('oobCode');
  const [status, setStatus] = useState<'loading' | 'success' | 'invalid'>('loading');

  useEffect(() => {
    if (!oobCode) {
      setStatus('invalid');
      return;
    }

    applyActionCode(auth, oobCode)
      .then(() => {
        setStatus('success');
        Swal.fire({
          title: '¡Email Verificado!',
          text: 'Tu cuenta ha sido activada correctamente. Ya podés entrar al chat.',
          icon: 'success',
          background: '#1c1c1c',
          color: '#fff',
          confirmButtonColor: '#1ebbf4',
        }).then(() => {
          router.push('/chat');
        });
      })
      .catch((err) => {
        console.error('Error verifying email:', err);
        setStatus('invalid');
      });
  }, [oobCode, auth, router]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="size-10 border-4 border-white/20 border-t-[#1ebbf4] rounded-full animate-spin" />
        <p className="text-sm font-medium opacity-50 text-center px-4">Verificando tu cuenta...</p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="text-center px-4">
        <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-red-500/20 ring-1 ring-red-500/50">
                <svg className="size-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Link inválido o expirado</h2>
        <p className="text-sm text-white/50 mb-8 max-w-xs mx-auto">
          Parece que este enlace de activación ya no es válido o ya fue utilizado.
        </p>
        <Button onClick={() => router.push('/login')} variant="ghost" fullWidth>
          Ir al Login
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center px-4">
      <div className="mb-6 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <svg className="size-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
          </div>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">¡Cuenta Verificada!</h2>
      <p className="text-sm text-white/50 mb-8 max-w-xs mx-auto">
        Tu email ha sido confirmado con éxito. Ahora ya tenés acceso completo a Fiboo.
      </p>
      <Button onClick={() => router.push('/chat')} fullWidth>
        Entrar al Chat
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-[#1c1c1c] px-4 overflow-hidden">
      {/* Background Aurora */}
      <div className="aurora-bg bg-[#1ebbf4] w-[100vw] h-[100vw] -top-[50vw] -left-[20vw]"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4">
            <div className="relative w-48 h-20 pointer-events-none drop-shadow-[0_0_20px_rgba(30,187,244,0.4)]">
              <Image 
                src="/assets/logo.png" 
                alt="Fidooo Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>
        </div>

        <Suspense fallback={null}>
          <VerifyEmailContent />
        </Suspense>
      </div>

      <p className="absolute bottom-8 left-0 right-0 text-center text-[9px] uppercase tracking-widest text-white/30 font-medium">
        Account Activation • Fidooo Engineering
      </p>
    </main>
  );
}
