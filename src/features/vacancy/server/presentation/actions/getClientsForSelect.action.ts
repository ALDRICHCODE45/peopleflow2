"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { prismaClientRepository } from "@features/Finanzas/Clientes/server/infrastructure/repositories/PrismaClientRepository";
import { pickClientDisplayName } from "@features/Finanzas/Clientes/server/helpers/pickClientDisplayName.helper";
import { CheckAnyPermissonUseCase } from "@features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

export interface ClientOption {
  id: string;
  nombre: string;
  currency: string | null;
}

export interface GetClientsResult {
  error: string | null;
  clients: ClientOption[];
}

export async function getClientsForSelectAction(): Promise<GetClientsResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: ServerErrors.notAuthenticated, clients: [] };

    const tenantId = await getActiveTenantId();
    if (!tenantId) return { error: ServerErrors.noActiveTenant, clients: [] };

    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantes.acceder,
        PermissionActions.vacantes.gestionar,
        PermissionActions.vacantes.crear,
        PermissionActions.vacantes.editar,
      ],
      tenantId,
    });
    if (!hasPermission) return { error: ServerErrors.noPermission, clients: [] };

    const rawClients = await prismaClientRepository.findAllByTenantId(tenantId);

    // Mantenemos la shape del ClientOption (id, nombre, currency) pero ahora
    // `nombre` es el display name (nombreComercial si existe, sino la razón social).
    const clients: ClientOption[] = rawClients
      .map((c) => ({
        id: c.id,
        nombre: pickClientDisplayName(c),
        currency: c.currency,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));

    return { error: null, clients };
  } catch (error) {
    console.error("Error getting clients:", error);
    return { error: "Error al obtener clientes", clients: [] };
  }
}
