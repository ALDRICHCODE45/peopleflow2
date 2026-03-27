"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";

import { prismaInvoiceRepository } from "../../infrastructure/repositories/PrismaInvoiceRepository";
import { GetInvoiceByIdUseCase } from "../../application/use-cases/GetInvoiceByIdUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

import type { InvoiceDTO } from "../../domain/entities/Invoice";

// --- Output ---

export interface GetInvoiceByIdResult {
  error: string | null;
  invoice?: InvoiceDTO;
}

/**
 * Obtiene una factura por ID
 */
export async function getInvoiceByIdAction(
  invoiceId: string,
): Promise<GetInvoiceByIdResult> {
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

    // Verificar permisos
    const permissionCheck = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.facturas.acceder,
        PermissionActions.facturas.gestionar,
      ],
      tenantId,
    });

    if (!permissionCheck.hasAnyPermission) {
      return { error: "No tienes permisos para ver facturas" };
    }

    // Ejecutar caso de uso
    const useCase = new GetInvoiceByIdUseCase(prismaInvoiceRepository);
    const result = await useCase.execute({ invoiceId, tenantId });

    if (!result.success) {
      return { error: result.error ?? "Error al obtener la factura" };
    }

    return {
      error: null,
      invoice: result.invoice?.toJSON(),
    };
  } catch (error) {
    console.error("Error in getInvoiceByIdAction:", error);
    return { error: "Error al obtener la factura" };
  }
}
