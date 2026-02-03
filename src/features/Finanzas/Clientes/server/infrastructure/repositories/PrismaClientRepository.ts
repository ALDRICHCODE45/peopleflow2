/**
 * Implementación del repositorio de Clientes usando Prisma
 */

import prisma from "@lib/prisma";
import { Client } from "../../domain/entities/Client";
import type {
  IClientRepository,
  CreateClientData,
} from "../../domain/interfaces/IClientRepository";

class PrismaClientRepositoryImpl implements IClientRepository {
  async create(data: CreateClientData): Promise<Client> {
    const client = await prisma.client.create({
      data: {
        nombre: data.nombre,
        leadId: data.leadId,
        generadorId: data.generadorId,
        origenId: data.origenId,
        tenantId: data.tenantId,
        createdById: data.createdById,
      },
      include: {
        generador: {
          select: { name: true },
        },
        origen: {
          select: { name: true },
        },
        createdBy: {
          select: { name: true },
        },
      },
    });

    return new Client({
      id: client.id,
      nombre: client.nombre,
      leadId: client.leadId,
      generadorId: client.generadorId,
      generadorName: client.generador?.name,
      origenId: client.origenId,
      origenName: client.origen?.name,
      tenantId: client.tenantId,
      createdById: client.createdById,
      createdByName: client.createdBy?.name,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    });
  }

  async findByLeadId(leadId: string, tenantId: string): Promise<Client | null> {
    const client = await prisma.client.findFirst({
      where: {
        leadId,
        tenantId,
      },
      include: {
        generador: {
          select: { name: true },
        },
        origen: {
          select: { name: true },
        },
        createdBy: {
          select: { name: true },
        },
      },
    });

    if (!client) {
      return null;
    }

    return new Client({
      id: client.id,
      nombre: client.nombre,
      leadId: client.leadId,
      generadorId: client.generadorId,
      generadorName: client.generador?.name,
      origenId: client.origenId,
      origenName: client.origen?.name,
      tenantId: client.tenantId,
      createdById: client.createdById,
      createdByName: client.createdBy?.name,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    });
  }
}

export const prismaClientRepository = new PrismaClientRepositoryImpl();
