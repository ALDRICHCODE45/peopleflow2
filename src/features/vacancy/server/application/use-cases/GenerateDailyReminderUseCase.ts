import type {
  IVacancyCommitmentRepository,
  CommitmentReportRow,
} from "@features/vacancy/server/domain/interfaces/IVacancyCommitmentRepository";
import type { INotificationConfigRepository } from "@features/Sistema/configuracion/server/domain/interfaces/INotificationConfigRepository";
import { getMexicoDayRangeUTC } from "@core/shared/helpers/timezone";

export interface GenerateDailyReminderInput {
  tenantId: string;
}

export interface RecruiterReminderData {
  recruiterId: string;
  recruiterName: string | null;
  recruiterEmail: string;
  dueTodayCommitments: CommitmentReportRow[];
}

export interface GenerateDailyReminderOutput {
  success: boolean;
  error?: string;
  data?: RecruiterReminderData[];
}

export class GenerateDailyReminderUseCase {
  constructor(
    private readonly commitmentRepo: IVacancyCommitmentRepository,
    private readonly configRepo: INotificationConfigRepository
  ) {}

  async execute(
    input: GenerateDailyReminderInput
  ): Promise<GenerateDailyReminderOutput> {
    try {
      const { tenantId } = input;

      // 1. Load config to check if morning reminder is enabled
      const config = await this.configRepo.findByTenantId(tenantId);
      if (!config?.enabled || !config.commitmentMorningReminderEnabled) {
        return {
          success: false,
          error: "Morning reminder notifications disabled for this tenant",
        };
      }

      // 2. Calculate today's window in Mexico timezone (proper UTC range)
      const { startOfDay, endOfDay } = getMexicoDayRangeUTC();

      // 3. Fetch commitments due today
      const commitments = await this.commitmentRepo.findDueToday(
        tenantId,
        startOfDay,
        endOfDay
      );

      if (commitments.length === 0) {
        return { success: true, data: [] };
      }

      // 4. Group by recruiter
      const recruiterMap = new Map<string, RecruiterReminderData>();

      for (const commitment of commitments) {
        const { recruiterId, recruiterName, recruiterEmail } = commitment;

        if (!recruiterMap.has(recruiterId)) {
          recruiterMap.set(recruiterId, {
            recruiterId,
            recruiterName,
            recruiterEmail,
            dueTodayCommitments: [],
          });
        }

        recruiterMap.get(recruiterId)!.dueTodayCommitments.push(commitment);
      }

      // 5. Sort commitments within each recruiter by vacancy name, then dueDate
      for (const recruiterData of recruiterMap.values()) {
        recruiterData.dueTodayCommitments.sort((a, b) => {
          const vacancyCompare = a.vacancyPosition.localeCompare(b.vacancyPosition);
          if (vacancyCompare !== 0) return vacancyCompare;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      }

      return { success: true, data: Array.from(recruiterMap.values()) };
    } catch (error) {
      console.error("Error in GenerateDailyReminderUseCase:", error);
      return { success: false, error: "Failed to generate daily reminder" };
    }
  }
}
