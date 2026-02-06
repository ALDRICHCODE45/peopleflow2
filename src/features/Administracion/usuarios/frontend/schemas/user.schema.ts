import z from "zod";

const avatarPattern = /^\/avatars\/.*\.webp$/;

const avatarField = z.string();

export const createUserSchema = z.object({
  email: z.email("El correo electrónico no es válido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
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
