'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { signOutUser } from '@/lib/firebase/auth';
import { clearChat } from '@/lib/firebase/firestore';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Loader } from '@/components/ui/Loader';
import Swal from 'sweetalert2';
import { useChatStore } from '@/store/useChatStore';

import { Sidebar } from '@/components/layout/Sidebar';

/**
 * Página principal del Chat.
 * 
 * QUÉ: Componente principal que orquesta el Sidebar y la Ventana de Chat.
 * POR QUÉ: Es la vista protegida central de la aplicación.
 * PROBLEMA QUE RESUELVE: Maneja la verificación de sesión y el estado de verificación de email antes de mostrar el chat.
 */
export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth(); // Hook que monitorea la sesión activa
  const { isSidebarOpen, setSidebarOpen } = useChatStore(); // Estado global del layout

  /**
   * Cierra la sesión del usuario tanto en Firebase como en la persistencia local.
   * POR QUÉ: Firebase no borra cookies automáticamente; debemos hacerlo manualmente 
   *          para que el middleware de Next.js detecte el logout.
   */
  async function handleSignOut(): Promise<void> {
    await signOutUser();
    // Limpieza de cookie de sesión:
    document.cookie = '__session=; path=/; max-age=0';
    router.push('/login');
  }

  // --- PROTECCIÓN VISUAL (CLIENT-SIDE) ---
  // Mientras Firebase recupera la sesión, mostramos un loader premium.
  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#1c1c1c]">
        <Loader size="lg" label="Cargando entorno Fidooo..." />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  /**
   * REQUISITO TÉCNICO: Verificación de email obligatoria.
   * Si el usuario no ha verificado su cuenta, no puede ver el chat.
   */
  if (!user.emailVerified) {
    return (
      <div className="flex h-dvh flex-col items-center justify-start bg-[#1c1c1c] px-4 pt-20 relative overflow-hidden">
        {/* UI de Bloqueo por falta de verificación */}
        <div className="aurora-bg bg-[#1ebbf4] w-[80vw] h-[80vw] -top-[40vw] -left-[40vw]"></div>
        
        <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
            <div className="mb-8 flex size-24 items-center justify-center rounded-[2.5rem] bg-amber-500/20 ring-1 ring-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
                <svg className="size-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            
            <h2 className="mb-3 text-2xl font-bold text-white tracking-tight">Activación de Cuenta</h2>
            <p className="mb-8 text-sm text-white/50 leading-relaxed max-w-xs">
              Tu cuenta de <span className="text-[#1ebbf4] font-semibold">{user.email}</span> ya casi está lista. Si acabas de verificar tu email, ya podés entrar.
            </p>

            <div className="flex w-full flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-2xl bg-gradient-to-r from-[#1ebbf4] to-[#84d6f6] px-6 py-3 text-sm font-bold text-[#0a0a0f] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(30,187,244,0.3)]"
              >
                Ir a Fidooo Chat
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full rounded-2xl px-6 py-3 text-sm font-bold text-white/40 transition-all hover:text-white cursor-pointer"
              >
                Volver al Login / Salir
              </button>
            </div>
        </div>
      </div>
    );
  }

  const displayName = user.displayName ?? user.email?.split('@')[0] ?? 'Usuario';
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarImage = user.photoURL;

  return (
    <div className="flex h-dvh bg-[#1c1c1c] overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden pointer-events-auto cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      <div className={`flex flex-1 flex-col relative overflow-hidden transition-all duration-500 ease-in-out ${
        isSidebarOpen ? 'lg:pl-72' : 'lg:pl-0'
      }`}>
        {/* Background Aurora */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
           <div className="aurora-bg bg-[#1ebbf4] w-[100vw] h-[100vw] -top-[50vw] -left-[20vw]"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-2 backdrop-blur-xl md:px-6 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-500">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-4 group transition-all cursor-pointer p-1.5 rounded-xl hover:bg-white/5"
                title="Abrir menú"
              >
                <div className="flex flex-col justify-center text-left">
                  <svg className="size-6 text-white group-hover:text-[#1ebbf4] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </div>
                <div className="relative size-14 shrink-0 drop-shadow-[0_0_15px_rgba(30,187,244,0.4)] transition-transform group-hover:scale-110">
                  <Image 
                    src="/assets/logo.png" 
                    alt="Fidooo Logo" 
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </button>
            )}
            
            {isSidebarOpen && (
              <div className="flex items-center gap-4">
                <div className="hidden xs:flex flex-col justify-center border-l border-white/10 pl-4 order-2">
                  <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white">Fidooo Engineering</h1>
                </div>
                <div className="relative size-14 shrink-0 drop-shadow-[0_0_15px_rgba(30,187,244,0.4)] order-1">
                   <Image src="/assets/logo.png" alt="Logo" fill className="object-contain" priority />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 border-l border-white/10 pl-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-white leading-none">{displayName}</span>
                <span className="text-[9px] text-white/40 font-medium tracking-wide uppercase mt-0.5">Usuario Premium</span>
              </div>
              <div className="relative size-8 overflow-hidden rounded-xl border border-[#1ebbf4]/30 shadow-[0_0_15px_rgba(30,187,244,0.2)]">
                {avatarImage ? (
                  <Image src={avatarImage} alt={displayName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1ebbf4] to-[#84d6f6] text-xs font-bold text-[#0a0a0f]">
                    {initials}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => void handleSignOut()}
              aria-label="Cerrar sesión"
              className="group flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5
                text-[11px] font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] active:scale-95 cursor-pointer"
            >
              <svg className="size-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Salir
            </button>
          </div>
        </header>

        {/* Chat area */}
        <div className="relative z-10 flex-1 overflow-hidden">
          <ChatWindow userId={user.uid} />
        </div>
      </div>
    </div>
  );
}
