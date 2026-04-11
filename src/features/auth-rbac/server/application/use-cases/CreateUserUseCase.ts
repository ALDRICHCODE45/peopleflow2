/**
 * Caso de uso: Crear un nuevo usuario
 * Solo puede ser ejecutado por superadmin (validado en la capa de presentación)
 */

import { auth } from "@/core/lib/auth";

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

export interface CreateUserOutput {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  error?: string;
}

export class CreateUserUseCase {
  constructor() {}

  private getSafeCreateErrorMessage(error: unknown): string {
    const fallbackMessage =
      "No se pudo crear el usuario. Verificá que el email sea válido e intentá nuevamente.";

    if (error instanceof Error) {
      const normalizedMessage = error.message.toLowerCase();

      if (
        normalizedMessage.includes("already") ||
        normalizedMessage.includes("exists") ||
        normalizedMessage.includes("duplicate")
      ) {
        return "Ya existe un usuario registrado con ese email.";
      }

      if (
        normalizedMessage.includes("password") &&
        normalizedMessage.includes("weak")
      ) {
        return "La contraseña no cumple con los requisitos mínimos de seguridad.";
      }

      if (error.message.trim().length > 0) {
        return error.message;
      }
    }

    if (typeof error === "object" && error !== null) {
      const errorRecord = error as Record<string, unknown>;
      const message = errorRecord.message;

      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }

    return fallbackMessage;
  }

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: input.email,
          password: input.password,
          name: input.name,
        },
      });

      if (!result.user) {
        return {
          success: false,
          error:
            "No se pudo crear el usuario. El proveedor de autenticación no devolvió datos del usuario.",
        };
      }

      // Retornar el usuario creado
      return {
        success: true,
        user: {
          id: result.user?.id || result.user.id,
          email: input.email,
          name: input.name || null,
        },
      };
    } catch (error) {
      console.error("Error in CreateUserUseCase:", error);

      return {
        success: false,
        error: this.getSafeCreateErrorMessage(error),
      };
    }
  }
}
