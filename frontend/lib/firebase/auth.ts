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
  'auth/too-many-requests': 'Demasiados intentos. Esperá un momento o restablecé tu contraseña.',
  'auth/network-request-failed': 'Error de conexión. Verificá tu internet y el estado del servidor.',
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
    console.log(`[Diagnostic] Verificando email en: ${targetUrl} (Backend URL: ${process.env.NEXT_PUBLIC_BACKEND_URL})`);
    
    // Si backendUrl es localhost, y estamos en móvil, esto fallará. 
    // Capturamos el error de red específicamente para avisar en consola.
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      console.warn(`[Auth] Error en backend (${response.status}):`, targetUrl);
      throw new Error(`Servidor de validación respondió con error ${response.status}. Verificá la URL del backend.`);
    }

    const data = await response.json();
    return data.registered === true;
  } catch (error: any) {
    const isNetworkError = error.name === 'TypeError' || error.message.includes('fetch');
    
    if (isNetworkError) {
      console.error('[Auth] Error de conexión al backend:', error);
      throw new Error('No se pudo conectar con el servidor de validación (BACKEND_URL). Verificá tu internet o la configuración en Vercel.');
    }
    
    // Si es un error que nosotros lanzamos arriba (404/500), lo relanzamos
    if (error.message.includes('Servidor')) throw error;

    console.error('[Auth] Error inesperado en validación:', error);
    throw new Error('Error inesperado al verificar el email. Intentá de nuevo más tarde.');
  }
}

/**
 * Inicia sesión con Google.
 * Detecta si el usuario está en móvil para usar 'Redirect' (más robusto en celulares)
 * o 'Popup' (mejor UX en escritorio).
 */
export async function signInWithGoogle(): Promise<UserCredential | void> {
  const provider = new GoogleAuthProvider();
  // Forzamos selección de cuenta para evitar que use una sesión previa corrupta
  provider.setCustomParameters({ prompt: 'select_account' });
  
  // Detección de móvil o modo incógnito/restringido
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  console.log(`[Auth] Iniciando Google Login. Plataforma detectada: ${navigator.userAgent}. Modo sugerido: ${isMobile ? 'REDIRECT' : 'POPUP'}`);

  if (isMobile) {
    // Marcamos que hay un redirect pendiente para que el hook useAuth sepa qué esperar
    console.log('[Auth] Ejecutando signInWithRedirect...');
    sessionStorage.setItem('pendingGoogleRedirect', 'true');
    return signInWithRedirect(auth, provider);
  } else {

    try {
      // Intentamos popup en escritorio para mejor UX
      return await signInWithPopup(auth, provider);
    } catch (error: any) {
      // FALLBACK CRÍTICO: Si el popup es bloqueado por el navegador o por un CSP viejo en caché,
      // reintentamos automáticamente usando Redirect, que no puede ser bloqueado por CSP.
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.warn('[Auth] Popup bloqueado o cerrado. Reintentando vía Redirect para asegurar el acceso...');
        sessionStorage.setItem('pendingGoogleRedirect', 'true');
        return signInWithRedirect(auth, provider);
      }
      throw error;
    }
  }
}

/**
 * Sincroniza el token de Firebase con la cookie de sesión (__session).
 * QUÉ: Guarda el ID Token en el navegador con los flags de seguridad correctos.
 * POR QUÉ: Los navegadores móviles requieren Secure y SameSite=Lax para persistir sesiones tras redirecciones.
 */
export function setSessionCookie(token: string): void {
  const isSecure = window.location.protocol === 'https:';
  
  /**
   * REGLA DE PERSISTENCIA ULTRA-COMPATIBLE:
   * Usamos 'Lax' por defecto tanto en local como en producción. 
   * 'None' a veces es bloqueado por navegadores móviles (Safari/Chrome iOS) 
   * incluso en sitios de primer nivel por políticas de privacidad estrictas.
   */
  const cookieBase = `__session=${token}; path=/; max-age=604800; SameSite=Lax; Priority=High`;
  const finalCookie = isSecure ? `${cookieBase}; Secure` : cookieBase;
  
  document.cookie = finalCookie;

  // Verificación para el desarrollador en el log
  const isSet = document.cookie.includes('__session=');
  console.log(`[Auth] Cookie configurada en ${isSecure ? 'HTTPS' : 'HTTP'}. Estado: ${isSet ? 'ÉXITO' : 'FALLO'}`);
}

/**
 * Envía el email de verificación con configuraciones avanzadas para
 * mejorar la compatibilidad en móviles y asegurar el redireccionamiento.
 */
export async function sendCustomEmailVerification(user: any): Promise<void> {
  // Preferimos usar el dominio oficial de producción para mayor confiabilidad en filtros de SPAM
  const domain = window.location.hostname === 'localhost' 
    ? window.location.origin 
    : 'https://fidooo-prueba.vercel.app';

  const actionCodeSettings = {
    // URL de retorno estándar. Google abrirá primero su página de éxito 
    // y luego mostrará un botón de "Continuar" hacia Fiboo. 
    // Esta es la forma más compatible con celulares.
    url: `${domain}/verify-email`,
  };
  
  return sendEmailVerification(user, actionCodeSettings);
}

export { getRedirectResult };
