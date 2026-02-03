import { createAuthClient } from "better-auth/react";

/**
 * Cliente de Better Auth para React
 *
 * Este cliente se usa en componentes del lado del cliente (use client)
 * para realizar acciones de autenticación como:
 * - signIn, signUp, signOut
 * - useSession hook para obtener la sesión actual
 * - Y más...
 *
 * Ejemplo de uso:
 * ```tsx
 * "use client"
 * import { authClient } from "@lib/auth-client"
 *
 * const { data: session } = authClient.useSession()
 * ```
 */
const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

if (!baseURL && process.env.NODE_ENV === "production") {
  console.warn(
    "[Better Auth] NEXT_PUBLIC_BETTER_AUTH_URL no está definida; se usará detección automática."
  );
}

export const authClient = createAuthClient({
  // Configura explícitamente la URL base en producción
  baseURL,
});
