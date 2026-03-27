"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useUpdateClient } from "./useClient";
import type { ClientDTO } from "../types/client.types";
import type {
  CommercialTermsData,
  FiscalData,
} from "../../server/domain/interfaces/IClientRepository";

export interface EditClientFormValues {
  // General
  nombre: string;
  nombreComercial: string;
  // Commercial terms
  currency: string;
  paymentScheme: string;
  advanceType: string;
  advanceValue: number | null;
  feeType: string;
  feeValue: number | null;
  creditDays: number | null;
  warrantyMonths: number | null;
  cancellationFee: number | null;
  // Fiscal data
  rfc: string;
  codigoPostalFiscal: string;
  ubicacion: string;
  regimenFiscal: string;
  figura: string;
}

export function useEditClientForm({
  onClose,
  client,
}: {
  onClose: () => void;
  client: ClientDTO;
}) {
  const updateClientMutation = useUpdateClient();

  const defaultValues: EditClientFormValues = {
    // General
    nombre: client.nombre,
    nombreComercial: client.nombreComercial ?? "",
    // Commercial terms
    currency: client.currency ?? "",
    paymentScheme: client.paymentScheme ?? "",
    advanceType: client.advanceType ?? "",
    advanceValue: client.advanceValue ?? null,
    feeType: client.feeType ?? "",
    feeValue: client.feeValue ?? null,
    creditDays: client.creditDays ?? null,
    warrantyMonths: client.warrantyMonths ?? null,
    cancellationFee: client.cancellationFee ?? null,
    // Fiscal data
    rfc: client.rfc ?? "",
    codigoPostalFiscal: client.codigoPostalFiscal ?? "",
    ubicacion: client.ubicacion ?? "",
    regimenFiscal: client.regimenFiscal ?? "",
    figura: client.figura ?? "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const commercialTerms: CommercialTermsData = {
        currency: (value.currency || null) as CommercialTermsData["currency"],
        paymentScheme: (value.paymentScheme ||
          null) as CommercialTermsData["paymentScheme"],
        advanceType:
          value.paymentScheme === "ADVANCE"
            ? ((value.advanceType ||
                null) as CommercialTermsData["advanceType"])
            : null,
        advanceValue:
          value.paymentScheme === "ADVANCE" ? value.advanceValue : null,
        feeType: (value.feeType || null) as CommercialTermsData["feeType"],
        feeValue: value.feeValue,
        creditDays: value.creditDays,
        cancellationFee: value.cancellationFee,
        warrantyMonths: value.warrantyMonths,
      };

      const fiscalData: FiscalData = {
        rfc: value.rfc || null,
        codigoPostalFiscal: value.codigoPostalFiscal || null,
        nombreComercial: value.nombreComercial || null,
        ubicacion: value.ubicacion || null,
        regimenFiscal: value.regimenFiscal || null,
        figura: value.figura || null,
      };

      await updateClientMutation.mutateAsync({
        clientId: client.id,
        data: {
          nombre: value.nombre,
          commercialTerms,
          fiscalData,
        },
      });

      onClose();
    },
  });

  const paymentScheme = useStore(form.store, (s) => s.values.paymentScheme);
  const feeType = useStore(form.store, (s) => s.values.feeType);
  const advanceType = useStore(form.store, (s) => s.values.advanceType);
  const isAdvance = paymentScheme === "ADVANCE";

  return {
    form,
    isAdvance,
    feeType,
    advanceType,
    isSubmitting: updateClientMutation.isPending,
  };
}

export type UseEditClientFormReturn = ReturnType<typeof useEditClientForm>;
