import type { ILeadRepository } from "../../domain/interfaces/ILeadRepository";
import type { ILeadStatusHistoryRepository } from "../../domain/interfaces/ILeadStatusHistoryRepository";
import type { IClientRepository } from "@features/Finanzas/Clientes/server/domain/interfaces/IClientRepository";
import { Lead } from "../../domain/entities/Lead";
import type { LeadStatusType } from "../../domain/value-objects/LeadStatus";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import {
  generateLeadStatusChangeEmail,
  generateLeadStatusChangePlainText,
} from "@features/Notifications/server/infrastructure/templates/leadStatusChangeTemplate";
import {
  generateLeadToClientConversionEmail,
  generateLeadToClientConversionPlainText,
} from "@features/Notifications/server/infrastructure/templates/leadToClientConversionTemplate";
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
  missingFields?: string[];
}

// Estados que requieren datos completos
const STATES_REQUIRING_COMPLETE_DATA: LeadStatusType[] = [
  "CONTACTO_CALIDO",
  "CITA_AGENDADA",
  "CITA_ATENDIDA",
  "CITA_VALIDADA",
  "POSICIONES_ASIGNADAS",
  "STAND_BY",
];

export class UpdateLeadStatusUseCase {
  constructor(
    private readonly leadRepository: ILeadRepository,
    private readonly leadStatusHistoryRepository: ILeadStatusHistoryRepository,
    private readonly clientRepository?: IClientRepository,
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

      // Verificar datos completos para estados avanzados
      if (STATES_REQUIRING_COMPLETE_DATA.includes(input.newStatus)) {
        if (!lead.isDataComplete()) {
          const missingFields = lead.getMissingFields();
          return {
            success: false,
            error: "INCOMPLETE_DATA",
            missingFields,
          };
        }
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

      // Crear cliente automáticamente al llegar a POSICIONES_ASIGNADAS
      if (input.newStatus === "POSICIONES_ASIGNADAS" && this.clientRepository) {
        try {
          const existingClient = await this.clientRepository.findByLeadId(
            input.leadId,
            input.tenantId,
          );

          if (!existingClient) {
            await this.clientRepository.create({
              nombre: updatedLead.companyName,
              leadId: updatedLead.id,
              generadorId: updatedLead.assignedToId,
              origenId: updatedLead.originId,
              tenantId: input.tenantId,
              createdById: input.userId,
            });
          }
        } catch (clientError) {
          // Log error but don't fail the status update
          console.error("Error creating client from lead:", clientError);
        }
      }

      // Enviar notificación cuando el lead se convierte a cliente (POSICIONES_ASIGNADAS)
      if (
        input.newStatus === "POSICIONES_ASIGNADAS" &&
        updatedLead.assignedToId
      ) {
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
              appUrl: "https://peopleflow.space",
            };

            const htmlTemplate =
              generateLeadToClientConversionEmail(emailData);
            const plainTextBody =
              generateLeadToClientConversionPlainText(emailData);

            await notificationUseCase.execute({
              tenantId: input.tenantId,
              provider: "EMAIL",
              recipient: "nocheblanca92@gmail.com",
              subject: `Lead "${updatedLead.companyName}" es ahora un Cliente`,
              body: plainTextBody,
              priority: "HIGH",
              metadata: {
                leadId: updatedLead.id,
                leadName: updatedLead.companyName,
                triggerEvent: "LEAD_TO_CLIENT_CONVERSION",
                newStatus: "POSICIONES_ASIGNADAS",
                htmlTemplate: htmlTemplate,
              },
              createdById: input.userId,
            });
          }
        } catch (notificationError) {
          // Log error but don't fail the status update
          console.error(
            "Error sending conversion notification:",
            notificationError,
          );
        }
      }

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
              recipient: "salvador@topsales.expert",
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
