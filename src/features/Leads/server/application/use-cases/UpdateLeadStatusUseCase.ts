import type { ILeadRepository } from "../../domain/interfaces/ILeadRepository";
import type { ILeadStatusHistoryRepository } from "../../domain/interfaces/ILeadStatusHistoryRepository";
import { Lead } from "../../domain/entities/Lead";
import type { LeadStatusType } from "../../domain/value-objects/LeadStatus";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import {
  generateLeadStatusChangeEmail,
  generateLeadStatusChangePlainText,
} from "@features/Notifications/server/infrastructure/templates/leadStatusChangeTemplate";
import prisma from "@lib/prisma";

export interface UpdateLeadStatusInput {
  leadId: string;
  tenantId: string;
  newStatus: LeadStatusType;
  userId: string;
}

export interface UpdateLeadStatusOutput {
  success: boolean;
  lead?: Lead;
  error?: string;
}

export class UpdateLeadStatusUseCase {
  constructor(
    private readonly leadRepository: ILeadRepository,
    private readonly leadStatusHistoryRepository: ILeadStatusHistoryRepository,
  ) {}

  async execute(input: UpdateLeadStatusInput): Promise<UpdateLeadStatusOutput> {
    try {
      // Obtener el lead actual
      const lead = await this.leadRepository.findById(
        input.leadId,
        input.tenantId,
      );

      if (!lead) {
        return {
          success: false,
          error: "Lead no encontrado",
        };
      }

      if (!lead.canEdit()) {
        return {
          success: false,
          error: "El lead no puede ser editado",
        };
      }

      const oldStatus = lead.status;

      // Verificar si ya tiene el mismo estado
      if (oldStatus === input.newStatus) {
        return {
          success: false,
          error: "El lead ya tiene ese estado",
        };
      }

      // Verificar si la transición es válida
      if (!lead.canTransitionTo(input.newStatus)) {
        return {
          success: false,
          error: `Transición de estado no válida: ${oldStatus} → ${input.newStatus}`,
        };
      }

      // Actualizar el estado del lead
      const updatedLead = await this.leadRepository.updateStatus(
        input.leadId,
        input.tenantId,
        input.newStatus,
        input.userId,
      );

      if (!updatedLead) {
        return {
          success: false,
          error: "Error al actualizar estado del lead",
        };
      }

      // Crear registro en el historial de estados
      await this.leadStatusHistoryRepository.create({
        leadId: input.leadId,
        tenantId: input.tenantId,
        previousStatus: oldStatus,
        newStatus: input.newStatus,
        changedById: input.userId,
      });

      // Enviar notificación si el nuevo estado es CONTACTO_CALIDO y hay usuario asignado
      if (input.newStatus === "CONTACTO_CALIDO" && updatedLead.assignedToId) {
        try {
          const assignedUser = await prisma.user.findUnique({
            where: { id: updatedLead.assignedToId },
            select: { email: true, name: true },
          });

          if (assignedUser?.email) {
            const notificationUseCase = new SendNotificationUseCase(
              prismaNotificationRepository,
              [emailProvider],
            );

            const emailData = {
              recipientName: assignedUser.name || "Usuario",
              leadName: updatedLead.companyName,
              newStatus: "Contacto Calido",
              appUrl: "https://peopleflow.space",
            };

            const htmlTemplate = generateLeadStatusChangeEmail(emailData);
            const plainTextBody = generateLeadStatusChangePlainText(emailData);

            await notificationUseCase.execute({
              tenantId: input.tenantId,
              provider: "EMAIL",
              recipient: "nocheblanca92@gmail.com",
              subject: `Lead "${updatedLead.companyName}" es ahora Contacto Calido`,
              body: plainTextBody,
              priority: "HIGH",
              metadata: {
                leadId: updatedLead.id,
                leadName: updatedLead.companyName,
                triggerEvent: "LEAD_STATUS_CHANGE",
                newStatus: "CONTACTO_CALIDO",
                htmlTemplate: htmlTemplate,
              },
              createdById: input.userId,
            });
          }
        } catch (notificationError) {
          // Log error but don't fail the status update
          console.error("Error sending notification:", notificationError);
        }
      }

      return {
        success: true,
        lead: updatedLead,
      };
    } catch (error) {
      console.error("Error in UpdateLeadStatusUseCase:", error);
      return {
        success: false,
        error: "Error al actualizar estado del lead",
      };
    }
  }
}
