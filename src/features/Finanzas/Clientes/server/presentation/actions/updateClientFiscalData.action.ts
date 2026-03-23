"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { prismaClientRepository } from "../../infrastructure/repositories/PrismaClientRepository";
import { UpdateClientFiscalDataUseCase } from "../../application/use-cases/UpdateClientFiscalDataUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

import type { FiscalData } from "../../domain/interfaces/IClientRepository";
import type { UpdateFiscalDataResult } from "../../../frontend/types/client.types";

/**
 * Actualiza los datos fiscales de un cliente
 */
export async function updateClientFiscalDataAction(
  clientId: string,
  fiscalData: FiscalData,
): Promise<UpdateFiscalDataResult> {
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
    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.clientes.editar,
        PermissionActions.clientes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "No tienes permisos para editar clientes" };
    }

    const useCase = new UpdateClientFiscalDataUseCase(prismaClientRepository);
    const result = await useCase.execute({
      clientId,
      tenantId,
      fiscalData,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al actualizar datos fiscales" };
    }

    revalidatePath("/finanzas/clientes");
    return {
      error: null,
      data: result.data,
    };
  } catch (error) {
    console.error("Error in updateClientFiscalDataAction:", error);
    return { error: "Error al actualizar datos fiscales" };
  }
}
