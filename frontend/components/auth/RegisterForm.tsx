'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { signUp, getFirebaseErrorMessage, setSessionCookie } from '@/lib/firebase/auth';
import Swal from 'sweetalert2';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  /**
   * REQUISITOS DE CONTRASEÑA: 
   * Objeto reactivo que verifica las reglas de seguridad en tiempo real 
   * mientras el usuario escribe. Facilita el feedback visual inmediato (UX).
   */
  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    letter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  /** Indica si la contraseña actual es apta para el registro */
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  async function handleSendVerification(user: any) {
    try {
      const { sendEmailVerification } = await import('@/lib/firebase/auth');
      await sendEmailVerification(user);
      setVerificationSent(true);
      setCountdown(60);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Error sending verification:', err);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('La contraseña no cumple con los requisitos.');
      return;
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      const credential = await signUp(email, password);
      // Send verification email
      await handleSendVerification(credential.user);
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(getFirebaseErrorMessage(err.code));
      } else {
        setError('Ocurrió un error inesperado.');
      }
      setIsLoading(false);
    }
  }

  if (verificationSent) {
    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div className="relative">
          <div className="flex size-20 items-center justify-center rounded-[2rem] bg-emerald-500/20 ring-1 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-pulse">
            <svg className="size-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="absolute -right-1 -top-1 size-5 rounded-full bg-emerald-500 border-4 border-[#1c1c1c] flex items-center justify-center">
            <svg className="size-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">¡Casi listo, {email.split('@')[0]}!</h2>
          <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
            Te enviamos un mensaje de activación a <span className="text-emerald-400 font-medium">{email}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-xs text-white/40 leading-relaxed italic">
            "Revisá tu carpeta de SPAM si no lo ves en unos minutos."
          </div>

          <Button 
            type="button" 
            variant="ghost" 
            fullWidth 
            disabled={countdown > 0}
            size="small"
            onClick={async () => {
              const { auth } = await import('@/lib/firebase/auth');
              if (auth.currentUser) await handleSendVerification(auth.currentUser);
            }}
          >
            {countdown > 0 ? `Reenviar en ${countdown}s` : '¿No llegó? Reenviar email'}
          </Button>

          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors cursor-pointer"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        id="register-email"
        label="Email"
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <div>
        <Input
          id="register-password"
          label="Contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        
        {/* Real-time Validation UI */}
        {password.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5 px-1">
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
        id="register-confirm"
        label="Confirmar contraseña"
        type="password"
        placeholder="Repetí tu contraseña"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        error={confirm && password !== confirm ? 'Las contraseñas no coinciden.' : undefined}
        required
      />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Button type="submit" fullWidth isLoading={isLoading} disabled={!isPasswordValid}>
        Crear cuenta
      </Button>
      
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="shrink-0 px-3 text-xs text-white/30">O continuá con</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>

      <Button 
        type="button" 
        variant="ghost" 
        fullWidth 
        isLoading={isLoading}
        onClick={async () => {
          setIsLoading(true);
          setError(null);
          try {
            const { signInWithGoogle } = await import('@/lib/firebase/auth');
            const credential = await signInWithGoogle();

            // Si no hay credential, es porque se inició un Redirect (común en móviles)
            if (!credential) return;

            const token = await credential.user.getIdToken();
            setSessionCookie(token);
            
            // Verificación para diagnóstico en móviles
            const isCookieSet = document.cookie.includes('__session=');
            if (!isCookieSet) {
              await Swal.fire({
                icon: 'error',
                title: 'Error de Sesión',
                text: 'Tu navegador rechazó la sesión tras la redirección de Google. Verificá los permisos de cookies.',
                background: '#1c1c1c',
                color: '#fff',
                confirmButtonColor: '#1ebbf4'
              });
              setIsLoading(false);
              return;
            }

            // Pequeño delay de seguridad
            await new Promise(r => setTimeout(r, 200));
            router.push('/chat');
          } catch (err: any) {
            if (err instanceof FirebaseError) {
              setError(getFirebaseErrorMessage(err.code));
            } else {
              setError('Ocurrió un error al iniciar con Google.');
            }
          } finally {
             setIsLoading(false);
          }
        }}
      >
        <svg className="mr-2 size-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google
      </Button>

      <p className="text-center text-xs text-white/40 pt-1">
        ¿Ya tenés cuenta?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-violet-400 hover:text-violet-300 font-medium transition-colors cursor-pointer"
        >
          Iniciá sesión
        </button>
      </p>
    </form>
  );
}
