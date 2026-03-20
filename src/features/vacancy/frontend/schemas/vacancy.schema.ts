import z from "zod";

export const createVacancySchema = z.object({
  position: z.string().min(1, "La posición es requerida"),
  recruiterId: z.string().min(1, "El reclutador es requerido"),
  clientId: z.string().min(1, "El cliente es requerido"),
  assignedAt: z.string().min(1, "La fecha de asignación es requerida"),
  targetDeliveryDate: z.string(),
  salaryType: z.enum(["FIXED", "RANGE"]).default("RANGE"),
  salaryFixed: z.number().optional(),
  salaryMin: z.number().or(z.undefined()),
  salaryMax: z.number().or(z.undefined()),
  benefits: z.string(),
  tools: z.string(),
  commissions: z.string(),
  modality: z
    .enum(["PRESENCIAL", "REMOTO", "HIBRIDO"])
    .optional(),
  schedule: z.string(),
  countryCode: z.string(),
  regionCode: z.string(),
  requiresPsychometry: z.boolean(),
  serviceType: z.enum(["END_TO_END", "SOURCING"], {
    message: "El tipo de servicio es requerido",
  }),
});
