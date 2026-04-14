import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@core/lib/auth";
import { Routes } from "@core/shared/constants/routes";
import prisma from "@core/lib/prisma";

/**
 * Helper de seguridad centralizado para server components y layouts protegidos.
 *
 * Garantiza TRES condiciones antes de permitir el acceso a cualquier ruta protegida:
 * 1. Existe una sesión válida (usuario autenticado)
 * 2. La sesión actual tiene OTP verificado (otpVerifiedAt !== null)
 *
 * IMPORTANTE — por qué verificamos por sesión y no por usuario (emailVerified):
 * Better Auth marca emailVerified=true de forma permanente en el User una vez
 * que el usuario verifica OTP por primera vez. Esto significa que sesiones
 * futuras heredarían ese flag sin pasar por el OTP, rompiendo el 2FA.
 * La solución es verificar otpVerifiedAt en la Session activa — cada nueva
 * sesión nace con otpVerifiedAt=null y debe completar el OTP para avanzar.
 *
 * Uso en server components:
 *   const session = await requireVerifiedSession();
 *   // A partir de aquí session.user y session.session.otpVerifiedAt están garantizados
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

  // Verificar OTP por sesión (no por usuario).
  // Consultamos directamente la DB porque Better Auth no expone otpVerifiedAt
  // en el objeto de sesión que devuelve getSession().
  const dbSession = await prisma.session.findUnique({
    where: { token: session.session.token },
    select: { otpVerifiedAt: true },
  });

  if (!dbSession?.otpVerifiedAt) {
    redirect(Routes.verifyOtp);
  }

  return session;
}
