"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { prismaInvoiceRepository } from "../../infrastructure/repositories/PrismaInvoiceRepository";
import { DeleteInvoiceUseCase } from "../../application/use-cases/DeleteInvoiceUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

// --- Output ---

export interface DeleteInvoiceActionResult {
  error: string | null;
  success: boolean;
}

/**
 * Elimina una factura existente
 */
export async function deleteInvoiceAction(
  invoiceId: string,
): Promise<DeleteInvoiceActionResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated, success: false };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant, success: false };
    }

    // Verificar permisos
    const permissionCheck = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.facturas.eliminar,
        PermissionActions.facturas.gestionar,
      ],
      tenantId,
    });

    if (!permissionCheck.hasAnyPermission) {
      return { error: "No tienes permisos para eliminar facturas", success: false };
    }

    // Ejecutar caso de uso
    const useCase = new DeleteInvoiceUseCase(prismaInvoiceRepository);
    const result = await useCase.execute({
      id: invoiceId,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al eliminar la factura", success: false };
    }

    revalidatePath("/finanzas/facturas");

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Error in deleteInvoiceAction:", error);
    return { error: "Error inesperado al eliminar la factura", success: false };
  }
}
