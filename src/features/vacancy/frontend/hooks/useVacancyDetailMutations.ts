"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { transitionVacancyStatusAction } from "@features/vacancy/server/presentation/actions/transitionVacancyStatus.action";
import {
  addCandidateAction,
  removeCandidateAction,
} from "@features/vacancy/server/presentation/actions/candidate.actions";
import {
  updateChecklistItemAction,
  addChecklistItemAction,
} from "@features/vacancy/server/presentation/actions/checklist.actions";
import type {
  VacancyStatusType,
  AddCandidateFormData,
} from "../types/vacancy.types";

// ---- Transition Status ----

export interface TransitionStatusInput {
  vacancyId: string;
  newStatus: VacancyStatusType;
  reason?: string;
  newTargetDeliveryDate?: string;
}

export function useTransitionVacancyStatus() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (input: TransitionStatusInput) => {
      const result = await transitionVacancyStatusAction(input);
      if (result.error) throw new Error(result.error);
      return result.vacancy;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Estado actualizado",
        description: "El estado de la vacante fue cambiado exitosamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: ["vacancy", "detail", tenant.id, variables.vacancyId],
        });
        queryClient.invalidateQueries({
          queryKey: ["vacancies", "paginated", tenant.id],
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message ?? "No se pudo cambiar el estado",
      });
    },
  });
}

// ---- Add Candidate ----

export interface AddCandidateInput {
  vacancyId: string;
  data: AddCandidateFormData;
}

export function useAddCandidate() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ vacancyId, data }: AddCandidateInput) => {
      const result = await addCandidateAction(vacancyId, data);
      if (result.error) throw new Error(result.error);
      return result.candidate;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Candidato agregado",
        description: "El candidato fue agregado exitosamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: ["vacancy", "detail", tenant.id, variables.vacancyId],
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message ?? "No se pudo agregar el candidato",
      });
    },
  });
}

// ---- Remove Candidate ----

export interface RemoveCandidateInput {
  candidateId: string;
  vacancyId: string;
}

export function useRemoveCandidate() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ candidateId, vacancyId }: RemoveCandidateInput) => {
      const result = await removeCandidateAction(candidateId, vacancyId);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Candidato eliminado",
        description: "El candidato fue eliminado de la vacante",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: ["vacancy", "detail", tenant.id, variables.vacancyId],
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message ?? "No se pudo eliminar el candidato",
      });
    },
  });
}

// ---- Toggle Checklist Item ----

export interface ToggleChecklistItemInput {
  itemId: string;
  vacancyId: string;
  isCompleted: boolean;
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({
      itemId,
      isCompleted,
    }: ToggleChecklistItemInput) => {
      const result = await updateChecklistItemAction(itemId, { isCompleted });
      if (result.error) throw new Error(result.error);
      return result.item;
    },
    onSuccess: (_data, variables) => {
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: ["vacancy", "detail", tenant.id, variables.vacancyId],
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message ?? "No se pudo actualizar el ítem",
      });
    },
  });
}

// ---- Add Checklist Item ----

export interface AddChecklistItemInput {
  vacancyId: string;
  requirement: string;
  order?: number;
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ vacancyId, requirement, order }: AddChecklistItemInput) => {
      const result = await addChecklistItemAction(vacancyId, requirement, order);
      if (result.error) throw new Error(result.error);
      return result.item;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Ítem agregado",
        description: "El ítem fue agregado al checklist",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: ["vacancy", "detail", tenant.id, variables.vacancyId],
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message ?? "No se pudo agregar el ítem",
      });
    },
  });
}
