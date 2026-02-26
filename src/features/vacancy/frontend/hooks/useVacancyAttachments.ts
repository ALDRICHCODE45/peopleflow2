"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import {
  getVacancyAttachmentsAction,
  deleteVacancyAttachmentAction,
  validateAttachmentAction,
  rejectAttachmentAction,
  validateVacancyChecklistAction,
  rejectVacancyChecklistAction,
} from "@features/vacancy/server/presentation/actions/vacancyAttachment.actions";
import type { AttachmentDTO } from "../types/vacancy.types";

// ─── Query: fetch attachments for a vacancy ───────────────────────────────────

export function useVacancyAttachmentsQuery(vacancyId: string | null) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["vacancy", "attachments", tenant?.id, vacancyId],
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

export function useDeleteVacancyAttachment(vacancyId: string) {
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
        queryClient.invalidateQueries({ queryKey: ["vacancy", "attachments", tenant.id, vacancyId] });
        queryClient.invalidateQueries({ queryKey: ["vacancy", "detail", tenant.id, vacancyId] });
      }
    },
    onError: (error: Error) => {
      showToast({ type: "error", title: "Error", description: error.message ?? "No se pudo eliminar el archivo" });
    },
  });
}

// ─── Mutation: validate attachment ────────────────────────────────────────────

export function useValidateAttachment(vacancyId: string) {
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
        queryClient.invalidateQueries({ queryKey: ["vacancy", "attachments", tenant.id, vacancyId] });
        queryClient.invalidateQueries({ queryKey: ["vacancy", "detail", tenant.id, vacancyId] });
      }
    },
    onError: (error: Error) => {
      showToast({ type: "error", title: "Error", description: error.message ?? "No se pudo validar el archivo" });
    },
  });
}

// ─── Mutation: reject attachment ──────────────────────────────────────────────

export function useRejectAttachment(vacancyId: string) {
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
        queryClient.invalidateQueries({ queryKey: ["vacancy", "attachments", tenant.id, vacancyId] });
        queryClient.invalidateQueries({ queryKey: ["vacancy", "detail", tenant.id, vacancyId] });
      }
    },
    onError: (error: Error) => {
      showToast({ type: "error", title: "Error", description: error.message ?? "No se pudo rechazar el archivo" });
    },
  });
}

// ─── Mutation: validate checklist ─────────────────────────────────────────────

export function useValidateChecklist(vacancyId: string) {
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
        queryClient.invalidateQueries({ queryKey: ["vacancy", "detail", tenant.id, vacancyId] });
        queryClient.invalidateQueries({ queryKey: ["vacancies", "paginated", tenant.id] });
      }
    },
    onError: (error: Error) => {
      showToast({ type: "error", title: "Error", description: error.message ?? "No se pudo validar el checklist" });
    },
  });
}

// ─── Mutation: reject checklist ───────────────────────────────────────────────

export function useRejectChecklist(vacancyId: string) {
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
        queryClient.invalidateQueries({ queryKey: ["vacancy", "detail", tenant.id, vacancyId] });
        queryClient.invalidateQueries({ queryKey: ["vacancies", "paginated", tenant.id] });
      }
    },
    onError: (error: Error) => {
      showToast({ type: "error", title: "Error", description: error.message ?? "No se pudo rechazar el checklist" });
    },
  });
}
