export const vacancyQueryKeys = {
  all: (tenantId: string) => ["vacancies", "paginated", tenantId] as const,
  detail: (tenantId: string, vacancyId: string) =>
    ["vacancy", "detail", tenantId, vacancyId] as const,
  attachments: (tenantId: string, vacancyId: string) =>
    ["vacancy", "attachments", tenantId, vacancyId] as const,
  assignmentHistory: (tenantId: string, vacancyId: string) =>
    ["recruiter-assignment-history", tenantId, vacancyId] as const,
};

export const leadsQueryKeys = {
  paginated: () => ["leads", "paginated"] as const,
  infinite: (tenantId: string, status: string) =>
    ["leads", "infinite", tenantId, status] as const,
  infiniteAll: () => ["leads", "infinite"] as const,
  detail: (leadId: string) => ["leads", "detail", leadId] as const,
  contacts: (leadId: string) => ["contacts", "by-lead", leadId] as const,
  interactionsByLead: (leadId: string) =>
    ["interactions", "by-lead", leadId] as const,
  interactionsByContact: (contactId: string) =>
    ["interactions", "by-contact", contactId] as const,
};

export const rolesQueryKeys = {
  all: (tenantId: string) => ["roles", "paginated", tenantId] as const,
};

export const usersQueryKeys = {
  paginated: (tenantId: string) => ["users", "paginated", tenantId] as const,
};

export const permissionsQueryKeys = {
  byRole: (roleId: string) => ["permissions", "by-role", roleId] as const,
};

export const clientsQueryKeys = {
  paginated: (tenantId: string) =>
    ["clients", "paginated", tenantId] as const,
  detail: (tenantId: string, clientId: string) =>
    ["clients", "detail", tenantId, clientId] as const,
};

export const invoiceQueryKeys = {
  all: (tenantId: string) => ["invoices", "paginated", tenantId] as const,
  detail: (tenantId: string, invoiceId: string) =>
    ["invoices", "detail", tenantId, invoiceId] as const,
  availableAnticipos: (tenantId: string, clientId: string) =>
    ["invoices", "available-anticipos", tenantId, clientId] as const,
  vacancyOptions: (tenantId: string, clientId?: string) =>
    ["invoices", "vacancy-options", tenantId, clientId ?? "all"] as const,
};
