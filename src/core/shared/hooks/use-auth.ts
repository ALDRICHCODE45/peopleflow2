"use client";

import { authClient } from "@lib/auth-client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

/**
 * Tipo para el usuario autenticado
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resultado de las operaciones de autenticación
 */
export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Hook de autenticación que abstrae Better Auth en el cliente
 *
 * Proporciona:
 * - user: Usuario activo o null
 * - isAuthenticated: Si el usuario está autenticado
 * - isLoading: Si la sesión está cargando
 * - login: Función para iniciar sesión
 * - logout: Función para cerrar sesión
 * - signUp: Función para registrar un nuevo usuario
 * - refetch: Función para refrescar la sesión
 *
 * @example
 * ```tsx
 * "use client"
 * import { useAuth } from "@core/shared/hooks/use-auth"
 *
 * function MyComponent() {
 *   const { user, isAuthenticated, isLoading, login, logout } = useAuth();
 *
 *   if (isLoading) return <div>Cargando...</div>;
 *
 *   if (!isAuthenticated) {
 *     return <button onClick={() => login("email@example.com", "password")}>Login</button>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Hola, {user?.name}</p>
 *       <button onClick={logout}>Cerrar sesión</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const router = useRouter();
  const [isOperationLoading, setIsOperationLoading] = useState(false);

  /**
   * Inicia sesión con email y contraseña
   */
  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setIsOperationLoading(true);

      try {
        const result = await authClient.signIn.email({
          email,
          password,
        });

        if (result.error) {
          return {
            success: false,
            error: result.error.message || "Error al iniciar sesión",
          };
        }

        // Refrescar la sesión después del login
        await refetch();

        return { success: true };
      } catch (error) {
        console.error("Error en login:", error);
        return {
          success: false,
          error: "Ocurrió un error inesperado",
        };
      } finally {
        setIsOperationLoading(false);
      }
    },
    [refetch],
  );

  /**
   * Cierra la sesión del usuario
   */
  const logout = useCallback(
    async (redirectTo: string = "/"): Promise<AuthResult> => {
      setIsOperationLoading(true);

      try {
        await authClient.signOut();
        await refetch();

        // Redirigir después del logout
        router.push(redirectTo);
        router.refresh();

        return { success: true };
      } catch (error) {
        console.error("Error en logout:", error);
        return {
          success: false,
          error: "Error al cerrar sesión",
        };
      } finally {
        setIsOperationLoading(false);
      }
    },
    [refetch, router],
  );

  /**
   * Registra un nuevo usuario
   */
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name?: string,
    ): Promise<AuthResult> => {
      setIsOperationLoading(true);

      try {
        const result = await authClient.signUp.email({
          email,
          password,
          name: name || "",
        });

        if (result.error) {
          return {
            success: false,
            error: result.error.message || "Error al registrar usuario",
          };
        }

        // Refrescar la sesión después del registro
        await refetch();

        return { success: true };
      } catch (error) {
        console.error("Error en signUp:", error);
        return {
          success: false,
          error: "Ocurrió un error inesperado",
        };
      } finally {
        setIsOperationLoading(false);
      }
    },
    [refetch],
  );

  // Extraer el usuario de la sesión
  const user = session?.user as AuthUser | undefined;

  // Determinar estado de autenticación
  const isAuthenticated = !!session?.user;

  // Loading combina el estado de la sesión y operaciones en curso
  const isLoading = isPending || isOperationLoading;

  return {
    user: user ?? null,
    session,
    isAuthenticated,
    isLoading,
    isPending,
    login,
    logout,
    signUp,
    refetch,
  };
}

export type UseAuthReturn = ReturnType<typeof useAuth>;
