"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { prismaClientRepository } from "../../infrastructure/repositories/PrismaClientRepository";
import { GetClientByIdUseCase } from "../../application/use-cases/GetClientByIdUseCase";
import { UpdateClientUseCase } from "../../application/use-cases/UpdateClientUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

import type { ClientDTO, UpdateClientResult } from "../../../frontend/types/client.types";
import type { UpdateClientData } from "../../domain/interfaces/IClientRepository";

/**
 * Obtiene un cliente por ID
 */
export async function getClientByIdAction(
  clientId: string,
): Promise<{ error: string | null; client?: ClientDTO }> {
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

    const useCase = new GetClientByIdUseCase(prismaClientRepository);
    const result = await useCase.execute({ clientId, tenantId });

    if (!result.success) {
      return { error: result.error ?? "Error al obtener el cliente" };
    }

    return {
      error: null,
      client: result.client?.toJSON(),
    };
  } catch (error) {
    console.error("Error in getClientByIdAction:", error);
    return { error: "Error al obtener el cliente" };
  }
}

/**
 * Lista todos los clientes del tenant con datos completos
 */
export async function getClientsListAction(): Promise<{
  error: string | null;
  clients: ClientDTO[];
}> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated, clients: [] };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant, clients: [] };
    }

    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.clientes.acceder,
        PermissionActions.clientes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "No tienes permisos para ver clientes", clients: [] };
    }

    const clients = await prismaClientRepository.findAllWithDetailsByTenantId(
      tenantId,
    );

    return {
      error: null,
      clients: clients.map((c) => c.toJSON()),
    };
  } catch (error) {
    console.error("Error in getClientsListAction:", error);
    return { error: "Error al obtener la lista de clientes", clients: [] };
  }
}

/**
 * Actualiza un cliente existente (condiciones comerciales, nombre, etc.)
 */
export async function updateClientAction(
  clientId: string,
  data: UpdateClientData,
): Promise<UpdateClientResult> {
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
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();
    const hasPermission = await hasAnyPermissionUseCase.execute({
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

    const useCase = new UpdateClientUseCase(prismaClientRepository);
    const result = await useCase.execute({
      clientId,
      tenantId,
      data,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al actualizar el cliente" };
    }

    revalidatePath("/finanzas/clientes");
    return {
      error: null,
      data: result.data,
    };
  } catch (error) {
    console.error("Error in updateClientAction:", error);
    return { error: "Error al actualizar el cliente" };
  }
}
