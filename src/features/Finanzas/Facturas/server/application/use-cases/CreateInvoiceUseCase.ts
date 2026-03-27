/**
 * Caso de uso: Crear una nueva factura
 *
 * Maneja creación para los tres tipos:
 * - ANTICIPO: total manual, back-calcula subtotal/IVA
 * - FULL: calcula fee desde feeType/feeValue/salario
 * - LIQUIDACION: igual que FULL pero deduce anticipo.total del total final
 */

import type { InvoiceDTO } from "../../domain/entities/Invoice";
import type {
  IInvoiceRepository,
  CreateInvoiceData,
} from "../../domain/interfaces/IInvoiceRepository";
import {
  InvoiceCalculationService,
  type FeeCalculationResult,
} from "../../domain/services/InvoiceCalculationService";
import type {
  AdvanceType,
  Currency,
  FeeType,
  InvoicePaymentType,
  InvoiceType,
} from "@/core/generated/prisma/client";

// --- Input / Output ---

export interface CreateInvoiceInput {
  tenantId: string;
  createdById: string;
  type: InvoiceType;
  paymentType: InvoicePaymentType;
  clientId: string;
  vacancyId?: string | null;
  anticipoInvoiceId?: string | null;
  // Snapshots
  candidateId?: string | null;
  candidateName?: string | null;
  hunterId?: string | null;
  hunterName?: string | null;
  razonSocial?: string | null;
  nombreComercial?: string | null;
  ubicacion?: string | null;
  figura?: string | null;
  rfc?: string | null;
  codigoPostal?: string | null;
  regimen?: string | null;
  posicion?: string | null;
  // Economics
  currency: Currency;
  salario?: number | null;
  feeType?: FeeType | null;
  feeValue?: number | null;
  advanceType?: AdvanceType | null;
  advanceValue?: number | null;
  // Dates
  issuedAt: Date;
  mesPlacement?: Date | null;
  banco?: string | null;
}

export interface CreateInvoiceOutput {
  success: boolean;
  data?: InvoiceDTO;
  error?: string;
}

export class CreateInvoiceUseCase {
  constructor(private readonly repo: IInvoiceRepository) {}

  async execute(input: CreateInvoiceInput): Promise<CreateInvoiceOutput> {
    try {
      // 0. Validar pertenencia de cliente al tenant + resolver moneda canónica desde cliente
      const client = await this.repo.findClientBillingSnapshot(
        input.clientId,
        input.tenantId,
      );

      if (!client) {
        return {
          success: false,
          error: "Entidad no encontrada",
        };
      }

      const resolvedCurrency: Currency = client.currency ?? "MXN";

      // 1. Validaciones por tipo
      if (input.type === "LIQUIDACION" && !input.anticipoInvoiceId) {
        return {
          success: false,
          error: "Debe seleccionar una factura de anticipo",
        };
      }

      if (!input.vacancyId) {
        return {
          success: false,
          error: "Debe seleccionar una vacante para este tipo de factura",
        };
      }

      // Validar vacante seleccionada: tenant ownership + regla de garantía
      if (input.vacancyId) {
        const vacancy = await this.repo.findVacancyBillingSnapshot(
          input.vacancyId,
          input.tenantId,
        );

        if (!vacancy) {
          return {
            success: false,
            error: "Entidad no encontrada",
          };
        }

        if (vacancy.isWarranty) {
          return {
            success: false,
            error: "Las vacantes de garantía no generan facturas",
          };
        }

        if (vacancy.clientId !== input.clientId) {
          return {
            success: false,
            error: "La vacante no pertenece al cliente seleccionado",
          };
        }
      }

      // 2. Calcular totales según tipo
      let calculation: FeeCalculationResult;

      // Resolve advance data: input overrides client snapshot
      const resolvedAdvanceType =
        input.advanceType ?? client.advanceType ?? null;
      const resolvedAdvanceValue =
        input.advanceValue ?? client.advanceValue ?? null;

      if (input.type === "ANTICIPO") {
        // ANTICIPO: require fee + advance data for forward calculation
        if (!input.feeType || !input.feeValue || input.feeValue <= 0) {
          return {
            success: false,
            error: "Debe especificar tipo y valor de fee",
          };
        }

        if (
          (input.feeType === "PERCENTAGE" || input.feeType === "MONTHS") &&
          (!input.salario || input.salario <= 0)
        ) {
          return {
            success: false,
            error: "El salario es requerido para el tipo de fee seleccionado",
          };
        }

        if (!resolvedAdvanceType || !resolvedAdvanceValue || resolvedAdvanceValue <= 0) {
          return {
            success: false,
            error: "Debe especificar tipo y valor de anticipo",
          };
        }

        if (resolvedAdvanceType === "PERCENTAGE" && resolvedAdvanceValue > 100) {
          return {
            success: false,
            error: "El porcentaje de anticipo no puede ser mayor a 100%",
          };
        }

        calculation = InvoiceCalculationService.calculateAnticipoInvoice({
          feeType: input.feeType,
          feeValue: input.feeValue,
          salaryFixed: input.salario ?? 0,
          advanceType: resolvedAdvanceType,
          advanceValue: resolvedAdvanceValue,
          currency: resolvedCurrency,
        });
      } else {
        // FULL o LIQUIDACION: requiere fee data
        if (!input.feeType || !input.feeValue || input.feeValue <= 0) {
          return {
            success: false,
            error: "Debe especificar tipo y valor de fee",
          };
        }

        // Para PERCENTAGE y MONTHS necesitamos salario
        if (
          (input.feeType === "PERCENTAGE" || input.feeType === "MONTHS") &&
          (!input.salario || input.salario <= 0)
        ) {
          return {
            success: false,
            error: "El salario es requerido para el tipo de fee seleccionado",
          };
        }

        // Obtener monto de anticipo si es LIQUIDACION
        let anticipoAmount = 0;
        if (input.type === "LIQUIDACION" && input.anticipoInvoiceId) {
          const anticipo = await this.repo.findByIdWithTenant(
            input.anticipoInvoiceId,
            input.tenantId,
          );

          if (!anticipo) {
            return {
              success: false,
              error: "Factura de anticipo no encontrada",
            };
          }

          if (!anticipo.isAnticipo()) {
            return {
              success: false,
              error: "La factura seleccionada no es de tipo ANTICIPO",
            };
          }

          if (anticipo.clientId !== input.clientId) {
            return {
              success: false,
              error: "La factura de anticipo no pertenece al mismo cliente",
            };
          }

          anticipoAmount = anticipo.total;
        }

        calculation = InvoiceCalculationService.calculateFullInvoice({
          feeType: input.feeType,
          feeValue: input.feeValue,
          salaryFixed: input.salario ?? 0,
          currency: resolvedCurrency,
          anticipoAmount,
        });

        // Validar que el total sea > 0 para LIQUIDACION
        if (input.type === "LIQUIDACION" && calculation.total <= 0) {
          return {
            success: false,
            error: "El total de la liquidación debe ser mayor a 0",
          };
        }
      }

      // 3. Armar datos de creación (el folio se genera atómicamente en el repo)
      const createData: CreateInvoiceData = {
        folio: "", // Se genera atómicamente en repo.create via $transaction
        type: input.type,
        paymentType: input.paymentType,
        clientId: input.clientId,
        vacancyId: input.vacancyId ?? null,
        anticipoInvoiceId: input.anticipoInvoiceId ?? null,
        candidateId: input.candidateId ?? null,
        candidateName: input.candidateName ?? null,
        hunterId: input.hunterId ?? null,
        hunterName: input.hunterName ?? null,
        razonSocial: input.razonSocial ?? null,
        nombreComercial: input.nombreComercial ?? null,
        ubicacion: input.ubicacion ?? null,
        figura: input.figura ?? null,
        rfc: input.rfc ?? null,
        codigoPostal: input.codigoPostal ?? null,
        regimen: input.regimen ?? null,
        posicion: input.posicion ?? null,
        currency: resolvedCurrency,
        salario: input.salario ?? null,
        feeType: input.feeType ?? null,
        feeValue: input.feeValue ?? null,
        advanceType: resolvedAdvanceType,
        advanceValue: resolvedAdvanceValue,
        subtotal: calculation.subtotal,
        ivaRate: calculation.ivaRate,
        ivaAmount: calculation.ivaAmount,
        anticipoDeduccion: calculation.anticipoDeduccion,
        total: calculation.total,
        issuedAt: input.issuedAt,
        mesPlacement: input.mesPlacement ?? null,
        banco: input.banco ?? null,
        tenantId: input.tenantId,
        createdById: input.createdById,
      };

      // 4. Crear factura (repo maneja folio atómicamente)
      const invoice = await this.repo.create(createData);

      return {
        success: true,
        data: invoice.toJSON(),
      };
    } catch (error) {
      console.error("Error in CreateInvoiceUseCase:", error);

      // Manejar error de unique constraint (anticipo ya consumido)
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        return {
          success: false,
          error: "Este anticipo ya está vinculado a otra liquidación",
        };
      }

      return {
        success: false,
        error: "Error al crear la factura",
      };
    }
  }
}
