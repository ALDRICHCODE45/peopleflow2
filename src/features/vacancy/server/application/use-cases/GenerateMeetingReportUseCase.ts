import type {
  IVacancyCommitmentRepository,
  CommitmentReportRow,
} from "@features/vacancy/server/domain/interfaces/IVacancyCommitmentRepository";
import type { INotificationConfigRepository } from "@features/Sistema/configuracion/server/domain/interfaces/INotificationConfigRepository";
import { getMexicoDayRangeUTC } from "@core/shared/helpers/timezone";

export interface GenerateMeetingReportInput {
  tenantId: string;
  from: Date;
  to: Date;
}

export interface CommitmentByRecruiter {
  recruiterId: string;
  recruiterName: string | null;
  recruiterEmail: string;
  commitments: CommitmentReportRow[];
  dueToday: CommitmentReportRow[];
}

export interface GenerateMeetingReportOutput {
  success: boolean;
  error?: string;
  data?: {
    recruiterReports: CommitmentByRecruiter[];
    adminRecipients: string[];
  };
}

export class GenerateMeetingReportUseCase {
  constructor(
    private readonly commitmentRepo: IVacancyCommitmentRepository,
    private readonly configRepo: INotificationConfigRepository
  ) {}

  async execute(
    input: GenerateMeetingReportInput
  ): Promise<GenerateMeetingReportOutput> {
    try {
      const { tenantId, from, to } = input;

      // 1. Load config to check if enabled and get admin recipients
      const config = await this.configRepo.findByTenantId(tenantId);
      if (!config?.enabled || !config.commitmentMeetingReportEnabled) {
        return {
          success: false,
          error: "Meeting report notifications disabled for this tenant",
        };
      }

      // 2. Fetch commitments created in the meeting window
      const commitments =
        await this.commitmentRepo.findByCreatedInRange(tenantId, from, to);

      if (commitments.length === 0) {
        return {
          success: true,
          data: { recruiterReports: [], adminRecipients: config.recipientUserIds },
        };
      }

      // 3. Determine due-today window (Mexico timezone → proper UTC range)
      const { startOfDay: startOfDayMexico, endOfDay: endOfDayMexico } =
        getMexicoDayRangeUTC();

      // 4. Group by recruiter
      const recruiterMap = new Map<string, CommitmentByRecruiter>();

      for (const commitment of commitments) {
        const { recruiterId, recruiterName, recruiterEmail } = commitment;

        if (!recruiterMap.has(recruiterId)) {
          recruiterMap.set(recruiterId, {
            recruiterId,
            recruiterName,
            recruiterEmail,
            commitments: [],
            dueToday: [],
          });
        }

        const recruiterData = recruiterMap.get(recruiterId)!;
        recruiterData.commitments.push(commitment);

        // Check if due today
        const dueDate = new Date(commitment.dueDate);
        if (dueDate >= startOfDayMexico && dueDate <= endOfDayMexico) {
          recruiterData.dueToday.push(commitment);
        }
      }

      // 5. Sort commitments within each recruiter: due-today first, then by dueDate asc
      for (const recruiterData of recruiterMap.values()) {
        recruiterData.commitments.sort((a, b) => {
          const aIsDueToday = recruiterData.dueToday.some(
            (c) => c.commitmentId === a.commitmentId
          );
          const bIsDueToday = recruiterData.dueToday.some(
            (c) => c.commitmentId === b.commitmentId
          );

          if (aIsDueToday && !bIsDueToday) return -1;
          if (!aIsDueToday && bIsDueToday) return 1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      }

      return {
        success: true,
        data: {
          recruiterReports: Array.from(recruiterMap.values()),
          adminRecipients: config.recipientUserIds,
        },
      };
    } catch (error) {
      console.error("Error in GenerateMeetingReportUseCase:", error);
      return { success: false, error: "Failed to generate meeting report" };
    }
  }
}
