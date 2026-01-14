"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Repository
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";

// Use Cases
import { GetVacanciesUseCase } from "../../application/use-cases/GetVacanciesUseCase";
import { CreateVacancyUseCase } from "../../application/use-cases/CreateVacancyUseCase";
import { UpdateVacancyUseCase } from "../../application/use-cases/UpdateVacancyUseCase";
import { DeleteVacancyUseCase } from "../../application/use-cases/DeleteVacancyUseCase";

// Types
import type { VacancyStatus } from "../../../frontend/types/vacancy.types";
import type {
  GetVacanciesResult,
  CreateVacancyResult,
  UpdateVacancyResult,
  DeleteVacancyResult,
} from "../../../frontend/types/vacancy.types";
import { getCurrentTenantAction } from "@/features/tenants/server/presentation/actions/tenant.actions";

/**
 * Helper interno para obtener el tenant activo de la sesión
 */
async function getActiveTenantId(): Promise<string | null> {
  const result = await getCurrentTenantAction();
  return result.tenant?.id ?? null;
}

/**
 * Server Actions para gestionar vacantes
 * Capa de presentacion - entry points para el frontend
 */

/**
 * Obtiene todas las vacantes del tenant activo
 */
export async function getVacanciesAction(filters?: {
  status?: VacancyStatus;
  search?: string;
}): Promise<GetVacanciesResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", vacancies: [] };
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: "No hay tenant activo", vacancies: [] };
    }

    const useCase = new GetVacanciesUseCase(prismaVacancyRepository);
    const result = await useCase.execute({
      tenantId,
      status: filters?.status,
      search: filters?.search,
    });

    if (!result.success) {
      return {
        error: result.error || "Error al obtener vacantes",
        vacancies: [],
      };
    }

    return {
      error: null,
      vacancies: result.vacancies.map((v) => v.toJSON()),
    };
  } catch (error) {
    console.error("Error getting vacancies:", error);
    return { error: "Error al obtener vacantes", vacancies: [] };
  }
}

/**
 * Crea una nueva vacante
 */
export async function createVacancyAction(data: {
  title: string;
  description: string;
  status?: VacancyStatus;
  department?: string;
  location?: string;
}): Promise<CreateVacancyResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: "No hay tenant activo" };
    }

    const useCase = new CreateVacancyUseCase(prismaVacancyRepository);
    const result = await useCase.execute({
      ...data,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error || "Error al crear vacante" };
    }

    revalidatePath("/reclutamiento/vacantes");
    return {
      error: null,
      vacancy: result.vacancy?.toJSON(),
    };
  } catch (error) {
    console.error("Error creating vacancy:", error);
    return { error: "Error al crear vacante" };
  }
}

/**
 * Actualiza una vacante existente
 */
export async function updateVacancyAction(
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: VacancyStatus;
    department?: string | null;
    location?: string | null;
  }
): Promise<UpdateVacancyResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado" };
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: "No hay tenant activo" };
    }

    const useCase = new UpdateVacancyUseCase(prismaVacancyRepository);
    const result = await useCase.execute({
      id,
      tenantId,
      ...data,
    });

    if (!result.success) {
      return { error: result.error || "Error al actualizar vacante" };
    }

    revalidatePath("/reclutamiento/vacantes");
    return {
      error: null,
      vacancy: result.vacancy?.toJSON(),
    };
  } catch (error) {
    console.error("Error updating vacancy:", error);
    return { error: "Error al actualizar vacante" };
  }
}

/**
 * Elimina una vacante
 */
export async function deleteVacancyAction(
  id: string
): Promise<DeleteVacancyResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", success: false };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: "No hay tenant activo", success: false };
    }

    const useCase = new DeleteVacancyUseCase(prismaVacancyRepository);
    const result = await useCase.execute({ id, tenantId });

    if (!result.success) {
      return {
        error: result.error || "Error al eliminar vacante",
        success: false,
      };
    }

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, success: true };
  } catch (error) {
    console.error("Error deleting vacancy:", error);
    return { error: "Error al eliminar vacante", success: false };
  }
}
