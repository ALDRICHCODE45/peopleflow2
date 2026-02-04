import prisma from "@lib/prisma";
import { IUserRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IUserRoleRepository";
import { ITenantRepository } from "@/features/tenants/server/domain/interfaces/ITenantRepository";
import { IRoleRepository } from "@/features/auth-rbac/server/domain/interfaces/IRoleRepository";
import { SendNotificationUseCase } from "@/features/Notifications/server/application/use-cases/SendNotificationUseCase";
import {
  generateTenantInvitationEmail,
  generateTenantInvitationPlainText,
} from "@/features/Notifications/server/infrastructure/templates/tenantInvitationTemplate";

export interface InviteUserToTenantInput {
  userId: string;
  tenantId: string;
  roleIds: string[];
  invitedById: string;
  invitedByName: string;
}

export interface InviteUserToTenantOutput {
  success: boolean;
  error?: string;
}

export class InviteUserToTenantUseCase {
  constructor(
    private readonly userRoleRepository: IUserRoleRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly sendNotificationUseCase?: SendNotificationUseCase,
  ) {}

  async execute(
    input: InviteUserToTenantInput,
  ): Promise<InviteUserToTenantOutput> {
    try {
      // 1. Validar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        return {
          success: false,
          error: "Usuario no encontrado",
        };
      }

      // 2. Validar que el tenant existe
      const tenant = await this.tenantRepository.findById(input.tenantId);

      if (!tenant) {
        return {
          success: false,
          error: "Tenant no encontrado",
        };
      }

      // 3. Verificar que el usuario no esté ya en el tenant
      const alreadyInTenant = await this.userRoleRepository.userBelongsToTenant(
        input.userId,
        input.tenantId,
      );

      if (alreadyInTenant) {
        return {
          success: false,
          error: "El usuario ya pertenece a este tenant",
        };
      }

      // 4. Validar que los roles pertenecen al tenant destino
      const roles = await this.roleRepository.findByTenantId(input.tenantId);
      const validRoleIds = roles.map((r) => r.id);
      const invalidRoles = input.roleIds.filter(
        (id) => !validRoleIds.includes(id),
      );

      if (invalidRoles.length > 0) {
        return {
          success: false,
          error: "Uno o más roles no pertenecen al tenant destino",
        };
      }

      //5. Crear UserRole para cada rol seleccionado
      for (const roleId of input.roleIds) {
        await this.userRoleRepository.create({
          userId: input.userId,
          roleId,
          tenantId: input.tenantId,
        });
      }

      // 6. Enviar notificación por email (si está disponible)
      if (this.sendNotificationUseCase && user.email) {
        const roleNames = roles
          .filter((r) => input.roleIds.includes(r.id))
          .map((r) => r.name);

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://peopleflow.tech";

        const emailData = {
          recipientName: user.name || user.email,
          inviterName: input.invitedByName,
          tenantName: tenant.name,
          roles: roleNames,
          appUrl,
        };

        const htmlTemplate = generateTenantInvitationEmail(emailData);
        const plainText = generateTenantInvitationPlainText(emailData);

        const notificationResult = await this.sendNotificationUseCase.execute({
          tenantId: input.tenantId,
          provider: "EMAIL",
          recipient: user.email,
          subject: `Has sido invitado a ${tenant.name}`,
          body: plainText,
          metadata: {
            htmlTemplate: htmlTemplate,
            type: "tenant-invitation",
            userId: input.userId,
            invitedById: input.invitedById,
          },
          priority: "MEDIUM",
          createdById: input.invitedById,
        });

        console.log(
          "Email Data y resultado de la notificacion de invitacion a otro tenant",
        );

        console.log({ notificationResult });

        console.log({ emailData });
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error in InviteUserToTenantUseCase:", error);
      return {
        success: false,
        error: "Error al invitar usuario al tenant",
      };
    }
  }
}
