import { z } from "zod";

/**
 * Schemas de validación Zod para Users
 */

export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const assignUserToTenantSchema = z.object({
  userId: z.string().min(1, "El ID del usuario es requerido"),
  tenantId: z.string().min(1, "El ID del tenant es requerido"),
  roleName: z.enum(["capturador", "gerente", "superadmin"], {
    message: "Rol inválido",
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type AssignUserToTenantInput = z.infer<typeof assignUserToTenantSchema>;
