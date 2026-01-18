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

  constructor() {
  }

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    try {

      const result = await auth.api.signUpEmail({
        body: {
          email:input.email,
          password: input.password,
          name: input.name,
        },
      });


      //const result = await response.json();
      if (!result.user) {
        return {
          success: false,
          error: "Error al crear usuario",
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
        error: "Error al crear usuario con Better Auth",
      };
    }
  }
}
