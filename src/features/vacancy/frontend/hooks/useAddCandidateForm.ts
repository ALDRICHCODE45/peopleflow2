"use client";

import { useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAddCandidate } from "./useVacancyDetailMutations";
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
import type { VacancyModality } from "../types/vacancy.types";

const DEFAULT_VALUES: CandidateFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  isCurrentlyEmployed: false,
  currentCompany: "",
  currentModality: "",
  currentCountryCode: "",
  currentRegionCode: "",
  workCity: "",
  currentSalary: "",
  salaryExpectation: "",
  currentCommissions: "",
  currentBenefits: "",
  otherBenefits: "",
  candidateCountryCode: "",
  candidateRegionCode: "",
  candidateCity: "",
};

export function useAddCandidateForm({
  vacancyId,
  onClose,
}: {
  vacancyId: string;
  onClose: () => void;
}) {
  const addCandidateMutation = useAddCandidate();
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  // Ref to hold the selected CV file — immune to closure/render issues.
  // Updated synchronously in onFilesAdded, read in onSubmit.
  const cvFileRef = useRef<File | null>(null);

  // CV file state — collect only, upload after candidate creation
  const [
    { files: cvFiles, isDragging: cvIsDragging, errors: cvErrors },
    {
      getInputProps: getCvInputProps,
      openFileDialog: openCvDialog,
      removeFile: removeCvFileInternal,
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
      // Sync the ref immediately when file is selected — this is called
      // BEFORE the state update, so the ref always holds the latest file.
      const first = added[0];
      if (first?.file instanceof File) {
        cvFileRef.current = first.file;
      }
    },
  });

  // Wrap removeFile to also clear the ref
  const removeCvFile = (id: string) => {
    cvFileRef.current = null;
    removeCvFileInternal(id);
  };

  // Separate mutation for CV upload (runs after candidate is created)
  const uploadCvMutation = useMutation({
    mutationFn: async ({
      file,
      candidateId,
    }: {
      file: File;
      candidateId: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      const ext = file.name.split(".").pop() ?? "pdf";
      const key = StorageKeys.candidateCV(vacancyId, candidateId, ext);
      const result = await uploadFileAction({
        formData,
        key,
        attachableType:
          "VACANCY_CANDIDATE" as import("@/core/generated/prisma/client").AttachableType,
        subType:
          "CV" as import("@/core/generated/prisma/client").AttachmentSubType,
        vacancyCandidateId: candidateId,
      });
      if (result.error) throw new Error(result.error);
      return result.attachment;
    },
  });

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onSubmit: candidateSchema },
    onSubmit: async ({ value }) => {
      // Read file from ref — stable across renders, immune to stale closures.
      // Also check state as fallback in case ref was missed.
      const fileToUpload =
        cvFileRef.current ??
        (cvFiles[0]?.file instanceof File ? cvFiles[0].file : null);

      const candidate = await addCandidateMutation.mutateAsync({
        vacancyId,
        data: {
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          email: value.email.trim() || undefined,
          phone: value.phone.trim() || undefined,
          isCurrentlyEmployed: value.isCurrentlyEmployed,
          currentCompany: value.currentCompany.trim() || undefined,
          currentModality:
            (value.currentModality as VacancyModality) || undefined,
          countryCode: value.currentCountryCode || undefined,
          regionCode: value.currentRegionCode || undefined,
          workCity: value.workCity.trim() || undefined,
          currentSalary: value.currentSalary
            ? Number(value.currentSalary)
            : undefined,
          salaryExpectation: value.salaryExpectation
            ? Number(value.salaryExpectation)
            : undefined,
          currentCommissions: value.currentCommissions.trim() || undefined,
          currentBenefits: value.currentBenefits.trim() || undefined,
          otherBenefits: value.otherBenefits.trim() || undefined,
          candidateCountryCode: value.candidateCountryCode || undefined,
          candidateRegionCode: value.candidateRegionCode || undefined,
          candidateCity: value.candidateCity.trim() || undefined,
        },
      });

      // Upload CV if one was selected — after candidate exists in DB
      if (fileToUpload && candidate?.id) {
        try {
          await uploadCvMutation.mutateAsync({
            file: fileToUpload,
            candidateId: candidate.id,
          });
          showToast({
            type: "success",
            title: "CV subido",
            description: "El CV fue adjuntado al candidato",
          });
          // Invalidate vacancy detail so the UI reflects the new CV attachment
          if (tenant?.id) {
            queryClient.invalidateQueries({
              queryKey: vacancyQueryKeys.detail(tenant.id, vacancyId),
            });
          }
        } catch {
          showToast({
            type: "error",
            title: "CV no subido",
            description:
              "El candidato fue creado pero el CV no pudo subirse. Podés intentarlo desde el perfil del candidato.",
          });
        }
      }

      // Clear the ref for next use
      cvFileRef.current = null;
      onClose();
    },
  });

  return {
    form,
    isSubmitting:
      addCandidateMutation.isPending || uploadCvMutation.isPending,
    // CV helpers
    cvFiles,
    cvIsDragging,
    cvErrors,
    getCvInputProps,
    openCvDialog,
    removeCvFile,
    cvDragEnter,
    cvDragLeave,
    cvDragOver,
    cvDrop,
    formatBytes,
  };
}

export type UseAddCandidateFormReturn = ReturnType<typeof useAddCandidateForm>;
