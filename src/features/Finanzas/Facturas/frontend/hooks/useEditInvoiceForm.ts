"use client";

import { useMemo } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useUpdateInvoice } from "./useUpdateInvoice";
import { useUpdateInvoiceStatus } from "./useUpdateInvoiceStatus";
import {
  toDateInputValue,
  toMonthInputValue,
} from "../helpers/invoice.helpers";
import {
  INVOICE_TYPES,
  INVOICE_PAYMENT_TYPES,
  INVOICE_STATUSES,
} from "../types/invoice.types";
import type {
  InvoiceDTO,
  EditInvoiceFormValues,
  InvoiceStatus,
  Currency,
  FeeType,
} from "../types/invoice.types";
import type { UpdateInvoiceActionInput } from "../../server/presentation/actions/updateInvoice.action";

// ── Hook ────────────────────────────────────────────────────────────────────

export function useEditInvoiceForm({
  onClose,
  invoice,
}: {
  onClose: () => void;
  invoice: InvoiceDTO;
}) {
  const updateInvoiceMutation = useUpdateInvoice();
  const updateStatusMutation = useUpdateInvoiceStatus();

  const defaultValues: EditInvoiceFormValues = useMemo(
    () => ({
      candidateId: invoice.candidateId ?? "",
      candidateName: invoice.candidateName ?? "",
      hunterId: invoice.hunterId ?? "",
      hunterName: invoice.hunterName ?? "",
      razonSocial: invoice.razonSocial ?? "",
      nombreComercial: invoice.nombreComercial ?? "",
      ubicacion: invoice.ubicacion ?? "",
      figura: invoice.figura ?? "",
      rfc: invoice.rfc ?? "",
      codigoPostal: invoice.codigoPostal ?? "",
      regimen: invoice.regimen ?? "",
      posicion: invoice.posicion ?? "",
      currency: invoice.currency,
      salario: invoice.salario,
      feeType: invoice.feeType ?? "",
      feeValue: invoice.feeValue,
      advanceType: invoice.advanceType ?? "",
      advanceValue: invoice.advanceValue ?? null,
      issuedAt: toDateInputValue(invoice.issuedAt),
      mesPlacement: toMonthInputValue(invoice.mesPlacement),
      banco: invoice.banco ?? "",
      vacancyId: invoice.vacancyId ?? "",
    }),
    [invoice],
  );

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const input: UpdateInvoiceActionInput = {
        id: invoice.id,
        // Snapshots
        candidateId: value.candidateId || null,
        candidateName: value.candidateName || null,
        hunterId: value.hunterId || null,
        hunterName: value.hunterName || null,
        razonSocial: value.razonSocial || null,
        nombreComercial: value.nombreComercial || null,
        ubicacion: value.ubicacion || null,
        figura: value.figura || null,
        rfc: value.rfc || null,
        codigoPostal: value.codigoPostal || null,
        regimen: value.regimen || null,
        posicion: value.posicion || null,
        // Economics
        currency: value.currency as Currency,
        salario: value.salario,
        feeType: (value.feeType || null) as FeeType | null,
        feeValue: value.feeValue,
        advanceType: value.advanceType || null,
        advanceValue: value.advanceValue,
        // Dates
        issuedAt: value.issuedAt
          ? new Date(value.issuedAt + "T12:00:00").toISOString()
          : undefined,
        mesPlacement: value.mesPlacement
          ? new Date(value.mesPlacement + "-01T12:00:00").toISOString()
          : null,
        // Additional
        banco: value.banco || null,
        vacancyId: value.vacancyId || null,
      };

      await updateInvoiceMutation.mutateAsync(input);
      onClose();
    },
  });

  // ── Derived state from store ──────────────────────────────────────────────

  const currency = useStore(form.store, (s) => s.values.currency);
  const feeType = useStore(form.store, (s) => s.values.feeType);
  const advanceType = useStore(form.store, (s) => s.values.advanceType);

  const isAnticipo = invoice.type === INVOICE_TYPES.ANTICIPO;
  const isLiquidacion = invoice.type === INVOICE_TYPES.LIQUIDACION;
  const isPPD = invoice.paymentType === INVOICE_PAYMENT_TYPES.PPD;
  const isPorCobrar = invoice.status === INVOICE_STATUSES.POR_COBRAR;

  // ── Mark as Paid handler ──────────────────────────────────────────────────

  const handleMarkAsPaid = async () => {
    await updateStatusMutation.mutateAsync({
      id: invoice.id,
      status: INVOICE_STATUSES.PAGADA as InvoiceStatus,
      paymentDate: new Date().toISOString(),
    });
  };

  return {
    form,
    invoice,
    // Derived state
    currency,
    feeType,
    advanceType,
    isAnticipo,
    isLiquidacion,
    isPPD,
    isPorCobrar,
    // Handlers
    handleMarkAsPaid,
    // Mutation state
    isSubmitting: updateInvoiceMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}

export type UseEditInvoiceFormReturn = ReturnType<typeof useEditInvoiceForm>;
