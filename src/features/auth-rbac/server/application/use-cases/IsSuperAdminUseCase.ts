import { IUserRoleRepository } from "../../domain/interfaces/IUserRoleRepository";

/**
 * Caso de uso: Verificar si un usuario es superadmin
 */

export interface IsSuperAdminInput {
  userId: string;
}

export interface IsSuperAdminOutput {
  isSuperAdmin: boolean;
  error?: string;
}

export class IsSuperAdminUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(input: IsSuperAdminInput): Promise<IsSuperAdminOutput> {
    try {
      const isSuperAdmin = await this.userRoleRepository.isSuperAdmin(input.userId);

      return {
        isSuperAdmin,
      };
    } catch (error) {
      console.error("Error in IsSuperAdminUseCase:", error);
      return {
        isSuperAdmin: false,
        error: "Error al verificar superadmin",
      };
    }
  }
}
