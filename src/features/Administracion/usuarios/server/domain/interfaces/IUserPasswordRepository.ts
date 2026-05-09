/**
 * Domain repository interface for user password management operations
 */
export interface IUserPasswordRepository {
  /**
   * Verifies if a user belongs to a specific tenant
   * @param userId - Target user ID
   * @param tenantId - Tenant ID to check membership
   * @returns Promise resolving to true if user belongs to tenant
   */
  userBelongsToTenant(userId: string, tenantId: string): Promise<boolean>;

  /**
   * Sets a new password for a user using Better Auth
   * @param userId - Target user ID
   * @param newPassword - New password (plain text, will be hashed by Better Auth)
   * @returns Promise resolving when password is updated
   */
  setUserPassword(userId: string, newPassword: string): Promise<void>;

  /**
   * Revokes all active sessions for a user
   * @param userId - Target user ID
   * @returns Promise resolving when all sessions are revoked
   */
  revokeUserSessions(userId: string): Promise<void>;
}
