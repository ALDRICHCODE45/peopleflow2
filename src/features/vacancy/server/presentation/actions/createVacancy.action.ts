"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { CreateVacancyUseCase } from "../../application/use-cases/CreateVacancyUseCase";
import { inngest } from "@/core/shared/inngest/inngest";
import type {
  CreateVacancyFormData,
  CreateVacancyResult,
} from "../../../frontend/types/vacancy.types";

export async function createVacancyAction(
  data: CreateVacancyFormData,
): Promise<CreateVacancyResult> {
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
        PermissionActions.vacantes.crear,
        PermissionActions.vacantes.gestionar,
      ],
      tenantId,
    });

    if (!hasPermission) {
      return { error: "Sin permisos para crear vacantes" };
    }

    const useCase = new CreateVacancyUseCase(prismaVacancyRepository);
    const result = await useCase.execute({
      position: data.position,
      recruiterId: data.recruiterId,
      clientId: data.clientId,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      commissions: data.commissions ?? null,
      benefits: data.benefits ?? null,
      tools: data.tools ?? null,
      modality: data.modality ?? null,
      schedule: data.schedule ?? null,
      countryCode: data.countryCode ?? null,
      regionCode: data.regionCode ?? null,
      requiresPsychometry: data.requiresPsychometry,
      targetDeliveryDate: data.targetDeliveryDate
        ? new Date(data.targetDeliveryDate)
        : null,
      tenantId,
      createdById: session.user.id,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al crear la vacante" };
    }

    const vacancyDTO = result.vacancy?.toJSON();

    if (data.sendNotification === true && vacancyDTO) {
      const [recruiter, clientName] = await Promise.all([
        prismaVacancyRepository.findRecruiterContactById(data.recruiterId),
        prismaVacancyRepository.findClientNameById(data.clientId, tenantId),
      ]);

      if (recruiter?.email) {
        await inngest.send({
          name: "email/send",
          data: {
            template: "recruiter-vacancy-assigned",
            tenantId,
            triggeredById: session.user.id,
            data: {
              recruiterName: recruiter.name ?? "Reclutador",
              recruiterEmail: recruiter.email,
              vacancyPosition: data.position,
              clientName: clientName ?? "Cliente",
              vacancyId: vacancyDTO.id,
            },
          },
        });
      }
    }

    revalidatePath("/reclutamiento/vacantes");
    return { error: null, vacancy: vacancyDTO };
  } catch (error) {
    console.error("Error in createVacancyAction:", error);
    return { error: "Error inesperado al crear la vacante" };
  }
}
