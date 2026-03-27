/**
 * Caso de uso: Obtener anticipos disponibles para un cliente
 *
 * Retorna facturas de tipo ANTICIPO que NO están vinculadas a una LIQUIDACION.
 * Usado por el formulario de creación de LIQUIDACION para el selector de anticipos.
 */

import type { Invoice } from "../../domain/entities/Invoice";
import type { IInvoiceRepository } from "../../domain/interfaces/IInvoiceRepository";

// --- Input / Output ---

export interface GetAvailableAnticiposInput {
  clientId: string;
  tenantId: string;
}

export interface GetAvailableAnticiposOutput {
  success: boolean;
  data?: Invoice[];
  error?: string;
}

export class GetAvailableAnticiposUseCase {
  constructor(private readonly repo: IInvoiceRepository) {}

  async execute(input: GetAvailableAnticiposInput): Promise<GetAvailableAnticiposOutput> {
    try {
      if (!input.clientId) {
        return {
          success: false,
          error: "Debe especificar un cliente",
        };
      }

      const anticipos = await this.repo.findAvailableAnticiposByClient(
        input.clientId,
        input.tenantId,
      );

      return {
        success: true,
        data: anticipos,
      };
    } catch (error) {
      console.error("Error in GetAvailableAnticiposUseCase:", error);
      return {
        success: false,
        error: "Error al obtener anticipos disponibles",
      };
    }
  }
}
