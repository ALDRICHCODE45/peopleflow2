"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload01Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@shadcn/badge";
import { Button } from "@shadcn/button";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@shadcn/item";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/shared/ui/shadcn/tooltip";
import { showToast } from "@/core/shared/components/ShowToast";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import {
  useFileUpload,
  formatBytes,
  type FileWithPreview,
} from "@/core/shared/hooks/use-upload-file";
import { cn } from "@lib/utils";
import { invoiceQueryKeys } from "@core/shared/constants/query-keys";
import { uploadInvoiceComplementoAction } from "../../server/presentation/actions/uploadInvoiceComplemento.action";
import { formatDateSafe } from "../helpers/invoice.helpers";
import type { ComplementoUploadProps } from "../types/invoice.types";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ".pdf,application/pdf";

// ── Complemento File Item (when a file is already uploaded) ─────────────────

interface ComplementoFileItemProps {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt?: string | null;
  onReplace: () => void;
  isReplacing: boolean;
}

/* eslint-disable @next/next/no-img-element */
function ComplementoFileItem({
  fileName,
  fileUrl,
  fileSize,
  createdAt,
  onReplace,
  isReplacing,
}: ComplementoFileItemProps) {
  const descriptionParts = [formatBytes(fileSize)];
  if (createdAt) {
    descriptionParts.push(`Subido el ${formatDateSafe(createdAt)}`);
  }

  return (
    <Item variant="outline" size="sm" className="group">
      <ItemMedia className="size-9 shrink-0 self-start">
        <img
          src="/icons/pdf.svg"
          alt="PDF"
          className="size-9 object-contain"
        />
      </ItemMedia>

      <ItemContent>
        <ItemTitle>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate hover:underline underline-offset-2"
          >
            {fileName}
          </a>
          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={11} />
            Adjunto
          </Badge>
        </ItemTitle>

        <ItemDescription>{descriptionParts.join(" · ")}</ItemDescription>
      </ItemContent>

      <ItemActions className="opacity-0 group-hover:opacity-100 transition-opacity gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              asChild
            >
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <HugeiconsIcon icon={Download01Icon} size={15} />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Descargar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onReplace}
              disabled={isReplacing}
            >
              <HugeiconsIcon
                icon={ArrowReloadHorizontalIcon}
                size={15}
                className={isReplacing ? "animate-spin" : ""}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reemplazar</TooltipContent>
        </Tooltip>
      </ItemActions>
    </Item>
  );
}
/* eslint-enable @next/next/no-img-element */

// ── Complemento Drop Zone (when no file is uploaded yet) ────────────────────

interface ComplementoDropZoneProps {
  invoiceId: string;
  disabled?: boolean;
}

function ComplementoDropZone({ invoiceId, disabled = false }: ComplementoDropZoneProps) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadInvoiceComplementoAction(formData, invoiceId);
      if (result.error) throw new Error(result.error);
      return result.attachment;
    },
    onSuccess: (_data, file) => {
      showToast({
        type: "success",
        title: "Complemento subido",
        description: `"${file.name}" fue subido exitosamente`,
      });
      clearFiles();
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: invoiceQueryKeys.all(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error al subir",
        description: error.message ?? "No se pudo subir el complemento",
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
    accept: ACCEPTED_TYPES,
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
        (isLoading || disabled) && "pointer-events-none opacity-60",
      )}
      onClick={!isLoading && !disabled ? openFileDialog : undefined}
    >
      <input
        {...getInputProps()}
        className="hidden"
        disabled={isLoading || disabled}
      />

      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <HugeiconsIcon
          icon={Upload01Icon}
          size={28}
          strokeWidth={1.5}
          className={cn(
            "transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground",
          )}
        />
        <div>
          <p className="text-sm font-medium">
            {isLoading
              ? "Subiendo..."
              : isDragging
                ? "Soltá el archivo aquí"
                : "Arrastrá o hacé clic para subir el complemento"}
          </p>
          {!isLoading && (
            <p className="text-xs text-muted-foreground mt-0.5">PDF</p>
          )}
          {!isLoading && (
            <p className="text-xs text-muted-foreground mt-1">
              Máx. {formatBytes(MAX_FILE_SIZE_BYTES)}
            </p>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <p className="text-xs text-destructive text-center mt-2">
          {errors[0]}
        </p>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface ComplementoData {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt?: string | null;
}

interface ComplementoUploadFullProps extends ComplementoUploadProps {
  /** Complemento data for display when file exists */
  complemento?: ComplementoData | null;
}

/**
 * Complemento de pago upload/display component.
 *
 * When no file: shows a drag & drop zone (FileDropZone pattern).
 * When file exists: shows an Item row with PDF icon, badge, and hover actions.
 */
export function ComplementoUpload({
  invoiceId,
  hasComplemento,
  complemento,
  disabled = false,
}: ComplementoUploadFullProps) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  // Mutation for replacing an existing complemento
  const replaceMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadInvoiceComplementoAction(formData, invoiceId);
      if (result.error) throw new Error(result.error);
      return result.attachment;
    },
    onSuccess: (_data, file) => {
      showToast({
        type: "success",
        title: "Complemento reemplazado",
        description: `"${file.name}" fue subido exitosamente`,
      });
      clearReplaceFiles();
      if (tenant?.id) {
        queryClient.invalidateQueries({
          queryKey: invoiceQueryKeys.all(tenant.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast({
        type: "error",
        title: "Error al reemplazar",
        description: error.message ?? "No se pudo reemplazar el complemento",
      });
      clearReplaceFiles();
    },
  });

  const [, { getInputProps: getReplaceInputProps, openFileDialog: openReplaceDialog, clearFiles: clearReplaceFiles }] =
    useFileUpload({
      accept: ACCEPTED_TYPES,
      multiple: false,
      maxSize: MAX_FILE_SIZE_BYTES,
      onFilesAdded: (added: FileWithPreview[]) => {
        const first = added[0];
        if (first && first.file instanceof File) {
          replaceMutation.mutate(first.file);
        }
      },
    });

  if (hasComplemento && complemento) {
    return (
      <div className="space-y-2">
        <input
          {...getReplaceInputProps()}
          className="hidden"
          disabled={replaceMutation.isPending || disabled}
        />
        <ComplementoFileItem
          fileName={complemento.fileName}
          fileUrl={complemento.fileUrl}
          fileSize={complemento.fileSize}
          createdAt={complemento.createdAt}
          onReplace={openReplaceDialog}
          isReplacing={replaceMutation.isPending}
        />
      </div>
    );
  }

  return <ComplementoDropZone invoiceId={invoiceId} disabled={disabled} />;
}
