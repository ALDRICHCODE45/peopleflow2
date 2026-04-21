"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { prismaClientRepository } from "../../infrastructure/repositories/PrismaClientRepository";
import { CreateClientUseCase } from "../../application/use-cases/CreateClientUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

import type { ClientDTO } from "../../../frontend/types/client.types";

interface CreateClientManualInput {
  companyName: string;
  generadorId: string;
}

interface CreateClientManualResult {
  error: string | null;
  data?: ClientDTO;
}

/**
 * Crea un cliente manualmente sin pasar por el flujo de conversión de lead.
 */
export async function createClientManualAction(
  input: CreateClientManualInput,
): Promise<CreateClientManualResult> {
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
        PermissionActions.clientes.crear,
        PermissionActions.clientes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: ServerErrors.noPermission };
    }

    // Validar input
    if (!input.companyName.trim()) {
      return { error: "El nombre del cliente es requerido" };
    }

    if (!input.generadorId.trim()) {
      return { error: "El generador es requerido" };
    }

    // Crear cliente usando el use case (incluye validación de duplicados)
    const result = await new CreateClientUseCase(prismaClientRepository).execute({
      nombre: input.companyName,
      leadId: null,
      generadorId: input.generadorId,
      origenId: null,
      tenantId,
      createdById: session.user.id,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al crear el cliente" };
    }

    revalidatePath("/finanzas/clientes");

    return {
      error: null,
      data: result.data,
    };
  } catch (error) {
    console.error("Error in createClientManualAction:", error);
    return { error: "Error al crear el cliente" };
  }
}
