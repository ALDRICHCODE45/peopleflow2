import type { Metadata } from "next";
import { VerifyOTPPage } from "@/features/Auth/frontend/pages/VerifyOTPPage";

export const metadata: Metadata = {
  title: "Verificar Codigo OTP",
  description: "Ingresa el codigo de verificacion enviado a tu correo electronico.",
};

const Page = () => {
  return <VerifyOTPPage />;
};

export default Page;
