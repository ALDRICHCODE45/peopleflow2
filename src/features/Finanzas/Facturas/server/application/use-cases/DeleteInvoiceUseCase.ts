/**
 * Caso de uso: Eliminar una factura
 *
 * Validaciones:
 * - Si es ANTICIPO y está vinculada a una LIQUIDACION, prevenir eliminación
 */

import type { IInvoiceRepository } from "../../domain/interfaces/IInvoiceRepository";

// --- Input / Output ---

export interface DeleteInvoiceInput {
  id: string;
  tenantId: string;
}

export interface DeleteInvoiceOutput {
  success: boolean;
  error?: string;
}

export class DeleteInvoiceUseCase {
  constructor(private readonly repo: IInvoiceRepository) {}

  async execute(input: DeleteInvoiceInput): Promise<DeleteInvoiceOutput> {
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

      // 2. Validar: si es ANTICIPO, verificar que no esté vinculada a una LIQUIDACION
      // La relación inversa `liquidacion` existiría si otro invoice tiene anticipoInvoiceId = this.id
      // La restricción FK (onDelete: Restrict) en el schema previene esto a nivel DB,
      // pero validamos aquí para dar un mensaje de error claro
      if (invoice.isAnticipo()) {
        try {
          await this.repo.delete(input.id, input.tenantId);
        } catch (deleteError) {
          if (
            deleteError instanceof Error &&
            (deleteError.message.includes("Restrict") ||
              deleteError.message.includes("foreign key") ||
              deleteError.message.includes("constraint"))
          ) {
            return {
              success: false,
              error:
                "No se puede eliminar este anticipo porque está vinculado a una liquidación",
            };
          }
          throw deleteError;
        }

        return { success: true };
      }

      // 3. Eliminar factura
      await this.repo.delete(input.id, input.tenantId);

      return { success: true };
    } catch (error) {
      console.error("Error in DeleteInvoiceUseCase:", error);

      if (
        error instanceof Error &&
        (error.message.includes("Restrict") ||
          error.message.includes("foreign key") ||
          error.message.includes("constraint"))
      ) {
        return {
          success: false,
          error:
            "No se puede eliminar esta factura porque tiene registros vinculados",
        };
      }

      return {
        success: false,
        error: "Error al eliminar la factura",
      };
    }
  }
}
