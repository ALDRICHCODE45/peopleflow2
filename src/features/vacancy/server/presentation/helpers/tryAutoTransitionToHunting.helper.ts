import { revalidatePath } from "next/cache";
import { prismaVacancyRepository } from "../../infrastructure/repositories/PrismaVacancyRepository";
import { prismaVacancyStatusHistoryRepository } from "../../infrastructure/repositories/PrismaVacancyStatusHistoryRepository";
import { prismaVacancyAttachmentRepository } from "../../infrastructure/repositories/PrismaVacancyAttachmentRepository";
import { TransitionVacancyStatusUseCase } from "../../application/use-cases/TransitionVacancyStatusUseCase";
import { Routes } from "@core/shared/constants/routes";

/**
 * Checks if ALL 3 guard conditions for QUICK_MEETING → HUNTING are met,
 * and if so, automatically transitions the vacancy.
 *
 * Called after validating an attachment or checklist — presentation-layer
 * orchestration, NOT a domain concern.
 *
 * @returns true if the auto-transition was executed, false otherwise
 */
export async function tryAutoTransitionToHunting(
  vacancyId: string,
  tenantId: string,
  changedById: string,
): Promise<boolean> {
  try {
    // 1. Load vacancy to check current status
    const vacancy = await prismaVacancyRepository.findById(vacancyId, tenantId);
    if (!vacancy || vacancy.status !== "QUICK_MEETING") {
      return false;
    }

    // 2. Check all 3 guard conditions in parallel
    const [jobDescCount, perfilMuestraValidatedCount] = await Promise.all([
      prismaVacancyAttachmentRepository.countBySubType(vacancyId, "JOB_DESCRIPTION"),
      prismaVacancyAttachmentRepository.countBySubType(vacancyId, "PERFIL_MUESTRA", true),
    ]);

    const hasJobDescription = jobDescCount > 0;
    const hasValidatedPerfilMuestra = perfilMuestraValidatedCount > 0;
    const hasValidatedChecklist = vacancy.checklistValidatedAt !== null;

    // 3. All 3 must pass
    if (!hasJobDescription || !hasValidatedPerfilMuestra || !hasValidatedChecklist) {
      return false;
    }

    // 4. Execute the transition via the existing use case
    const useCase = new TransitionVacancyStatusUseCase(
      prismaVacancyRepository,
      prismaVacancyStatusHistoryRepository,
    );

    const result = await useCase.execute({
      vacancyId,
      tenantId,
      newStatus: "HUNTING",
      changedById,
      hasJobDescription,
      hasValidatedPerfilMuestra,
    });

    if (!result.success) {
      console.warn(
        `[Auto-transition] Failed for vacancy ${vacancyId}: ${result.error}`,
      );
      return false;
    }

    console.log(`[Auto-transition] Vacancy ${vacancyId} → HUNTING`);
    revalidatePath(Routes.reclutamiento.vacantes);
    return true;
  } catch (error) {
    console.error(`[Auto-transition] Error for vacancy ${vacancyId}:`, error);
    return false;
  }
}
