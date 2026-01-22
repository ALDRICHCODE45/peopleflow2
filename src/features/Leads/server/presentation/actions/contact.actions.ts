"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Repositories
import { prismaContactRepository } from "../../infrastructure/repositories/PrismaContactRepository";
import { prismaLeadRepository } from "../../infrastructure/repositories/PrismaLeadRepository";

// Use Cases
import { AddContactToLeadUseCase } from "../../application/use-cases/AddContactToLeadUseCase";
import { UpdateContactUseCase } from "../../application/use-cases/UpdateContactUseCase";
import { DeleteContactUseCase } from "../../application/use-cases/DeleteContactUseCase";
import { GetContactsByLeadUseCase } from "../../application/use-cases/GetContactsByLeadUseCase";

// Types
import type {
  Contact,
  CreateContactResult,
  UpdateContactResult,
  DeleteContactResult,
  GetContactsResult,
} from "../../../frontend/types";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";

/**
 * Agrega un contacto a un lead
 */
export async function addContactToLeadAction(
  leadId: string,
  data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    position?: string;
    linkedInUrl?: string;
    isPrimary?: boolean;
    notes?: string;
  }
): Promise<CreateContactResult> {
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

    const useCase = new AddContactToLeadUseCase(
      prismaContactRepository,
      prismaLeadRepository
    );
    const result = await useCase.execute({
      leadId,
      tenantId,
      ...data,
    });

    if (!result.success) {
      return { error: result.error || "Error al agregar contacto" };
    }

    revalidatePath("/generacion-de-leads/leads");
    return {
      error: null,
      contact: result.contact?.toJSON(),
    };
  } catch (error) {
    console.error("Error adding contact:", error);
    return { error: "Error al agregar contacto" };
  }
}

/**
 * Actualiza un contacto
 */
export async function updateContactAction(
  contactId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    position?: string | null;
    linkedInUrl?: string | null;
    isPrimary?: boolean;
    notes?: string | null;
  }
): Promise<UpdateContactResult> {
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

    const useCase = new UpdateContactUseCase(prismaContactRepository);
    const result = await useCase.execute({
      contactId,
      tenantId,
      data,
    });

    if (!result.success) {
      return { error: result.error || "Error al actualizar contacto" };
    }

    revalidatePath("/generacion-de-leads/leads");
    return {
      error: null,
      contact: result.contact?.toJSON(),
    };
  } catch (error) {
    console.error("Error updating contact:", error);
    return { error: "Error al actualizar contacto" };
  }
}

/**
 * Elimina un contacto
 */
export async function deleteContactAction(
  contactId: string
): Promise<DeleteContactResult> {
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
      return { error: "No tienes permisos para editar leads", success: false };
    }

    const useCase = new DeleteContactUseCase(prismaContactRepository);
    const result = await useCase.execute({
      contactId,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error || "Error al eliminar contacto", success: false };
    }

    revalidatePath("/generacion-de-leads/leads");
    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Error deleting contact:", error);
    return { error: "Error al eliminar contacto", success: false };
  }
}

/**
 * Obtiene los contactos de un lead
 */
export async function getContactsByLeadAction(
  leadId: string
): Promise<GetContactsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "No autenticado", contacts: [] };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: "No hay tenant activo", contacts: [] };
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
      return { error: "No tienes permisos para ver leads", contacts: [] };
    }

    const useCase = new GetContactsByLeadUseCase(prismaContactRepository);
    const result = await useCase.execute({
      leadId,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error || "Error al obtener contactos", contacts: [] };
    }

    return {
      error: null,
      contacts: result.contacts?.map((c) => c.toJSON()) || [],
    };
  } catch (error) {
    console.error("Error getting contacts:", error);
    return { error: "Error al obtener contactos", contacts: [] };
  }
}
