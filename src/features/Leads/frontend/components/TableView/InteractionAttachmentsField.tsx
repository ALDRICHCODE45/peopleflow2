"use client";

import type React from "react";
import { memo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Download01Icon,
  FileAttachmentIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/core/shared/ui/shadcn/button";
import { cn } from "@/core/lib/utils";
import {
  formatBytes,
  type FileWithPreview,
} from "@/core/shared/hooks/use-upload-file";
import type { InteractionAttachment } from "../../types";

export const INTERACTION_ATTACHMENTS_MAX_FILES = 5;
export const INTERACTION_ATTACHMENTS_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const INTERACTION_ATTACHMENTS_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function getFileTypeIcon(fileName: string): { src: string; alt: string } {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return { src: "/icons/pdf.svg", alt: "Imagen" };
  }
  if (ext === "pdf") return { src: "/icons/pdf.svg", alt: "PDF" };
  if (ext === "doc" || ext === "docx") {
    return { src: "/icons/microsoft-word.svg", alt: "Word" };
  }
  if (ext === "xls" || ext === "xlsx" || ext === "csv") {
    return { src: "/icons/google-sheets.svg", alt: "Sheets" };
  }
  return { src: "/icons/pdf.svg", alt: "Archivo" };
}

interface InteractionAttachmentsListProps {
  attachments: InteractionAttachment[];
  onDeleteAttachment?: (attachmentId: string) => void;
  deletingAttachmentId?: string | null;
}

/* eslint-disable @next/next/no-img-element */
export const InteractionAttachmentsList = memo(function InteractionAttachmentsList({
  attachments,
  onDeleteAttachment,
  deletingAttachmentId,
}: InteractionAttachmentsListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        const isImage = isImageMimeType(attachment.mimeType);
        const fileIcon = getFileTypeIcon(attachment.fileName);
        const isDeleting = deletingAttachmentId === attachment.id;

        return (
          <div
            key={attachment.id}
            className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/20 p-2"
          >
            <div className="shrink-0 size-10 rounded-md bg-background border border-border/40 flex items-center justify-center overflow-hidden">
              {isImage ? (
                <img
                  src={attachment.fileUrl}
                  alt={attachment.fileName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={fileIcon.src}
                  alt={fileIcon.alt}
                  className="h-6 w-6 object-contain"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{attachment.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(attachment.fileSize)}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="size-8" asChild>
                <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                  <HugeiconsIcon icon={Download01Icon} size={14} />
                </a>
              </Button>

              {onDeleteAttachment && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  disabled={isDeleting}
                  onClick={() => onDeleteAttachment(attachment.id)}
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    size={14}
                    className={isDeleting ? "animate-pulse" : ""}
                  />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
/* eslint-enable @next/next/no-img-element */

interface InteractionAttachmentsFieldProps {
  queuedFiles: FileWithPreview[];
  existingAttachments?: InteractionAttachment[];
  isDragging: boolean;
  errors: string[];
  disabled?: boolean;
  isUploading?: boolean;
  deletingAttachmentId?: string | null;
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & {
    ref?: React.Ref<HTMLInputElement>;
  };
  onOpenFileDialog: () => void;
  onRemoveQueuedFile: (id: string) => void;
  onDeleteExistingAttachment?: (attachmentId: string) => void;
  onDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  onDrop: (e: React.DragEvent<HTMLElement>) => void;
}

/* eslint-disable @next/next/no-img-element */
export function InteractionAttachmentsField({
  queuedFiles,
  existingAttachments = [],
  isDragging,
  errors,
  disabled = false,
  isUploading = false,
  deletingAttachmentId,
  inputProps,
  onOpenFileDialog,
  onRemoveQueuedFile,
  onDeleteExistingAttachment,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: InteractionAttachmentsFieldProps) {
  const canAddMore =
    existingAttachments.length + queuedFiles.length <
    INTERACTION_ATTACHMENTS_MAX_FILES;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Evidencias (opcional)</p>
        <p className="text-xs text-muted-foreground">
          Máx. {INTERACTION_ATTACHMENTS_MAX_FILES} archivos · {formatBytes(INTERACTION_ATTACHMENTS_MAX_SIZE_BYTES)} por archivo
        </p>
      </div>

      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cn(
          "rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          (disabled || isUploading || !canAddMore) && "pointer-events-none opacity-60",
        )}
        onClick={canAddMore && !disabled && !isUploading ? onOpenFileDialog : undefined}
      >
        <input {...inputProps} className="hidden" disabled={disabled || isUploading || !canAddMore} />

        <div className="flex items-center gap-2 text-sm">
          <HugeiconsIcon icon={Upload01Icon} className="size-4 text-muted-foreground" />
          <span>
            {isUploading
              ? "Subiendo archivos..."
              : canAddMore
                ? "Arrastrá archivos o hacé clic para seleccionar"
                : "Límite de archivos alcanzado"}
          </span>
        </div>
      </div>

      {errors.length > 0 && (
        <p className="text-xs text-destructive">{errors[0]}</p>
      )}

      {existingAttachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Adjuntos actuales
          </p>
          <InteractionAttachmentsList
            attachments={existingAttachments}
            onDeleteAttachment={onDeleteExistingAttachment}
            deletingAttachmentId={deletingAttachmentId}
          />
        </div>
      )}

      {queuedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pendientes por subir ({queuedFiles.length})
          </p>

          <div className="space-y-2">
            {queuedFiles.map((queuedFile) => {
              const fileName = queuedFile.file.name;
              const fileSize = queuedFile.file.size;
              const mimeType = queuedFile.file.type;
              const isImage = isImageMimeType(mimeType);

              return (
                <div
                  key={queuedFile.id}
                  className="flex items-center gap-3 rounded-md border border-border/60 bg-background p-2"
                >
                  <div className="shrink-0 size-10 rounded-md bg-muted/30 border border-border/40 flex items-center justify-center overflow-hidden">
                    {isImage && queuedFile.preview ? (
                      <img
                        src={queuedFile.preview}
                        alt={fileName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <HugeiconsIcon icon={FileAttachmentIcon} className="size-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(fileSize)}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => onRemoveQueuedFile(queuedFile.id)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Estos archivos se suben al guardar la interacción.
          </p>
        </div>
      )}
    </div>
  );
}
/* eslint-enable @next/next/no-img-element */
