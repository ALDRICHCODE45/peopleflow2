import {
  handleCommitmentEveningAdminReport,
  handleCommitmentMeetingReport,
  handleCommitmentMorningReminder,
} from "@core/shared/inngest/functions";
import { applyInAppNotificationRetention } from "@features/InAppNotifications/server/presentation/inngest/applyRetention.inngest";
import { handleLeadInactivityAlert } from "@features/Leads/server/presentation/inngest/handleLeadInactivityAlert.inngest";
import { handleLeadStatusChangeNotification } from "@features/Leads/server/presentation/inngest/handleLeadStatusChange.inngest";
import { handleSendStandaloneEmail } from "@features/Notifications/server/presentation/inngest/handleStandaloneEmail.inngest";
import { handleVacancyPlacementCongratsEmail } from "@features/vacancy/server/presentation/inngest/handlePlacementCongratsEmail.inngest";
import { handleVacancyPrePlacementEntryReminder } from "@features/vacancy/server/presentation/inngest/handlePrePlacementEntryReminder.inngest";
import { handleVacancyCountdownNotification } from "@features/vacancy/server/presentation/inngest/vacancyCountdownNotification.inngest";
import { handleVacancyStaleNotification } from "@features/vacancy/server/presentation/inngest/vacancyStaleNotification.inngest";

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
