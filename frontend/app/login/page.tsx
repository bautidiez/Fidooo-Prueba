'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getRedirectResult, auth } from '@/lib/firebase/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

type AuthTab = 'login' | 'register' | 'reset';

/**
 * Página de Autenticación (Login, Registro, Recuperación).
 * 
 * QUÉ: Punto de entrada único para la gestión de acceso de usuarios.
 * POR QUÉ: Centraliza la UI de auth en una sola ruta usando subcomponentes para evitar recargas.
 * PROBLEMA QUE RESUELVE: Ofrece una experiencia fluida (SPA) para que el usuario gestione su cuenta.
 */
export default function LoginPage() {
  const router = useRouter();
  // ESTADO: Maneja la vista activa ('login', 'register' o 'reset')
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);

  /**
   * MANEJO DE REDIRECCIÓN DE GOOGLE (Móvil):
   * Este efecto corre al cargar la página. Si venimos de un Redirect de Google,
   * Firebase nos dará el resultado aquí.
   */
  useEffect(() => {
    async function checkRedirect() {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setIsProcessingRedirect(true);
          const token = await result.user.getIdToken();
          // Sincronizar sesión
          document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Strict`;
          router.push('/chat');
        }
      } catch (err) {
        console.error('Error al procesar el resultado de redirección:', err);
      } finally {
        setIsProcessingRedirect(false);
      }
    }
    checkRedirect();
  }, [router]);

  const titles: Record<AuthTab, string> = {
    login: 'Bienvenido de vuelta',
    register: 'Creá tu cuenta',
    reset: 'Recuperá tu contraseña',
  };

  const subtitles: Record<AuthTab, string> = {
    login: 'Iniciá sesión para conversar con IA',
    register: 'Comenzá a chatear con IA en segundos',
    reset: 'Te enviamos el link a tu email',
  };

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-start bg-[#1c1c1c] px-4 pt-4 md:pt-6 overflow-y-auto pb-8">
      {/* Background Aurora */}
      <div className="aurora-bg bg-[#1ebbf4] w-[80vw] h-[80vw] -top-[40vw] -left-[40vw]"></div>
      <div className="aurora-bg bg-[#84d6f6] w-[60vw] h-[60vw] top-[20vw] right-[0vw]" style={{ animationDuration: '25s' }}></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-2 flex flex-col items-center gap-2">
          <div className="relative w-40 h-16 md:w-72 md:h-32 pointer-events-none drop-shadow-[0_0_20px_rgba(30,187,244,0.4)]">
            <Image 
              src="/assets/logo.png" 
              alt="Fidooo Engineering Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center">
            <p className="text-[10px] md:text-sm font-medium tracking-wide text-white/50">{subtitles[activeTab]}</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/5 bg-white/5 p-5 md:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 relative overflow-hidden group min-h-[400px] flex flex-col justify-center">
          {isProcessingRedirect ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="size-12 rounded-full border-4 border-[#1ebbf4]/20 border-t-[#1ebbf4] animate-spin"></div>
              <p className="text-sm text-white/50 font-medium">Finalizando sesión...</p>
            </div>
          ) : (
            <>
              {/* Subtle inner top glow */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#1ebbf4]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              
              {/* Tab Title */}
              <h2 className="mb-4 md:mb-6 text-lg md:text-xl font-semibold text-white tracking-tight">{titles[activeTab]}</h2>

              {/* Forms */}
              {activeTab === 'login' && (
                <LoginForm
                  onSwitchToRegister={() => setActiveTab('register')}
                  onSwitchToReset={() => setActiveTab('reset')}
                />
              )}
              {activeTab === 'register' && (
                <RegisterForm onSwitchToLogin={() => setActiveTab('login')} />
              )}
              {activeTab === 'reset' && (
                <ResetPasswordForm onSwitchToLogin={() => setActiveTab('login')} />
              )}
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[9px] uppercase tracking-widest text-white/30 font-medium">
          Powered by ChatGPT • Firebase • Fidooo Next.js
        </p>
      </div>
    </main>
  );
}
