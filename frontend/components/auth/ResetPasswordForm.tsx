'use client';

import { useState, type FormEvent } from 'react';
import { FirebaseError } from 'firebase/app';
import { resetPassword, getFirebaseErrorMessage } from '@/lib/firebase/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ResetPasswordFormProps {
  onSwitchToLogin: () => void;
}

export function ResetPasswordForm({ onSwitchToLogin }: ResetPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
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

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-green-500/20">
          <svg className="size-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-white">¡Email enviado!</p>
          <p className="mt-1 text-sm text-white/50">
            Revisá tu bandeja de entrada para restablecer tu contraseña.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-white/50">
        Ingresá tu email y te mandamos un link para restablecer tu contraseña.
      </p>

      <Input
        id="reset-email"
        label="Email"
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Button type="submit" fullWidth isLoading={isLoading}>
        Enviar link de recuperación
      </Button>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="text-center text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        ← Volver al inicio de sesión
      </button>
    </form>
  );
}
