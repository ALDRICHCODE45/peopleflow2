import { auth } from "@lib/auth";

export interface ToggleUserActiveInput {
  userId: string;
  currentUserId: string;
  isActive: boolean; // target state
  tenantId: string; // for audit/context
}

export interface ToggleUserActiveOutput {
  success: boolean;
  error?: string;
}

/**
 * Use Case para activar/desactivar usuarios mediante Better Auth admin plugin
 * Usa banUser/unbanUser para controlar el acceso y revocar sesiones automáticamente
 */
export class ToggleUserActiveUseCase {
  async execute(input: ToggleUserActiveInput): Promise<ToggleUserActiveOutput> {
    try {
      const { userId, currentUserId, isActive } = input;

      // Prevenir auto-desactivación
      if (userId === currentUserId) {
        return {
          success: false,
          error: "No podés desactivar tu propio usuario",
        };
      }

      // Ejecutar ban/unban según el estado objetivo
      if (!isActive) {
        // Desactivar = banear usuario
        await auth.api.banUser({
          body: {
            userId,
            banReason: "Desactivado por administrador",
            // banExpiresIn opcional - null/undefined = permanente hasta que se reactive manualmente
          },
        });
      } else {
        // Activar = quitar ban
        await auth.api.unbanUser({
          body: {
            userId,
          },
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error in ToggleUserActiveUseCase:", error);
      return {
        success: false,
        error: "Error al cambiar el estado del usuario",
      };
    }
  }
}
