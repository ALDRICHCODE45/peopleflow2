import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy de Next.js 16+ (reemplazo de middleware.ts)
 *
 * Intercepta requests para:
 * - Verificar autenticación
 * - Proteger rutas según permisos
 * - Redirigir a rutas apropiadas
 *
 * NOTA: En Next.js 16, la verificación de permisos completa se hace
 * en los Server Components porque el proxy no tiene acceso directo a la BD.
 * El proxy solo maneja rutas públicas y autenticación básica via cookies.
 */

/**
 * Rutas públicas que no requieren autenticación
 */
const PUBLIC_PATHS = ["/sign-in", "/api/auth", "/access-denied"];

/**
 * Rutas que requieren autenticación pero son para flujo de auth
 */
const AUTH_FLOW_PATHS = ["/select-tenant"];

/**
 * Verifica si es una ruta pública
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

/**
 * Verifica si es una ruta del flujo de autenticación
 */
function isAuthFlowPath(pathname: string): boolean {
  return AUTH_FLOW_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

/**
 * Verifica si es un archivo estático o ruta de API interna
 */
function isStaticOrInternalPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") // Archivos con extensión (imágenes, etc.)
  );
}

/**
 * Obtiene el token de sesión de las cookies
 */
function getSessionToken(request: NextRequest): string | null {
  // Better Auth usa estas cookies para la sesión
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  return sessionCookie?.value || null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Excluir archivos estáticos y rutas internas
  if (isStaticOrInternalPath(pathname)) {
    return NextResponse.next();
  }

  // 2. Verificar si hay token de sesión (autenticación básica)
  const sessionToken = getSessionToken(request);
  const isLoggedIn = !!sessionToken;

  // 3. Si está logueado y accede a sign-in, redirigir a la raíz
  //    (la página raíz se encargará de redirigir según permisos)
  if (isLoggedIn && pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 4. Rutas públicas - permitir acceso sin autenticación
  //    (solo si no está logueado, porque si está logueado ya se manejó arriba)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 5. Si no está logueado y no es ruta pública, redirigir a sign-in
  if (!isLoggedIn) {
    // Si es la ruta raíz, redirigir a sign-in
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    // Si es cualquier otra ruta protegida, redirigir a sign-in
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // 6. Para rutas del flujo de autenticación, permitir si está logueado
  if (isAuthFlowPath(pathname)) {
    return NextResponse.next();
  }

  // 7. Para todas las demás rutas, permitir el acceso
  //    La verificación de permisos específicos se hace en los Server Components
  //    usando AuthGuard y PermissionGate
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
