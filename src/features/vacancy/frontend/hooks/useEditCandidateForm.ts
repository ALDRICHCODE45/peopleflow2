"use client";

import { useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUpdateCandidate } from "./useVacancyDetailMutations";
import { useDeleteVacancyAttachment } from "./useVacancyAttachments";
import {
  useFileUpload,
  formatBytes,
  type FileWithPreview,
} from "@/core/shared/hooks/use-upload-file";
import { uploadFileAction } from "@core/storage/actions/uploadFile.action";
import { StorageKeys } from "@core/storage/StorageKeys";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { showToast } from "@/core/shared/components/ShowToast";
import { vacancyQueryKeys } from "@core/shared/constants/query-keys";
import { candidateSchema } from "../schemas/candidate.schema";
import type { CandidateFormValues } from "../types/candidate-form.types";
import type {
  VacancyCandidateDTO,
  VacancyModality,
  AttachmentDTO,
} from "../types/vacancy.types";

function candidateToFormValues(
  candidate: VacancyCandidateDTO,
): CandidateFormValues {
  return {
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email ?? "",
    phone: candidate.phone ?? "",
    isCurrentlyEmployed: candidate.isCurrentlyEmployed ?? false,
    currentCompany: candidate.currentCompany ?? "",
    currentModality: candidate.currentModality ?? "",
    currentCountryCode: candidate.countryCode ?? "",
    currentRegionCode: candidate.regionCode ?? "",
    workCity: candidate.workCity ?? "",
    currentSalary:
      candidate.currentSalary != null ? String(candidate.currentSalary) : "",
    salaryExpectation:
      candidate.salaryExpectation != null
        ? String(candidate.salaryExpectation)
        : "",
    currentCommissions: candidate.currentCommissions ?? "",
    currentBenefits: candidate.currentBenefits ?? "",
    otherBenefits: candidate.otherBenefits ?? "",
    candidateCountryCode: candidate.candidateCountryCode ?? "",
    candidateRegionCode: candidate.candidateRegionCode ?? "",
    candidateCity: candidate.candidateCity ?? "",
  };
}

export function useEditCandidateForm({
  vacancyId,
  candidate,
  onClose,
}: {
  vacancyId: string;
  candidate: VacancyCandidateDTO;
  onClose: () => void;
}) {
  const updateCandidateMutation = useUpdateCandidate();
  const deleteAttachmentMutation = useDeleteVacancyAttachment(vacancyId);
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  // ── Existing CV ────────────────────────────────────────────────────────────
  const existingCv = useMemo<AttachmentDTO | null>(
    () => candidate.attachments?.find((a) => a.subType === "CV") ?? null,
    [candidate.attachments],
  );

  // ── CV file state — upload IMMEDIATELY on file selection ───────────────────
  const [
    { files: cvFiles, isDragging: cvIsDragging, errors: cvErrors },
    {
      getInputProps: getCvInputProps,
      openFileDialog: openCvDialog,
      clearFiles: clearCvFiles,
      handleDragEnter: cvDragEnter,
      handleDragLeave: cvDragLeave,
      handleDragOver: cvDragOver,
      handleDrop: cvDrop,
    },
  ] = useFileUpload({
    accept: ".pdf,.doc,.docx",
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onFilesAdded: (added: FileWithPreview[]) => {
      const first = added[0];
      if (first && first.file instanceof File) {
        uploadCvMutation.mutate({ file: first.file });
      }
    },
  });

  const pendingCvFile =
    cvFiles[0]?.file instanceof File ? cvFiles[0].file : null;

  // Immediate CV upload mutation
  const uploadCvMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const ext = file.name.split(".").pop() ?? "pdf";
      const key = StorageKeys.candidateCV(vacancyId, candidate.id, ext);
      const result = await uploadFileAction({
        formData,
        key,
        attachableType:
          "VACANCY_CANDIDATE" as import("@/core/generated/prisma/client").AttachableType,
        subType:
          "CV" as import("@/core/generated/prisma/client").AttachmentSubType,
        vacancyCandidateId: candidate.id,
      });
      if (result.error) throw new Error(result.error);
      return result.attachment;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "CV subido",
        description: "El CV fue adjuntado al candidato",
      });
      clearCvFiles();
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: vacancyQueryKeys.detail(tenant.id, vacancyId),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error al subir CV",
        description: error.message ?? "No se pudo subir el CV",
      });
      clearCvFiles();
    },
  });

  // ── CV management helpers ──────────────────────────────────────────────────
  const handleDeleteCv = async (attachmentId: string) => {
    await deleteAttachmentMutation.mutateAsync(attachmentId);
  };

  const handleReplaceCv = (attachmentId: string) => {
    deleteAttachmentMutation.mutate(attachmentId, {
      onSuccess: () => {
        openCvDialog();
      },
    });
  };

  const handleDownloadCv = (url: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  // ── Form ───────────────────────────────────────────────────────────────────
  const defaultValues = candidateToFormValues(candidate);

  const form = useForm({
    defaultValues,
    validators: { onSubmit: candidateSchema },
    onSubmit: async ({ value }) => {
      await updateCandidateMutation.mutateAsync({
        candidateId: candidate.id,
        vacancyId,
        data: {
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          email: value.email.trim() || null,
          phone: value.phone.trim() || null,
          isCurrentlyEmployed: value.isCurrentlyEmployed,
          currentCompany: value.currentCompany.trim() || null,
          currentModality:
            (value.currentModality as VacancyModality) || null,
          countryCode: value.currentCountryCode || null,
          regionCode: value.currentRegionCode || null,
          workCity: value.workCity.trim() || null,
          currentSalary: value.currentSalary
            ? Number(value.currentSalary)
            : null,
          salaryExpectation: value.salaryExpectation
            ? Number(value.salaryExpectation)
            : null,
          currentCommissions: value.currentCommissions.trim() || null,
          currentBenefits: value.currentBenefits.trim() || null,
          otherBenefits: value.otherBenefits.trim() || null,
          candidateCountryCode: value.candidateCountryCode || null,
          candidateRegionCode: value.candidateRegionCode || null,
          candidateCity: value.candidateCity.trim() || null,
        },
      });

      onClose();
    },
  });

  return {
    form,
    isSubmitting: updateCandidateMutation.isPending,
    // CV state
    existingCv,
    pendingCvFile,
    cvFiles,
    cvIsDragging,
    cvErrors,
    getCvInputProps,
    openCvDialog,
    cvDragEnter,
    cvDragLeave,
    cvDragOver,
    cvDrop,
    formatBytes,
    // CV actions
    uploadCvIsPending: uploadCvMutation.isPending,
    deleteAttachmentIsPending: deleteAttachmentMutation.isPending,
    handleDeleteCv,
    handleReplaceCv,
    handleDownloadCv,
  };
}

export type UseEditCandidateFormReturn = ReturnType<
  typeof useEditCandidateForm
>;
