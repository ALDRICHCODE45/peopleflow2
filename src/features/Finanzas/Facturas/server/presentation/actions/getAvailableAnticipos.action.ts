"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";

import { prismaInvoiceRepository } from "../../infrastructure/repositories/PrismaInvoiceRepository";
import { GetAvailableAnticiposUseCase } from "../../application/use-cases/GetAvailableAnticiposUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

import type { InvoiceDTO } from "../../domain/entities/Invoice";

// --- Output ---

export interface GetAvailableAnticiposResult {
  error: string | null;
  data?: InvoiceDTO[];
}

/**
 * Obtiene anticipos disponibles (no consumidos) para un cliente.
 * Usado por el selector de anticipos en el formulario de LIQUIDACIÓN.
 */
export async function getAvailableAnticiposAction(
  clientId: string,
): Promise<GetAvailableAnticiposResult> {
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

    // Verificar permisos (acceder es suficiente para leer anticipos)
    const permissionCheck = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.facturas.acceder,
        PermissionActions.facturas.crear,
        PermissionActions.facturas.gestionar,
      ],
      tenantId,
    });

    if (!permissionCheck.hasAnyPermission) {
      return { error: "No tienes permisos para ver anticipos" };
    }

    // Ejecutar caso de uso
    const useCase = new GetAvailableAnticiposUseCase(prismaInvoiceRepository);
    const result = await useCase.execute({
      clientId,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al obtener anticipos disponibles" };
    }

    return {
      error: null,
      data: result.data?.map((invoice) => invoice.toJSON()) ?? [],
    };
  } catch (error) {
    console.error("Error in getAvailableAnticiposAction:", error);
    return { error: "Error inesperado al obtener anticipos" };
  }
}
