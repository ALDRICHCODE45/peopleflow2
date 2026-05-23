// Inngest step.run() serializes Date → string. Rehydrate before passing to templates.
export function rehydrateReportRow<
  T extends { dueDate: unknown; createdAt: unknown; completedAt: unknown },
>(row: T): T & { dueDate: Date; createdAt: Date; completedAt: Date | null } {
  return {
    ...row,
    dueDate: new Date(row.dueDate as string),
    createdAt: new Date(row.createdAt as string),
    completedAt: row.completedAt ? new Date(row.completedAt as string) : null,
  };
}
