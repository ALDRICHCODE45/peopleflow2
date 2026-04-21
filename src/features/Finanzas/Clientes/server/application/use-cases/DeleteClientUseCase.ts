/**
 * Caso de uso: Eliminar un cliente
 *
 * Validaciones:
 * - Pre-check de vacantes y facturas asociadas
 * - Mensajes de error específicos por tipo de dependencia
 * - Fallback para FK constraint residuales
 */

import type { IClientRepository } from "../../domain/interfaces/IClientRepository";

// --- Input / Output ---

export interface DeleteClientInput {
  id: string;
  tenantId: string;
}

export interface DeleteClientOutput {
  success: boolean;
  error?: string;
}

export class DeleteClientUseCase {
  constructor(private readonly repo: IClientRepository) {}

  async execute(input: DeleteClientInput): Promise<DeleteClientOutput> {
    try {
      // 1. Verificar que el cliente existe
      const client = await this.repo.findByIdWithTenant(
        input.id,
        input.tenantId,
      );

      if (!client) {
        return {
          success: false,
          error: "Cliente no encontrado",
        };
      }

      // 2. Pre-check: contar vacantes asociadas
      const vacancyCount = await this.repo.countVacanciesByClientId(
        input.id,
        input.tenantId,
      );

      // 3. Pre-check: contar facturas asociadas
      const invoiceCount = await this.repo.countInvoicesByClientId(
        input.id,
        input.tenantId,
      );

      // 4. Validar dependencias y retornar mensajes específicos
      if (vacancyCount > 0 && invoiceCount > 0) {
        return {
          success: false,
          error: `No se puede eliminar el cliente porque tiene ${vacancyCount} vacante${vacancyCount === 1 ? "" : "s"} y ${invoiceCount} factura${invoiceCount === 1 ? "" : "s"} asociadas`,
        };
      }

      if (vacancyCount > 0) {
        return {
          success: false,
          error: `No se puede eliminar el cliente porque tiene ${vacancyCount} vacante${vacancyCount === 1 ? "" : "s"} asociada${vacancyCount === 1 ? "" : "s"}`,
        };
      }

      if (invoiceCount > 0) {
        return {
          success: false,
          error: `No se puede eliminar el cliente porque tiene ${invoiceCount} factura${invoiceCount === 1 ? "" : "s"} asociada${invoiceCount === 1 ? "" : "s"}`,
        };
      }

      // 5. Intentar eliminación con try/catch para FK residuales
      try {
        const deleted = await this.repo.delete(input.id, input.tenantId);

        if (!deleted) {
          return {
            success: false,
            error: "No se pudo eliminar el cliente",
          };
        }

        return { success: true };
      } catch (deleteError) {
        // FK constraint fallback
        if (
          deleteError instanceof Error &&
          (deleteError.message.includes("Restrict") ||
            deleteError.message.includes("foreign key") ||
            deleteError.message.includes("constraint"))
        ) {
          return {
            success: false,
            error:
              "No se puede eliminar el cliente porque tiene registros vinculados",
          };
        }
        throw deleteError;
      }
    } catch (error) {
      console.error("Error in DeleteClientUseCase:", error);

      // FK constraint fallback (outer catch)
      if (
        error instanceof Error &&
        (error.message.includes("Restrict") ||
          error.message.includes("foreign key") ||
          error.message.includes("constraint"))
      ) {
        return {
          success: false,
          error:
            "No se puede eliminar el cliente porque tiene registros vinculados",
        };
      }

      return {
        success: false,
        error: "Error al eliminar el cliente",
      };
    }
  }
}
