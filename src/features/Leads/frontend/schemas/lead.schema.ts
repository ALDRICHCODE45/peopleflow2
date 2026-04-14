import z from "zod";

const optionalUrl = z
  .string()
  .refine((val) => val === "" || z.string().url().safeParse(val).success, {
    message: "La URL no es válida.",
  });

export const createLeadSchema = z.object({
  companyName: z
    .string()
    .min(2, "El nombre de la empresa debe tener al menos 2 caracteres."),
  website: optionalUrl,
  linkedInUrl: optionalUrl,
  countryCode: z.string(),
  regionCode: z.string(),
  postalCode: z.string(),
  subOrigin: z.string().min(1, "El sub-origen es obligatorio."),
  employeeCount: z.string(),
  notes: z.string(),
  sectorId: z.string().min(1, "El sector es obligatorio."),
  subsectorId: z.string().min(1, "El subsector es obligatorio."),
  originId: z.string().min(1, "El origen es obligatorio."),
  assignedToId: z.string().min(1, "Debes seleccionar un usuario asignado."),
  status: z.enum([
    "CONTACTO",
    "CONTACTO_CALIDO",
    "SOCIAL_SELLING",
    "CITA_AGENDADA",
    "CITA_ATENDIDA",
    "CITA_VALIDADA",
    "POSICIONES_ASIGNADAS",
    "STAND_BY",
  ]),
});

export const editLeadSchema = createLeadSchema;
