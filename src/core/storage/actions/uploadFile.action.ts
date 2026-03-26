"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import prisma from "@lib/prisma";
import { getActiveTenantId } from "@features/vacancy/server/presentation/helpers/getActiveTenant.helper";
import { storageAdapter } from "@core/storage/StorageModule";
import { AttachableType, AttachmentSubType } from "../../generated/prisma/client";
import { ServerErrors } from "@core/shared/constants/error-messages";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";

export interface UploadFileActionInput {
  formData: FormData;
  key: string; // pre-built storage key (use StorageKeys helpers)
  attachableType: AttachableType;
  subType: AttachmentSubType;
  vacancyId?: string;
  vacancyCandidateId?: string;
}

export interface UploadFileActionResult {
  error: string | null;
  attachment?: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    subType: string;
  };
}

export async function uploadFileAction(
  input: UploadFileActionInput,
): Promise<UploadFileActionResult> {
  try {
    // 1. Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated };
    }

    // 2. Tenant check
    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant };
    }

    // 3. Permission check for vacancy-related uploads
    if (input.attachableType === "VACANCY" || input.attachableType === "VACANCY_CANDIDATE") {
      const hasPermission = await new CheckAnyPermissonUseCase().execute({
        userId: session.user.id,
        permissions: [
          PermissionActions.vacantes.subirArchivos,
          PermissionActions.vacantes.gestionar,
        ],
        tenantId,
      });
      if (!hasPermission) {
        return { error: "Sin permisos para subir archivos a vacantes" };
      }
    }

    // 4. Extract file from FormData
    const file = input.formData.get("file");
    if (!(file instanceof File)) {
      return { error: "No se encontró el archivo en el formulario" };
    }

    const fileName = file.name;
    const mimeType = file.type;
    const fileSize = file.size;

    if (fileSize === 0) {
      return { error: "El archivo está vacío" };
    }

    // 5. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Upload to storage
    const uploadResult = await storageAdapter.upload({
      buffer,
      fileName,
      key: input.key,
      mimeType,
      fileSize,
    });

    if (!uploadResult.ok) {
      return { error: uploadResult.error };
    }

    // 7. Create Attachment record in the DB
    const attachment = await prisma.attachment.create({
      data: {
        fileName,
        fileUrl: uploadResult.url,
        fileSize,
        mimeType,
        attachableType: input.attachableType,
        subType: input.subType,
        tenantId,
        uploadedById: session.user.id,
        ...(input.vacancyId ? { vacancyId: input.vacancyId } : {}),
        ...(input.vacancyCandidateId
          ? { vacancyCandidateId: input.vacancyCandidateId }
          : {}),
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        subType: true,
      },
    });

    return {
      error: null,
      attachment: {
        ...attachment,
        subType: attachment.subType.toString(),
      },
    };
  } catch (error) {
    console.error("[uploadFileAction] Unexpected error:", error);
    return { error: "Error inesperado al subir el archivo" };
  }
}
