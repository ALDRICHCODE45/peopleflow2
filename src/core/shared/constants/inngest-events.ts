export const InngestEvents = {
  lead: {
    statusChanged: "lead/status.changed",
  },
  vacancy: {
    prePlacementEntered: "vacancy/pre-placement.entered",
    placementCongratsEmail: "vacancy/placement.congrats-email",
    countdownSchedule: "vacancy/countdown.schedule",
    statusChanged: "vacancy/status.changed",
  },
  commitment: {
    meetingReportRequested: "commitment/meeting-report.requested",
  },
  email: {
    send: "email/send",
  },
} as const;
