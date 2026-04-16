'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { signUp, getFirebaseErrorMessage } from '@/lib/firebase/auth';
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const credential = await signUp(email, password);
      const token = await credential.user.getIdToken();
      document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Strict`;
      router.push('/chat');
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(getFirebaseErrorMessage(err.code));
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
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
      <Input
        id="register-password"
        label="Contraseña"
        type="password"
        placeholder="Mínimo 6 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        required
      />
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

      <Button type="submit" fullWidth isLoading={isLoading}>
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
            const token = await credential.user.getIdToken();
            document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Strict`;
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
