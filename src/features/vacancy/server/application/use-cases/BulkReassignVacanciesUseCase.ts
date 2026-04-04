import type {
  BulkActionFailure,
  BulkActionResult,
  ReassignmentReasonType,
  VacancyStatusType,
} from "@features/vacancy/frontend/types/vacancy.types";
import type { IRecruiterAssignmentHistoryRepository } from "../../domain/interfaces/IRecruiterAssignmentHistoryRepository";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";

const REASSIGNABLE_STATUSES: VacancyStatusType[] = [
  "QUICK_MEETING",
  "HUNTING",
  "FOLLOW_UP",
  "PRE_PLACEMENT",
  "STAND_BY",
];

export interface BulkReassignVacanciesInput {
  ids: string[];
  recruiterId: string;
  reason: ReassignmentReasonType;
  notes?: string;
  assignedByUserId: string;
  assignedByName: string;
  tenantId: string;
}

export interface BulkReassignVacanciesOutput {
  success: boolean;
  data?: BulkActionResult;
  error?: string;
}

export class BulkReassignVacanciesUseCase {
  constructor(
    private readonly assignmentRepository: IRecruiterAssignmentHistoryRepository,
    private readonly vacancyRepository: IVacancyRepository,
  ) {}

  async execute(input: BulkReassignVacanciesInput): Promise<BulkReassignVacanciesOutput> {
    try {
      if (input.ids.length === 0) {
        return {
          success: false,
          error: "Debes seleccionar al menos una vacante",
        };
      }

      if (!input.recruiterId) {
        return {
          success: false,
          error: "Debes seleccionar un reclutador",
        };
      }

      if (!input.assignedByUserId) {
        return {
          success: false,
          error: "Usuario no autenticado",
        };
      }

      const recruiterContact = await this.vacancyRepository.findRecruiterContactById(
        input.recruiterId,
      );

      if (!recruiterContact) {
        return {
          success: false,
          error: "Reclutador no encontrado",
        };
      }

      const uniqueIds = Array.from(new Set(input.ids));
      const failed: BulkActionFailure[] = [];
      const validIds: string[] = [];
      const vacancies = await this.vacancyRepository.findByIds(
        uniqueIds,
        input.tenantId,
      );
      const vacanciesById = new Map(vacancies.map((vacancy) => [vacancy.id, vacancy]));

      for (const id of uniqueIds) {
        const vacancy = vacanciesById.get(id);

        if (!vacancy) {
          failed.push({
            id,
            reason: "La vacante no existe o no pertenece al tenant activo",
          });
          continue;
        }

        if (!REASSIGNABLE_STATUSES.includes(vacancy.status)) {
          failed.push({
            id,
            reason: `La vacante está en estado ${vacancy.status} y no puede reasignarse`,
          });
          continue;
        }

        if (vacancy.recruiterId === input.recruiterId) {
          failed.push({
            id,
            reason: "La vacante ya está asignada al reclutador seleccionado",
          });
          continue;
        }

        validIds.push(id);
      }

      if (validIds.length === 0) {
        return {
          success: true,
          data: {
            succeeded: [],
            failed,
          },
        };
      }

      const persisted = await this.assignmentRepository.bulkReassign({
        vacancyIds: validIds,
        newRecruiterId: input.recruiterId,
        reason: input.reason,
        notes: input.notes,
        assignedByUserId: input.assignedByUserId,
        assignedByName: input.assignedByName,
        tenantId: input.tenantId,
      });

      return {
        success: true,
        data: {
          succeeded: persisted.succeeded,
          failed: [...failed, ...persisted.failed],
        },
      };
    } catch (error) {
      console.error("Error in BulkReassignVacanciesUseCase:", error);
      return {
        success: false,
        error: "Error al reasignar vacantes",
      };
    }
  }
}
