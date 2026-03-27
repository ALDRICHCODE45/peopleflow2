"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { prismaInvoiceRepository } from "../../infrastructure/repositories/PrismaInvoiceRepository";
import {
  CreateInvoiceUseCase,
  type CreateInvoiceInput,
} from "../../application/use-cases/CreateInvoiceUseCase";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

import type { InvoiceDTO } from "../../domain/entities/Invoice";
import type {
  Currency,
  FeeType,
  InvoicePaymentType,
  InvoiceType,
} from "@/core/generated/prisma/client";

// --- Input / Output ---

export interface CreateInvoiceActionInput {
  type: InvoiceType;
  paymentType: InvoicePaymentType;
  clientId: string;
  vacancyId?: string | null;
  anticipoInvoiceId?: string | null;
  // Snapshots
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
  // Economics
  currency: Currency;
  salario?: number | null;
  feeType?: FeeType | null;
  feeValue?: number | null;
  advanceType?: string | null;
  advanceValue?: number | null;
  // Dates (ISO strings from client)
  issuedAt: string;
  mesPlacement?: string | null;
  banco?: string | null;
}

export interface CreateInvoiceActionResult {
  error: string | null;
  data?: InvoiceDTO;
}

/**
 * Crea una nueva factura
 */
export async function createInvoiceAction(
  input: CreateInvoiceActionInput,
): Promise<CreateInvoiceActionResult> {
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
        PermissionActions.facturas.crear,
        PermissionActions.facturas.gestionar,
      ],
      tenantId,
    });

    if (!permissionCheck.hasAnyPermission) {
      return { error: "No tienes permisos para crear facturas" };
    }

    // Ejecutar caso de uso
    const useCase = new CreateInvoiceUseCase(prismaInvoiceRepository);
    const result = await useCase.execute({
      tenantId,
      createdById: session.user.id,
      type: input.type,
      paymentType: input.paymentType,
      clientId: input.clientId,
      vacancyId: input.vacancyId,
      anticipoInvoiceId: input.anticipoInvoiceId,
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
      advanceType: input.advanceType as CreateInvoiceInput["advanceType"],
      advanceValue: input.advanceValue,
      // Dates (parse ISO strings to Date)
      issuedAt: new Date(input.issuedAt),
      mesPlacement: input.mesPlacement ? new Date(input.mesPlacement) : null,
      banco: input.banco,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al crear la factura" };
    }

    revalidatePath("/finanzas/facturas");

    return {
      error: null,
      data: result.data,
    };
  } catch (error) {
    console.error("Error in createInvoiceAction:", error);
    return { error: "Error inesperado al crear la factura" };
  }
}
