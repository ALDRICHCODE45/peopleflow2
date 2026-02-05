"use client";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/core/shared/hooks/use-auth";
import { showToast } from "@/core/shared/components/ShowToast";
import { userLoginSchema } from "../schemas/userLoginSchema";
import { authClient } from "@lib/auth-client";
import { setOTPVerificationEmail } from "./useVerifyOTPForm";

export function useSignInForm(getCaptchaToken: () => string | null) {
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: userLoginSchema,
    },
    onSubmit: async ({ value }) => {
      const token = getCaptchaToken();
      if (!token) {
        showToast({
          type: "error",
          title: "Captcha requerido",
          description: "Por favor, completa la verificación de seguridad.",
        });
        return;
      }

      const result = await login(value.email, value.password, token);

      if (!result.success) {
        showToast({
          type: "error",
          title: "Error de autenticacion",
          description: result.error || "Credenciales incorrectas",
        });
        return;
      }

      // Send OTP for email verification
      const otpResult = await authClient.emailOtp.sendVerificationOtp({
        email: value.email,
        type: "email-verification",
      });

      if (otpResult.error) {
        showToast({
          type: "error",
          title: "Error al enviar codigo",
          description: otpResult.error.message || "No se pudo enviar el codigo de verificacion.",
        });
        return;
      }

      // Store email in session storage for OTP verification page
      setOTPVerificationEmail(value.email);

      showToast({
        type: "success",
        title: "Codigo enviado",
        description: "Se ha enviado un codigo de verificacion a tu correo electronico.",
      });

      router.push("/verify-otp");
    },
  });

  return form;
}
