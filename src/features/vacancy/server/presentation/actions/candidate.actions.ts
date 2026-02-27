"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { prismaVacancyCandidateRepository } from "../../infrastructure/repositories/PrismaVacancyCandidateRepository";
import { prismaVacancyStatusHistoryRepository } from "../../infrastructure/repositories/PrismaVacancyStatusHistoryRepository";
import { AddCandidateToVacancyUseCase } from "../../application/use-cases/AddCandidateToVacancyUseCase";
import { UpdateCandidateUseCase } from "../../application/use-cases/UpdateCandidateUseCase";
import { RemoveCandidateUseCase } from "../../application/use-cases/RemoveCandidateUseCase";
import { SelectFinalistUseCase } from "../../application/use-cases/SelectFinalistUseCase";
import type {
  AddCandidateFormData,
  AddCandidateResult,
  UpdateCandidateResult,
  DeleteCandidateResult,
  SelectFinalistResult,
  VacancyModality,
  CandidateStatus,
} from "../../../frontend/types/vacancy.types";

/**
 * Agrega un candidato a una vacante
 */
export async function addCandidateAction(
  vacancyId: string,
  data: AddCandidateFormData,
): Promise<AddCandidateResult> {
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
        PermissionActions.candidatos.crear,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para agregar candidatos" };
    }

    const useCase = new AddCandidateToVacancyUseCase(
      prismaVacancyRepository,
      prismaVacancyCandidateRepository,
    );

    const result = await useCase.execute({
      vacancyId,
      tenantId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      isCurrentlyEmployed: data.isCurrentlyEmployed ?? null,
      currentCompany: data.currentCompany ?? null,
      currentSalary: data.currentSalary ?? null,
      salaryExpectation: data.salaryExpectation ?? null,
      currentModality: data.currentModality ?? null,
      countryCode: data.countryCode ?? null,
      regionCode: data.regionCode ?? null,
      currentCommissions: data.currentCommissions ?? null,
      currentBenefits: data.currentBenefits ?? null,
      candidateLocation: data.candidateLocation ?? null,
      otherBenefits: data.otherBenefits ?? null,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al agregar el candidato" };
    }

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, candidate: result.candidate?.toJSON() };
  } catch (error) {
    console.error("Error in addCandidateAction:", error);
    return { error: "Error inesperado al agregar el candidato" };
  }
}

export interface UpdateCandidateInput {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  isCurrentlyEmployed?: boolean | null;
  currentCompany?: string | null;
  currentSalary?: number | null;
  salaryExpectation?: number | null;
  currentModality?: VacancyModality | null;
  countryCode?: string | null;
  regionCode?: string | null;
  currentCommissions?: string | null;
  currentBenefits?: string | null;
  candidateLocation?: string | null;
  otherBenefits?: string | null;
  status?: CandidateStatus;
  isInTerna?: boolean;
  isFinalist?: boolean;
  finalSalary?: number | null;
}

/**
 * Actualiza un candidato existente
 */
export async function updateCandidateAction(
  candidateId: string,
  data: UpdateCandidateInput,
): Promise<UpdateCandidateResult> {
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
        PermissionActions.candidatos.editar,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para actualizar candidatos" };
    }

    const useCase = new UpdateCandidateUseCase(prismaVacancyCandidateRepository);
    const result = await useCase.execute({
      id: candidateId,
      tenantId,
      ...data,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al actualizar el candidato" };
    }

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, candidate: result.candidate?.toJSON() };
  } catch (error) {
    console.error("Error in updateCandidateAction:", error);
    return { error: "Error inesperado al actualizar el candidato" };
  }
}

/**
 * Elimina un candidato de una vacante
 */
export async function removeCandidateAction(
  candidateId: string,
  vacancyId: string,
): Promise<DeleteCandidateResult> {
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

    const hasPermission = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.candidatos.eliminar,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para eliminar candidatos", success: false };
    }

    const useCase = new RemoveCandidateUseCase(prismaVacancyCandidateRepository);
    const result = await useCase.execute({
      id: candidateId,
      vacancyId,
      tenantId,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al eliminar el candidato", success: false };
    }

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, success: true };
  } catch (error) {
    console.error("Error in removeCandidateAction:", error);
    return { error: "Error inesperado al eliminar el candidato", success: false };
  }
}

export interface SelectFinalistInput {
  candidateId: string;
  vacancyId: string;
  salaryFixed: number;
  entryDate: string;
}

/**
 * Selecciona al candidato finalista y mueve la vacante a Pre-Placement
 */
export async function selectFinalistAction(
  input: SelectFinalistInput,
): Promise<SelectFinalistResult> {
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
      permissions: [PermissionActions.vacantes.gestionar],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para seleccionar el finalista" };
    }

    const useCase = new SelectFinalistUseCase(
      prismaVacancyRepository,
      prismaVacancyCandidateRepository,
      prismaVacancyStatusHistoryRepository,
    );

    const result = await useCase.execute({
      candidateId: input.candidateId,
      vacancyId: input.vacancyId,
      tenantId,
      salaryFixed: input.salaryFixed,
      entryDate: new Date(input.entryDate),
      changedById: session.user.id,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al seleccionar el finalista" };
    }

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, vacancy: result.vacancy };
  } catch (error) {
    console.error("Error in selectFinalistAction:", error);
    return { error: "Error inesperado al seleccionar el finalista" };
  }
}
