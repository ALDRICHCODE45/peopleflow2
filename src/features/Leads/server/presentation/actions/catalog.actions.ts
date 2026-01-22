"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";

// Repositories
import {
  prismaSectorRepository,
  prismaSubsectorRepository,
  prismaLeadOriginRepository,
} from "../../infrastructure/repositories/PrismaCatalogRepository";

// Use Cases
import { GetSectorsUseCase } from "../../application/use-cases/GetSectorsUseCase";
import { GetSubsectorsBySectorUseCase } from "../../application/use-cases/GetSubsectorsBySectorUseCase";
import { GetLeadOriginsUseCase } from "../../application/use-cases/GetLeadOriginsUseCase";

// Types
import type {
  GetSectorsResult,
  GetSubsectorsResult,
  GetLeadOriginsResult,
} from "../../../frontend/types";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";

/**
 * Obtiene todos los sectores activos
 */
export async function getSectorsAction(): Promise<GetSectorsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", sectors: [] };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: "No hay tenant activo", sectors: [] };
    }

    const useCase = new GetSectorsUseCase(prismaSectorRepository);
    const result = await useCase.execute({ tenantId });

    if (!result.success) {
      return { error: result.error || "Error al obtener sectores", sectors: [] };
    }

    return {
      error: null,
      sectors: result.sectors || [],
    };
  } catch (error) {
    console.error("Error getting sectors:", error);
    return { error: "Error al obtener sectores", sectors: [] };
  }
}

/**
 * Obtiene los subsectores de un sector
 */
export async function getSubsectorsBySectorAction(
  sectorId: string
): Promise<GetSubsectorsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", subsectors: [] };
    }

    const useCase = new GetSubsectorsBySectorUseCase(prismaSubsectorRepository);
    const result = await useCase.execute({ sectorId });

    if (!result.success) {
      return { error: result.error || "Error al obtener subsectores", subsectors: [] };
    }

    return {
      error: null,
      subsectors: result.subsectors || [],
    };
  } catch (error) {
    console.error("Error getting subsectors:", error);
    return { error: "Error al obtener subsectores", subsectors: [] };
  }
}

/**
 * Obtiene todos los orígenes de leads activos
 */
export async function getLeadOriginsAction(): Promise<GetLeadOriginsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", origins: [] };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: "No hay tenant activo", origins: [] };
    }

    const useCase = new GetLeadOriginsUseCase(prismaLeadOriginRepository);
    const result = await useCase.execute({ tenantId });

    if (!result.success) {
      return { error: result.error || "Error al obtener orígenes", origins: [] };
    }

    return {
      error: null,
      origins: result.origins || [],
    };
  } catch (error) {
    console.error("Error getting lead origins:", error);
    return { error: "Error al obtener orígenes", origins: [] };
  }
}
