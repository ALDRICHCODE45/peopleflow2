import z from "zod";
import { loginPasswordSchema } from "./passwordPolicy";

/**
 * Schema de login: SOLO valida que el email sea email y que la contraseña no esté vacía.
 *
 * NO valida longitud porque el backend (Better Auth) ya verifica las credenciales
 * contra el hash. Restringir formato acá rompe el login para usuarios con
 * contraseñas viejas que no cumplen la política actual.
 */
export const userLoginSchema = z.object({
  email: z.email("El correo electrónico no es válido."),
  password: loginPasswordSchema,
});
