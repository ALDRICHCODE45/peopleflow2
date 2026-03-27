/**
 * Caso de uso: Actualizar una factura existente
 *
 * Si se modifican campos económicos (feeType, feeValue, salario, currency),
 * recalcula subtotal/IVA/total usando InvoiceCalculationService.
 */

import type { InvoiceDTO } from "../../domain/entities/Invoice";
import type {
  IInvoiceRepository,
  UpdateInvoiceData,
} from "../../domain/interfaces/IInvoiceRepository";
import { InvoiceCalculationService } from "../../domain/services/InvoiceCalculationService";
import type { Currency, FeeType } from "@/core/generated/prisma/client";

// --- Input / Output ---

export interface UpdateInvoiceInput {
  id: string;
  tenantId: string;
  // Snapshots editables
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
  // Economics (trigger recalculation)
  currency?: Currency;
  salario?: number | null;
  feeType?: FeeType | null;
  feeValue?: number | null;
  // Dates
  issuedAt?: Date;
  mesPlacement?: Date | null;
  // Additional
  banco?: string | null;
  // Vacancy (editable on ANTICIPO)
  vacancyId?: string | null;
}

export interface UpdateInvoiceOutput {
  success: boolean;
  data?: InvoiceDTO;
  error?: string;
}

export class UpdateInvoiceUseCase {
  constructor(private readonly repo: IInvoiceRepository) {}

  async execute(input: UpdateInvoiceInput): Promise<UpdateInvoiceOutput> {
    try {
      // 1. Obtener factura existente
      const existing = await this.repo.findByIdWithTenant(
        input.id,
        input.tenantId,
      );

      if (!existing) {
        return {
          success: false,
          error: "Factura no encontrada",
        };
      }

      // 2. Preparar datos de actualización
      const updateData: UpdateInvoiceData = {};

      // Copiar campos snapshot si se proporcionaron
      if (input.candidateId !== undefined) updateData.candidateId = input.candidateId;
      if (input.candidateName !== undefined) updateData.candidateName = input.candidateName;
      if (input.hunterId !== undefined) updateData.hunterId = input.hunterId;
      if (input.hunterName !== undefined) updateData.hunterName = input.hunterName;
      if (input.razonSocial !== undefined) updateData.razonSocial = input.razonSocial;
      if (input.nombreComercial !== undefined) updateData.nombreComercial = input.nombreComercial;
      if (input.ubicacion !== undefined) updateData.ubicacion = input.ubicacion;
      if (input.figura !== undefined) updateData.figura = input.figura;
      if (input.rfc !== undefined) updateData.rfc = input.rfc;
      if (input.codigoPostal !== undefined) updateData.codigoPostal = input.codigoPostal;
      if (input.regimen !== undefined) updateData.regimen = input.regimen;
      if (input.posicion !== undefined) updateData.posicion = input.posicion;
      if (input.issuedAt !== undefined) updateData.issuedAt = input.issuedAt;
      if (input.mesPlacement !== undefined) updateData.mesPlacement = input.mesPlacement;
      if (input.banco !== undefined) updateData.banco = input.banco;
      if (input.vacancyId !== undefined) updateData.vacancyId = input.vacancyId;

      // 3. Detectar si hubo cambio en campos económicos → recalcular
      const economicFieldChanged =
        input.feeType !== undefined ||
        input.feeValue !== undefined ||
        input.salario !== undefined ||
        input.currency !== undefined;

      if (economicFieldChanged) {
        const newCurrency = input.currency ?? existing.currency;
        const newFeeType = input.feeType !== undefined ? input.feeType : existing.feeType;
        const newFeeValue = input.feeValue !== undefined ? input.feeValue : existing.feeValue;
        const newSalario = input.salario !== undefined ? input.salario : existing.salario;

        updateData.currency = newCurrency;

        if (existing.isAnticipo()) {
          // ANTICIPO: no recalcular fee, pero actualizar IVA rate si cambió currency
          const ivaRate = InvoiceCalculationService.calculateIvaRate(newCurrency);
          const { subtotal, ivaAmount } =
            InvoiceCalculationService.calculateFromAnticipo(existing.total, ivaRate);

          updateData.subtotal = subtotal;
          updateData.ivaRate = ivaRate;
          updateData.ivaAmount = ivaAmount;
          updateData.total = existing.total; // El total del anticipo no cambia
        } else {
          // FULL / LIQUIDACION: recalcular todo
          if (!newFeeType || !newFeeValue || newFeeValue <= 0) {
            return {
              success: false,
              error: "Debe especificar tipo y valor de fee",
            };
          }

          if (
            (newFeeType === "PERCENTAGE" || newFeeType === "MONTHS") &&
            (!newSalario || newSalario <= 0)
          ) {
            return {
              success: false,
              error: "El salario es requerido para el tipo de fee seleccionado",
            };
          }

          const calculation = InvoiceCalculationService.calculateFullInvoice({
            feeType: newFeeType,
            feeValue: newFeeValue,
            salaryFixed: newSalario ?? 0,
            currency: newCurrency,
            anticipoAmount: existing.anticipoDeduccion,
          });

          // Validar total > 0 para LIQUIDACION
          if (existing.isLiquidacion() && calculation.total <= 0) {
            return {
              success: false,
              error: "El total de la liquidación debe ser mayor a 0",
            };
          }

          updateData.feeType = newFeeType;
          updateData.feeValue = newFeeValue;
          updateData.salario = newSalario;
          updateData.subtotal = calculation.subtotal;
          updateData.ivaRate = calculation.ivaRate;
          updateData.ivaAmount = calculation.ivaAmount;
          updateData.anticipoDeduccion = calculation.anticipoDeduccion;
          updateData.total = calculation.total;
        }
      }

      // 4. Actualizar
      const updated = await this.repo.update(input.id, updateData, input.tenantId);

      return {
        success: true,
        data: updated.toJSON(),
      };
    } catch (error) {
      console.error("Error in UpdateInvoiceUseCase:", error);

      if (
        error instanceof Error &&
        error.message.includes("not found")
      ) {
        return {
          success: false,
          error: "Factura no encontrada",
        };
      }

      return {
        success: false,
        error: "Error al actualizar la factura",
      };
    }
  }
}
