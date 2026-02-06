import { IUserRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IUserRoleRepository";

export interface GetUserByIdUseCaseInput {
  userId: string;
}

export interface GetUserByIdUseCaseOutput {
  success: boolean;
  error?: string;
  user?: { name: string; email: string; image: string | null; avatar: string | null; id: string };
}

export class GetUserByIdUseCase {
  constructor(private readonly userRoleRepository: IUserRoleRepository) {}

  async execute(input: GetUserByIdUseCaseInput): Promise<GetUserByIdUseCaseOutput> {
    try {
      const { userId } = input;

      if (!userId) {
        return { success: false, error: "userId es requerido" };
      }

      const user = await this.userRoleRepository.findUserById(userId);

      if (!user) {
        return { success: false, error: "Usuario no encontrado" };
      }

      return { success: true, user };
    } catch (error) {
      console.error("Error in GetUserByIdUseCase:", error);
      return { success: false, error: "Error al obtener usuario" };
    }
  }
}
