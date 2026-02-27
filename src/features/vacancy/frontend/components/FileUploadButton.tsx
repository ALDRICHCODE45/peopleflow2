"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shadcn/button";
import { showToast } from "@/core/shared/components/ShowToast";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { uploadFileAction } from "@core/storage/actions/uploadFile.action";
import { StorageKeys } from "@core/storage/StorageKeys";
import {
  useFileUpload,
  formatBytes,
  type FileWithPreview,
} from "@/core/shared/hooks/use-upload-file";
import { cn } from "@lib/utils";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── FileUploadButton — compact inline button ──────────────────────────────────

interface FileUploadButtonProps {
  vacancyId: string;
  subType: "JOB_DESCRIPTION" | "PERFIL_MUESTRA";
  accept?: string;
  label?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  className?: string;
}

export function FileUploadButton({
  vacancyId,
  subType,
  accept = ".pdf,.doc,.docx",
  label = "Subir archivo",
  disabled = false,
  onSuccess,
  className,
}: FileUploadButtonProps) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const ext = file.name.split(".").pop() ?? "bin";
      const key =
        subType === "JOB_DESCRIPTION"
          ? StorageKeys.vacancyJobDescription(vacancyId, ext)
          : StorageKeys.vacancyPerfilMuestra(vacancyId, ext);

      const result = await uploadFileAction({
        formData,
        key,
        attachableType:
          "VACANCY" as import("@/core/generated/prisma/client").AttachableType,
        subType:
          subType as import("@/core/generated/prisma/client").AttachmentSubType,
        vacancyId,
      });

      if (result.error) throw new Error(result.error);
      return result.attachment;
    },
    onSuccess: (_data, file) => {
      showToast({
        type: "success",
        title: "Archivo subido",
        description: `"${file.name}" fue subido exitosamente`,
      });
      clearFiles();
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: ["vacancy", "attachments", tenant.id, vacancyId],
        });
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error al subir",
        description: error.message ?? "No se pudo subir el archivo",
      });
      clearFiles();
    },
  });

  const [{ errors }, { getInputProps, openFileDialog, clearFiles }] =
    useFileUpload({
      accept,
      multiple: false,
      maxSize: MAX_FILE_SIZE_BYTES,
      onFilesAdded: (added: FileWithPreview[]) => {
        const first = added[0];
        if (first && first.file instanceof File) {
          mutation.mutate(first.file);
        }
      },
    });

  const isLoading = mutation.isPending;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        <input {...getInputProps()} className="hidden" disabled={isLoading || disabled} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={isLoading || disabled}
          onClick={openFileDialog}
        >
          <HugeiconsIcon
            icon={Upload01Icon}
            size={14}
            strokeWidth={2}
            className={isLoading ? "animate-pulse" : ""}
          />
          {isLoading ? "Subiendo..." : label}
        </Button>
        <span className="text-xs text-muted-foreground">
          Máx. {formatBytes(MAX_FILE_SIZE_BYTES)}
        </span>
      </div>

      {/* Validation errors from the hook */}
      {errors.length > 0 && (
        <p className="text-xs text-destructive">{errors[0]}</p>
      )}
    </div>
  );
}

// ─── FileDropZone — drag & drop area ──────────────────────────────────────────

interface FileDropZoneProps {
  vacancyId: string;
  subType: "JOB_DESCRIPTION" | "PERFIL_MUESTRA";
  accept?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function FileDropZone({
  vacancyId,
  subType,
  accept = ".pdf,.doc,.docx",
  label = "Subir archivo",
  description,
  disabled = false,
  onSuccess,
}: FileDropZoneProps) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const ext = file.name.split(".").pop() ?? "bin";
      const key =
        subType === "JOB_DESCRIPTION"
          ? StorageKeys.vacancyJobDescription(vacancyId, ext)
          : StorageKeys.vacancyPerfilMuestra(vacancyId, ext);

      const result = await uploadFileAction({
        formData,
        key,
        attachableType:
          "VACANCY" as import("@/core/generated/prisma/client").AttachableType,
        subType:
          subType as import("@/core/generated/prisma/client").AttachmentSubType,
        vacancyId,
      });

      if (result.error) throw new Error(result.error);
      return result.attachment;
    },
    onSuccess: (_data, file) => {
      showToast({
        type: "success",
        title: "Archivo subido",
        description: `"${file.name}" fue subido exitosamente`,
      });
      clearFiles();
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: ["vacancy", "attachments", tenant.id, vacancyId],
        });
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error al subir",
        description: error.message ?? "No se pudo subir el archivo",
      });
      clearFiles();
    },
  });

  const [
    { isDragging, errors },
    {
      getInputProps,
      openFileDialog,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
    },
  ] = useFileUpload({
    accept,
    multiple: false,
    maxSize: MAX_FILE_SIZE_BYTES,
    onFilesAdded: (added: FileWithPreview[]) => {
      const first = added[0];
      if (first && first.file instanceof File) {
        mutation.mutate(first.file);
      }
    },
  });

  const isLoading = mutation.isPending;

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        (isLoading || disabled) && "pointer-events-none opacity-60"
      )}
      onClick={!isLoading && !disabled ? openFileDialog : undefined}
    >
      <input {...getInputProps()} className="hidden" disabled={isLoading || disabled} />

      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <HugeiconsIcon
          icon={Upload01Icon}
          size={28}
          strokeWidth={1.5}
          className={cn(
            "transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )}
        />
        <div>
          <p className="text-sm font-medium">
            {isLoading ? "Subiendo..." : isDragging ? "Suelta el archivo aquí" : label}
          </p>
          {description && !isLoading && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
          {!isLoading && (
            <p className="text-xs text-muted-foreground mt-1">
              Máx. {formatBytes(MAX_FILE_SIZE_BYTES)}
            </p>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <p className="text-xs text-destructive text-center mt-2">{errors[0]}</p>
      )}
    </div>
  );
}
