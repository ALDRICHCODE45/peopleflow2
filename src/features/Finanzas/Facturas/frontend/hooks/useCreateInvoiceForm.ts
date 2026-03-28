"use client";

import { useCallback, useMemo } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useClientsListQuery } from "@/features/Finanzas/Clientes/frontend/hooks/useClient";
import { useCreateInvoice } from "./useCreateInvoice";
import { useInvoiceVacancyOptions } from "./useInvoiceVacancyOptions";
import { toMonthValue } from "../helpers/invoice.helpers";
import {
  INVOICE_TYPES,
  INVOICE_PAYMENT_TYPES,
  CURRENCIES,
} from "../types/invoice.types";
import type { CreateInvoiceFormValues } from "../types/invoice.types";
import type { CreateInvoiceActionInput } from "../../server/presentation/actions/createInvoice.action";
import type { InvoiceVacancyOption } from "../../server/presentation/actions/getInvoiceVacancyOptions.action";
import type {
  InvoiceType,
  InvoicePaymentType,
  Currency,
  FeeType,
} from "../types/invoice.types";
import type { ClientDTO } from "@/features/Finanzas/Clientes/frontend/types/client.types";

// ── Default form values ─────────────────────────────────────────────────────

const DEFAULT_VALUES: CreateInvoiceFormValues = {
  type: INVOICE_TYPES.FULL,
  paymentType: INVOICE_PAYMENT_TYPES.PUE,
  clientId: "",
  vacancyId: "",
  anticipoInvoiceId: "",
  candidateId: "",
  candidateName: "",
  hunterId: "",
  hunterName: "",
  razonSocial: "",
  nombreComercial: "",
  ubicacion: "",
  figura: "",
  rfc: "",
  codigoPostal: "",
  regimen: "",
  posicion: "",
  currency: CURRENCIES.MXN,
  salario: null,
  feeType: "",
  feeValue: null,
  advanceType: "",
  advanceValue: null,
  issuedAt: new Date().toISOString().split("T")[0],
  mesPlacement: "",
  banco: "",
  anticipoTotal: null,
};

// ── Hook ────────────────────────────────────────────────────────────────────

export function useCreateInvoiceForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const createInvoiceMutation = useCreateInvoice();
  const { data: clients = [] } = useClientsListQuery();

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    onSubmit: async ({ value }) => {
      const input: CreateInvoiceActionInput = {
        type: value.type as InvoiceType,
        paymentType: value.paymentType as InvoicePaymentType,
        clientId: value.clientId,
        vacancyId: value.vacancyId || null,
        anticipoInvoiceId: value.anticipoInvoiceId || null,
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
          : new Date().toISOString(),
        mesPlacement: value.mesPlacement
          ? new Date(value.mesPlacement + "T12:00:00").toISOString()
          : null,
        banco: value.banco || null,
      };

      await createInvoiceMutation.mutateAsync(input);
      onClose();
    },
  });

  // ── Derived state from store (reactive, no re-render of entire form) ────

  const clientId = useStore(form.store, (s) => s.values.clientId);
  const type = useStore(form.store, (s) => s.values.type);
  const paymentType = useStore(form.store, (s) => s.values.paymentType);
  const currency = useStore(form.store, (s) => s.values.currency);
  const feeType = useStore(form.store, (s) => s.values.feeType);
  const advanceType = useStore(form.store, (s) => s.values.advanceType);
  const vacancyId = useStore(form.store, (s) => s.values.vacancyId);

  const isAnticipo = type === INVOICE_TYPES.ANTICIPO;
  const isLiquidacion = type === INVOICE_TYPES.LIQUIDACION;
  const isPPD = paymentType === INVOICE_PAYMENT_TYPES.PPD;

  // ── Vacancy options (depends on clientId) ────────────────────────────────

  const { data: rawVacancyOptions = [] } = useInvoiceVacancyOptions(
    clientId || undefined,
  );

  const vacancyOptions = useMemo(
    () =>
      rawVacancyOptions.map((vacancy: InvoiceVacancyOption) => ({
        value: vacancy.id,
        label: `${vacancy.position}${vacancy.isWarranty ? " (Garantía)" : ""}`,
        ...vacancy,
      })),
    [rawVacancyOptions],
  );

  const selectedVacancy = useMemo(
    () => rawVacancyOptions.find((v) => v.id === vacancyId),
    [rawVacancyOptions, vacancyId],
  );

  // ── Client options ───────────────────────────────────────────────────────

  const clientOptions = useMemo(
    () =>
      clients.map((c: ClientDTO) => ({
        value: c.id,
        label: c.nombreComercial || c.nombre,
        nombre: c.nombre,
      })),
    [clients],
  );

  const selectedClient = useMemo(
    () => clients.find((c: ClientDTO) => c.id === clientId),
    [clients, clientId],
  );

  const clientHasNoFee = selectedClient
    ? !selectedClient.feeType || !selectedClient.feeValue
    : false;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleClientChange = useCallback(
    (newClientId: string) => {
      const client = clients.find((c: ClientDTO) => c.id === newClientId);
      if (!client) return;

      form.setFieldValue("clientId", newClientId);
      // Auto-fill fiscal data
      form.setFieldValue("razonSocial", client.nombre ?? "");
      form.setFieldValue("nombreComercial", client.nombreComercial ?? "");
      form.setFieldValue("ubicacion", client.ubicacion ?? "");
      form.setFieldValue("figura", client.figura ?? "");
      form.setFieldValue("rfc", client.rfc ?? "");
      form.setFieldValue("codigoPostal", client.codigoPostalFiscal ?? "");
      form.setFieldValue("regimen", client.regimenFiscal ?? "");
      // Auto-fill commercial terms
      form.setFieldValue("currency", client.currency ?? CURRENCIES.MXN);
      form.setFieldValue("feeType", client.feeType ?? "");
      form.setFieldValue("feeValue", client.feeValue ?? null);
      // Auto-fill advance terms
      form.setFieldValue("advanceType", client.advanceType ?? "");
      form.setFieldValue("advanceValue", client.advanceValue ?? null);
      // Reset vacancy selection when client changes
      form.setFieldValue("vacancyId", "");
      form.setFieldValue("posicion", "");
      form.setFieldValue("salario", null);
      form.setFieldValue("candidateId", "");
      form.setFieldValue("candidateName", "");
      form.setFieldValue("hunterId", "");
      form.setFieldValue("hunterName", "");
      form.setFieldValue("mesPlacement", "");
      form.setFieldValue("anticipoInvoiceId", "");
      form.setFieldValue("anticipoTotal", null);
    },
    [clients, form],
  );

  const handleTypeChange = useCallback(
    (newType: string) => {
      form.setFieldValue("type", newType);
      // Reset type-specific fields
      form.setFieldValue("vacancyId", "");
      form.setFieldValue("posicion", "");
      form.setFieldValue("salario", null);
      form.setFieldValue("candidateId", "");
      form.setFieldValue("candidateName", "");
      form.setFieldValue("hunterId", "");
      form.setFieldValue("hunterName", "");
      form.setFieldValue("mesPlacement", "");
      form.setFieldValue("anticipoInvoiceId", "");
      form.setFieldValue("anticipoTotal", null);
    },
    [form],
  );

  const handleVacancyChange = useCallback(
    (newVacancyId: string) => {
      const vacancy = rawVacancyOptions.find((v) => v.id === newVacancyId);
      if (!vacancy) return;

      form.setFieldValue("vacancyId", newVacancyId);
      form.setFieldValue("posicion", vacancy.position);
      form.setFieldValue("salario", vacancy.salaryFixed ?? form.getFieldValue("salario"));
      form.setFieldValue("hunterId", vacancy.recruiterId);
      form.setFieldValue("hunterName", vacancy.recruiterName);
      form.setFieldValue("candidateId", vacancy.hiredCandidateId ?? "");
      form.setFieldValue("candidateName", vacancy.hiredCandidateName ?? "");
      form.setFieldValue("mesPlacement", toMonthValue(vacancy.mesPlacement));
    },
    [rawVacancyOptions, form],
  );

  const handleAnticipoChange = useCallback(
    (anticipoId: string, anticipoTotal: number) => {
      form.setFieldValue("anticipoInvoiceId", anticipoId);
      form.setFieldValue("anticipoTotal", anticipoTotal);
    },
    [form],
  );

  return {
    form,
    // Derived state
    clientId,
    type,
    paymentType,
    currency,
    feeType,
    advanceType,
    isAnticipo,
    isLiquidacion,
    isPPD,
    // Options
    clientOptions,
    vacancyOptions,
    selectedClient,
    selectedVacancy,
    clientHasNoFee,
    // Handlers
    handleClientChange,
    handleTypeChange,
    handleVacancyChange,
    handleAnticipoChange,
    // Mutation state
    isSubmitting: createInvoiceMutation.isPending,
  };
}

export type UseCreateInvoiceFormReturn = ReturnType<typeof useCreateInvoiceForm>;
