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
  email: {
    send: "email/send",
  },
} as const;
