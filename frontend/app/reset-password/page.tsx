'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { confirmPasswordReset, verifyPasswordResetCode, applyActionCode, getAuth, onAuthStateChanged } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { app } from '@/lib/firebase/config';
import { getFirebaseErrorMessage, setSessionCookie } from '@/lib/firebase/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Swal from 'sweetalert2';

function AuthActionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = getAuth(app);
  
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success' | 'verified'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    letter: /[a-zA-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  useEffect(() => {
    if (!oobCode) {
      setStatus('invalid');
      return;
    }

    // Usamos onAuthStateChanged para asegurar que el usuario esté cargado antes de aplicar el código
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (mode === 'verifyEmail') {
        try {
          await applyActionCode(auth, oobCode);
          
          // Si hay un usuario en esta pestaña, forzamos recarga y generamos cookie
          if (user) {
            await user.reload();
            const token = await user.getIdToken(true);
            setSessionCookie(token);
          }

          setStatus('verified');
          Swal.fire({
            title: '¡Email Verificado!',
            text: 'Tu cuenta ha sido activada correctamente. Ya podés entrar al chat.',
            icon: 'success',
            background: '#1c1c1c',
            color: '#fff',
            confirmButtonColor: '#1ebbf4',
          }).then(() => {
            window.location.href = '/chat';
          });
        } catch (err) {
          console.error('Error verifying email:', err);
          setStatus('invalid');
        }
      } else {
        // Modo reset password
        verifyPasswordResetCode(auth, oobCode)
          .then(() => setStatus('valid'))
          .catch((err) => {
            console.error('Invalid or expired code:', err);
            setStatus('invalid');
          });
      }
    });

    return () => unsubscribe();
  }, [oobCode, mode, auth, router]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!oobCode || !isPasswordValid) return;
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
      
      Swal.fire({
        title: '¡Contraseña Cambiada!',
        text: 'Tu contraseña fue actualizada con éxito. Ya podés iniciar sesión.',
        icon: 'success',
        background: '#1c1c1c',
        color: '#fff',
        confirmButtonColor: '#1ebbf4',
      }).then(() => {
        router.push('/login');
      });
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(getFirebaseErrorMessage(err.code));
      } else {
        setError('Ocurrió un error al cambiar la contraseña.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="size-10 border-4 border-white/20 border-t-[#1ebbf4] rounded-full animate-spin" />
        <p className="text-sm font-medium opacity-50 text-center px-4">
          {mode === 'verifyEmail' ? 'Verificando tu cuenta...' : 'Verificando el link de recuperación...'}
        </p>
      </div>
    );
  }

  if (status === 'verified') {
    return (
      <div className="text-center px-4">
        <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-500/50">
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
        <p className="text-sm text-white/50 mb-8 max-w-xs">
          Parece que este enlace ya no es válido. Por favor, solicitá uno nuevo desde la aplicación.
        </p>
        <Button onClick={() => router.push('/login')} variant="ghost" fullWidth>
          Ir al Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="mb-8 flex flex-col items-center gap-4">
          <div className="relative w-48 h-20 pointer-events-none drop-shadow-[0_0_20px_rgba(30,187,244,0.4)]">
            <Image 
              src="/assets/logo.png" 
              alt="Fidooo Engineering Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium tracking-wide text-white/50 uppercase">Nueva Contraseña</p>
          </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-white/5 p-6 md:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 relative overflow-hidden">
        <h2 className="mb-6 text-xl font-semibold text-white tracking-tight">Elegí tu nueva clave</h2>
        
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
              <Input
                label="Nueva Contraseña"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              
              {/* Validation UI */}
              {newPassword.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5 px-1 pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`size-1.5 rounded-full transition-colors ${passwordRequirements.length ? 'bg-green-500' : 'bg-red-500/50'}`} />
                    <p className={`text-[10px] ${passwordRequirements.length ? 'text-green-400' : 'text-white/30'}`}>
                      Al menos 8 caracteres
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`size-1.5 rounded-full transition-colors ${passwordRequirements.uppercase ? 'bg-green-500' : 'bg-red-500/50'}`} />
                    <p className={`text-[10px] ${passwordRequirements.uppercase ? 'text-green-400' : 'text-white/30'}`}>
                      Al menos una mayúscula
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`size-1.5 rounded-full transition-colors ${passwordRequirements.letter ? 'bg-green-500' : 'bg-red-500/50'}`} />
                    <p className={`text-[10px] ${passwordRequirements.letter ? 'text-green-400' : 'text-white/30'}`}>
                      Al menos una letra
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`size-1.5 rounded-full transition-colors ${passwordRequirements.number ? 'bg-green-500' : 'bg-red-500/50'}`} />
                    <p className={`text-[10px] ${passwordRequirements.number ? 'text-green-400' : 'text-white/30'}`}>
                      Al menos un número
                    </p>
                  </div>
                </div>
              )}
          </div>

          <Input
            label="Confirmar Nueva Contraseña"
            type="password"
            placeholder="Repetí tu nueva clave"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPassword && newPassword !== confirmPassword ? 'Las contraseñas no coinciden.' : undefined}
            required
          />

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button type="submit" fullWidth isLoading={isLoading} disabled={!isPasswordValid || newPassword !== confirmPassword}>
            Guardar Contraseña
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-start bg-[#1c1c1c] px-4 pt-16 md:pt-20 overflow-y-auto pb-8">
      {/* Background Aurora */}
      <div className="aurora-bg bg-[#1ebbf4] w-[80vw] h-[80vw] -top-[40vw] -left-[40vw]"></div>
      <div className="aurora-bg bg-[#84d6f6] w-[60vw] h-[60vw] top-[20vw] right-[0vw]" style={{ animationDuration: '25s' }}></div>

      <Suspense fallback={
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="size-10 border-4 border-white/20 border-t-[#1ebbf4] rounded-full animate-spin" />
        </div>
      }>
        <AuthActionContent />
      </Suspense>

      <p className="mt-8 text-center text-[9px] uppercase tracking-widest text-white/30 font-medium">
        Secure Recovery • Fidooo Next.js • Firebase
      </p>
    </main>
  );
}
