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
      // Obtener el lead actual (lectura fuera de transacción — validaciones previas)
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

      // TRANSACCIÓN: Envolver operaciones críticas para garantizar consistencia
      // Si falla cualquier paso, todos se revierten
      const updatedLead = await prisma.$transaction(async (tx) => {
        // 1. Actualizar el estado del lead
        const statusResult = await tx.lead.updateMany({
          where: { id: input.leadId, tenantId: input.tenantId, isDeleted: false },
          data: { status: input.newStatus },
        });

        if (statusResult.count === 0) {
          throw new Error("Error al actualizar estado del lead");
        }

        // 2. Crear registro en el historial de estados
        await tx.leadStatusHistory.create({
          data: {
            leadId: input.leadId,
            tenantId: input.tenantId,
            previousStatus: oldStatus,
            newStatus: input.newStatus,
            changedById: input.userId,
          },
        });

        // 3. Crear cliente automáticamente al llegar a POSICIONES_ASIGNADAS
        if (input.newStatus === "POSICIONES_ASIGNADAS") {
          const existingClient = await tx.client.findUnique({
            where: { leadId: input.leadId },
          });

          if (!existingClient) {
            await tx.client.create({
              data: {
                nombre: lead.companyName,
                leadId: lead.id,
                generadorId: lead.assignedToId,
                origenId: lead.originId,
                tenantId: input.tenantId,
                createdById: input.userId,
              },
            });
          }
        }

        // 4. Re-fetch el lead actualizado con relaciones
        const freshLead = await tx.lead.findFirst({
          where: { id: input.leadId, tenantId: input.tenantId },
          include: {
            sector: { select: { name: true } },
            subsector: { select: { name: true } },
            origin: { select: { name: true } },
            assignedTo: { select: { name: true } },
            createdBy: { select: { name: true } },
            _count: { select: { contacts: true } },
          },
        });

        return freshLead;
      });

      if (!updatedLead) {
        return {
          success: false,
          error: "Error al actualizar estado del lead",
        };
      }

      // Construir Lead domain object desde el resultado de la transacción
      const resultLead = this.leadRepository.findById(input.leadId, input.tenantId);

      // SIDE-EFFECTS (no-críticos): Notificaciones fuera de la transacción
      // Enviar notificación cuando el lead se convierte a cliente (POSICIONES_ASIGNADAS)
      if (
        input.newStatus === "POSICIONES_ASIGNADAS" &&
        updatedLead.assignedToId
      ) {
        this.sendConversionNotification(input, updatedLead).catch((err) =>
          console.error("Error sending conversion notification:", err),
        );
      }

      // Enviar notificación si el nuevo estado es CONTACTO_CALIDO y hay usuario asignado
      if (input.newStatus === "CONTACTO_CALIDO" && updatedLead.assignedToId) {
        this.sendStatusChangeNotification(input, updatedLead).catch((err) =>
          console.error("Error sending notification:", err),
        );
      }

      const finalLead = await resultLead;

      return {
        success: true,
        lead: finalLead ?? undefined,
      };
    } catch (error) {
      console.error("Error in UpdateLeadStatusUseCase:", error);
      return {
        success: false,
        error: "Error al actualizar estado del lead",
      };
    }
  }

  private async sendConversionNotification(
    input: UpdateLeadStatusInput,
    lead: { assignedToId: string | null; companyName: string; id: string },
  ): Promise<void> {
    if (!lead.assignedToId) return;

    const assignedUser = await prisma.user.findUnique({
      where: { id: lead.assignedToId },
      select: { email: true, name: true },
    });

    if (!assignedUser?.email) return;

    const notificationUseCase = new SendNotificationUseCase(
      prismaNotificationRepository,
      [emailProvider],
    );

    const emailData = {
      recipientName: assignedUser.name || "Usuario",
      leadName: lead.companyName,
      appUrl: "https://www.peopleflow.tech",
    };

    const htmlTemplate = generateLeadToClientConversionEmail(emailData);
    const plainTextBody = generateLeadToClientConversionPlainText(emailData);

    await notificationUseCase.execute({
      tenantId: input.tenantId,
      provider: "EMAIL",
      recipient: "nocheblanca92@gmail.com",
      subject: `Lead "${lead.companyName}" es ahora un Cliente`,
      body: plainTextBody,
      priority: "HIGH",
      metadata: {
        leadId: lead.id,
        leadName: lead.companyName,
        triggerEvent: "LEAD_TO_CLIENT_CONVERSION",
        newStatus: "POSICIONES_ASIGNADAS",
        htmlTemplate: htmlTemplate,
      },
      createdById: input.userId,
    });
  }

  private async sendStatusChangeNotification(
    input: UpdateLeadStatusInput,
    lead: { assignedToId: string | null; companyName: string; id: string },
  ): Promise<void> {
    if (!lead.assignedToId) return;

    const assignedUser = await prisma.user.findUnique({
      where: { id: lead.assignedToId },
      select: { email: true, name: true },
    });

    if (!assignedUser?.email) return;

    const notificationUseCase = new SendNotificationUseCase(
      prismaNotificationRepository,
      [emailProvider],
    );

    const emailData = {
      recipientName: assignedUser.name || "Usuario",
      leadName: lead.companyName,
      newStatus: "Contacto Calido",
      appUrl: "https://www.peopleflow.tech",
    };

    const htmlTemplate = generateLeadStatusChangeEmail(emailData);
    const plainTextBody = generateLeadStatusChangePlainText(emailData);

    await notificationUseCase.execute({
      tenantId: input.tenantId,
      provider: "EMAIL",
      recipient: "salvador@topsales.expert",
      subject: `Lead "${lead.companyName}" es ahora Contacto Calido`,
      body: plainTextBody,
      priority: "HIGH",
      metadata: {
        leadId: lead.id,
        leadName: lead.companyName,
        triggerEvent: "LEAD_STATUS_CHANGE",
        newStatus: "CONTACTO_CALIDO",
        htmlTemplate: htmlTemplate,
      },
      createdById: input.userId,
    });
  }
}
