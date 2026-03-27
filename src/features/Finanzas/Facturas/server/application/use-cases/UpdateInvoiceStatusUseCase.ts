/**
 * Caso de uso: Actualizar el estado de una factura
 *
 * Separado del UpdateInvoiceUseCase porque las transiciones de estado
 * tienen reglas de negocio específicas (PPD → complemento requerido).
 */

import type { InvoiceDTO } from "../../domain/entities/Invoice";
import type { IInvoiceRepository } from "../../domain/interfaces/IInvoiceRepository";
import type { InvoiceStatus } from "@/core/generated/prisma/client";

// --- Input / Output ---

export interface UpdateInvoiceStatusInput {
  id: string;
  tenantId: string;
  status: InvoiceStatus;
  paymentDate?: Date | null;
}

export interface UpdateInvoiceStatusOutput {
  success: boolean;
  data?: InvoiceDTO;
  error?: string;
}

export class UpdateInvoiceStatusUseCase {
  constructor(private readonly repo: IInvoiceRepository) {}

  async execute(input: UpdateInvoiceStatusInput): Promise<UpdateInvoiceStatusOutput> {
    try {
      // 1. Obtener factura existente
      const invoice = await this.repo.findByIdWithTenant(
        input.id,
        input.tenantId,
      );

      if (!invoice) {
        return {
          success: false,
          error: "Factura no encontrada",
        };
      }

      // 2. Validar transición de estado
      if (input.status === "PAGADA") {
        // Verificar si es PPD → necesita complemento
        const hasComplemento = await this.repo.hasComplementoAttachment(
          input.id,
          input.tenantId,
        );

        if (!invoice.canMarkAsPaid(hasComplemento)) {
          return {
            success: false,
            error:
              "Esta factura es PPD; debe ingresar el complemento antes de actualizar el estado",
          };
        }
      }

      // 3. Validar paymentDate para PPD
      if (input.paymentDate !== undefined && input.paymentDate !== null) {
        if (invoice.isPPD()) {
          const hasComplemento = await this.repo.hasComplementoAttachment(
            input.id,
            input.tenantId,
          );

          if (!invoice.canSetFechaPago(hasComplemento)) {
            return {
              success: false,
              error:
                "Debe ingresar el complemento antes de registrar fecha de pago",
            };
          }
        }
      }

      // 4. Actualizar estado
      const updated = await this.repo.updateStatus(
        input.id,
        input.status,
        input.paymentDate ?? null,
        input.tenantId,
      );

      return {
        success: true,
        data: updated.toJSON(),
      };
    } catch (error) {
      console.error("Error in UpdateInvoiceStatusUseCase:", error);

      if (
        error instanceof Error &&
        error.message.includes("not found")
      ) {
        return {
          success: false,
          error: "Factura no encontrada",
        };
      }

      return {
        success: false,
        error: "Error al actualizar el estado de la factura",
      };
    }
  }
}
