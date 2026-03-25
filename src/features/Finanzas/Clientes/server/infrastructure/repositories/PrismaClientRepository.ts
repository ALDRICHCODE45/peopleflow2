/**
 * Implementación del repositorio de Clientes usando Prisma
 */

import prisma from "@lib/prisma";
import { Client } from "../../domain/entities/Client";
import type { ClientProps } from "../../domain/entities/Client";
import type {
  IClientRepository,
  CreateClientData,
  UpdateClientData,
  FindPaginatedClientsParams,
  FindClientsFilters,
  PaginatedClientResult,
} from "../../domain/interfaces/IClientRepository";

/** Include estándar para hidratar relaciones del Client */
const CLIENT_INCLUDE = {
  generador: { select: { name: true } },
  origen: { select: { name: true } },
  createdBy: { select: { name: true } },
} as const;

/**
 * Mapea el resultado crudo de Prisma (con includes) a ClientProps del dominio.
 * Centraliza la hidratación para evitar duplicación en cada método.
 */
function toDomain(
  client: {
    id: string;
    nombre: string;
    leadId: string | null;
    generadorId: string | null;
    generador?: { name: string | null } | null;
    origenId: string | null;
    origen?: { name: string } | null;
    tenantId: string;
    createdById: string | null;
    createdBy?: { name: string | null } | null;
    createdAt: Date;
    updatedAt: Date;
    currency: string | null;
    initialPositions: number | null;
    paymentScheme: string | null;
    advanceType: string | null;
    advanceValue: number | null;
    feeType: string | null;
    feeValue: number | null;
    creditDays: number | null;
    cancellationFee: number | null;
    warrantyMonths: number | null;
    // Datos Fiscales
    rfc: string | null;
    codigoPostalFiscal: string | null;
    nombreComercial: string | null;
    ubicacion: string | null;
    regimenFiscal: string | null;
    figura: string | null;
  },
): Client {
  const props: ClientProps = {
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
    // Condiciones comerciales — cast seguro porque Prisma genera los mismos enums
    currency: client.currency as ClientProps["currency"],
    initialPositions: client.initialPositions,
    paymentScheme: client.paymentScheme as ClientProps["paymentScheme"],
    advanceType: client.advanceType as ClientProps["advanceType"],
    advanceValue: client.advanceValue,
    feeType: client.feeType as ClientProps["feeType"],
    feeValue: client.feeValue,
    creditDays: client.creditDays,
    cancellationFee: client.cancellationFee,
    warrantyMonths: client.warrantyMonths,
    // Datos Fiscales
    rfc: client.rfc,
    codigoPostalFiscal: client.codigoPostalFiscal,
    nombreComercial: client.nombreComercial,
    ubicacion: client.ubicacion,
    regimenFiscal: client.regimenFiscal,
    figura: client.figura,
  };
  return new Client(props);
}

class PrismaClientRepositoryImpl implements IClientRepository {
  async create(data: CreateClientData): Promise<Client> {
    const terms = data.commercialTerms;

    const client = await prisma.client.create({
      data: {
        nombre: data.nombre,
        leadId: data.leadId ?? undefined,
        generadorId: data.generadorId,
        origenId: data.origenId,
        tenantId: data.tenantId,
        createdById: data.createdById,
        // Condiciones comerciales (opcionales)
        ...(terms && {
          currency: terms.currency,
          initialPositions: terms.initialPositions,
          paymentScheme: terms.paymentScheme,
          advanceType: terms.advanceType,
          advanceValue: terms.advanceValue,
          feeType: terms.feeType,
          feeValue: terms.feeValue,
          creditDays: terms.creditDays,
          cancellationFee: terms.cancellationFee,
          warrantyMonths: terms.warrantyMonths,
        }),
      },
      include: CLIENT_INCLUDE,
    });

    return toDomain(client);
  }

  async findByIdWithTenant(id: string, tenantId: string): Promise<Client | null> {
    const client = await prisma.client.findFirst({
      where: { id, tenantId },
      include: CLIENT_INCLUDE,
    });

    if (!client) {
      return null;
    }

    return toDomain(client);
  }

  async findByLeadId(leadId: string, tenantId: string): Promise<Client | null> {
    const client = await prisma.client.findFirst({
      where: { leadId, tenantId },
      include: CLIENT_INCLUDE,
    });

    if (!client) {
      return null;
    }

    return toDomain(client);
  }

  async findAllByTenantId(tenantId: string): Promise<{ id: string; nombre: string; currency: string | null }[]> {
    return prisma.client.findMany({
      where: { tenantId },
      select: { id: true, nombre: true, currency: true },
      orderBy: { nombre: "asc" },
    });
  }

  async findPaginated(params: FindPaginatedClientsParams): Promise<PaginatedClientResult> {
    const { tenantId, skip, take, sorting, filters } = params;
    const where = this.buildWhereClause(tenantId, filters);

    // Whitelist de columnas permitidas para prevenir inyección
    const allowedSortColumns = ["nombre", "creditDays", "createdAt", "updatedAt"];

    const orderBy =
      sorting && sorting.length > 0
        ? sorting
            .filter((s) => allowedSortColumns.includes(s.id))
            .map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" as const }];

    const [totalCount, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        include: CLIENT_INCLUDE,
        orderBy,
        skip,
        take,
      }),
    ]);

    return {
      data: clients.map(toDomain),
      totalCount,
    };
  }

  private buildWhereClause(
    tenantId: string,
    filters?: FindClientsFilters,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = { tenantId };

    if (filters?.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  async findAllWithDetailsByTenantId(tenantId: string): Promise<Client[]> {
    const clients = await prisma.client.findMany({
      where: { tenantId },
      include: CLIENT_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return clients.map(toDomain);
  }

  async update(id: string, data: UpdateClientData, tenantId: string): Promise<Client> {
    // Verificar que el client pertenece al tenant ANTES de actualizar
    const existing = await prisma.client.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Client not found or does not belong to tenant");
    }

    const terms = data.commercialTerms;
    const fiscal = data.fiscalData;

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        // Condiciones comerciales
        ...(terms && {
          currency: terms.currency,
          initialPositions: terms.initialPositions,
          paymentScheme: terms.paymentScheme,
          advanceType: terms.advanceType,
          advanceValue: terms.advanceValue,
          feeType: terms.feeType,
          feeValue: terms.feeValue,
          creditDays: terms.creditDays,
          cancellationFee: terms.cancellationFee,
          warrantyMonths: terms.warrantyMonths,
        }),
        // Datos Fiscales
        ...(fiscal && {
          rfc: fiscal.rfc,
          codigoPostalFiscal: fiscal.codigoPostalFiscal,
          nombreComercial: fiscal.nombreComercial,
          ubicacion: fiscal.ubicacion,
          regimenFiscal: fiscal.regimenFiscal,
          figura: fiscal.figura,
        }),
      },
      include: CLIENT_INCLUDE,
    });

    return toDomain(client);
  }
}

export const prismaClientRepository = new PrismaClientRepositoryImpl();
