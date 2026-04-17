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
  const { pathname } = request.nextUrl;

  // 1. Protección de /chat: Si no hay sesión, mandamos a login
  if (pathname.startsWith('/chat') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Si el usuario ya tiene sesión e intenta ir a login, redirigir al chat
  if (pathname.startsWith('/login') && session) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  // 3. Robustez para links de recuperación malformados (con punto al final)
  if (pathname.includes('/reset-password.')) {
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = pathname.replace('/reset-password.', '/reset-password');
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
}

// Configuración de las rutas que el middleware debe interceptar
// USAMOS UNA NEGACIÓN: Protege todo EXCEPTO /login, /register, /reset-password, /api y assets.
// Esto permite que el cliente procese el Redirect de Google sin bloqueos del servidor.
export const config = {
  matcher: ['/((?!login|register|reset-password|_next|favicon.ico|api|assets).*)'],
};
