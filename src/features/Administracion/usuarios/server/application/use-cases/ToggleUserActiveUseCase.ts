import prisma from "@lib/prisma";

export interface ToggleUserActiveInput {
  userId: string;
  currentUserId: string;
  isActive: boolean;
  tenantId: string;
}

export interface ToggleUserActiveOutput {
  success: boolean;
  error?: string;
}

export class ToggleUserActiveUseCase {
  async execute(input: ToggleUserActiveInput): Promise<ToggleUserActiveOutput> {
    try {
      const { userId, currentUserId, isActive } = input;

      if (userId === currentUserId) {
        return {
          success: false,
          error: "No podés desactivar tu propio usuario",
        };
      }

      // Mutamos `banned` directo en la DB en vez de usar `auth.api.banUser`:
      // el plugin admin() de Better Auth tiene su propio ACL basado en
      // `User.role`, incompatible con el RBAC multi-tenant del proyecto.
      // El plugin sigue interceptando el sign-in al leer este campo.
      if (!isActive) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: {
              banned: true,
              banReason: "Desactivado por administrador",
              banExpires: null,
            },
          }),
          prisma.session.deleteMany({ where: { userId } }),
        ]);
      } else {
        await prisma.user.update({
          where: { id: userId },
          data: {
            banned: false,
            banReason: null,
            banExpires: null,
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
