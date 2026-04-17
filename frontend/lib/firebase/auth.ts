/**
 * Servicios de Autenticación de Firebase (Lado Cliente).
 * 
 * QUÉ: Centraliza la lógica de login, registro, reseteo de clave y Google Auth.
 * POR QUÉ: Desacopla la complejidad del SDK de Firebase de los componentes de la interfaz.
 * PROBLEMA QUE RESUELVE: Facilita la gestión de errores y la validación de usuarios en toda la app.
 */
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type UserCredential,
  type Auth,
} from 'firebase/auth';
import { app } from './config';

const auth: Auth = getAuth(app);

export { auth };

export const FIREBASE_AUTH_ERRORS: Record<string, string> = {
  'auth/user-not-found': 'Este email no está registrado.',
  'auth/wrong-password': 'Contraseña incorrecta. Intentá de nuevo.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/email-already-in-use': 'Este email ya está registrado.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El email no tiene un formato válido.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá un momento e intentá de nuevo.',
  'auth/network-request-failed': 'Error de red. Verificá tu conexión a internet.',
};

export function getFirebaseErrorMessage(code: string): string {
  return FIREBASE_AUTH_ERRORS[code] ?? `Error: ${code}`;
}

export async function signIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutUser(): Promise<void> {
  return signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

export async function checkEmailExists(email: string): Promise<boolean> {
  let backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '').trim().replace(/\/+$/, '');
  
  if (!backendUrl) {
    console.error('CRITICAL: NEXT_PUBLIC_BACKEND_URL is not defined in environment variables.');
    return true; 
  }

  // Aseguramos protocolo https:// si no lo tiene
  if (!backendUrl.startsWith('http')) {
    backendUrl = `https://${backendUrl}`;
  }

  try {
    const targetUrl = `${backendUrl}/auth/check-email`;
    console.log(`[Auth] Checking email existence at: ${targetUrl}`);
    
    // Si backendUrl es localhost, y estamos en móvil, esto fallará. 
    // Capturamos el error de red específicamente para avisar en consola.
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      console.warn(`[Auth] Backend responded with status: ${response.status}`);
      return true; 
    }

    const data = await response.json();
    return data.registered === true;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('[Auth] Network error: No se pudo conectar al backend. ¿Está bien configurada la IP en .env?', error);
    } else {
      console.error('[Auth] Error checking email:', error);
    }
    return true; 
  }
}

/**
 * Inicia sesión con Google.
 * Detecta si el usuario está en móvil para usar 'Redirect' (más robusto en celulares)
 * o 'Popup' (mejor UX en escritorio).
 */
export async function signInWithGoogle(): Promise<UserCredential | void> {
  const provider = new GoogleAuthProvider();
  
  // Detección básica de móvil para decidir el flujo de Auth
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // En móviles, redirigimos para evitar el bloqueo de popups
    return signInWithRedirect(auth, provider);
  } else {
    // en escritorio, usamos el popup para no recargar la página del usuario
    return signInWithPopup(auth, provider);
  }
}

/**
 * Sincroniza el token de Firebase con la cookie de sesión (__session).
 * QUÉ: Guarda el ID Token en el navegador con los flags de seguridad correctos.
 * POR QUÉ: Los navegadores móviles requieren Secure y SameSite=Lax para persistir sesiones tras redirecciones.
 */
export function setSessionCookie(token: string): void {
  const isSecure = window.location.protocol === 'https:';
  const isLocalhost = window.location.hostname === 'localhost';
  
  /**
   * REGLA DE PERSISTENCIA PARA MÓVILES/IP:
   * 1. Si estamos en HTTPS o localhost, usamos flags estrictas (SameSite=None si es cross-origin o Secure si es localhost).
   * 2. Si estamos en una IP local (ej: 192.168.x.x) sobre HTTP (común en testing móvil),
   *    NO podemos usar 'Secure' ni 'SameSite=None'. Debemos usar 'SameSite=Lax'.
   */
  // Aumentamos max-age a 7 días (604800 segundos) para mayor robustez
  const cookieBase = `__session=${token}; path=/; max-age=604800; Priority=High`;
  
  if (isSecure || isLocalhost) {
    // Modo producción o local con privilegio
    document.cookie = `${cookieBase}; Secure; SameSite=None`;
    console.log('[Auth] Sesión síncrona: Secure; SameSite=None');
  } else {
    // Modo testing móvil por IP (HTTP)
    console.warn('[Auth] Detectada conexión HTTP por IP. Usando cookies Lax sin Secure para compatibilidad móvil.');
    document.cookie = `${cookieBase}; SameSite=Lax`;
  }

  // Verificación inmediata de persistencia
  const isSet = document.cookie.includes('__session=');
  if (!isSet) {
    console.error('[Auth] CRITICAL: El navegador rechazó la cookie de sesión. Verificá la configuración de privacidad o si estás en modo incógnito.');
  } else {
    console.log('[Auth] Cookie de sesión verificada y persistida.');
  }
}

export { sendEmailVerification, getRedirectResult };
