"use client";

import { useMutation } from "@tanstack/react-query";
import { showToast } from "@/core/shared/components/ShowToast";

interface RequestPasswordResetInput {
  email: string;
  redirectTo: string;
}

interface ResetPasswordInput {
  newPassword: string;
  token: string;
}

/**
 * Hook for requesting a password reset email
 * Always shows generic success message (enumeration-safe)
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (data: RequestPasswordResetInput) => {
      const response = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          redirectTo: data.redirectTo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message ?? "Error al solicitar el restablecimiento");
      }

      return response.json();
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Solicitud enviada",
        description:
          "Si el correo existe, recibirás un enlace para restablecer tu contraseña.",
      });
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message || "No se pudo enviar el correo de restablecimiento.",
      });
    },
  });
}

/**
 * Hook for resetting password with a token
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: data.newPassword,
          token: data.token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message ?? "Error al restablecer la contraseña");
      }

      return response.json();
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido restablecida exitosamente.",
      });
    },
    onError: (error: Error) => {
      const message = error.message;
      
      // Provide specific error messages for common cases
      let description = "No se pudo restablecer la contraseña.";
      
      if (message.includes("token") || message.includes("expired") || message.includes("invalid")) {
        description = "El enlace es inválido o ha expirado. Solicita un nuevo enlace.";
      }

      showToast({
        type: "error",
        title: "Error",
        description,
      });
    },
  });
}
