"use server";

import { auth } from "@lib/auth";
import prisma from "@lib/prisma";
import { headers } from "next/headers";

import { getActiveTenantId } from "../helpers/getActiveTenant.helper";
import { CheckAnyPermissonUseCase } from "@/features/auth-rbac/server/application/use-cases/CheckAnyPermissionUseCase";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { ServerErrors } from "@core/shared/constants/error-messages";

export interface InvoiceVacancyOption {
  id: string;
  position: string;
  salaryFixed: number | null;
  recruiterId: string;
  recruiterName: string;
  // Datos del candidato contratado (vía FK directa hiredCandidate)
  hiredCandidateId: string | null;
  hiredCandidateName: string | null;
  hiredCandidateEmail: string | null;
  mesPlacement: string | null;
  isWarranty: boolean;
}

export interface GetInvoiceVacancyOptionsResult {
  error: string | null;
  vacancies: InvoiceVacancyOption[];
}

export async function getInvoiceVacancyOptionsAction(
  clientId?: string,
): Promise<GetInvoiceVacancyOptionsResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: ServerErrors.notAuthenticated, vacancies: [] };
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return { error: ServerErrors.noActiveTenant, vacancies: [] };
    }

    const permissionCheck = await new CheckAnyPermissonUseCase().execute({
      userId: session.user.id,
      permissions: [
        PermissionActions.facturas.crear,
        PermissionActions.facturas.gestionar,
      ],
      tenantId,
    });

    if (!permissionCheck.hasAnyPermission) {
      return {
        error: "No tienes permisos para consultar vacantes de facturación",
        vacancies: [],
      };
    }

    const vacancies = await prisma.vacancy.findMany({
      where: {
        tenantId,
        ...(clientId ? { clientId } : {}),
      },
      select: {
        id: true,
        position: true,
        salaryFixed: true,
        recruiterId: true,
        recruiter: {
          select: {
            name: true,
          },
        },
        // FK directa al candidato contratado
        hiredCandidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        entryDate: true,
        placementConfirmedAt: true,
        isWarranty: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return {
      error: null,
      vacancies: vacancies.map((vacancy) => {
        const hired = vacancy.hiredCandidate;
        const placementDate = vacancy.entryDate ?? vacancy.placementConfirmedAt;

        return {
          id: vacancy.id,
          position: vacancy.position,
          salaryFixed: vacancy.salaryFixed,
          recruiterId: vacancy.recruiterId,
          recruiterName: vacancy.recruiter.name ?? "Sin reclutador",
          // Datos del candidato contratado (vía FK directa)
          hiredCandidateId: hired?.id ?? null,
          hiredCandidateName: hired
            ? `${hired.firstName} ${hired.lastName}`.trim()
            : null,
          hiredCandidateEmail: hired?.email ?? null,
          mesPlacement: placementDate?.toISOString() ?? null,
          isWarranty: vacancy.isWarranty,
        };
      }),
    };
  } catch (error) {
    console.error("Error in getInvoiceVacancyOptionsAction:", error);
    return { error: "Error al obtener vacantes", vacancies: [] };
  }
}
