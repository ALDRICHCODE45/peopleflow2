"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Repositories
import { prismaInteractionRepository } from "../../infrastructure/repositories/PrismaInteractionRepository";
import { prismaContactRepository } from "../../infrastructure/repositories/PrismaContactRepository";

// Use Cases
import { AddInteractionUseCase } from "../../application/use-cases/AddInteractionUseCase";
import { GetInteractionsByLeadUseCase } from "../../application/use-cases/GetInteractionsByLeadUseCase";
import { GetInteractionsByContactUseCase } from "../../application/use-cases/GetInteractionsByContactUseCase";

// Types
import type {
  InteractionType,
  Interaction,
  CreateInteractionResult,
} from "../../../frontend/types";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";

/**
 * Agrega una interacción a un contacto
 */
export async function addInteractionAction(data: {
  contactId: string;
  type: InteractionType;
  subject: string;
  content?: string;
  date?: string;
}): Promise<CreateInteractionResult> {
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

    const useCase = new AddInteractionUseCase(
      prismaInteractionRepository,
      prismaContactRepository
    );
    const result = await useCase.execute({
      contactId: data.contactId,
      tenantId,
      userId: session.user.id,
      type: data.type,
      subject: data.subject,
      content: data.content,
      date: data.date,
    });

    if (!result.success) {
      return { error: result.error || "Error al agregar interacción" };
    }

    revalidatePath("/generacion-de-leads/leads");
    return {
      error: null,
      interaction: result.interaction?.toJSON(),
    };
  } catch (error) {
    console.error("Error adding interaction:", error);
    return { error: "Error al agregar interacción" };
  }
}

/**
 * Obtiene las interacciones de un lead
 */
export async function getInteractionsByLeadAction(
  leadId: string
): Promise<{ error: string | null; interactions: Interaction[] }> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", interactions: [] };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: "No hay tenant activo", interactions: [] };
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
      return { error: "No tienes permisos para ver leads", interactions: [] };
    }

    const useCase = new GetInteractionsByLeadUseCase(prismaInteractionRepository);
    const result = await useCase.execute({
      leadId,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error || "Error al obtener interacciones", interactions: [] };
    }

    return {
      error: null,
      interactions: result.interactions?.map((i) => i.toJSON()) || [],
    };
  } catch (error) {
    console.error("Error getting interactions:", error);
    return { error: "Error al obtener interacciones", interactions: [] };
  }
}

/**
 * Obtiene las interacciones de un contacto específico
 */
export async function getInteractionsByContactAction(
  contactId: string
): Promise<{ error: string | null; interactions: Interaction[] }> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", interactions: [] };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: "No hay tenant activo", interactions: [] };
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
      return { error: "No tienes permisos para ver leads", interactions: [] };
    }

    const useCase = new GetInteractionsByContactUseCase(
      prismaInteractionRepository
    );
    const result = await useCase.execute({
      contactId,
      tenantId,
    });

    if (!result.success) {
      return {
        error: result.error || "Error al obtener interacciones del contacto",
        interactions: [],
      };
    }

    return {
      error: null,
      interactions: result.interactions?.map((i) => i.toJSON()) || [],
    };
  } catch (error) {
    console.error("Error getting interactions by contact:", error);
    return {
      error: "Error al obtener interacciones del contacto",
      interactions: [],
    };
  }
}
