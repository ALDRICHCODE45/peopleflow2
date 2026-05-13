import type {
  IVacancyCommitmentRepository,
  CommitmentReportRow,
} from "@features/vacancy/server/domain/interfaces/IVacancyCommitmentRepository";
import type { INotificationConfigRepository } from "@features/Sistema/configuracion/server/domain/interfaces/INotificationConfigRepository";
import { getMexicoDayRangeUTC } from "@core/shared/helpers/timezone";

export interface GenerateEveningAdminReportInput {
  tenantId: string;
}

export interface EveningAdminReportOutput {
  success: boolean;
  error?: string;
  data?: {
    dueTodayCommitments: CommitmentReportRow[];
    adminRecipients: string[];
  };
}

export class GenerateEveningAdminReportUseCase {
  constructor(
    private readonly commitmentRepo: IVacancyCommitmentRepository,
    private readonly configRepo: INotificationConfigRepository
  ) {}

  async execute(
    input: GenerateEveningAdminReportInput
  ): Promise<EveningAdminReportOutput> {
    try {
      const { tenantId } = input;

      // 1. Load config to check if evening report is enabled
      const config = await this.configRepo.findByTenantId(tenantId);
      if (!config?.enabled || !config.commitmentEveningReportEnabled) {
        return {
          success: false,
          error: "Evening admin report notifications disabled for this tenant",
        };
      }

      // 2. Calculate today's window in Mexico timezone (proper UTC range)
      const { startOfDay, endOfDay } = getMexicoDayRangeUTC();

      // 3. Fetch all commitments due today (including completed and pending)
      const commitments = await this.commitmentRepo.findDueToday(
        tenantId,
        startOfDay,
        endOfDay
      );

      if (commitments.length === 0) {
        return {
          success: true,
          data: {
            dueTodayCommitments: [],
            adminRecipients: config.recipientUserIds,
          },
        };
      }

      // 4. Sort by recruiter → vacancy → pending first, then completed
      commitments.sort((a, b) => {
        // Sort by recruiter name first
        const recruiterCompare = (a.recruiterName || "").localeCompare(
          b.recruiterName || ""
        );
        if (recruiterCompare !== 0) return recruiterCompare;

        // Then by vacancy position
        const vacancyCompare = a.vacancyPosition.localeCompare(b.vacancyPosition);
        if (vacancyCompare !== 0) return vacancyCompare;

        // Then by status: PENDING first (still incomplete = more critical)
        if (a.status === "PENDING" && b.status !== "PENDING") return -1;
        if (a.status !== "PENDING" && b.status === "PENDING") return 1;

        // Finally by due date
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      return {
        success: true,
        data: {
          dueTodayCommitments: commitments,
          adminRecipients: config.recipientUserIds,
        },
      };
    } catch (error) {
      console.error("Error in GenerateEveningAdminReportUseCase:", error);
      return {
        success: false,
        error: "Failed to generate evening admin report",
      };
    }
  }
}
