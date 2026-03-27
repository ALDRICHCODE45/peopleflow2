/**
 * Implementación del repositorio de Facturas usando Prisma
 */

import prisma from "@lib/prisma";
import { Invoice } from "../../domain/entities/Invoice";
import type { InvoiceProps } from "../../domain/entities/Invoice";
import type {
  IInvoiceRepository,
  CreateInvoiceData,
  UpdateInvoiceData,
  FindPaginatedInvoicesParams,
  InvoiceFilters,
  PaginatedInvoiceResult,
} from "../../domain/interfaces/IInvoiceRepository";
import type { InvoiceStatus } from "@/core/generated/prisma/client";

/** Include estándar para hidratar relaciones del Invoice */
const INVOICE_INCLUDE = {
  client: { select: { nombre: true } },
  createdBy: { select: { name: true } },
  anticipoInvoice: { select: { folio: true, total: true } },
  attachments: {
    where: { subType: "COMPLEMENTO_PAGO" as const },
    select: { id: true, fileName: true, fileUrl: true, fileSize: true, mimeType: true, createdAt: true },
    take: 1,
  },
} as const;

/**
 * Mapea el resultado crudo de Prisma (con includes) a InvoiceProps del dominio.
 * Centraliza la hidratación para evitar duplicación en cada método.
 */
function toDomain(
  invoice: {
    id: string;
    folio: string;
    type: string;
    paymentType: string;
    clientId: string;
    client?: { nombre: string } | null;
    vacancyId: string | null;
    anticipoInvoiceId: string | null;
    anticipoInvoice?: { folio: string; total: number } | null;
    candidateId: string | null;
    candidateName: string | null;
    hunterId: string | null;
    hunterName: string | null;
    razonSocial: string | null;
    nombreComercial: string | null;
    ubicacion: string | null;
    figura: string | null;
    rfc: string | null;
    codigoPostal: string | null;
    regimen: string | null;
    posicion: string | null;
    currency: string;
    salario: number | null;
    feeType: string | null;
    feeValue: number | null;
    advanceType: string | null;
    advanceValue: number | null;
    subtotal: number;
    ivaRate: number;
    ivaAmount: number;
    anticipoDeduccion: number;
    total: number;
    issuedAt: Date;
    paymentDate: Date | null;
    mesPlacement: Date | null;
    status: string;
    banco: string | null;
    tenantId: string;
    createdById: string | null;
    createdBy?: { name: string | null } | null;
    createdAt: Date;
    updatedAt: Date;
    attachments?: { id: string; fileName: string; fileUrl: string; fileSize: number; mimeType: string; createdAt: Date }[];
  },
): Invoice {
  const complementoAttachment = invoice.attachments?.[0] ?? null;
  const props: InvoiceProps = {
    id: invoice.id,
    folio: invoice.folio,
    type: invoice.type as InvoiceProps["type"],
    paymentType: invoice.paymentType as InvoiceProps["paymentType"],
    clientId: invoice.clientId,
    clientName: invoice.client?.nombre ?? null,
    vacancyId: invoice.vacancyId,
    anticipoInvoiceId: invoice.anticipoInvoiceId,
    anticipoFolio: invoice.anticipoInvoice?.folio ?? null,
    anticipoTotal: invoice.anticipoInvoice?.total ?? null,
    candidateId: invoice.candidateId,
    candidateName: invoice.candidateName,
    hunterId: invoice.hunterId,
    hunterName: invoice.hunterName,
    razonSocial: invoice.razonSocial,
    nombreComercial: invoice.nombreComercial,
    ubicacion: invoice.ubicacion,
    figura: invoice.figura,
    rfc: invoice.rfc,
    codigoPostal: invoice.codigoPostal,
    regimen: invoice.regimen,
    posicion: invoice.posicion,
    currency: invoice.currency as InvoiceProps["currency"],
    salario: invoice.salario,
    feeType: invoice.feeType as InvoiceProps["feeType"],
    feeValue: invoice.feeValue,
    advanceType: (invoice.advanceType as InvoiceProps["advanceType"]) ?? null,
    advanceValue: invoice.advanceValue ?? null,
    subtotal: invoice.subtotal,
    ivaRate: invoice.ivaRate,
    ivaAmount: invoice.ivaAmount,
    anticipoDeduccion: invoice.anticipoDeduccion,
    total: invoice.total,
    issuedAt: invoice.issuedAt,
    paymentDate: invoice.paymentDate,
    mesPlacement: invoice.mesPlacement,
    status: invoice.status as InvoiceProps["status"],
    banco: invoice.banco,
    hasComplemento: !!complementoAttachment,
    complemento: complementoAttachment
      ? {
          id: complementoAttachment.id,
          fileName: complementoAttachment.fileName,
          fileUrl: complementoAttachment.fileUrl,
          fileSize: complementoAttachment.fileSize,
          mimeType: complementoAttachment.mimeType,
          createdAt: complementoAttachment.createdAt,
        }
      : null,
    tenantId: invoice.tenantId,
    createdById: invoice.createdById,
    createdByName: invoice.createdBy?.name ?? null,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
  return new Invoice(props);
}

class PrismaInvoiceRepositoryImpl implements IInvoiceRepository {
  async create(data: CreateInvoiceData): Promise<Invoice> {
    // Uso $transaction para generación atómica de folio + creación de invoice
    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Upsert InvoiceFolioCounter: incrementar counter
      const folioCounter = await tx.invoiceFolioCounter.upsert({
        where: { tenantId: data.tenantId },
        create: {
          tenantId: data.tenantId,
          prefix: "A",
          counter: 1,
        },
        update: {
          counter: { increment: 1 },
        },
      });

      // Formatear folio: prefix + counter (sin padding)
      const folio = `${folioCounter.prefix}${folioCounter.counter}`;

      // 2. Crear Invoice con folio generado
      return tx.invoice.create({
        data: {
          folio,
          type: data.type,
          paymentType: data.paymentType,
          clientId: data.clientId,
          vacancyId: data.vacancyId,
          anticipoInvoiceId: data.anticipoInvoiceId,
          candidateId: data.candidateId,
          candidateName: data.candidateName,
          hunterId: data.hunterId,
          hunterName: data.hunterName,
          razonSocial: data.razonSocial,
          nombreComercial: data.nombreComercial,
          ubicacion: data.ubicacion,
          figura: data.figura,
          rfc: data.rfc,
          codigoPostal: data.codigoPostal,
          regimen: data.regimen,
          posicion: data.posicion,
          currency: data.currency,
          salario: data.salario,
          feeType: data.feeType,
          feeValue: data.feeValue,
          advanceType: data.advanceType,
          advanceValue: data.advanceValue,
          subtotal: data.subtotal,
          ivaRate: data.ivaRate,
          ivaAmount: data.ivaAmount,
          anticipoDeduccion: data.anticipoDeduccion,
          total: data.total,
          issuedAt: data.issuedAt,
          mesPlacement: data.mesPlacement,
          banco: data.banco,
          tenantId: data.tenantId,
          createdById: data.createdById,
        },
        include: INVOICE_INCLUDE,
      });
    });

    return toDomain(invoice);
  }

  async findByIdWithTenant(id: string, tenantId: string): Promise<Invoice | null> {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
      include: INVOICE_INCLUDE,
    });

    if (!invoice) {
      return null;
    }

    return toDomain(invoice);
  }

  async findPaginated(params: FindPaginatedInvoicesParams): Promise<PaginatedInvoiceResult> {
    const { tenantId, skip, take, sorting, filters } = params;
    const where = this.buildWhereClause(tenantId, filters);

    // Whitelist de columnas permitidas para prevenir inyección
    const allowedSortColumns = [
      "folio",
      "total",
      "issuedAt",
      "paymentDate",
      "createdAt",
      "updatedAt",
      "status",
      "type",
    ];

    const orderBy =
      sorting && sorting.length > 0
        ? sorting
            .filter((s) => allowedSortColumns.includes(s.id))
            .map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" as const }];

    const [totalCount, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: INVOICE_INCLUDE,
        orderBy,
        skip,
        take,
      }),
    ]);

    return {
      data: invoices.map(toDomain),
      totalCount,
    };
  }

  async update(id: string, data: UpdateInvoiceData, tenantId: string): Promise<Invoice> {
    // Verificar que la factura pertenece al tenant ANTES de actualizar
    const existing = await prisma.invoice.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Invoice not found or does not belong to tenant");
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(data.candidateId !== undefined && { candidateId: data.candidateId }),
        ...(data.candidateName !== undefined && { candidateName: data.candidateName }),
        ...(data.hunterId !== undefined && { hunterId: data.hunterId }),
        ...(data.hunterName !== undefined && { hunterName: data.hunterName }),
        ...(data.razonSocial !== undefined && { razonSocial: data.razonSocial }),
        ...(data.nombreComercial !== undefined && { nombreComercial: data.nombreComercial }),
        ...(data.ubicacion !== undefined && { ubicacion: data.ubicacion }),
        ...(data.figura !== undefined && { figura: data.figura }),
        ...(data.rfc !== undefined && { rfc: data.rfc }),
        ...(data.codigoPostal !== undefined && { codigoPostal: data.codigoPostal }),
        ...(data.regimen !== undefined && { regimen: data.regimen }),
        ...(data.posicion !== undefined && { posicion: data.posicion }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.salario !== undefined && { salario: data.salario }),
        ...(data.feeType !== undefined && { feeType: data.feeType }),
        ...(data.feeValue !== undefined && { feeValue: data.feeValue }),
        ...(data.advanceType !== undefined && { advanceType: data.advanceType }),
        ...(data.advanceValue !== undefined && { advanceValue: data.advanceValue }),
        ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
        ...(data.ivaRate !== undefined && { ivaRate: data.ivaRate }),
        ...(data.ivaAmount !== undefined && { ivaAmount: data.ivaAmount }),
        ...(data.anticipoDeduccion !== undefined && { anticipoDeduccion: data.anticipoDeduccion }),
        ...(data.total !== undefined && { total: data.total }),
        ...(data.issuedAt !== undefined && { issuedAt: data.issuedAt }),
        ...(data.paymentDate !== undefined && { paymentDate: data.paymentDate }),
        ...(data.mesPlacement !== undefined && { mesPlacement: data.mesPlacement }),
        ...(data.banco !== undefined && { banco: data.banco }),
        ...(data.vacancyId !== undefined && { vacancyId: data.vacancyId }),
      },
      include: INVOICE_INCLUDE,
    });

    return toDomain(invoice);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    // Verificar que la factura pertenece al tenant ANTES de eliminar
    const existing = await prisma.invoice.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Invoice not found or does not belong to tenant");
    }

    await prisma.invoice.delete({
      where: { id },
    });
  }

  async updateStatus(
    id: string,
    status: InvoiceStatus,
    paymentDate: Date | null,
    tenantId: string,
  ): Promise<Invoice> {
    // Verificar que la factura pertenece al tenant ANTES de actualizar
    const existing = await prisma.invoice.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Invoice not found or does not belong to tenant");
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(paymentDate !== undefined && { paymentDate }),
      },
      include: INVOICE_INCLUDE,
    });

    return toDomain(invoice);
  }

  async findAvailableAnticiposByClient(
    clientId: string,
    tenantId: string,
  ): Promise<Invoice[]> {
    // Buscar ANTICIPOs del cliente que NO estén ya vinculados a una LIQUIDACION
    // Un anticipo está consumido si otro invoice tiene anticipoInvoiceId apuntando a él
    const anticipos = await prisma.invoice.findMany({
      where: {
        clientId,
        tenantId,
        type: "ANTICIPO",
        // Excluir anticipos que ya tienen una liquidación vinculada
        liquidacion: null,
      },
      include: INVOICE_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return anticipos.map(toDomain);
  }

  async getNextFolio(tenantId: string): Promise<string> {
    // Preview del siguiente folio sin crear (para display purposes)
    const folioCounter = await prisma.invoiceFolioCounter.findUnique({
      where: { tenantId },
    });

    if (!folioCounter) {
      return "A1";
    }

    return `${folioCounter.prefix}${folioCounter.counter + 1}`;
  }

  async hasComplementoAttachment(
    invoiceId: string,
    tenantId: string,
  ): Promise<boolean> {
    const count = await prisma.attachment.count({
      where: {
        invoiceId,
        tenantId,
        attachableType: "INVOICE",
        subType: "COMPLEMENTO_PAGO",
      },
    });

    return count > 0;
  }

  async findClientBillingSnapshot(clientId: string, tenantId: string) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
      select: {
        id: true,
        tenantId: true,
        currency: true,
        feeType: true,
        feeValue: true,
        advanceType: true,
        advanceValue: true,
        paymentScheme: true,
      },
    });

    if (!client) {
      return null;
    }

    return {
      id: client.id,
      tenantId: client.tenantId,
      currency: client.currency,
      feeType: client.feeType,
      feeValue: client.feeValue,
      advanceType: client.advanceType,
      advanceValue: client.advanceValue,
      paymentScheme: client.paymentScheme,
    };
  }

  async findVacancyBillingSnapshot(vacancyId: string, tenantId: string) {
    const vacancy = await prisma.vacancy.findFirst({
      where: { id: vacancyId, tenantId },
      select: {
        id: true,
        tenantId: true,
        clientId: true,
        isWarranty: true,
      },
    });

    if (!vacancy) {
      return null;
    }

    return {
      id: vacancy.id,
      tenantId: vacancy.tenantId,
      clientId: vacancy.clientId,
      isWarranty: vacancy.isWarranty,
    };
  }

  // --- Métodos privados ---

  private buildWhereClause(
    tenantId: string,
    filters?: InvoiceFilters,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = { tenantId };

    if (filters?.search) {
      where.OR = [
        { folio: { contains: filters.search, mode: "insensitive" } },
        { razonSocial: { contains: filters.search, mode: "insensitive" } },
        { nombreComercial: { contains: filters.search, mode: "insensitive" } },
        { rfc: { contains: filters.search, mode: "insensitive" } },
        { posicion: { contains: filters.search, mode: "insensitive" } },
        { candidateName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      const issuedAtFilter: Record<string, Date> = {};
      if (filters.dateFrom) {
        issuedAtFilter.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        issuedAtFilter.lte = filters.dateTo;
      }
      where.issuedAt = issuedAtFilter;
    }

    return where;
  }
}

export const prismaInvoiceRepository = new PrismaInvoiceRepositoryImpl();
