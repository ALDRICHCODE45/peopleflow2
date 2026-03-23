"use server";

import { auth } from "@lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { parseISO } from "date-fns";
import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { prismaRecruiterAssignmentHistoryRepository } from "../../infrastructure/repositories/PrismaRecruiterAssignmentHistoryRepository";
import { CreateVacancyUseCase } from "../../application/use-cases/CreateVacancyUseCase";
import { Routes } from "@core/shared/constants/routes";
import { inngest } from "@/core/shared/inngest/inngest";
import { InngestEvents } from "@core/shared/constants/inngest-events";
import type {
  CreateVacancyFormData,
  CreateVacancyResult,
  VacancyServiceType,
  VacancyCurrency,
} from "../../../frontend/types/vacancy.types";
import { ServerErrors } from "@core/shared/constants/error-messages";
import { TargetDeliveryDate } from "../../domain/value-objects/TargetDeliveryDate";

export async function createVacancyAction(
  data: CreateVacancyFormData,
): Promise<CreateVacancyResult> {
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

    // Determine assignedAt based on permission
    const canModifyAssignedAt = data.assignedAt
      ? await new CheckAnyPermissonUseCase().execute({
          userId: session.user.id,
          permissions: [
            PermissionActions.vacantes.modificarFechaAsignacion,
            PermissionActions.vacantes.gestionar,
          ],
          tenantId,
        })
      : false;

    const assignedAt =
      canModifyAssignedAt && data.assignedAt
        ? parseISO(data.assignedAt)
        : new Date();

    // Determine targetDeliveryDate based on permission
    const canModifyTargetDate = data.targetDeliveryDate
      ? await new CheckAnyPermissonUseCase().execute({
          userId: session.user.id,
          permissions: [
            PermissionActions.vacantes.modificarFechaTentativaEntrega,
            PermissionActions.vacantes.gestionar,
          ],
          tenantId,
        })
      : false;

    const serviceType = data.serviceType ?? "END_TO_END";

    const targetDeliveryDate =
      canModifyTargetDate && data.targetDeliveryDate
        ? TargetDeliveryDate.from(parseISO(data.targetDeliveryDate)).value
        : TargetDeliveryDate.calculate(assignedAt, serviceType as VacancyServiceType).value;

    // Fetch recruiter name for the initial assignment record
    const recruiterContact = await prismaVacancyRepository.findRecruiterContactById(data.recruiterId);

    const useCase = new CreateVacancyUseCase(
      prismaVacancyRepository,
      prismaRecruiterAssignmentHistoryRepository,
    );
    const result = await useCase.execute({
      position: data.position,
      recruiterId: data.recruiterId,
      clientId: data.clientId,
      currency: (data.currency as VacancyCurrency) ?? null,
      salaryType: data.salaryType ?? "RANGE",
      salaryFixed: data.salaryType === "FIXED" ? (data.salaryFixed ?? null) : null,
      salaryMin: data.salaryType === "FIXED" ? null : (data.salaryMin ?? null),
      salaryMax: data.salaryType === "FIXED" ? null : (data.salaryMax ?? null),
      commissions: data.commissions ?? null,
      benefits: data.benefits ?? null,
      tools: data.tools ?? null,
      modality: data.modality ?? null,
      schedule: data.schedule ?? null,
      countryCode: data.countryCode ?? null,
      regionCode: data.regionCode ?? null,
      requiresPsychometry: data.requiresPsychometry,
      serviceType,
      assignedAt,
      targetDeliveryDate,
      tenantId,
      createdById: session.user.id,
      recruiterName: recruiterContact?.name ?? null,
      createdByName: session.user.name ?? null,
    });

    if (!result.success) {
      return { error: result.error ?? "Error al crear la vacante" };
    }

    const vacancyDTO = result.vacancy?.toJSON();

    // Lookup recruiter + client for notifications (needed by both events below)
    const [recruiter, clientName] = vacancyDTO
      ? await Promise.all([
          prismaVacancyRepository.findRecruiterContactById(data.recruiterId),
          prismaVacancyRepository.findClientNameById(data.clientId, tenantId),
        ])
      : [null, null];

    if (data.sendNotification === true && vacancyDTO && recruiter?.email) {
      await inngest.send({
        name: InngestEvents.email.send,
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

    // Schedule countdown reminders if vacancy has a targetDeliveryDate
    if (vacancyDTO && targetDeliveryDate && recruiter?.email) {
      inngest
        .send({
          name: InngestEvents.vacancy.countdownSchedule,
          data: {
            vacancyId: vacancyDTO.id,
            tenantId,
            targetDeliveryDate: targetDeliveryDate.toISOString(),
            vacancyPosition: data.position,
            clientName: clientName ?? "Cliente",
            recruiterId: data.recruiterId,
            recruiterName: recruiter.name ?? "Reclutador",
            recruiterEmail: recruiter.email,
          },
        })
        .catch((err) => {
          console.error("[createVacancyAction] Failed to send countdown event:", err);
        });
    }

    revalidatePath(Routes.reclutamiento.vacantes);
    return { error: null, vacancy: vacancyDTO };
  } catch (error) {
    console.error("Error in createVacancyAction:", error);
    return { error: "Error inesperado al crear la vacante" };
  }
}
