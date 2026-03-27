/**
 * Caso de uso: Obtener facturas paginadas con filtros
 *
 * Sigue el patrón de GetPaginatedClientsUseCase
 */

import type { Invoice } from "../../domain/entities/Invoice";
import type {
  IInvoiceRepository,
  PaginatedInvoiceResult,
} from "../../domain/interfaces/IInvoiceRepository";
import type { InvoiceStatus, InvoiceType } from "@/core/generated/prisma/client";

// --- Input / Output ---

export interface GetPaginatedInvoicesInput {
  tenantId: string;
  pageIndex: number;
  pageSize: number;
  sorting?: { id: string; desc: boolean }[];
  globalFilter?: string;
  // Filtros específicos
  status?: InvoiceStatus;
  type?: InvoiceType;
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface GetPaginatedInvoicesOutput {
  success: boolean;
  data?: Invoice[];
  totalCount?: number;
  error?: string;
}

export class GetPaginatedInvoicesUseCase {
  constructor(private readonly repo: IInvoiceRepository) {}

  async execute(input: GetPaginatedInvoicesInput): Promise<GetPaginatedInvoicesOutput> {
    try {
      // Validación de parámetros de paginación
      const pageSize = Math.min(Math.max(input.pageSize, 1), 100); // Entre 1 y 100
      const pageIndex = Math.max(input.pageIndex, 0);

      const result: PaginatedInvoiceResult = await this.repo.findPaginated({
        tenantId: input.tenantId,
        skip: pageIndex * pageSize,
        take: pageSize,
        sorting: input.sorting,
        filters: {
          ...(input.globalFilter && { search: input.globalFilter }),
          ...(input.status && { status: input.status }),
          ...(input.type && { type: input.type }),
          ...(input.clientId && { clientId: input.clientId }),
          ...(input.dateFrom && { dateFrom: input.dateFrom }),
          ...(input.dateTo && { dateTo: input.dateTo }),
        },
      });

      return {
        success: true,
        data: result.data,
        totalCount: result.totalCount,
      };
    } catch (error) {
      console.error("Error in GetPaginatedInvoicesUseCase:", error);
      return {
        success: false,
        error: "Error al obtener facturas",
      };
    }
  }
}
