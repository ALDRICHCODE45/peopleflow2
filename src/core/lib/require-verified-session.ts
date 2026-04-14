import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@core/lib/auth";
import { Routes } from "@core/shared/constants/routes";

/**
 * Helper de seguridad centralizado para server components y layouts protegidos.
 *
 * Garantiza DOS condiciones antes de permitir el acceso a cualquier ruta protegida:
 * 1. Existe una sesión válida (usuario autenticado)
 * 2. El usuario completó la verificación OTP (emailVerified === true)
 *
 * Uso en server components:
 *   const session = await requireVerifiedSession();
 *   // A partir de aquí session.user y session.user.emailVerified === true están garantizados
 *
 * Si alguna condición falla, redirige automáticamente:
 * - Sin sesión      → /sign-in
 * - Sin OTP         → /verify-otp
 */
export async function requireVerifiedSession() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect(Routes.signIn);
  }

  if (!session.user.emailVerified) {
    redirect(Routes.verifyOtp);
  }

  return session;
}
