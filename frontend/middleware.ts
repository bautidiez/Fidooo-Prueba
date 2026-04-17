import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de Next.js para protección de rutas.
 * 
 * QUÉ: Este middleware intercepta todas las peticiones entrantes.
 * POR QUÉ: Permite centralizar la lógica de autenticación y redirección.
 * PROBLEMA QUE RESUELVE: Evita que usuarios no autenticados accedan a rutas protegidas
 * como /chat, y que usuarios autenticados vuelvan a /login.
 */
export function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const { pathname } = request.nextUrl;

  // 1. Si el usuario intenta acceder al chat sin sesión, redirigir a login
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
export const config = {
  matcher: ['/chat/:path*', '/login', '/', '/reset-password.:path*'],
};
