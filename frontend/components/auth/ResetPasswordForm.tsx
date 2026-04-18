'use client';

import { useState, type FormEvent } from 'react';
import { FirebaseError } from 'firebase/app';
import { resetPassword, getFirebaseErrorMessage, checkEmailExists } from '@/lib/firebase/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ResetPasswordFormProps {
  onSwitchToLogin: () => void;
}

/**
 * Componente de Recuperación de Contraseña.
 * 
 * QUÉ: Permite solicitar un link de reseteo de cuenta a través de email.
 * POR QUÉ: Ofrece una vía de recuperación segura para el usuario.
 * PROBLEMA QUE RESUELVE: Reduce la pérdida de cuentas y valida la existencia del usuario antes de enviar.
 */
export function ResetPasswordForm({ onSwitchToLogin }: ResetPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Timer logic for resend
  const isResendDisabled = countdown > 0;

  async function handleSendEmail(isResend: boolean = false): Promise<void> {
    setError(null);
    setIsLoading(true);

    try {
      // Verificamos si el email existe antes de intentar resetear
      const exists = await checkEmailExists(email);
      
      if (!exists) {
        setError('Este email no está registrado.');
        setIsLoading(false);
        return;
      }

      await resetPassword(email);
      setSuccess(true);
      setCountdown(30);
      
      // Start countdown
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
      if (err instanceof FirebaseError) {
        setError(getFirebaseErrorMessage(err.code));
      } else {
        setError(err?.message || 'Ocurrió un error inesperado. Revisá tu conexión.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    await handleSendEmail();
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
          <p className="mt-3 text-[11px] text-white/30 italic">
            "No olvides revisar tu carpeta de Spam si no lo recibís en unos minutos."
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full mt-2">
          <Button 
            type="button" 
            variant="ghost" 
            fullWidth 
            disabled={isResendDisabled}
            onClick={() => handleSendEmail(true)}
            size="small"
            className="text-xs"
          >
            {isResendDisabled ? `Reenviar en ${countdown}s` : '¿No llegó? Reenviar email'}
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
        className="text-center text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
      >
        ← Volver al inicio de sesión
      </button>
    </form>
  );
}
