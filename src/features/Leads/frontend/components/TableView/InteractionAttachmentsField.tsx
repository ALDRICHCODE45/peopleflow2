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
import { Badge } from "@shadcn/badge";
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
const INTERACTION_ATTACHMENTS_FORMATS_LABEL =
  "JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, CSV";

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
  compact?: boolean;
}

/* eslint-disable @next/next/no-img-element */
export const InteractionAttachmentsList = memo(function InteractionAttachmentsList({
  attachments,
  onDeleteAttachment,
  deletingAttachmentId,
  compact = false,
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
            className={cn(
              "group flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 p-2.5 transition-colors hover:bg-muted/30",
              compact && "rounded-lg p-2",
            )}
          >
            <div
              className={cn(
                "shrink-0 rounded-lg bg-background border border-border/40 flex items-center justify-center overflow-hidden",
                compact ? "size-9" : "size-11",
              )}
            >
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
                  className={cn("object-contain", compact ? "h-5 w-5" : "h-6 w-6")}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className={cn("truncate font-medium", compact ? "text-xs" : "text-sm")}>
                {attachment.fileName}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{formatBytes(attachment.fileSize)}</span>
                <span>•</span>
                <span>{isImage ? "Imagen" : fileIcon.alt}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("text-muted-foreground", compact ? "size-7" : "size-8")}
                asChild
              >
                <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                  <HugeiconsIcon icon={Download01Icon} size={14} />
                </a>
              </Button>

              {onDeleteAttachment && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("text-destructive", compact ? "size-7" : "size-8")}
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
  const totalCount = existingAttachments.length + queuedFiles.length;
  const remaining = Math.max(0, INTERACTION_ATTACHMENTS_MAX_FILES - totalCount);
  const canAddMore =
    totalCount < INTERACTION_ATTACHMENTS_MAX_FILES;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Evidencias (opcional)</p>
          <p className="text-xs text-muted-foreground">
            Adjuntá soporte de la interacción para seguimiento comercial.
          </p>
        </div>
        <Badge variant={canAddMore ? "outline" : "secondary"} className="text-xs">
          {totalCount}/{INTERACTION_ATTACHMENTS_MAX_FILES}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-muted-foreground">
          Hasta {formatBytes(INTERACTION_ATTACHMENTS_MAX_SIZE_BYTES)} por archivo
        </span>
        <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-muted-foreground">
          {INTERACTION_ATTACHMENTS_FORMATS_LABEL}
        </span>
      </div>

      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-4 transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          (disabled || isUploading || !canAddMore) && "pointer-events-none opacity-60",
          !canAddMore && "border-amber-400/60 bg-amber-50/40 dark:bg-amber-500/5",
        )}
        onClick={canAddMore && !disabled && !isUploading ? onOpenFileDialog : undefined}
      >
        <input {...inputProps} className="hidden" disabled={disabled || isUploading || !canAddMore} />

        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HugeiconsIcon icon={Upload01Icon} className="size-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {isUploading
                ? "Subiendo archivos..."
                : canAddMore
                  ? "Arrastrá archivos o hacé clic para seleccionar"
                  : "Límite de archivos alcanzado"}
            </p>
            <p className="text-xs text-muted-foreground">
              {canAddMore
                ? remaining === 1
                  ? "Te queda 1 archivo disponible"
                  : `Te quedan ${remaining} archivos disponibles`
                : "Eliminá un archivo para poder agregar otro"}
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFileDialog();
            }}
            disabled={!canAddMore || disabled || isUploading}
          >
            Seleccionar
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <p className="text-xs text-destructive">{errors[0]}</p>
      )}

      {existingAttachments.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Adjuntos actuales
            </p>
            <Badge variant="outline" className="text-[10px]">
              {existingAttachments.length}
            </Badge>
          </div>
          <InteractionAttachmentsList
            attachments={existingAttachments}
            onDeleteAttachment={onDeleteExistingAttachment}
            deletingAttachmentId={deletingAttachmentId}
          />
        </div>
      )}

      {queuedFiles.length > 0 && (
        <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pendientes por subir
            </p>
            <Badge className="text-[10px]">{queuedFiles.length}</Badge>
          </div>

          <div className="space-y-2">
            {queuedFiles.map((queuedFile) => {
              const fileName = queuedFile.file.name;
              const fileSize = queuedFile.file.size;
              const mimeType = queuedFile.file.type;
              const isImage = isImageMimeType(mimeType);

              return (
                <div
                  key={queuedFile.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-2.5"
                >
                  <div className="shrink-0 size-11 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-center overflow-hidden">
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
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{formatBytes(fileSize)}</span>
                      <span>•</span>
                      <span>{isImage ? "Imagen" : "Documento"}</span>
                    </div>
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
