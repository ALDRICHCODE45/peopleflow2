import z from "zod";

const optionalUrl = z
  .string()
  .refine((val) => val === "" || z.string().url().safeParse(val).success, {
    message: "La URL no es válida.",
  });

export const createContactSchema = z.object({
  firstName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres."),
  lastName: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres."),
  email: z.string(),
  phone: z.string(),
  position: z.string(),
  linkedInUrl: optionalUrl,
  isPrimary: z.boolean(),
  notes: z.string(),
});

export const editContactSchema = createContactSchema;
