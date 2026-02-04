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
  address: z.string(),
  subOrigin: z.string(),
  employeeCount: z.string(),
  notes: z.string(),
  sectorId: z.string().or(z.undefined()),
  subsectorId: z.string().or(z.undefined()),
  originId: z.string().or(z.undefined()),
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
