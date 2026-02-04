"use client";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/core/shared/hooks/use-auth";
import { showToast } from "@/core/shared/components/ShowToast";
import { userLoginSchema } from "../schemas/userLoginSchema";

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
      router.push("/");
    },
  });

  return form;
}
