import { addMonths } from "date-fns";
import type { IVacancyRepository } from "../../domain/interfaces/IVacancyRepository";
import type { WarrantyEligibilityResult } from "@features/vacancy/frontend/types/vacancy.types";

export interface CheckWarrantyEligibilityInput {
  vacancyId: string;
  tenantId: string;
}

export interface CheckWarrantyEligibilityOutput {
  success: boolean;
  eligibility?: WarrantyEligibilityResult;
  error?: string;
}

export class CheckWarrantyEligibilityUseCase {
  constructor(private readonly vacancyRepo: IVacancyRepository) {}

  async execute(
    input: CheckWarrantyEligibilityInput,
  ): Promise<CheckWarrantyEligibilityOutput> {
    try {
      // 1. Fetch the vacancy
      const vacancy = await this.vacancyRepo.findById(
        input.vacancyId,
        input.tenantId,
      );

      if (!vacancy) {
        return { success: false, error: "Vacante no encontrada" };
      }

      // 2. Check vacancy status — must be PLACEMENT
      if (!vacancy.canApplyWarranty()) {
        return {
          success: true,
          eligibility: {
            eligible: false,
            expired: false,
            expiryDate: null,
            warrantyMonths: null,
            prefillData: null,
            errorMessage:
              "Solo vacantes en PLACEMENT pueden aplicar garantía",
          },
        };
      }

      // 3. Check if warranty already exists
      const existingWarranty = await this.vacancyRepo.findByOriginVacancyId(
        input.vacancyId,
        input.tenantId,
      );

      if (existingWarranty) {
        return {
          success: true,
          eligibility: {
            eligible: false,
            expired: false,
            expiryDate: null,
            warrantyMonths: null,
            prefillData: null,
            errorMessage: "Esta vacante ya tiene una garantía aplicada",
          },
        };
      }

      // 4. Get warranty months from client
      const warrantyMonths = vacancy.clientWarrantyMonths ?? 0;
      const hasWarrantyConfig = warrantyMonths > 0;

      // 5. Calculate expiry
      const expired = vacancy.isWarrantyExpired(warrantyMonths);
      let expiryDate: string | null = null;

      if (vacancy.placementConfirmedAt && hasWarrantyConfig) {
        expiryDate = addMonths(
          vacancy.placementConfirmedAt,
          warrantyMonths,
        ).toISOString();
      }

      // 6. Build warning message
      let errorMessage: string | undefined;
      if (!hasWarrantyConfig) {
        errorMessage =
          "El cliente no tiene período de garantía configurado. Puede continuar bajo su responsabilidad.";
      } else if (expired) {
        errorMessage =
          "El período de garantía ha expirado. Puede continuar bajo su responsabilidad.";
      }

      // 7. Build prefill data from the vacancy
      const vacancyDTO = vacancy.toJSON();
      const prefillData = {
        position: vacancyDTO.position,
        recruiterId: vacancyDTO.recruiterId,
        recruiterName: vacancyDTO.recruiterName,
        clientId: vacancyDTO.clientId,
        clientName: vacancyDTO.clientName,
        saleType: vacancyDTO.saleType,
        serviceType: vacancyDTO.serviceType,
        currency: vacancyDTO.currency,
        salaryType: vacancyDTO.salaryType,
        salaryMin: vacancyDTO.salaryMin,
        salaryMax: vacancyDTO.salaryMax,
        salaryFixed: vacancyDTO.salaryFixed,
        commissions: vacancyDTO.commissions,
        benefits: vacancyDTO.benefits,
        tools: vacancyDTO.tools,
        modality: vacancyDTO.modality,
        schedule: vacancyDTO.schedule,
        countryCode: vacancyDTO.countryCode,
        regionCode: vacancyDTO.regionCode,
        requiresPsychometry: vacancyDTO.requiresPsychometry,
      };

      return {
        success: true,
        eligibility: {
          eligible: true,
          expired,
          expiryDate,
          warrantyMonths: hasWarrantyConfig ? warrantyMonths : null,
          prefillData,
          errorMessage,
        },
      };
    } catch (error) {
      console.error("Error in CheckWarrantyEligibilityUseCase:", error);
      return {
        success: false,
        error: "Error al verificar elegibilidad de garantía",
      };
    }
  }
}
