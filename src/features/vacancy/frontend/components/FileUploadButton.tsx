"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@shadcn/button";
import { showToast } from "@/core/shared/components/ShowToast";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { uploadFileAction } from "@core/storage/actions/uploadFile.action";
import { StorageKeys } from "@core/storage/StorageKeys";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface FileUploadButtonProps {
  vacancyId: string;
  subType: "JOB_DESCRIPTION" | "PERFIL_MUESTRA";
  accept?: string;
  label?: string;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function FileUploadButton({
  vacancyId,
  subType,
  accept = ".pdf,.doc,.docx",
  label = "Subir archivo",
  disabled = false,
  onSuccess,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      // Build storage key
      const ext = file.name.split(".").pop() ?? "bin";
      const key =
        subType === "JOB_DESCRIPTION"
          ? StorageKeys.vacancyJobDescription(vacancyId, ext)
          : StorageKeys.vacancyPerfilMuestra(vacancyId, ext);

      const result = await uploadFileAction({
        formData,
        key,
        // Cast to the Prisma enum values — these are the actual string values at runtime
        // Prisma enums are just string unions; we avoid importing @prisma/client in client bundles
        attachableType: "VACANCY" as import("@/core/generated/prisma/client").AttachableType,
        subType: subType as import("@/core/generated/prisma/client").AttachmentSubType,
        vacancyId,
      });

      if (result.error) throw new Error(result.error);
      return result.attachment;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: "Archivo subido",
        description: `${fileName ?? "El archivo"} fue subido exitosamente`,
      });
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
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
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast({
        type: "error",
        title: "Archivo muy grande",
        description: "El archivo no puede superar los 10 MB",
      });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFileName(file.name);
    mutation.mutate(file);
  }

  const isLoading = mutation.isPending;

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading || disabled}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        disabled={isLoading || disabled}
        onClick={() => inputRef.current?.click()}
      >
        {isLoading ? (
          <HugeiconsIcon icon={Cancel01Icon} size={14} className="animate-spin" />
        ) : (
          <HugeiconsIcon icon={Upload01Icon} size={14} strokeWidth={2} />
        )}
        {isLoading ? "Subiendo..." : label}
      </Button>
      {fileName && !isLoading && (
        <span className="text-xs text-muted-foreground truncate max-w-[160px]">
          {fileName}
        </span>
      )}
      <span className="text-xs text-muted-foreground">Máx. 10 MB</span>
    </div>
  );
}
