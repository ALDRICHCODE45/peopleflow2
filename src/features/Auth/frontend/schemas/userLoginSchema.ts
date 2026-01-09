import z from "zod";

export const userLoginSchema = z.object({
  email: z.email("El correo electrónico no es válido."),
  password: z
    .string()
    .min(5, "La contraseña debe tener al menos 5 caracteres.")
    .max(16, "La contraseña debe tener como máximo 16 caracteres."),
});
