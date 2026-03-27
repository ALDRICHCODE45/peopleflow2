"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { prismaInvoiceRepository } from "../../infrastructure/repositories/PrismaInvoiceRepository";
import { UpdateInvoiceUseCase } from "../../application/use-cases/UpdateInvoiceUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

import type { InvoiceDTO } from "../../domain/entities/Invoice";
import type { Currency, FeeType, AdvanceType } from "@/core/generated/prisma/client";

// --- Input / Output ---

export interface UpdateInvoiceActionInput {
  id: string;
  // Snapshots editables
  candidateId?: string | null;
  candidateName?: string | null;
  hunterId?: string | null;
  hunterName?: string | null;
  razonSocial?: string | null;
  nombreComercial?: string | null;
  ubicacion?: string | null;
  figura?: string | null;
  rfc?: string | null;
  codigoPostal?: string | null;
  regimen?: string | null;
  posicion?: string | null;
  // Economics (trigger recalculation)
  currency?: Currency;
  salario?: number | null;
  feeType?: FeeType | null;
  feeValue?: number | null;
  advanceType?: string | null;
  advanceValue?: number | null;
  // Dates (ISO strings from client)
  issuedAt?: string;
  mesPlacement?: string | null;
  // Additional
  banco?: string | null;
  // Vacancy (editable on ANTICIPO)
  vacancyId?: string | null;
}

export interface UpdateInvoiceActionResult {
  error: string | null;
  data?: InvoiceDTO;
}

/**
 * Actualiza una factura existente
 */
export async function updateInvoiceAction(
  input: UpdateInvoiceActionInput,
): Promise<UpdateInvoiceActionResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated };
    }

    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant };
    }

    // Verificar permisos
    const permissionCheck = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.facturas.editar,
        PermissionActions.facturas.gestionar,
      ],
      tenantId,
    });

    if (!permissionCheck.hasAnyPermission) {
      return { error: "No tienes permisos para editar facturas" };
    }

    // Ejecutar caso de uso
    const useCase = new UpdateInvoiceUseCase(prismaInvoiceRepository);
    const result = await useCase.execute({
      id: input.id,
      tenantId,
      // Snapshots
      candidateId: input.candidateId,
      candidateName: input.candidateName,
      hunterId: input.hunterId,
      hunterName: input.hunterName,
      razonSocial: input.razonSocial,
      nombreComercial: input.nombreComercial,
      ubicacion: input.ubicacion,
      figura: input.figura,
      rfc: input.rfc,
      codigoPostal: input.codigoPostal,
      regimen: input.regimen,
      posicion: input.posicion,
      // Economics
      currency: input.currency,
      salario: input.salario,
      feeType: input.feeType,
      feeValue: input.feeValue,
      advanceType: input.advanceType as AdvanceType | null | undefined,
      advanceValue: input.advanceValue,
      // Dates (parse ISO strings to Date when provided)
      ...(input.issuedAt !== undefined && { issuedAt: new Date(input.issuedAt) }),
      ...(input.mesPlacement !== undefined && {
        mesPlacement: input.mesPlacement ? new Date(input.mesPlacement) : null,
      }),
      // Additional
      banco: input.banco,
      vacancyId: input.vacancyId,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al actualizar la factura" };
    }

    revalidatePath("/finanzas/facturas");

    return {
      error: null,
      data: result.data,
    };
  } catch (error) {
    console.error("Error in updateInvoiceAction:", error);
    return { error: "Error inesperado al actualizar la factura" };
  }
}
