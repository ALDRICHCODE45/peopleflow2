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
export const authClient = createAuthClient({
  // Better Auth automáticamente detecta la URL base si no se especifica
  // pero puedes configurarlo explícitamente con NEXT_PUBLIC_BETTER_AUTH_URL
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});
