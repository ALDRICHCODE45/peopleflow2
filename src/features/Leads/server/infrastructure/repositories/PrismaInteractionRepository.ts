import prisma from "@lib/prisma";
import { Interaction, type InteractionProps } from "../../domain/entities/Interaction";
import type { InteractionType } from "../../../frontend/types";
import type {
  IInteractionRepository,
  CreateInteractionData,
  UpdateInteractionData,
} from "../../domain/interfaces/IInteractionRepository";

/**
 * Implementación del repositorio de Interactions usando Prisma
 * Capa de infraestructura - acceso a datos
 */
export class PrismaInteractionRepository implements IInteractionRepository {
  private mapToDomain(interaction: {
    id: string;
    type: string;
    subject: string;
    content: string | null;
    date: Date;
    contactId: string;
    createdById: string;
    createdBy?: { name: string | null } | null;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Interaction {
    const props: InteractionProps = {
      id: interaction.id,
      type: interaction.type as InteractionType,
      subject: interaction.subject,
      content: interaction.content,
      date: interaction.date,
      contactId: interaction.contactId,
      createdById: interaction.createdById,
      createdByName: interaction.createdBy?.name ?? undefined,
      tenantId: interaction.tenantId,
      createdAt: interaction.createdAt,
      updatedAt: interaction.updatedAt,
    };
    return new Interaction(props);
  }

  async findById(id: string, tenantId: string): Promise<Interaction | null> {
    const interaction = await prisma.interaction.findFirst({
      where: { id, tenantId },
      include: { createdBy: { select: { name: true } } },
    });

    if (!interaction) return null;
    return this.mapToDomain(interaction);
  }

  async findByContactId(contactId: string, tenantId: string): Promise<Interaction[]> {
    const interactions = await prisma.interaction.findMany({
      where: { contactId, tenantId },
      include: { createdBy: { select: { name: true } } },
      orderBy: { date: "desc" },
    });

    return interactions.map((interaction) => this.mapToDomain(interaction));
  }

  async findByLeadId(leadId: string, tenantId: string): Promise<Interaction[]> {
    const interactions = await prisma.interaction.findMany({
      where: {
        tenantId,
        contact: { leadId },
      },
      include: { createdBy: { select: { name: true } } },
      orderBy: { date: "desc" },
    });

    return interactions.map((interaction) => this.mapToDomain(interaction));
  }

  async create(data: CreateInteractionData): Promise<Interaction> {
    const interaction = await prisma.interaction.create({
      data: {
        type: data.type,
        subject: data.subject,
        content: data.content || null,
        date: data.date || new Date(),
        contactId: data.contactId,
        createdById: data.createdById,
        tenantId: data.tenantId,
      },
      include: { createdBy: { select: { name: true } } },
    });

    return this.mapToDomain(interaction);
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateInteractionData
  ): Promise<Interaction | null> {
    try {
      const interaction = await prisma.interaction.update({
        where: { id, tenantId },
        data: {
          ...(data.type !== undefined && { type: data.type }),
          ...(data.subject !== undefined && { subject: data.subject }),
          ...(data.content !== undefined && { content: data.content }),
          ...(data.date !== undefined && { date: data.date }),
        },
        include: { createdBy: { select: { name: true } } },
      });

      return this.mapToDomain(interaction);
    } catch (error) {
      console.error("Error updating interaction:", error);
      return null;
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      const result = await prisma.interaction.deleteMany({
        where: { id, tenantId },
      });

      return result.count > 0;
    } catch (error) {
      console.error("Error deleting interaction:", error);
      return false;
    }
  }

  async countByContactId(contactId: string, tenantId: string): Promise<number> {
    return prisma.interaction.count({
      where: { contactId, tenantId },
    });
  }
}

// Singleton instance
export const prismaInteractionRepository = new PrismaInteractionRepository();
