"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";
import {
  getVacancyAttachmentsAction,
  deleteVacancyAttachmentAction,
  validateAttachmentAction,
  rejectAttachmentAction,
  validateVacancyChecklistAction,
  rejectVacancyChecklistAction,
} from "@features/vacancy/server/presentation/actions/vacancyAttachment.actions";
import type {
  AttachmentDTO,
  VacancyDTO,
  DeleteVacancyAttachmentResult,
} from "../types/vacancy.types";

// ─── Query: fetch attachments for a vacancy ───────────────────────────────────

export function useVacancyAttachmentsQuery(vacancyId: string | null): UseQueryResult<AttachmentDTO[], Error> {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id && vacancyId
      ? vacancyQueryKeys.attachments(tenant.id, vacancyId)
      : ["vacancy", "attachments", "no-tenant"],
    queryFn: async (): Promise<AttachmentDTO[]> => {
      const result = await getVacancyAttachmentsAction(vacancyId!);
      if (result.error) throw new Error(result.error);
      return result.attachments ?? [];
    },
    enabled: !!vacancyId && !!tenant?.id,
    staleTime: 30_000,
  });
}

// ─── Mutation: delete attachment ──────────────────────────────────────────────

export function useDeleteVacancyAttachment(vacancyId: string): UseMutationResult<DeleteVacancyAttachmentResult, Error, string> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const result = await deleteVacancyAttachmentAction(attachmentId, vacancyId);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      showToast({ type: "success", title: "Archivo eliminado", description: "El archivo fue eliminado exitosamente" });
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.attachments(tenant.id, vacancyId) });
        queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.detail(tenant.id, vacancyId) });
      }
    },
    onError: (error: Error) => {
      showToast({ type: "error", title: "Error", description: error.message ?? "No se pudo eliminar el archivo" });
    },
  });
}

// ─── Mutation: validate attachment ────────────────────────────────────────────

export function useValidateAttachment(vacancyId: string): UseMutationResult<AttachmentDTO | undefined, Error, string> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const result = await validateAttachmentAction({ attachmentId, vacancyId });
      if (result.error) throw new Error(result.error);
      return result.attachment;
    },
    onSuccess: () => {
      showToast({ type: "success", title: "Archivo validado", description: "El archivo fue validado exitosamente" });
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.attachments(tenant.id, vacancyId) });
        queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.detail(tenant.id, vacancyId) });
      }
    },
    onError: (error: Error) => {
      showToast({ type: "error", title: "Error", description: error.message ?? "No se pudo validar el archivo" });
    },
  });
}

// ─── Mutation: reject attachment ──────────────────────────────────────────────

export function useRejectAttachment(vacancyId: string): UseMutationResult<AttachmentDTO | undefined, Error, { attachmentId: string; reason: string }> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async ({ attachmentId, reason }: { attachmentId: string; reason: string }) => {
      const result = await rejectAttachmentAction({ attachmentId, vacancyId, reason });
      if (result.error) throw new Error(result.error);
      return result.attachment;
    },
    onSuccess: () => {
      showToast({ type: "success", title: "Archivo rechazado", description: "El archivo fue rechazado" });
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.attachments(tenant.id, vacancyId) });
        queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.detail(tenant.id, vacancyId) });
      }
    },
    onError: (error: Error) => {
      showToast({ type: "error", title: "Error", description: error.message ?? "No se pudo rechazar el archivo" });
    },
  });
}

// ─── Mutation: validate checklist ─────────────────────────────────────────────

type ChecklistValidationResult = Pick<VacancyDTO, "id" | "checklistValidatedAt" | "checklistValidatedById" | "checklistRejectionReason">;

export function useValidateChecklist(vacancyId: string): UseMutationResult<ChecklistValidationResult | undefined, Error, void> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async () => {
      const result = await validateVacancyChecklistAction(vacancyId);
      if (result.error) throw new Error(result.error);
      return result.vacancy;
    },
    onSuccess: () => {
      showToast({ type: "success", title: "Checklist validado", description: "El checklist fue validado exitosamente" });
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.detail(tenant.id, vacancyId) });
        queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.all(tenant.id) });
      }
    },
    onError: (error: Error) => {
      showToast({ type: "error", title: "Error", description: error.message ?? "No se pudo validar el checklist" });
    },
  });
}

// ─── Mutation: reject checklist ───────────────────────────────────────────────

export function useRejectChecklist(vacancyId: string): UseMutationResult<ChecklistValidationResult | undefined, Error, string> {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (reason: string) => {
      const result = await rejectVacancyChecklistAction({ vacancyId, reason });
      if (result.error) throw new Error(result.error);
      return result.vacancy;
    },
    onSuccess: () => {
      showToast({ type: "success", title: "Checklist rechazado", description: "El checklist fue rechazado" });
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.detail(tenant.id, vacancyId) });
        queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.all(tenant.id) });
      }
    },
    onError: (error: Error) => {
      showToast({ type: "error", title: "Error", description: error.message ?? "No se pudo rechazar el checklist" });
    },
  });
}
