import prisma from "@lib/prisma";
import type { IUserPasswordRepository } from "../../domain/interfaces/IUserPasswordRepository";
import bcrypt from "bcryptjs";

/**
 * Prisma implementation of user password repository
 * Handles tenant membership validation, password updates, and session revocation
 */
export class PrismaUserPasswordRepository implements IUserPasswordRepository {
  /**
   * Verifies if a user belongs to a specific tenant via UserRole table
   */
  async userBelongsToTenant(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        tenantId,
      },
    });

    return !!userRole;
  }

  /**
   * Sets a new password for a user by directly updating the Account table
   * Better Auth admin API requires User.role='admin', incompatible with tenant RBAC
   * We hash the password ourselves and update the credential account record
   */
  async setUserPassword(userId: string, newPassword: string): Promise<void> {
    // Hash password with bcrypt (Better Auth uses bcryptjs internally)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the credential account password
    await prisma.account.updateMany({
      where: {
        userId,
        providerId: "credential",
      },
      data: {
        password: hashedPassword,
      },
    });
  }

  /**
   * Revokes all active sessions for a user
   * Called after password change to force re-authentication
   */
  async revokeUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
}

/**
 * Singleton instance for dependency injection
 */
export const prismaUserPasswordRepository = new PrismaUserPasswordRepository();
