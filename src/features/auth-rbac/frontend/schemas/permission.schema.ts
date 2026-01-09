import { z } from "zod";

/**
 * Schemas de validación Zod para Permissions
 */

export const checkPermissionSchema = z.object({
  permission: z.string().min(1, "El permiso es requerido"),
  tenantId: z.string().nullable(),
});

export type CheckPermissionInput = z.infer<typeof checkPermissionSchema>;
