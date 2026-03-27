/**
 * Caso de uso: Obtener una factura por ID
 *
 * Sigue el patrón de GetClientByIdUseCase
 */

import type { Invoice } from "../../domain/entities/Invoice";
import type { IInvoiceRepository } from "../../domain/interfaces/IInvoiceRepository";

// --- Input / Output ---

export interface GetInvoiceByIdInput {
  invoiceId: string;
  tenantId: string;
}

export interface GetInvoiceByIdOutput {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

export class GetInvoiceByIdUseCase {
  constructor(private readonly repo: IInvoiceRepository) {}

  async execute(input: GetInvoiceByIdInput): Promise<GetInvoiceByIdOutput> {
    try {
      const invoice = await this.repo.findByIdWithTenant(
        input.invoiceId,
        input.tenantId,
      );

      if (!invoice) {
        return {
          success: false,
          error: "Factura no encontrada",
        };
      }

      return {
        success: true,
        invoice,
      };
    } catch (error) {
      console.error("Error in GetInvoiceByIdUseCase:", error);
      return {
        success: false,
        error: "Error al obtener la factura",
      };
    }
  }
}
