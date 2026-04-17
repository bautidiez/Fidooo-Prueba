'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { signIn, getFirebaseErrorMessage, setSessionCookie } from '@/lib/firebase/auth';
import Swal from 'sweetalert2';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
}

/**
 * Componente de Formulario de Inicio de Sesión.
 * 
 * QUÉ: Maneja la entrada de credenciales y la autenticación con Firebase.
 * POR QUÉ: Es la puerta de entrada principal para usuarios registrados.
 * PROBLEMA QUE RESUELVE: Valida identidad y genera la cookie de sesión para el middleware.
 */
export function LoginForm({ onSwitchToRegister, onSwitchToReset }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const credential = await signIn(email, password);
      // Pequeño delay de seguridad para asegurar que el navegador escriba la cookie
      await new Promise(r => setTimeout(r, 200));
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
        id="login-email"
        label="Email"
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <Input
        id="login-password"
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Button type="submit" fullWidth isLoading={isLoading}>
        Iniciar sesión
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
            
            // Pequeño delay de seguridad
            await new Promise(r => setTimeout(r, 150));
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

      <div className="flex flex-col items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onSwitchToReset}
          className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
        >
          ¿Olvidaste tu contraseña?
        </button>
        <p className="text-xs text-white/40">
          ¿No tenés cuenta?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors cursor-pointer"
          >
            Registrate
          </button>
        </p>
      </div>
    </form>
  );
}
