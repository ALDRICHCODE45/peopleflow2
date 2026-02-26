"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { storageAdapter } from "@core/storage/StorageModule";
import prisma from "@lib/prisma";
import { NotificationProvider, NotificationPriority } from "@/core/generated/prisma/client";
import type {
  GetVacancyAttachmentsResult,
  DeleteVacancyAttachmentResult,
  ValidateAttachmentResult,
  RejectAttachmentResult,
  ValidateChecklistResult,
  RejectChecklistResult,
  AttachmentDTO,
} from "@features/vacancy/frontend/types/vacancy.types";

// ─── Helper para mapear registro Prisma a AttachmentDTO ───────────────────────

function toAttachmentDTO(a: {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  subType: string;
  isValidated: boolean;
  validatedAt: Date | null;
  validatedById: string | null;
  rejectionReason: string | null;
  vacancyId: string | null;
  vacancyCandidateId: string | null;
  uploadedById: string;
  createdAt: Date;
}): AttachmentDTO {
  return {
    id: a.id,
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    fileSize: a.fileSize,
    mimeType: a.mimeType,
    subType: a.subType as AttachmentDTO['subType'],
    isValidated: a.isValidated,
    validatedAt: a.validatedAt?.toISOString() ?? null,
    validatedById: a.validatedById,
    rejectionReason: a.rejectionReason,
    vacancyId: a.vacancyId,
    vacancyCandidateId: a.vacancyCandidateId,
    uploadedById: a.uploadedById,
    createdAt: a.createdAt.toISOString(),
  };
}

const ATTACHMENT_SELECT = {
  id: true,
  fileName: true,
  fileUrl: true,
  fileSize: true,
  mimeType: true,
  subType: true,
  isValidated: true,
  validatedAt: true,
  validatedById: true,
  rejectionReason: true,
  vacancyId: true,
  vacancyCandidateId: true,
  uploadedById: true,
  createdAt: true,
} as const;

// ─── Auth + permission guard shared helper ────────────────────────────────────

async function getAuthContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "No autenticado" as const, session: null, tenantId: null };

  const tenantId = await getActiveTenantId();
  if (!tenantId) return { error: "No hay tenant activo" as const, session: null, tenantId: null };

  return { error: null, session, tenantId };
}

async function checkVacancyPermission(userId: string, tenantId: string): Promise<boolean> {
  const result = await new CheckAnyPermissonUseCase().execute({
    userId,
    permissions: [PermissionActions.vacantes.gestionar],
    tenantId,
  });
  return result.hasAnyPermission;
}

// ─── GET all attachments for a vacancy ───────────────────────────────────────

export async function getVacancyAttachmentsAction(
  vacancyId: string,
): Promise<GetVacancyAttachmentsResult> {
  try {
    const { error, session, tenantId } = await getAuthContext();
    if (error || !session || !tenantId) return { error: error ?? "Error de autenticación", attachments: [] };

    const attachments = await prisma.attachment.findMany({
      where: { vacancyId, tenantId },
      select: ATTACHMENT_SELECT,
      orderBy: { createdAt: "asc" },
    });

    return { error: null, attachments: attachments.map(toAttachmentDTO) };
  } catch (err) {
    console.error("[getVacancyAttachmentsAction]", err);
    return { error: "Error inesperado al obtener los archivos", attachments: [] };
  }
}

// ─── DELETE attachment (storage + DB) ────────────────────────────────────────

export async function deleteVacancyAttachmentAction(
  attachmentId: string,
  vacancyId: string,
): Promise<DeleteVacancyAttachmentResult> {
  try {
    const { error, session, tenantId } = await getAuthContext();
    if (error || !session || !tenantId) return { error: error ?? "Error de autenticación", success: false };

    const hasPermission = await checkVacancyPermission(session.user.id, tenantId);
    if (!hasPermission) return { error: "Sin permisos para eliminar archivos", success: false };

    // Fetch attachment to get the URL (we'll derive the key from it)
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, vacancyId, tenantId },
      select: { id: true, fileUrl: true },
    });

    if (!attachment) return { error: "Archivo no encontrado", success: false };

    // Derive storage key from the URL
    // URL format: {baseUrl}/{key}  e.g. https://cdn.example.com/vacancies/xxx/jd/yyy.pdf
    // The key is everything after the base URL prefix
    const baseUrl = (process.env.DO_SPACES_CDN_URL ?? process.env.DO_SPACES_ENDPOINT ?? "").replace(/\/$/, "");
    const bucket = process.env.DO_SPACES_BUCKET ?? "";

    let storageKey: string;
    if (baseUrl && attachment.fileUrl.startsWith(baseUrl)) {
      storageKey = attachment.fileUrl.slice(baseUrl.length + 1); // remove leading slash
    } else if (bucket && attachment.fileUrl.includes(`/${bucket}/`)) {
      // Endpoint-style URL: https://endpoint/bucket/key
      const bucketPrefix = `/${bucket}/`;
      const idx = attachment.fileUrl.indexOf(bucketPrefix);
      storageKey = attachment.fileUrl.slice(idx + bucketPrefix.length);
    } else {
      // Fallback: use everything after the last domain segment
      const urlObj = new URL(attachment.fileUrl);
      storageKey = urlObj.pathname.replace(/^\//, "");
    }

    // Delete from storage (best-effort — don't fail if storage delete fails)
    const deleteResult = await storageAdapter.delete(storageKey);
    if (!deleteResult.ok) {
      console.warn("[deleteVacancyAttachmentAction] Storage delete warning:", deleteResult.error);
    }

    // Delete from DB
    await prisma.attachment.delete({ where: { id: attachmentId } });

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, success: true };
  } catch (err) {
    console.error("[deleteVacancyAttachmentAction]", err);
    return { error: "Error inesperado al eliminar el archivo", success: false };
  }
}

// ─── VALIDATE attachment ──────────────────────────────────────────────────────

export async function validateAttachmentAction(input: {
  attachmentId: string;
  vacancyId: string;
}): Promise<ValidateAttachmentResult> {
  try {
    const { error, session, tenantId } = await getAuthContext();
    if (error || !session || !tenantId) return { error: error ?? "Error de autenticación" };

    const hasPermission = await checkVacancyPermission(session.user.id, tenantId);
    if (!hasPermission) return { error: "Sin permisos para validar archivos" };

    const attachment = await prisma.attachment.update({
      where: { id: input.attachmentId },
      data: {
        isValidated: true,
        validatedAt: new Date(),
        validatedById: session.user.id,
        rejectionReason: null,
      },
      select: ATTACHMENT_SELECT,
    });

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, attachment: toAttachmentDTO(attachment) };
  } catch (err) {
    console.error("[validateAttachmentAction]", err);
    return { error: "Error inesperado al validar el archivo" };
  }
}

// ─── REJECT attachment ────────────────────────────────────────────────────────

export async function rejectAttachmentAction(input: {
  attachmentId: string;
  vacancyId: string;
  reason: string;
}): Promise<RejectAttachmentResult> {
  try {
    const { error, session, tenantId } = await getAuthContext();
    if (error || !session || !tenantId) return { error: error ?? "Error de autenticación" };

    const hasPermission = await checkVacancyPermission(session.user.id, tenantId);
    if (!hasPermission) return { error: "Sin permisos para rechazar archivos" };

    const attachment = await prisma.attachment.update({
      where: { id: input.attachmentId },
      data: {
        isValidated: false,
        validatedAt: null,
        validatedById: null,
        rejectionReason: input.reason,
      },
      select: ATTACHMENT_SELECT,
    });

    // Create notification record (email sending not implemented)
    await prisma.notification.create({
      data: {
        tenantId,
        provider: NotificationProvider.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipient: session.user.email ?? "",
        subject: "Archivo rechazado",
        body: `El archivo "${attachment.fileName}" fue rechazado. Motivo: ${input.reason}`,
        createdById: session.user.id,
      },
    });

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, attachment: toAttachmentDTO(attachment) };
  } catch (err) {
    console.error("[rejectAttachmentAction]", err);
    return { error: "Error inesperado al rechazar el archivo" };
  }
}

// ─── VALIDATE vacancy checklist ───────────────────────────────────────────────

export async function validateVacancyChecklistAction(
  vacancyId: string,
): Promise<ValidateChecklistResult> {
  try {
    const { error, session, tenantId } = await getAuthContext();
    if (error || !session || !tenantId) return { error: error ?? "Error de autenticación" };

    const hasPermission = await checkVacancyPermission(session.user.id, tenantId);
    if (!hasPermission) return { error: "Sin permisos para validar el checklist" };

    const vacancy = await prisma.vacancy.update({
      where: { id: vacancyId, tenantId },
      data: {
        checklistValidatedAt: new Date(),
        checklistValidatedById: session.user.id,
        checklistRejectionReason: null,
      },
      select: {
        id: true,
        checklistValidatedAt: true,
        checklistValidatedById: true,
        checklistRejectionReason: true,
      },
    });

    revalidatePath("/reclutamiento/vacantes");
    return {
      error: null,
      vacancy: {
        id: vacancy.id,
        checklistValidatedAt: vacancy.checklistValidatedAt?.toISOString() ?? null,
        checklistValidatedById: vacancy.checklistValidatedById,
        checklistRejectionReason: vacancy.checklistRejectionReason,
      },
    };
  } catch (err) {
    console.error("[validateVacancyChecklistAction]", err);
    return { error: "Error inesperado al validar el checklist" };
  }
}

// ─── REJECT vacancy checklist ─────────────────────────────────────────────────

export async function rejectVacancyChecklistAction(input: {
  vacancyId: string;
  reason: string;
}): Promise<RejectChecklistResult> {
  try {
    const { error, session, tenantId } = await getAuthContext();
    if (error || !session || !tenantId) return { error: error ?? "Error de autenticación" };

    const hasPermission = await checkVacancyPermission(session.user.id, tenantId);
    if (!hasPermission) return { error: "Sin permisos para rechazar el checklist" };

    const vacancy = await prisma.vacancy.update({
      where: { id: input.vacancyId, tenantId },
      data: {
        checklistValidatedAt: null,
        checklistValidatedById: null,
        checklistRejectionReason: input.reason,
      },
      select: {
        id: true,
        checklistValidatedAt: true,
        checklistValidatedById: true,
        checklistRejectionReason: true,
      },
    });

    // Create notification record (email sending not implemented)
    await prisma.notification.create({
      data: {
        tenantId,
        provider: NotificationProvider.EMAIL,
        priority: NotificationPriority.MEDIUM,
        recipient: session.user.email ?? "",
        subject: "Checklist de vacante rechazado",
        body: `El checklist de la vacante fue rechazado. Motivo: ${input.reason}`,
        createdById: session.user.id,
      },
    });

    revalidatePath("/reclutamiento/vacantes");
    return {
      error: null,
      vacancy: {
        id: vacancy.id,
        checklistValidatedAt: vacancy.checklistValidatedAt?.toISOString() ?? null,
        checklistValidatedById: vacancy.checklistValidatedById,
        checklistRejectionReason: vacancy.checklistRejectionReason,
      },
    };
  } catch (err) {
    console.error("[rejectVacancyChecklistAction]", err);
    return { error: "Error inesperado al rechazar el checklist" };
  }
}
