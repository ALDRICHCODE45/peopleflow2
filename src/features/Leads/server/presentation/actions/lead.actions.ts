"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Repositories
import { prismaLeadRepository } from "../../infrastructure/repositories/PrismaLeadRepository";
import { prismaLeadStatusHistoryRepository } from "../../infrastructure/repositories/PrismaLeadStatusHistoryRepository";

// Use Cases
import { CreateLeadUseCase } from "../../application/use-cases/CreateLeadUseCase";
import { UpdateLeadUseCase } from "../../application/use-cases/UpdateLeadUseCase";
import { DeleteLeadUseCase } from "../../application/use-cases/DeleteLeadUseCase";
import { GetLeadByIdUseCase } from "../../application/use-cases/GetLeadByIdUseCase";
import { UpdateLeadStatusUseCase } from "../../application/use-cases/UpdateLeadStatusUseCase";

// Types
import type {
  LeadStatus,
  CreateLeadResult,
  UpdateLeadResult,
  DeleteLeadResult,
  UpdateLeadStatusResult,
} from "../../../frontend/types";
import type { Lead } from "../../../frontend/types";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";

/**
 * Crea un nuevo lead
 */
export async function createLeadAction(data: {
  companyName: string;
  rfc?: string;
  website?: string;
  linkedInUrl?: string;
  address?: string;
  notes?: string;
  status?: LeadStatus;
  sectorId?: string;
  subsectorId?: string;
  originId?: string;
  assignedToId?: string;
}): Promise<CreateLeadResult> {
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

    // Verificar permisos
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();
    const hasPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.leads.crear,
        PermissionActions.leads.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "No tienes permisos para crear leads" };
    }

    const useCase = new CreateLeadUseCase(prismaLeadRepository);
    const result = await useCase.execute({
      ...data,
      tenantId,
      createdById: session.user.id,
    });

    if (!result.success) {
      return { error: result.error || "Error al crear lead" };
    }

    revalidatePath("/generacion-de-leads/leads");
    return {
      error: null,
      lead: result.lead?.toJSON(),
    };
  } catch (error) {
    console.error("Error creating lead:", error);
    return { error: "Error al crear lead" };
  }
}

/**
 * Actualiza un lead existente
 */
export async function updateLeadAction(
  leadId: string,
  data: {
    companyName?: string;
    rfc?: string | null;
    website?: string | null;
    linkedInUrl?: string | null;
    address?: string | null;
    notes?: string | null;
    sectorId?: string | null;
    subsectorId?: string | null;
    originId?: string | null;
    assignedToId?: string | null;
  }
): Promise<UpdateLeadResult> {
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

    // Verificar permisos
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();
    const hasPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.leads.editar,
        PermissionActions.leads.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "No tienes permisos para editar leads" };
    }

    const useCase = new UpdateLeadUseCase(prismaLeadRepository);
    const result = await useCase.execute({
      leadId,
      tenantId,
      data,
    });

    if (!result.success) {
      return { error: result.error || "Error al actualizar lead" };
    }

    revalidatePath("/generacion-de-leads/leads");
    return {
      error: null,
      lead: result.lead?.toJSON(),
    };
  } catch (error) {
    console.error("Error updating lead:", error);
    return { error: "Error al actualizar lead" };
  }
}

/**
 * Elimina un lead (soft delete)
 */
export async function deleteLeadAction(leadId: string): Promise<DeleteLeadResult> {
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

    // Verificar permisos
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();
    const hasPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.leads.eliminar,
        PermissionActions.leads.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "No tienes permisos para eliminar leads", success: false };
    }

    const useCase = new DeleteLeadUseCase(prismaLeadRepository);
    const result = await useCase.execute({
      leadId,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error || "Error al eliminar lead", success: false };
    }

    revalidatePath("/generacion-de-leads/leads");
    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Error deleting lead:", error);
    return { error: "Error al eliminar lead", success: false };
  }
}

/**
 * Obtiene un lead por ID
 */
export async function getLeadByIdAction(
  leadId: string
): Promise<{ error: string | null; lead?: Lead }> {
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

    // Verificar permisos
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();
    const hasPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.leads.acceder,
        PermissionActions.leads.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "No tienes permisos para ver leads" };
    }

    const useCase = new GetLeadByIdUseCase(prismaLeadRepository);
    const result = await useCase.execute({
      leadId,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error || "Error al obtener lead" };
    }

    return {
      error: null,
      lead: result.lead?.toJSON(),
    };
  } catch (error) {
    console.error("Error getting lead:", error);
    return { error: "Error al obtener lead" };
  }
}

/**
 * Actualiza el estado de un lead
 */
export async function updateLeadStatusAction(
  leadId: string,
  newStatus: LeadStatus
): Promise<UpdateLeadStatusResult> {
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

    // Verificar permisos
    const hasAnyPermissionUseCase = new CheckAnyPermissonUseCase();
    const hasPermission = await hasAnyPermissionUseCase.execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.leads.editar,
        PermissionActions.leads.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "No tienes permisos para editar leads" };
    }

    const useCase = new UpdateLeadStatusUseCase(
      prismaLeadRepository,
      prismaLeadStatusHistoryRepository
    );
    const result = await useCase.execute({
      leadId,
      tenantId,
      newStatus,
      userId: session.user.id,
    });

    if (!result.success) {
      return { error: result.error || "Error al actualizar estado del lead" };
    }

    revalidatePath("/generacion-de-leads/leads");
    return {
      error: null,
      lead: result.lead?.toJSON(),
    };
  } catch (error) {
    console.error("Error updating lead status:", error);
    return { error: "Error al actualizar estado del lead" };
  }
}
