import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de Next.js para protección de rutas y robustez de URLs (Edge Runtime).
 * 
 * QUÉ: Intercepta todas las peticiones antes de que lleguen a las páginas.
 * POR QUÉ: Permite centralizar la lógica de sesión sin repetir código en cada componente.
 * PROBLEMA QUE RESUELVE:
 * 1. Protección perimetral: Evita que el navegador renderice páginas protegidas si no hay sesión.
 * 2. Corrección de URLs: Redirige automáticamente links de Firebase malformados (trailing dots).
 */
export function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const { pathname, searchParams } = request.nextUrl;

  // Detectamos si venimos de un redirect de Google
  // Firebase agrega params como 'code' o 'state' en la URL de retorno
  const isGoogleRedirect = 
    searchParams.has('code') || 
    searchParams.has('state') ||
    request.nextUrl.hash.includes('google');

  // 1. Protección de /chat: Si no hay sesión, mandamos a login
  if (pathname.startsWith('/chat') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Si el usuario ya tiene sesión e intenta ir a login, redirigir al chat
  // EXCEPCIÓN: Si viene de un redirect de Google, permitimos que entre a /login para que
  // el cliente pueda procesar getRedirectResult() correctamente antes de ir al chat.
  if (pathname.startsWith('/login') && session && !isGoogleRedirect) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  // 3. Robustez para links de recuperación malformados (con punto al final)
  if (pathname.includes('/reset-password.')) {
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = pathname.replace('/reset-password.', '/reset-password');
    return NextResponse.redirect(newUrl);
  }

  const response = NextResponse.next();

  // REFUERZO DE SEGURIDAD (CSP) A NIVEL DE MIDDLEWARE:
  // Forzamos las cabeceras aquí para asegurar que el navegador las reciba y no sean
  // filtradas por configuraciones por defecto de Vercel.
  const cspHeader = [
    "default-src 'self';",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com https://www.gstatic.com;",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://*.groq.com;",
    "frame-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com;",
    "img-src 'self' data: https://*.googleusercontent.com https://*.firebaseapp.com;",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
    "font-src 'self' https://fonts.gstatic.com;",
    "object-src 'none';"
  ].join(' ');

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

// Configuración de las rutas que el middleware debe interceptar
// USAMOS UNA NEGACIÓN: Protege todo EXCEPTO /login, /register, /reset-password, /api y assets.
// Esto permite que el cliente procese el Redirect de Google sin bloqueos del servidor.
export const config = {
  matcher: ['/((?!login|register|reset-password|_next|favicon.ico|api|assets).*)'],
};
