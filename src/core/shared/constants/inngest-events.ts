export const InngestEvents = {
  lead: {
    statusChanged: "lead/status.changed",
  },
  vacancy: {
    prePlacementEntered: "vacancy/pre-placement.entered",
    placementCongratsEmail: "vacancy/placement.congrats-email",
  },
  email: {
    send: "email/send",
  },
} as const;
