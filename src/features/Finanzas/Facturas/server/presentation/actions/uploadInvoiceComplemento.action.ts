"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@lib/prisma";

import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";
import { storageAdapter } from "@core/storage/StorageModule";
import { StorageKeys } from "@core/storage/StorageKeys";

// --- Output ---

export interface UploadInvoiceComplementoResult {
  error: string | null;
  attachment?: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  };
}

/**
 * Sube un complemento de pago (PDF) para una factura PPD.
 * Crea el Attachment con attachableType: INVOICE, subType: COMPLEMENTO_PAGO.
 *
 * Sigue el patrón de uploadFile.action.ts
 */
export async function uploadInvoiceComplementoAction(
  formData: FormData,
  invoiceId: string,
): Promise<UploadInvoiceComplementoResult> {
  try {
    // 1. Auth check
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated };
    }

    // 2. Tenant check
    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant };
    }

    // 3. Permission check
    const permissionCheck = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.facturas.editar,
        PermissionActions.facturas.gestionar,
      ],
      tenantId,
    });

    if (!permissionCheck.hasAnyPermission) {
      return { error: "No tienes permisos para subir complementos" };
    }

    // 4. Verify invoice exists and belongs to tenant
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      select: { id: true, paymentType: true },
    });

    if (!invoice) {
      return { error: "Factura no encontrada" };
    }

    // 5. Extract file from FormData
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return { error: "No se encontró el archivo en el formulario" };
    }

    const fileName = file.name;
    const mimeType = file.type;
    const fileSize = file.size;

    if (fileSize === 0) {
      return { error: "El archivo está vacío" };
    }

    // 6. Get file extension for storage key
    const ext = fileName.split(".").pop() ?? "pdf";

    // 7. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 8. Upload to storage
    const storageKey = StorageKeys.invoiceComplemento(invoiceId, ext);
    const uploadResult = await storageAdapter.upload({
      buffer,
      fileName,
      key: storageKey,
      mimeType,
      fileSize,
    });

    if (!uploadResult.ok) {
      return { error: uploadResult.error };
    }

    // 9. Create Attachment record in DB
    const attachment = await prisma.attachment.create({
      data: {
        fileName,
        fileUrl: uploadResult.url,
        fileSize,
        mimeType,
        attachableType: "INVOICE",
        subType: "COMPLEMENTO_PAGO",
        tenantId,
        uploadedById: session.user.id,
        invoiceId,
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
      },
    });

    revalidatePath("/finanzas/facturas");

    return {
      error: null,
      attachment,
    };
  } catch (error) {
    console.error("[uploadInvoiceComplementoAction] Unexpected error:", error);
    return { error: "Error inesperado al subir el complemento" };
  }
}
