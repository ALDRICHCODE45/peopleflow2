"use server";

import { auth } from "@lib/auth";
import prisma from "@lib/prisma";
import { storageAdapter } from "@core/storage/StorageModule";
import { StorageKeys } from "@core/storage/StorageKeys";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Routes } from "@core/shared/constants/routes";

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
  DeleteInteractionAttachmentResult,
  InteractionType,
  Interaction,
  InteractionAttachment,
  CreateInteractionResult,
  UpdateInteractionResult,
  DeleteInteractionResult,
  UploadInteractionAttachmentResult,
} from "../../../frontend/types";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_INTERACTION = 5;
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
]);
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);

interface LeadsAuthContext {
  tenantId: string;
  userId: string;
}

async function getLeadsAuthContext(
  permissions: string[],
): Promise<{ error: string | null; context: LeadsAuthContext | null }> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    return { error: ServerErrors.notAuthenticated, context: null };
  }

  const tenantId = await getActiveTenantId();

  if (!tenantId) {
    return { error: ServerErrors.noActiveTenant, context: null };
  }

  const permissionCheck = await new CheckAnyPermissonUseCase().execute({
    userId: session.user.id,
    permissions,
    tenantId,
  });

  if (!permissionCheck.hasAnyPermission) {
    return {
      error: "No tienes permisos para gestionar interacciones",
      context: null,
    };
  }

  return {
    error: null,
    context: {
      tenantId,
      userId: session.user.id,
    },
  };
}

function extractFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function getStorageKeyFromFileUrl(fileUrl: string): string | null {
  try {
    const baseUrl =
      (process.env.DO_SPACES_CDN_URL ?? process.env.DO_SPACES_ENDPOINT ?? "").replace(
        /\/$/,
        "",
      );
    const bucket = process.env.DO_SPACES_BUCKET ?? "";

    if (baseUrl && fileUrl.startsWith(baseUrl)) {
      return fileUrl.slice(baseUrl.length + 1);
    }

    if (bucket && fileUrl.includes(`/${bucket}/`)) {
      const bucketPrefix = `/${bucket}/`;
      const idx = fileUrl.indexOf(bucketPrefix);
      return fileUrl.slice(idx + bucketPrefix.length);
    }

    const urlObj = new URL(fileUrl);
    return urlObj.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

function validateAttachmentFile(file: File): string | null {
  if (file.size === 0) {
    return "El archivo está vacío";
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return "El archivo excede el máximo de 10MB";
  }

  const extension = extractFileExtension(file.name);
  if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
    return "Tipo de archivo no permitido";
  }

  if (
    file.type &&
    file.type !== "application/octet-stream" &&
    !ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type)
  ) {
    return "Tipo MIME no permitido";
  }

  return null;
}

function toInteractionAttachment(input: {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  subType: string;
  interactionId: string | null;
  tenantId: string;
  uploadedById: string;
  createdAt: Date;
}): InteractionAttachment {
  return {
    id: input.id,
    fileName: input.fileName,
    fileUrl: input.fileUrl,
    fileSize: input.fileSize,
    mimeType: input.mimeType,
    subType: "OTHER",
    interactionId: input.interactionId ?? "",
    tenantId: input.tenantId,
    uploadedById: input.uploadedById,
    createdAt: input.createdAt.toISOString(),
  };
}

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
    const { error, context } = await getLeadsAuthContext([
      PermissionActions.leads.editar,
      PermissionActions.leads.gestionar,
    ]);
    if (error || !context) {
      return { error: error ?? "Error de autenticación" };
    }

    const useCase = new AddInteractionUseCase(
      prismaInteractionRepository,
      prismaContactRepository,
    );
    const result = await useCase.execute({
      contactId: data.contactId,
      tenantId: context.tenantId,
      userId: context.userId,
      type: data.type,
      subject: data.subject,
      content: data.content,
      date: data.date,
    });

    if (!result.success) {
      return { error: result.error || "Error al agregar interacción" };
    }

    revalidatePath(Routes.leads.list);
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
  leadId: string,
): Promise<{ error: string | null; interactions: Interaction[] }> {
  try {
    const { error, context } = await getLeadsAuthContext([
      PermissionActions.leads.acceder,
      PermissionActions.leads.gestionar,
    ]);
    if (error || !context) {
      return { error: error ?? "Error de autenticación", interactions: [] };
    }

    const useCase = new GetInteractionsByLeadUseCase(prismaInteractionRepository);
    const result = await useCase.execute({
      leadId,
      tenantId: context.tenantId,
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
  contactId: string,
): Promise<{ error: string | null; interactions: Interaction[] }> {
  try {
    const { error, context } = await getLeadsAuthContext([
      PermissionActions.leads.acceder,
      PermissionActions.leads.gestionar,
    ]);
    if (error || !context) {
      return { error: error ?? "Error de autenticación", interactions: [] };
    }

    const useCase = new GetInteractionsByContactUseCase(
      prismaInteractionRepository,
    );
    const result = await useCase.execute({
      contactId,
      tenantId: context.tenantId,
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
  },
): Promise<UpdateInteractionResult> {
  try {
    const { error, context } = await getLeadsAuthContext([
      PermissionActions.leads.editar,
      PermissionActions.leads.gestionar,
    ]);
    if (error || !context) {
      return { error: error ?? "Error de autenticación" };
    }

    const useCase = new UpdateInteractionUseCase(prismaInteractionRepository);
    const result = await useCase.execute({
      interactionId,
      tenantId: context.tenantId,
      data,
    });

    if (!result.success) {
      return { error: result.error || "Error al actualizar la interacción" };
    }

    revalidatePath(Routes.leads.list);
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
  interactionId: string,
): Promise<DeleteInteractionResult> {
  try {
    const { error, context } = await getLeadsAuthContext([
      PermissionActions.leads.editar,
      PermissionActions.leads.gestionar,
    ]);
    if (error || !context) {
      return { error: error ?? "Error de autenticación", success: false };
    }

    const existingInteraction = await prismaInteractionRepository.findById(
      interactionId,
      context.tenantId,
    );
    if (!existingInteraction) {
      return { error: "Interacción no encontrada", success: false };
    }

    for (const attachment of existingInteraction.attachments) {
      const storageKey = getStorageKeyFromFileUrl(attachment.fileUrl);
      if (!storageKey) continue;

      const deleteResult = await storageAdapter.delete(storageKey);
      if (!deleteResult.ok) {
        console.warn(
          "[deleteInteractionAction] Storage delete warning:",
          deleteResult.error,
        );
      }
    }

    const useCase = new DeleteInteractionUseCase(prismaInteractionRepository);
    const result = await useCase.execute({
      interactionId,
      tenantId: context.tenantId,
    });

    if (!result.success) {
      return {
        error: result.error || "Error al eliminar la interacción",
        success: false,
      };
    }

    revalidatePath(Routes.leads.list);
    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Error deleting interaction:", error);
    return { error: "Error al eliminar la interacción", success: false };
  }
}

/**
 * Sube un adjunto de evidencia para una interacción.
 */
export async function uploadInteractionAttachmentAction(
  formData: FormData,
  interactionId: string,
): Promise<UploadInteractionAttachmentResult> {
  try {
    const { error, context } = await getLeadsAuthContext([
      PermissionActions.leads.editar,
      PermissionActions.leads.gestionar,
    ]);
    if (error || !context) {
      return { error: error ?? "Error de autenticación" };
    }

    const interaction = await prismaInteractionRepository.findById(
      interactionId,
      context.tenantId,
    );
    if (!interaction) {
      return { error: "Interacción no encontrada" };
    }

    const currentAttachmentsCount = await prisma.attachment.count({
      where: {
        interactionId,
        tenantId: context.tenantId,
        attachableType: "INTERACTION",
      },
    });

    if (currentAttachmentsCount >= MAX_ATTACHMENTS_PER_INTERACTION) {
      return { error: `Máximo ${MAX_ATTACHMENTS_PER_INTERACTION} archivos por interacción` };
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { error: "No se encontró el archivo en el formulario" };
    }

    const fileValidationError = validateAttachmentFile(file);
    if (fileValidationError) {
      return { error: fileValidationError };
    }

    const extension = extractFileExtension(file.name);
    const key = StorageKeys.leadInteractionEvidence(interactionId, extension);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await storageAdapter.upload({
      buffer,
      fileName: file.name,
      key,
      mimeType: file.type,
      fileSize: file.size,
    });

    if (!uploadResult.ok) {
      return { error: uploadResult.error };
    }

    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        fileUrl: uploadResult.url,
        fileSize: file.size,
        mimeType: file.type,
        attachableType: "INTERACTION",
        subType: "OTHER",
        interactionId,
        tenantId: context.tenantId,
        uploadedById: context.userId,
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        subType: true,
        interactionId: true,
        tenantId: true,
        uploadedById: true,
        createdAt: true,
      },
    });

    revalidatePath(Routes.leads.list);
    return {
      error: null,
      attachment: toInteractionAttachment(attachment),
    };
  } catch (error) {
    console.error("[uploadInteractionAttachmentAction] Error:", error);
    return { error: "Error inesperado al subir el archivo" };
  }
}

/**
 * Elimina un archivo de evidencia de una interacción.
 */
export async function deleteInteractionAttachmentAction(
  attachmentId: string,
  interactionId: string,
): Promise<DeleteInteractionAttachmentResult> {
  try {
    const { error, context } = await getLeadsAuthContext([
      PermissionActions.leads.editar,
      PermissionActions.leads.gestionar,
    ]);
    if (error || !context) {
      return { error: error ?? "Error de autenticación", success: false };
    }

    const interaction = await prismaInteractionRepository.findById(
      interactionId,
      context.tenantId,
    );
    if (!interaction) {
      return { error: "Interacción no encontrada", success: false };
    }

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        interactionId,
        tenantId: context.tenantId,
        attachableType: "INTERACTION",
      },
      select: {
        id: true,
        fileUrl: true,
      },
    });

    if (!attachment) {
      return { error: "Archivo no encontrado", success: false };
    }

    const storageKey = getStorageKeyFromFileUrl(attachment.fileUrl);
    if (storageKey) {
      const deleteResult = await storageAdapter.delete(storageKey);
      if (!deleteResult.ok) {
        console.warn(
          "[deleteInteractionAttachmentAction] Storage delete warning:",
          deleteResult.error,
        );
      }
    }

    await prisma.attachment.deleteMany({
      where: {
        id: attachment.id,
        tenantId: context.tenantId,
      },
    });

    revalidatePath(Routes.leads.list);

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("[deleteInteractionAttachmentAction] Error:", error);
    return {
      error: "Error inesperado al eliminar el archivo",
      success: false,
    };
  }
}
