/**
 * Esquemas de validaci\u00f3n Zod para formularios de facturaci\u00f3n
 */

import { z } from "zod";

// --- Schema de creaci\u00f3n de factura ---

export const createInvoiceSchema = z
  .object({
    // Tipo de factura
    type: z.enum(["ANTICIPO", "FULL", "LIQUIDACION"], {
      message: "Tipo de factura es requerido",
    }),
    paymentType: z.enum(["PUE", "PPD"], {
      message: "Tipo de pago es requerido",
    }),

    // Relaciones
    clientId: z.string().min(1, "Cliente es requerido"),
    vacancyId: z.string().nullable().optional(),
    anticipoInvoiceId: z.string().nullable().optional(),

    // Snapshots: Candidato
    candidateId: z.string().nullable().optional(),
    candidateName: z.string().nullable().optional(),

    // Snapshots: Hunter
    hunterId: z.string().nullable().optional(),
    hunterName: z.string().nullable().optional(),

    // Snapshots: Datos fiscales del cliente
    razonSocial: z.string().min(1, "Raz\u00f3n social es requerida"),
    nombreComercial: z.string().nullable().optional(),
    ubicacion: z.string().nullable().optional(),
    figura: z.string().nullable().optional(),
    rfc: z.string().nullable().optional(),
    codigoPostal: z.string().nullable().optional(),
    regimen: z.string().nullable().optional(),

    // Snapshots: Vacante
    posicion: z.string().nullable().optional(),

    // Economics
    currency: z.enum(["MXN", "USD"], {
      message: "Moneda es requerida",
    }),
    salario: z.number().positive("Sueldo debe ser mayor a 0").nullable().optional(),
    feeType: z.enum(["PERCENTAGE", "FIXED", "MONTHS"]).nullable().optional(),
    feeValue: z.number().positive("Valor del fee debe ser mayor a 0").nullable().optional(),
    advanceType: z.enum(["FIXED", "PERCENTAGE"]).nullable().optional(),
    advanceValue: z.number().positive("Valor del anticipo debe ser mayor a 0").nullable().optional(),

    // Dates
    issuedAt: z.string().min(1, "Fecha de emisi\u00f3n es requerida"),
    mesPlacement: z.string().nullable().optional(),

    // Additional
    banco: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // LIQUIDACION requiere anticipoInvoiceId
    if (data.type === "LIQUIDACION" && !data.anticipoInvoiceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe seleccionar una factura de anticipo",
        path: ["anticipoInvoiceId"],
      });
    }

    // FULL y LIQUIDACION requieren sueldo y fee
    if (data.type === "FULL" || data.type === "LIQUIDACION") {
      if (!data.salario) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sueldo es requerido",
          path: ["salario"],
        });
      }
      if (!data.feeType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tipo de fee es requerido",
          path: ["feeType"],
        });
      }
      if (!data.feeValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valor del fee es requerido",
          path: ["feeValue"],
        });
      }
    }

    // ANTICIPO requiere vacancyId, fee y advance data
    if (data.type === "ANTICIPO") {
      if (!data.vacancyId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vacante es requerida",
          path: ["vacancyId"],
        });
      }
      if (!data.feeType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tipo de fee es requerido",
          path: ["feeType"],
        });
      }
      if (!data.feeValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valor del fee es requerido",
          path: ["feeValue"],
        });
      }
      if (
        (data.feeType === "PERCENTAGE" || data.feeType === "MONTHS") &&
        !data.salario
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sueldo es requerido",
          path: ["salario"],
        });
      }
      if (!data.advanceType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tipo de anticipo es requerido",
          path: ["advanceType"],
        });
      }
      if (!data.advanceValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valor del anticipo es requerido",
          path: ["advanceValue"],
        });
      }
      if (
        data.advanceType === "PERCENTAGE" &&
        data.advanceValue != null &&
        data.advanceValue > 100
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El porcentaje de anticipo no puede superar 100%",
          path: ["advanceValue"],
        });
      }
    }

    // FULL y LIQUIDACION requieren vacancyId
    if ((data.type === "FULL" || data.type === "LIQUIDACION") && !data.vacancyId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vacante es requerida",
        path: ["vacancyId"],
      });
    }
  });

export type CreateInvoiceSchemaInput = z.input<typeof createInvoiceSchema>;
export type CreateInvoiceSchemaOutput = z.output<typeof createInvoiceSchema>;

// --- Schema de actualizaci\u00f3n de factura ---

export const updateInvoiceSchema = z.object({
  id: z.string().min(1, "ID es requerido"),
  // Snapshots editables
  candidateId: z.string().nullable().optional(),
  candidateName: z.string().nullable().optional(),
  hunterId: z.string().nullable().optional(),
  hunterName: z.string().nullable().optional(),
  razonSocial: z.string().nullable().optional(),
  nombreComercial: z.string().nullable().optional(),
  ubicacion: z.string().nullable().optional(),
  figura: z.string().nullable().optional(),
  rfc: z.string().nullable().optional(),
  codigoPostal: z.string().nullable().optional(),
  regimen: z.string().nullable().optional(),
  posicion: z.string().nullable().optional(),
  // Economics (trigger recalculation)
  currency: z.enum(["MXN", "USD"]).optional(),
  salario: z.number().positive("Sueldo debe ser mayor a 0").nullable().optional(),
  feeType: z.enum(["PERCENTAGE", "FIXED", "MONTHS"]).nullable().optional(),
  feeValue: z.number().positive("Valor del fee debe ser mayor a 0").nullable().optional(),
  advanceType: z.enum(["FIXED", "PERCENTAGE"]).nullable().optional(),
  advanceValue: z.number().positive("Valor del anticipo debe ser mayor a 0").nullable().optional(),
  // Dates
  issuedAt: z.string().optional(),
  mesPlacement: z.string().nullable().optional(),
  // Additional
  banco: z.string().nullable().optional(),
  vacancyId: z.string().nullable().optional(),
});

export type UpdateInvoiceSchemaInput = z.input<typeof updateInvoiceSchema>;
export type UpdateInvoiceSchemaOutput = z.output<typeof updateInvoiceSchema>;

// --- Schema de actualizaci\u00f3n de estado ---

export const updateInvoiceStatusSchema = z.object({
  id: z.string().min(1, "ID es requerido"),
  status: z.enum(["POR_COBRAR", "PAGADA"], {
    message: "Estado es requerido",
  }),
  paymentDate: z.string().nullable().optional(),
});

export type UpdateInvoiceStatusSchemaInput = z.input<typeof updateInvoiceStatusSchema>;
export type UpdateInvoiceStatusSchemaOutput = z.output<typeof updateInvoiceStatusSchema>;
