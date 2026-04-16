'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { signOutUser } from '@/lib/firebase/auth';
import { clearChat } from '@/lib/firebase/firestore';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Loader } from '@/components/ui/Loader';
import Swal from 'sweetalert2';

export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  async function handleSignOut(): Promise<void> {
    await signOutUser();
    // Clear session cookie
    document.cookie = '__session=; path=/; max-age=0';
    router.push('/login');
  }

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

  // Block access if email is not verified
  if (!user.emailVerified) {
    return (
      <div className="flex h-dvh flex-col items-center justify-start bg-[#1c1c1c] px-4 pt-20 relative overflow-hidden">
        <div className="aurora-bg bg-[#1ebbf4] w-[80vw] h-[80vw] -top-[40vw] -left-[40vw]"></div>
        
        <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
            <div className="mb-8 flex size-24 items-center justify-center rounded-[2.5rem] bg-amber-500/20 ring-1 ring-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
                <svg className="size-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            
            <h2 className="mb-3 text-2xl font-bold text-white tracking-tight">Acceso Restringido</h2>
            <p className="mb-8 text-sm text-white/50 leading-relaxed max-w-xs">
              Tu cuenta de <span className="text-[#1ebbf4] font-semibold">{user.email}</span> aún no está verificada. Por favor, activá el email que te enviamos para habilitar el chat.
            </p>

            <div className="flex w-full flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 cursor-pointer"
              >
                Ya verifiqué, entrar ahora
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
    <div className="flex h-dvh flex-col bg-[#1c1c1c] overflow-hidden">
      {/* Background Aurora */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
         <div className="aurora-bg bg-[#1ebbf4] w-[100vw] h-[100vw] -top-[50vw] -left-[20vw]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3 backdrop-blur-xl md:px-6 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2">
          <div className="relative size-12 shrink-0 pointer-events-none drop-shadow-[0_0_15px_rgba(30,187,244,0.4)]">
            <Image 
              src="/assets/logo.png" 
              alt="Fidooo Logo" 
              fill
              className="object-contain transition-transform duration-700 hover:scale-110"
              priority
            />
          </div>
          <div className="hidden xs:flex flex-col justify-center border-l border-white/10 pl-3">
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white">Fidooo</h1>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-bold mt-0.5">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500 shadow-[0_0_8px_#34d399]"></span>
              </span>
              SISTEMAS ONLINE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
               const result = await Swal.fire({
                 title: '¿Limpiar chat?',
                 text: 'Esta acción borrará toda la conversación actual de forma permanente.',
                 icon: 'warning',
                 showCancelButton: true,
                 background: '#1c1c1c',
                 color: '#fff',
                 confirmButtonColor: '#1ebbf4',
                 cancelButtonColor: '#2a2a2a',
                 confirmButtonText: 'Sí, borrar todo',
                 cancelButtonText: 'Cancelar',
                 customClass: {
                   popup: 'rounded-2xl border border-white/10 backdrop-blur-xl',
                   confirmButton: 'rounded-xl font-bold px-6',
                   cancelButton: 'rounded-xl font-bold px-6'
                 }
               });

               if (result.isConfirmed) {
                 await clearChat(user.uid);
                 Swal.fire({
                   title: 'Chat vaciado',
                   text: 'Se borraron todos los mensajes.',
                   icon: 'success',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 3000,
                   background: '#1c1c1c',
                   color: '#fff'
                 });
               }
            }}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/70 transition-all hover:bg-white/10 hover:text-[#1ebbf4] cursor-pointer"
          >
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva Conversación
          </button>

          <div className="hidden sm:flex items-center gap-3 border-l border-white/10 pl-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-white leading-none">{displayName}</span>
              <span className="text-[10px] text-white/40 font-medium">Usuario Premium</span>
            </div>
            <div className="relative size-9 overflow-hidden rounded-xl border border-[#1ebbf4]/30 shadow-[0_0_15px_rgba(30,187,244,0.2)]">
              {avatarImage ? (
                <Image src={avatarImage} alt={displayName} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1ebbf4] to-[#84d6f6] text-sm font-bold text-[#0a0a0f]">
                  {initials}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => void handleSignOut()}
            aria-label="Cerrar sesión"
            className="group flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5
              text-xs font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] active:scale-95"
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
  );
}
