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
import { UpdateInteractionUseCase } from "../../application/use-cases/UpdateInteractionUseCase";
import { DeleteInteractionUseCase } from "../../application/use-cases/DeleteInteractionUseCase";

// Types
import type {
  InteractionType,
  Interaction,
  CreateInteractionResult,
  UpdateInteractionResult,
  DeleteInteractionResult,
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

/**
 * Actualiza una interacción existente
 */
export async function updateInteractionAction(
  interactionId: string,
  data: {
    type?: InteractionType;
    subject?: string;
    content?: string | null;
    date?: string;
  }
): Promise<UpdateInteractionResult> {
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
      return { error: "No tienes permisos para editar interacciones" };
    }

    const useCase = new UpdateInteractionUseCase(prismaInteractionRepository);
    const result = await useCase.execute({
      interactionId,
      tenantId,
      data,
    });

    if (!result.success) {
      return { error: result.error || "Error al actualizar la interacción" };
    }

    revalidatePath("/generacion-de-leads/leads");
    return {
      error: null,
      interaction: result.interaction?.toJSON(),
    };
  } catch (error) {
    console.error("Error updating interaction:", error);
    return { error: "Error al actualizar la interacción" };
  }
}

/**
 * Elimina una interacción
 */
export async function deleteInteractionAction(
  interactionId: string
): Promise<DeleteInteractionResult> {
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
        PermissionActions.leads.editar,
        PermissionActions.leads.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return {
        error: "No tienes permisos para eliminar interacciones",
        success: false,
      };
    }

    const useCase = new DeleteInteractionUseCase(prismaInteractionRepository);
    const result = await useCase.execute({
      interactionId,
      tenantId,
    });

    if (!result.success) {
      return {
        error: result.error || "Error al eliminar la interacción",
        success: false,
      };
    }

    revalidatePath("/generacion-de-leads/leads");
    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Error deleting interaction:", error);
    return { error: "Error al eliminar la interacción", success: false };
  }
}
