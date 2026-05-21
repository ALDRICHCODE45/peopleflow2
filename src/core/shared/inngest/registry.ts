import {
  handleCommitmentEveningAdminReport,
  handleCommitmentMeetingReport,
  handleCommitmentMorningReminder,
  handleLeadInactivityAlert,
  handleVacancyCountdownNotification,
  handleVacancyPlacementCongratsEmail,
  handleVacancyPrePlacementEntryReminder,
  handleVacancyStaleNotification,
} from "@core/shared/inngest/functions";
import { applyInAppNotificationRetention } from "@features/InAppNotifications/server/presentation/inngest/applyRetention.inngest";
import { handleLeadStatusChangeNotification } from "@features/Leads/server/presentation/inngest/handleLeadStatusChange.inngest";
import { handleSendStandaloneEmail } from "@features/Notifications/server/presentation/inngest/handleStandaloneEmail.inngest";

export const functions = [
  handleLeadStatusChangeNotification,
  handleLeadInactivityAlert,
  handleVacancyPrePlacementEntryReminder,
  handleVacancyPlacementCongratsEmail,
  handleSendStandaloneEmail,
  handleVacancyCountdownNotification,
  handleVacancyStaleNotification,
  handleCommitmentMeetingReport,
  handleCommitmentMorningReminder,
  handleCommitmentEveningAdminReport,
  applyInAppNotificationRetention,
];
