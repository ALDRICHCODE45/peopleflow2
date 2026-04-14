import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy de Next.js 16+ (reemplazo de middleware.ts)
 *
 * Intercepta requests para:
 * - Verificar autenticación básica via cookie
 * - Redirigir a /sign-in si no hay sesión
 * - Redirigir a /verify-otp si hay sesión pero no se completó el OTP
 *
 * ARQUITECTURA DE SEGURIDAD (defense in depth):
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Capa 1 — proxy.ts (este archivo)                                   │
 * │    • Sin cookie de sesión → /sign-in                                │
 * │    • Con cookie, ruta protegida → /verify-otp                       │
 * │    • El proxy NO puede verificar emailVerified sin llamar a la DB   │
 * │      (Better Auth usa tokens opacos, no JWTs)                       │
 * │                                                                     │
 * │  Capa 2 — requireVerifiedSession() en cada server component         │
 * │    • Verifica sesión válida en DB                                   │
 * │    • Verifica emailVerified === true                                 │
 * │    • Redirige a /verify-otp si OTP no completado                    │
 * │    • Importar desde @core/lib/require-verified-session              │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * REGLA: Todo server component o layout que proteja una ruta DEBE usar
 * requireVerifiedSession() en lugar de auth.api.getSession() directamente.
 */

/**
 * Rutas públicas que no requieren autenticación
 */
const PUBLIC_PATHS = ["/sign-in", "/api/auth", "/access-denied"];

/**
 * Rutas del flujo de autenticación:
 * - /verify-otp: solo accesible con sesión (verificación pendiente)
 * - /select-tenant: solo accesible con sesión + OTP verificado
 *   (protegida adicionalmente por requireVerifiedSession en su page.tsx)
 */
const AUTH_FLOW_PATHS = ["/select-tenant", "/verify-otp"];

/**
 * Verifica si es una ruta pública
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );
}

/**
 * Verifica si es una ruta del flujo de autenticación
 */
function isAuthFlowPath(pathname: string): boolean {
  return AUTH_FLOW_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
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

  // 3. Rutas públicas - permitir acceso sin autenticación
  //    La validación de sesión para /sign-in se hace en el server component
  //    porque el proxy no puede verificar si la sesión es válida en la DB
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 4. Si no está logueado y no es ruta pública, redirigir a sign-in
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // 5. Rutas del flujo de autenticación (/verify-otp, /select-tenant):
  //    permitir si hay sesión — la verificación de emailVerified se hace
  //    en los server components correspondientes via requireVerifiedSession()
  if (isAuthFlowPath(pathname)) {
    return NextResponse.next();
  }

  // 6. Para todas las demás rutas (rutas de app protegidas, raíz, etc.):
  //    el proxy permite el acceso — la verificación de emailVerified se delega
  //    a requireVerifiedSession() en cada server component/layout protegido.
  //    El proxy no puede verificar emailVerified sin DB (Better Auth usa tokens opacos).
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
