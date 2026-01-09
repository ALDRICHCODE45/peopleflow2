import { z } from "zod";

/**
 * Schemas de validación Zod para Tenants
 */

export const createTenantSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "El slug solo puede contener letras minúsculas, números y guiones"
    )
    .optional(),
});

export const switchTenantSchema = z.object({
  tenantId: z.string().nullable(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type SwitchTenantInput = z.infer<typeof switchTenantSchema>;
