"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { prismaInvoiceRepository } from "../../infrastructure/repositories/PrismaInvoiceRepository";
import { UpdateInvoiceStatusUseCase } from "../../application/use-cases/UpdateInvoiceStatusUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

import type { InvoiceDTO } from "../../domain/entities/Invoice";
import type { InvoiceStatus } from "@/core/generated/prisma/client";

// --- Input / Output ---

export interface UpdateInvoiceStatusActionInput {
  id: string;
  status: InvoiceStatus;
  paymentDate?: string | null; // ISO string from client
}

export interface UpdateInvoiceStatusActionResult {
  error: string | null;
  data?: InvoiceDTO;
}

/**
 * Actualiza el estado de una factura (POR_COBRAR → PAGADA)
 * Para PPD: valida que exista complemento de pago antes de permitir PAGADA
 */
export async function updateInvoiceStatusAction(
  input: UpdateInvoiceStatusActionInput,
): Promise<UpdateInvoiceStatusActionResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant };
    }

    // Verificar permisos (facturas:gestionar para cambios de estado según spec)
    const permissionCheck = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [PermissionActions.facturas.gestionar],
      tenantId,
    });

    if (!permissionCheck.hasAnyPermission) {
      return { error: "No tienes permisos para cambiar el estado de facturas" };
    }

    // Ejecutar caso de uso
    const useCase = new UpdateInvoiceStatusUseCase(prismaInvoiceRepository);
    const result = await useCase.execute({
      id: input.id,
      tenantId,
      status: input.status,
      paymentDate: input.paymentDate ? new Date(input.paymentDate) : null,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al actualizar el estado de la factura" };
    }

    revalidatePath("/finanzas/facturas");

    return {
      error: null,
      data: result.data,
    };
  } catch (error) {
    console.error("Error in updateInvoiceStatusAction:", error);
    return { error: "Error inesperado al actualizar el estado" };
  }
}
