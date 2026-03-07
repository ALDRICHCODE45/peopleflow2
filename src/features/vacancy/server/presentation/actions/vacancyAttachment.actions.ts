"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { storageAdapter } from "@core/storage/StorageModule";
import { prismaVacancyAttachmentRepository } from "../../infrastructure/repositories/PrismaVacancyAttachmentRepository";
import { Routes } from "@core/shared/constants/routes";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { SendNotificationUseCase } from "@features/Notifications/server/application/use-cases/SendNotificationUseCase";
import { prismaNotificationRepository } from "@features/Notifications/server/infrastructure/repositories/PrismaNotificationRepository";
import { emailProvider } from "@features/Notifications/server/infrastructure/providers/EmailProvider";
import type {
  GetVacancyAttachmentsResult,
  DeleteVacancyAttachmentResult,
  ValidateAttachmentResult,
  RejectAttachmentResult,
  ValidateChecklistResult,
  RejectChecklistResult,
  AttachmentDTO,
} from "@features/vacancy/frontend/types/vacancy.types";
import type { VacancyAttachmentRecord } from "../../domain/interfaces/IVacancyAttachmentRepository";
import { ServerErrors } from "@core/shared/constants/error-messages";

// ─── Map VacancyAttachmentRecord → AttachmentDTO ─────────────────────────────

function toAttachmentDTO(a: VacancyAttachmentRecord): AttachmentDTO {
  return {
    id: a.id,
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    fileSize: a.fileSize,
    mimeType: a.mimeType,
    subType: a.subType as AttachmentDTO["subType"],
    isValidated: a.isValidated,
    validatedAt: a.validatedAt,
    validatedById: a.validatedById,
    rejectionReason: a.rejectionReason,
    vacancyId: a.vacancyId,
    vacancyCandidateId: a.vacancyCandidateId,
    uploadedById: a.uploadedById,
    createdAt: a.createdAt,
  };
}

// ─── Auth + permission guard shared helper ────────────────────────────────────

async function getAuthContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: ServerErrors.notAuthenticated, session: null, tenantId: null };

  const tenantId = await getActiveTenantId();
  if (!tenantId) return { error: ServerErrors.noActiveTenant, session: null, tenantId: null };

  return { error: null, session, tenantId };
}

async function checkVacancyPermission(
  userId: string,
  tenantId: string,
  extraPermissions: string[] = [],
): Promise<boolean> {
  const result = await new CheckAnyPermissonUseCase().execute({
    userId,
    permissions: [PermissionActions.vacantes.gestionar, ...extraPermissions],
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

    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantes.acceder,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });
    if (!hasPermission.hasAnyPermission) return { error: "Sin permisos para ver los archivos", attachments: [] };

    const records = await prismaVacancyAttachmentRepository.findByVacancyId(vacancyId, tenantId);

    return { error: null, attachments: records.map(toAttachmentDTO) };
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

    const hasPermission = await checkVacancyPermission(session.user.id, tenantId, [
      PermissionActions.vacantes.eliminarArchivos,
    ]);
    if (!hasPermission) return { error: "Sin permisos para eliminar archivos", success: false };

    const attachment = await prismaVacancyAttachmentRepository.findById(attachmentId, vacancyId, tenantId);
    if (!attachment) return { error: "Archivo no encontrado", success: false };

    // Derive storage key from the URL
    const baseUrl = (process.env.DO_SPACES_CDN_URL ?? process.env.DO_SPACES_ENDPOINT ?? "").replace(/\/$/, "");
    const bucket = process.env.DO_SPACES_BUCKET ?? "";

    let storageKey: string;
    if (baseUrl && attachment.fileUrl.startsWith(baseUrl)) {
      storageKey = attachment.fileUrl.slice(baseUrl.length + 1);
    } else if (bucket && attachment.fileUrl.includes(`/${bucket}/`)) {
      const bucketPrefix = `/${bucket}/`;
      const idx = attachment.fileUrl.indexOf(bucketPrefix);
      storageKey = attachment.fileUrl.slice(idx + bucketPrefix.length);
    } else {
      const urlObj = new URL(attachment.fileUrl);
      storageKey = urlObj.pathname.replace(/^\//, "");
    }

    // Delete from storage (best-effort)
    const deleteResult = await storageAdapter.delete(storageKey);
    if (!deleteResult.ok) {
      console.warn("[deleteVacancyAttachmentAction] Storage delete warning:", deleteResult.error);
    }

    // Delete from DB via repository
    await prismaVacancyAttachmentRepository.deleteById(attachmentId);

    revalidatePath(Routes.reclutamiento.vacantes);
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

    const hasPermission = await checkVacancyPermission(session.user.id, tenantId, [
      PermissionActions.vacantes.revisarArchivos,
    ]);
    if (!hasPermission) return { error: "Sin permisos para validar archivos" };

    const record = await prismaVacancyAttachmentRepository.validate(input.attachmentId, session.user.id);

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, attachment: toAttachmentDTO(record) };
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

    const hasPermission = await checkVacancyPermission(session.user.id, tenantId, [
      PermissionActions.vacantes.revisarArchivos,
    ]);
    if (!hasPermission) return { error: "Sin permisos para rechazar archivos" };

    const record = await prismaVacancyAttachmentRepository.reject(input.attachmentId, input.reason);

    // Send notification via use case
    await new SendNotificationUseCase(prismaNotificationRepository, [emailProvider]).execute({
      tenantId,
      provider: "EMAIL",
      priority: "MEDIUM",
      recipient: session.user.email ?? "",
      subject: "Archivo rechazado",
      body: `El archivo "${record.fileName}" fue rechazado. Motivo: ${input.reason}`,
      createdById: session.user.id,
    });

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, attachment: toAttachmentDTO(record) };
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

    const hasPermission = await checkVacancyPermission(session.user.id, tenantId, [
      PermissionActions.vacantes.validarChecklist,
    ]);
    if (!hasPermission) return { error: "Sin permisos para validar el checklist" };

    const vacancy = await prismaVacancyRepository.validateChecklist(vacancyId, tenantId, session.user.id);

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, vacancy };
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

    const hasPermission = await checkVacancyPermission(session.user.id, tenantId, [
      PermissionActions.vacantes.rechazarChecklist,
    ]);
    if (!hasPermission) return { error: "Sin permisos para rechazar el checklist" };

    const vacancy = await prismaVacancyRepository.rejectChecklist(input.vacancyId, tenantId, input.reason);

    // Send notification via use case
    await new SendNotificationUseCase(prismaNotificationRepository, [emailProvider]).execute({
      tenantId,
      provider: "EMAIL",
      priority: "MEDIUM",
      recipient: session.user.email ?? "",
      subject: "Checklist de vacante rechazado",
      body: `El checklist de la vacante fue rechazado. Motivo: ${input.reason}`,
      createdById: session.user.id,
    });

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, vacancy };
  } catch (err) {
    console.error("[rejectVacancyChecklistAction]", err);
    return { error: "Error inesperado al rechazar el checklist" };
  }
}
