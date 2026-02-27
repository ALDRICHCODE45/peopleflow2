"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import prisma from "@lib/prisma";
import { inngest } from "@core/shared/inngest/inngest";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { prismaVacancyStatusHistoryRepository } from "../../infrastructure/repositories/PrismaVacancyStatusHistoryRepository";
import { prismaVacancyCandidateRepository } from "../../infrastructure/repositories/PrismaVacancyCandidateRepository";
import { TransitionVacancyStatusUseCase } from "../../application/use-cases/TransitionVacancyStatusUseCase";
import type {
  VacancyStatusType,
  TransitionVacancyStatusResult,
} from "../../../frontend/types/vacancy.types";

export interface TransitionVacancyStatusInput {
  vacancyId: string;
  newStatus: VacancyStatusType;
  reason?: string;
  newTargetDeliveryDate?: string;
  salaryFixed?: number;
  entryDate?: string; // ISO string from frontend
  sendCongratsEmail?: boolean;
  hiredCandidateId?: string;
}

export async function transitionVacancyStatusAction(
  input: TransitionVacancyStatusInput,
): Promise<TransitionVacancyStatusResult> {
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

    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.vacantes.gestionar,
        PermissionActions.vacantes.autorizarRetroceso,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para cambiar el estado de la vacante" };
    }

    // Determine if this transition requires a hired candidate selection
    const currentVacancy = await prismaVacancyRepository.findById(input.vacancyId, tenantId);
    if (!currentVacancy) {
      return { error: "Vacante no encontrada" };
    }
    const currentVacancyStatus = currentVacancy.status;

    const needsHiredCandidate =
      input.newStatus === "PRE_PLACEMENT" ||
      (input.newStatus === "PLACEMENT" && currentVacancyStatus === "FOLLOW_UP");

    if (needsHiredCandidate && !input.hiredCandidateId) {
      return { error: "Debés seleccionar el candidato contratado para continuar" };
    }

    // Query attachment counts needed for state machine guards
    // Only relevant for QUICK_MEETING → HUNTING transition, but we query always
    // to keep the action generic (cheap query, correct behavior)
    const [jobDescCount, perfilMuestraValidatedCount] = await Promise.all([
      prisma.attachment.count({
        where: {
          vacancyId: input.vacancyId,
          subType: "JOB_DESCRIPTION",
        },
      }),
      prisma.attachment.count({
        where: {
          vacancyId: input.vacancyId,
          subType: "PERFIL_MUESTRA",
          isValidated: true,
        },
      }),
    ]);

    const useCase = new TransitionVacancyStatusUseCase(
      prismaVacancyRepository,
      prismaVacancyStatusHistoryRepository,
    );

    const result = await useCase.execute({
      vacancyId: input.vacancyId,
      tenantId,
      newStatus: input.newStatus,
      changedById: session.user.id,
      reason: input.reason ?? null,
      newTargetDeliveryDate: input.newTargetDeliveryDate
        ? new Date(input.newTargetDeliveryDate)
        : null,
      hasJobDescription: jobDescCount > 0,
      hasValidatedPerfilMuestra: perfilMuestraValidatedCount > 0,
      salaryFixed: input.salaryFixed ?? null,
      entryDate: input.entryDate ? new Date(input.entryDate) : null,
      sendCongratsEmail: input.sendCongratsEmail,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al cambiar el estado" };
    }

    // If transition requires hired candidate, mark them as CONTRATADO
    if (needsHiredCandidate && input.hiredCandidateId) {
      await prismaVacancyCandidateRepository.markAsContratado(
        input.hiredCandidateId,
        input.vacancyId,
        tenantId,
      );
    }

    // On rollback to HUNTING: reset all candidates to EN_PROCESO and clear terna
    if (input.newStatus === "HUNTING") {
      await prismaVacancyCandidateRepository.resetCandidatesOnRollback(
        input.vacancyId,
        tenantId,
      );
    }

    // Fire and forget Inngest event if applicable
    if (result.inngestEvent) {
      inngest.send(result.inngestEvent as Parameters<typeof inngest.send>[0]).catch((err) => {
        console.error("[transitionVacancyStatusAction] Failed to send inngest event:", err);
      });
    }

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, vacancy: result.vacancy };
  } catch (error) {
    console.error("Error in transitionVacancyStatusAction:", error);
    return { error: "Error inesperado al cambiar el estado de la vacante" };
  }
}
