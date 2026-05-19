import z from "zod";
import { strongPasswordSchema } from "@features/Auth/frontend/schemas/passwordPolicy";

const avatarPattern = /^\/avatars\/.*\.webp$/;

const avatarField = z.string();

export const createUserSchema = z.object({
  email: z.email("El correo electrónico no es válido."),
  password: strongPasswordSchema,
  name: z.string().min(1, "El nombre es requerido."),
  roleId: z.string(),
  avatar: avatarField,
});

export const editUserSchema = z.object({
  email: z.email("El correo electrónico no es válido."),
  name: z.string(),
  password: z.string(),
  roleId: z.string(),
  avatar: avatarField,
});
