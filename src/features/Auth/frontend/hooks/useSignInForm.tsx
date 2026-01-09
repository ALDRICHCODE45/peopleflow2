"use client";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/core/shared/hooks/use-auth";
import { TryCatch } from "@/core/shared/helpers/tryCatch";
import { userLoginSchema } from "../schemas/userLoginSchema";

export function useSignInForm() {
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
      const result = await TryCatch(login(value.email, value.password));

      if (!result.ok) {
        //Cambiar esta línea por un logger
        console.error("Error en login:", result.error);
        throw new Error("Error al iniciar sesión");
      }
      router.push("/");
    },
  });

  return form;
}
