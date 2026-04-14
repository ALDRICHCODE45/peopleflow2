"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { authClient } from "@lib/auth-client";
import { showToast } from "@/core/shared/components/ShowToast";
import { Routes } from "@core/shared/constants/routes";
import { otpSchema } from "../schemas/otpSchema";
import { markSessionOtpVerified } from "@features/Auth/server/presentation/actions/markSessionOtpVerified.action";

const MAX_ATTEMPTS = 3;
const OTP_SESSION_KEY = "otp_verification_email";

export function useVerifyOTPForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS);
  const [isResending, setIsResending] = useState(false);

  // Load email from sessionStorage on mount
  useEffect(() => {
    const storedEmail = sessionStorage.getItem(OTP_SESSION_KEY);
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // No email in session, redirect to sign-in
      router.push(Routes.signIn);
    }
  }, [router]);

  const form = useForm({
    defaultValues: {
      otp: "",
    },
    validators: {
      onSubmit: otpSchema,
    },
    onSubmit: async ({ value }) => {
      if (!email) {
        showToast({
          type: "error",
          title: "Error",
          description: "No se encontro el email. Por favor inicia sesion nuevamente.",
        });
        router.push(Routes.signIn);
        return;
      }

      if (attemptsRemaining <= 0) {
        showToast({
          type: "error",
          title: "Demasiados intentos",
          description: "Has excedido el numero maximo de intentos. Por favor inicia sesion nuevamente.",
        });
        sessionStorage.removeItem(OTP_SESSION_KEY);
        router.push(Routes.signIn);
        return;
      }

      const result = await authClient.emailOtp.verifyEmail({
        email,
        otp: value.otp,
      });

      if (result.error) {
        const newAttempts = attemptsRemaining - 1;
        setAttemptsRemaining(newAttempts);

        if (newAttempts <= 0) {
          showToast({
            type: "error",
            title: "Demasiados intentos",
            description: "Has excedido el numero maximo de intentos. Por favor inicia sesion nuevamente.",
          });
          sessionStorage.removeItem(OTP_SESSION_KEY);
          router.push(Routes.signIn);
          return;
        }

        showToast({
          type: "error",
          title: "Codigo incorrecto",
          description: `Codigo invalido o expirado. Te quedan ${newAttempts} intento(s).`,
        });
        return;
      }

      // Marcar la sesión activa como OTP verificada en la DB.
      // Esto es CRÍTICO: requireVerifiedSession() verifica otpVerifiedAt,
      // no emailVerified del User (que es permanente y causaba el bypass).
      const markResult = await markSessionOtpVerified();
      if (markResult.error) {
        showToast({
          type: "error",
          title: "Error de sesion",
          description: "No se pudo completar la verificacion. Por favor inicia sesion nuevamente.",
        });
        router.push(Routes.signIn);
        return;
      }

      // Success - clear session storage and redirect
      sessionStorage.removeItem(OTP_SESSION_KEY);
      showToast({
        type: "success",
        title: "Verificacion exitosa",
        description: "Tu cuenta ha sido verificada correctamente.",
      });
      router.push("/");
    },
  });

  const resendOTP = useCallback(async () => {
    if (!email || isResending) return;

    setIsResending(true);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (result.error) {
        showToast({
          type: "error",
          title: "Error al reenviar",
          description: result.error.message || "No se pudo enviar el codigo. Intenta de nuevo.",
        });
        return;
      }

      // Reset attempts on successful resend
      setAttemptsRemaining(MAX_ATTEMPTS);
      showToast({
        type: "success",
        title: "Codigo reenviado",
        description: "Se ha enviado un nuevo codigo a tu correo electronico.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        description: "Ocurrio un error al reenviar el codigo.",
      });
    } finally {
      setIsResending(false);
    }
  }, [email, isResending]);

  return {
    form,
    email,
    attemptsRemaining,
    isResending,
    resendOTP,
  };
}

// Export helper for setting email in session storage
export function setOTPVerificationEmail(email: string) {
  sessionStorage.setItem(OTP_SESSION_KEY, email);
}
