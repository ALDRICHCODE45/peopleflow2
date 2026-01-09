/**
 * Caso de uso: Crear un nuevo usuario
 * Solo puede ser ejecutado por superadmin (validado en la capa de presentación)
 */

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
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
  private readonly betterAuthUrl: string;

  constructor() {
    this.betterAuthUrl =
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
      "http://localhost:3000";
  }

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    try {
      // Crear usuario usando Better Auth API HTTP
      const response = await fetch(`${this.betterAuthUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          name: input.name || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        return {
          success: false,
          error: result.error?.message || "Error al crear usuario",
        };
      }

      // Retornar el usuario creado
      return {
        success: true,
        user: {
          id: result.user?.id || result.id,
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
