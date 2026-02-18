import z from "zod";

export const createInteractionSchema = z.object({
  contactId: z.string().min(1, "Debes seleccionar un contacto."),
  type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE", "LINKEDIN", "WHATSAPP"]),
  subject: z.string().min(1, "El asunto es requerido."),
  content: z.string(),
  date: z.string().min(1, "La fecha es requerida."),
});

export const editInteractionSchema = z.object({
  type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE", "LINKEDIN", "WHATSAPP"]),
  subject: z.string().min(1, "El asunto es requerido."),
  content: z.string(),
  date: z.string().min(1, "La fecha es requerida."),
});
