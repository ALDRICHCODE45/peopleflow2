import type { IUserPasswordRepository } from "../../domain/interfaces/IUserPasswordRepository";

export interface ChangeUserPasswordInput {
  adminUserId: string;
  targetUserId: string;
  newPassword: string;
  confirmPassword: string;
  tenantId: string;
}

export interface ChangeUserPasswordOutput {
  success: boolean;
  error?: string;
}

/**
 * Use case for admin password change with security validations
 * Enforces tenant membership, self-change prevention, and session revocation
 */
export class ChangeUserPasswordUseCase {
  constructor(private readonly repository: IUserPasswordRepository) {}

  async execute(
    input: ChangeUserPasswordInput,
  ): Promise<ChangeUserPasswordOutput> {
    try {
      const { adminUserId, targetUserId, newPassword, confirmPassword, tenantId } =
        input;

      // Validation: Prevent self-password change through admin flow
      if (targetUserId === adminUserId) {
        return {
          success: false,
          error: "No podés cambiar tu propia contraseña desde aquí",
        };
      }

      // Validation: Password match
      if (newPassword !== confirmPassword) {
        return {
          success: false,
          error: "Las contraseñas no coinciden",
        };
      }

      // Validation: Minimum length
      if (newPassword.length < 8) {
        return {
          success: false,
          error: "La contraseña debe tener al menos 8 caracteres",
        };
      }

      // Security: Verify target user belongs to admin's tenant
      const belongsToTenant = await this.repository.userBelongsToTenant(
        targetUserId,
        tenantId,
      );

      if (!belongsToTenant) {
        return {
          success: false,
          error: "El usuario no pertenece a tu tenant",
        };
      }

      // Execute password change
      await this.repository.setUserPassword(targetUserId, newPassword);

      // Revoke all sessions to force re-authentication
      await this.repository.revokeUserSessions(targetUserId);

      return { success: true };
    } catch (error) {
      console.error("Error in ChangeUserPasswordUseCase:", error);
      return {
        success: false,
        error: "Error al cambiar la contraseña",
      };
    }
  }
}
