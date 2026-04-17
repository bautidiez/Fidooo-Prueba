'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getRedirectResult, auth, setSessionCookie, getFirebaseErrorMessage } from '@/lib/firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import Swal from 'sweetalert2';
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
  // Enganchamos el hook de auth para capturar redirecciones automáticamente
  const { user } = useAuth();
  
  // ESTADO: Maneja la vista activa ('login', 'register' o 'reset')
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  console.log('[LoginPage] v1.12 - Estado:', isProcessingRedirect ? 'Procesando Redirect' : 'Esperando interacción');

  /**
   * MANEJO DE REDIRECCIÓN DE Google (Centralizado):
   * Captura el resultado si venimos de un Redirect de Google y controla el Spinner local.
   */
  useEffect(() => {
    const pending = sessionStorage.getItem('pendingGoogleRedirect');
    if (!pending) return;

    setIsProcessingRedirect(true);

    // SEGURIDAD: Timeout de 8 segundos para evitar spinner infinito si getRedirectResult falla
    const timeout = setTimeout(() => {
      if (sessionStorage.getItem('pendingGoogleRedirect')) {
        console.warn('[LoginPage] Redirect de Google excedió el tiempo de espera. Forzando cierre de spinner.');
        sessionStorage.removeItem('pendingGoogleRedirect');
        setIsProcessingRedirect(false);
      }
    }, 8000);

    getRedirectResult(auth)
      .then(async (result) => {
        clearTimeout(timeout);
        if (result?.user) {
          const token = await result.user.getIdToken();
          setSessionCookie(token);
          sessionStorage.removeItem('pendingGoogleRedirect');
          router.push('/chat');
        } else {
          sessionStorage.removeItem('pendingGoogleRedirect');
          setIsProcessingRedirect(false);
        }
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error('[LoginPage] Error en redirect de Google:', err);
        
        // Manejo específico del Error 400 (Redirect Mismatch)
        if (err.code === 'auth/operation-not-allowed' || err.message?.includes('redirect_uri_mismatch')) {
          Swal.fire({
            title: 'Configuración Requerida',
            html: `Para usar Google en móviles, debés autorizar este dominio en la consola de Google Cloud.<br><br><b>URL a autorizar:</b><br><code>https://${window.location.host}/__/auth/handler</code>`,
            icon: 'info',
            confirmButtonText: 'Entendido'
          });
        }

        sessionStorage.removeItem('pendingGoogleRedirect');
        setIsProcessingRedirect(false);
      });

    return () => clearTimeout(timeout);
  }, [router]);

  /**
   * FALLBACK DE SEGURIDAD: Si useAuth detecta sesión mientras estamos en el spinner,
   * forzamos la entrada al chat aunque getRedirectResult no haya terminado.
   */
  useEffect(() => {
    if (user && isProcessingRedirect) {
      console.log('[LoginPage] Sesión detectada vía Hook. Redirigiendo al chat por fallback.');
      sessionStorage.removeItem('pendingGoogleRedirect');
      router.push('/chat');
    }
  }, [user, isProcessingRedirect, router]);
  
  
  /**
   * MANEJO DE REDIRECCIÓN DE GOOGLE (Móvil):
   * Este efecto corre al cargar la página. Si venimos de un Redirect de Google,
   * Firebase nos dará el resultado aquí.
   */

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
    <main className="relative flex min-h-dvh w-full flex-col items-center justify-start bg-[#1c1c1c] px-4 pt-4 md:pt-6 overflow-y-auto overflow-x-hidden pb-8">
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
              <h2 
                className="mb-4 md:mb-6 text-lg md:text-xl font-semibold text-white tracking-tight cursor-pointer"
                style={{ cursor: 'pointer' }}
                tabIndex={-1}
              >
                {titles[activeTab]}
              </h2>

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
          Powered by ChatGPT • Firebase • Fidooo v1.18
        </p>
      </div>
    </main>
  );
}
