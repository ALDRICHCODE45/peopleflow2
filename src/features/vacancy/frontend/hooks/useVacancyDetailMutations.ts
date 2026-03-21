"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";
import { transitionVacancyStatusAction } from "@features/vacancy/server/presentation/actions/transitionVacancyStatus.action";
import {
  addCandidateAction,
  removeCandidateAction,
  updateCandidateAction,
  selectFinalistAction,
} from "@features/vacancy/server/presentation/actions/candidate.actions";
import type { UpdateCandidateInput as ServerUpdateCandidateInput } from "@features/vacancy/server/presentation/actions/candidate.actions";
import {
  updateChecklistItemAction,
  addChecklistItemAction,
  deleteChecklistItemAction,
} from "@features/vacancy/server/presentation/actions/checklist.actions";
import { validateTernaAction } from "@features/vacancy/server/presentation/actions/validateTerna.action";
import { confirmPlacementAction } from "@features/vacancy/server/presentation/actions/confirmPlacement.action";
import { saveCandidateMatchAction } from "@features/vacancy/server/presentation/actions/saveCandidateMatch.action";
import type {
  VacancyStatusType,
  VacancyDTO,
  VacancyCandidateDTO,
  VacancyChecklistItemDTO,
  VacancyCandidateMatchDTO,
  DeleteCandidateResult,
  DeleteChecklistItemResult,
  AddCandidateFormData,
  CandidateMatchRating,
} from "../types/vacancy.types";

// ---- Transition Status ----

export interface TransitionStatusInput {
  vacancyId: string;
  newStatus: VacancyStatusType;
  reason?: string;
  newTargetDeliveryDate?: string;
  salaryFixed?: number;
  entryDate?: string; // ISO date string
  sendCongratsEmail?: boolean;
  hiredCandidateId?: string;
}

export function useTransitionVacancyStatus(): UseMutationResult<VacancyDTO | undefined, Error, TransitionStatusInput> {
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
          queryKey: vacancyQueryKeys.detail(tenant.id, variables.vacancyId),
        });
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
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

export function useAddCandidate(): UseMutationResult<VacancyCandidateDTO | undefined, Error, AddCandidateInput> {
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
          queryKey: vacancyQueryKeys.detail(tenant.id, variables.vacancyId),
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

export function useRemoveCandidate(): UseMutationResult<DeleteCandidateResult, Error, RemoveCandidateInput> {
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
          queryKey: vacancyQueryKeys.detail(tenant.id, variables.vacancyId),
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

export function useToggleChecklistItem(): UseMutationResult<VacancyChecklistItemDTO | undefined, Error, ToggleChecklistItemInput> {
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
          queryKey: vacancyQueryKeys.detail(tenant.id, variables.vacancyId),
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

// ---- Validate Terna ----

export interface ValidateTernaInput {
  vacancyId: string;
  candidateIds: string[];
  /** ISO date string (YYYY-MM-DD) — if omitted, defaults to now */
  validatedAt?: string;
}

export function useValidateTerna(): UseMutationResult<VacancyDTO | undefined, Error, ValidateTernaInput> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ vacancyId, candidateIds, validatedAt }: ValidateTernaInput) => {
      const result = await validateTernaAction({ vacancyId, candidateIds, validatedAt });
      if (result.error) throw new Error(result.error);
      return result.vacancy;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Terna validada",
        description: "Los candidatos de la terna fueron marcados como finalistas",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.detail(tenant.id, variables.vacancyId),
        });
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error al validar la terna",
        description: error.message ?? "No se pudo validar la terna",
      });
    },
  });
}

// ---- Confirm Placement ----

export function useConfirmPlacement(): UseMutationResult<VacancyDTO | undefined, Error, string> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (vacancyId: string) => {
      const result = await confirmPlacementAction(vacancyId);
      if (result.error) throw new Error(result.error);
      return result.vacancy;
    },
    onSuccess: (_data, vacancyId) => {
      showToast({
        type: "success",
        title: "Placement confirmado",
        description: "El placement fue confirmado exitosamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.detail(tenant.id, vacancyId),
        });
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error al confirmar placement",
        description: error.message ?? "No se pudo confirmar el placement",
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

export function useAddChecklistItem(): UseMutationResult<VacancyChecklistItemDTO | undefined, Error, AddChecklistItemInput> {
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
          queryKey: vacancyQueryKeys.detail(tenant.id, variables.vacancyId),
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

// ---- Update Checklist Item (requirement text) ----

export interface UpdateChecklistItemInput {
  itemId: string;
  vacancyId: string;
  requirement: string;
}

export function useUpdateChecklistItem(): UseMutationResult<VacancyChecklistItemDTO | undefined, Error, UpdateChecklistItemInput> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ itemId, requirement }: UpdateChecklistItemInput) => {
      const result = await updateChecklistItemAction(itemId, { requirement });
      if (result.error) throw new Error(result.error);
      return result.item;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Ítem actualizado",
        description: "El requisito fue actualizado exitosamente",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.detail(tenant.id, variables.vacancyId),
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

// ---- Delete Checklist Item ----

export interface DeleteChecklistItemInput {
  itemId: string;
  vacancyId: string;
}

export function useDeleteChecklistItem(): UseMutationResult<DeleteChecklistItemResult, Error, DeleteChecklistItemInput> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ itemId }: DeleteChecklistItemInput) => {
      const result = await deleteChecklistItemAction(itemId);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Ítem eliminado",
        description: "El requisito fue eliminado del checklist",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.detail(tenant.id, variables.vacancyId),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message ?? "No se pudo eliminar el ítem",
      });
    },
  });
}

// ---- Update Candidate ----

export interface UpdateCandidateInput {
  candidateId: string;
  vacancyId: string;
  data: ServerUpdateCandidateInput;
}

export function useUpdateCandidate(): UseMutationResult<VacancyCandidateDTO | undefined, Error, UpdateCandidateInput> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ candidateId, data }: UpdateCandidateInput) => {
      const result = await updateCandidateAction(candidateId, data);
      if (result.error) throw new Error(result.error);
      return result.candidate;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Candidato actualizado",
        description: "Los datos del candidato fueron actualizados",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.detail(tenant.id, variables.vacancyId),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message ?? "No se pudo actualizar el candidato",
      });
    },
  });
}

// ── useSaveCandidateMatch ──────────────────────────────────────────────────

interface SaveCandidateMatchInput {
  candidateId: string;
  checklistItemId: string;
  rating: CandidateMatchRating | null;
  feedback: string | null;
}

export function useSaveCandidateMatch(vacancyId: string): UseMutationResult<VacancyCandidateMatchDTO | undefined, Error, SaveCandidateMatchInput> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  return useMutation({
    mutationFn: async (data: {
      candidateId: string;
      checklistItemId: string;
      rating: CandidateMatchRating | null;
      feedback: string | null;
    }) => {
      const result = await saveCandidateMatchAction(data);
      if (result.error) throw new Error(result.error);
      return result.match;
    },
    onSuccess: () => {
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.detail(tenant.id, vacancyId) });
      }
    },
    onError: () =>
      showToast({ type: "error", title: "Error", description: "No se pudo guardar la evaluación" }),
  });
}

// ---- Select Finalist ----

export interface SelectFinalistInput {
  candidateId: string;
  vacancyId: string;
  salaryFixed: number;
  entryDate: string;
}

export function useSelectFinalist(): UseMutationResult<VacancyDTO | undefined, Error, SelectFinalistInput> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (input: SelectFinalistInput) => {
      const result = await selectFinalistAction(input);
      if (result.error) throw new Error(result.error);
      return result.vacancy;
    },
    onSuccess: (_data, variables) => {
      showToast({
        type: "success",
        title: "Finalista seleccionado",
        description: "El candidato fue seleccionado como finalista",
      });
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.detail(tenant.id, variables.vacancyId),
        });
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.all(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error",
        description: error.message ?? "No se pudo seleccionar el finalista",
      });
    },
  });
}
