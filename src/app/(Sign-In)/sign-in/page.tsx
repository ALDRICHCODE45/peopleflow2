import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInPage } from "@/features/Auth/frontend/pages/SignInPage";
import { Routes } from "@core/shared/constants/routes";
import { getSessionOtpStatus } from "@core/lib/session-otp";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description:
    "Accede a tu cuenta de PeopleFlow ERP para gestionar tu organización.",
};

export default async function Page() {
  const { isLoggedIn, otpVerified } = await getSessionOtpStatus();

  // Ya autenticado: si completó el OTP va al home; si está pendiente va al flujo
  // de OTP. Nunca lo enviamos a "/" con OTP pendiente — eso reingresaba al área
  // protegida y disparaba el loop de redirección.
  if (isLoggedIn) {
    redirect(otpVerified ? Routes.home : Routes.verifyOtp);
  }

  const cloudflareSiteKey = process.env.CLOUDFLARE_SITE_KEY ?? "";

  return <SignInPage cloudflareSiteKey={cloudflareSiteKey} />;
}
