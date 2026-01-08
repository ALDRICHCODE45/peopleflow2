import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy de Next.js 16+ (reemplazo de middleware.ts)
 * 
 * Intercepta requests para verificar autenticación y proteger rutas.
 * Para este ejemplo básico, solo protegemos rutas que requieren autenticación.
 */

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/', '/api/auth'];
  
  // Verificar si es una ruta pública
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Para rutas protegidas, verificar autenticación
  // En un ejemplo más completo, aquí se verificaría la sesión
  // Por ahora, permitimos el acceso y la verificación de permisos se hace en las páginas
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
