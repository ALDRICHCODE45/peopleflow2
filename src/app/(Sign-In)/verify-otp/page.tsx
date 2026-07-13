import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Routes } from "@core/shared/constants/routes";
import { getSessionOtpStatus } from "@core/lib/session-otp";
import { VerifyOTPPage } from "@/features/Auth/frontend/pages/VerifyOTPPage";

export const metadata: Metadata = {
  title: "Verificar Codigo OTP",
  description: "Ingresa el codigo de verificacion enviado a tu correo electronico.",
};

const Page = async () => {
  const { session, isLoggedIn, otpVerified } = await getSessionOtpStatus();

  // Sin sesión válida → sign-in.
  if (!isLoggedIn || !session?.user) {
    redirect(Routes.signIn);
  }

  // Sesión ya verificada → home. Evita quedarse en el paso de OTP y cierra el
  // loop desde este lado.
  if (otpVerified) {
    redirect(Routes.home);
  }

  // El email viene del servidor (autoritativo). Antes se dependía solo de
  // sessionStorage efímero: si faltaba, esta pantalla rebotaba a /sign-in y
  // alimentaba el loop de redirección.
  return <VerifyOTPPage email={session.user.email} />;
};

export default Page;
