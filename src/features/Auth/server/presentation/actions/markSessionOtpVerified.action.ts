"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import prisma from "@core/lib/prisma";

/**
 * Server Action: Marca la sesión activa como OTP verificada.
 *
 * Se llama desde el cliente (useVerifyOTPForm) inmediatamente después de que
 * Better Auth confirma el OTP con authClient.emailOtp.verifyEmail().
 *
 * Escribe otpVerifiedAt = now() en la Session activa de la DB.
 * A partir de ahí, requireVerifiedSession() permite el acceso a rutas protegidas.
 */
export async function markSessionOtpVerified(): Promise<{ error: string | null }> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.session?.token) {
      return { error: "No hay sesión activa" };
    }

    await prisma.session.update({
      where: { token: session.session.token },
      data: { otpVerifiedAt: new Date() },
    });

    return { error: null };
  } catch (error) {
    console.error("Error in markSessionOtpVerified:", error);
    return { error: "Error inesperado al verificar la sesión" };
  }
}
