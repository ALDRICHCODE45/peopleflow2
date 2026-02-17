import prisma from "@lib/prisma";
import { Contact, type ContactProps } from "../../domain/entities/Contact";
import type {
  IContactRepository,
  CreateContactData,
  UpdateContactData,
} from "../../domain/interfaces/IContactRepository";
import { LeadStatus } from "@/features/Leads/frontend/types";

/**
 * Implementación del repositorio de Contacts usando Prisma
 * Capa de infraestructura - acceso a datos
 */
export class PrismaContactRepository implements IContactRepository {
  private mapToDomain(contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    position: string | null;
    linkedInUrl: string | null;
    isPrimary: boolean;
    notes: string | null;
    tag: LeadStatus | null;
    leadId: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Contact {
    const props: ContactProps = {
      tag: contact.tag,
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      position: contact.position,
      linkedInUrl: contact.linkedInUrl,
      isPrimary: contact.isPrimary,
      notes: contact.notes,
      leadId: contact.leadId,
      tenantId: contact.tenantId,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
    return new Contact(props);
  }

  async findById(id: string, tenantId: string): Promise<Contact | null> {
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId },
    });

    if (!contact) return null;
    return this.mapToDomain(contact);
  }

  async findByLeadId(leadId: string, tenantId: string): Promise<Contact[]> {
    const contacts = await prisma.contact.findMany({
      where: { leadId, tenantId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    return contacts.map((contact) => this.mapToDomain(contact));
  }

  async create(data: CreateContactData): Promise<Contact> {
    // Si es el primer contacto o está marcado como primario, asegurarse de que sea el único primario
    if (data.isPrimary) {
      await prisma.contact.updateMany({
        where: { leadId: data.leadId, tenantId: data.tenantId },
        data: { isPrimary: false },
      });
    }

    // Verificar si es el primer contacto del lead
    const existingContacts = await prisma.contact.count({
      where: { leadId: data.leadId, tenantId: data.tenantId },
    });

    const contact = await prisma.contact.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        position: data.position || null,
        linkedInUrl: data.linkedInUrl || null,
        isPrimary: data.isPrimary ?? existingContacts === 0, // Primer contacto es primario
        notes: data.notes || null,
        leadId: data.leadId,
        tenantId: data.tenantId,
      },
    });

    return this.mapToDomain(contact);
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateContactData,
  ): Promise<Contact | null> {
    try {
      // Si se está marcando como primario, quitar primario de los demás
      if (data.isPrimary === true) {
        const contact = await prisma.contact.findFirst({
          where: { id, tenantId },
        });

        if (contact) {
          await prisma.contact.updateMany({
            where: { leadId: contact.leadId, tenantId, id: { not: id } },
            data: { isPrimary: false },
          });
        }
      }

      const result = await prisma.contact.updateMany({
        where: { id, tenantId },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.position !== undefined && { position: data.position }),
          ...(data.linkedInUrl !== undefined && {
            linkedInUrl: data.linkedInUrl,
          }),
          ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.tag !== undefined && { tag: data.tag }),
        },
      });

      if (result.count === 0) {
        return null;
      }

      const contact = await prisma.contact.findFirst({
        where: { id, tenantId },
      });

      if (!contact) return null;
      return this.mapToDomain(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      return null;
    }
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    try {
      const result = await prisma.contact.deleteMany({
        where: { id, tenantId },
      });

      return result.count > 0;
    } catch (error) {
      console.error("Error deleting contact:", error);
      return false;
    }
  }

  async setPrimary(
    contactId: string,
    leadId: string,
    tenantId: string,
  ): Promise<boolean> {
    try {
      // Quitar primario de todos los contactos del lead
      await prisma.contact.updateMany({
        where: { leadId, tenantId },
        data: { isPrimary: false },
      });

      // Establecer el contacto como primario
      const result = await prisma.contact.updateMany({
        where: { id: contactId, leadId, tenantId },
        data: { isPrimary: true },
      });

      return result.count > 0;
    } catch (error) {
      console.error("Error setting primary contact:", error);
      return false;
    }
  }

  async countByLeadId(leadId: string, tenantId: string): Promise<number> {
    return prisma.contact.count({
      where: { leadId, tenantId },
    });
  }
}

// Singleton instance
export const prismaContactRepository = new PrismaContactRepository();
