import { z } from "zod";

/**
 * Política de contraseñas centralizada para PeopleFlow.
 *
 * USAR SIEMPRE estos valores en formularios de creación, cambio o reset.
 * NO duplicar reglas inline — si la política cambia, cambia acá.
 *
 * El backend (Better Auth) acepta por default 8..128 caracteres.
 * Mantenemos esos mismos límites en el cliente para no mentirle al usuario.
 *
 * IMPORTANTE: El login NO debe validar formato de contraseña — solo verifica
 * contra el hash. Si un usuario tiene una contraseña vieja de 5 caracteres,
 * debe poder ingresar. Usar `loginPasswordSchema` ahí.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/**
 * Schema para formularios de creación / cambio / reset de contraseña.
 * Aplica longitud mínima y máxima.
 */
export const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`)
  .max(PASSWORD_MAX, `La contraseña no puede exceder ${PASSWORD_MAX} caracteres.`);

/**
 * Schema para el campo de contraseña en login.
 * SOLO valida que no esté vacío. No restringe formato — eso lo hace el backend
 * al verificar contra el hash. Restringir formato en login bloquea a usuarios
 * con contraseñas antiguas que no cumplen la política actual.
 */
export const loginPasswordSchema = z
  .string()
  .min(1, "La contraseña es requerida.");

/**
 * Mensajes reutilizables para validaciones inline (cuando no se puede usar Zod).
 */
export const PASSWORD_MESSAGES = {
  required: "La contraseña es requerida.",
  tooShort: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`,
  tooLong: `La contraseña no puede exceder ${PASSWORD_MAX} caracteres.`,
  mismatch: "Las contraseñas no coinciden.",
} as const;

/**
 * Valida una contraseña según la política. Devuelve mensaje de error o null.
 * Útil para validaciones inline con useState (ResetPasswordPage, ChangeUserPasswordDialog).
 */
export function validatePassword(value: string): string | null {
  if (!value) return PASSWORD_MESSAGES.required;
  if (value.length < PASSWORD_MIN) return PASSWORD_MESSAGES.tooShort;
  if (value.length > PASSWORD_MAX) return PASSWORD_MESSAGES.tooLong;
  return null;
}
