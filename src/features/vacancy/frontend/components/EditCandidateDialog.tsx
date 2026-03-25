"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shadcn/dropdown-menu";
import { Button } from "@shadcn/button";
import { ScrollArea } from "@shadcn/scroll-area";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload01Icon,
  Delete02Icon,
  MoreVerticalIcon,
  Download04Icon,
  ArrowMoveUpLeftIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@lib/utils";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import { useEditCandidateForm } from "../hooks/useEditCandidateForm";
import { CandidateFormFields } from "./CandidateFormFields";
import type { VacancyCandidateDTO } from "../types/vacancy.types";

interface EditCandidateDialogProps {
  open: boolean;
  onClose: () => void;
  candidate: VacancyCandidateDTO;
  vacancyId: string;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="space-y-1 mb-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <Separator />
    </div>
  );
}

function getFileTypeIconSrc(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "doc" || ext === "docx") return "/icons/microsoft-word.svg";
  return "/icons/pdf.svg";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EditCandidateDialog({
  open,
  onClose,
  candidate,
  vacancyId,
}: EditCandidateDialogProps) {
  const {
    form,
    isSubmitting,
    existingCv,
    pendingCvFile,
    cvIsDragging,
    cvErrors,
    getCvInputProps,
    openCvDialog,
    cvDragEnter,
    cvDragLeave,
    cvDragOver,
    cvDrop,
    uploadCvIsPending,
    deleteAttachmentIsPending,
    handleDeleteCv,
    handleReplaceCv,
    handleDownloadCv,
  } = useEditCandidateForm({ vacancyId, candidate, onClose });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar candidato</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="py-2 px-1 pr-4"
            id="edit-candidate-form"
          >
            <CandidateFormFields form={form} />

            {/* ── CV Section (immediate upload) ─────────────────── */}
            <div className="mt-6">
              <SectionHeader title="CV del candidato" />
              <input {...getCvInputProps()} className="hidden" />

              {/* Uploading indicator */}
              {uploadCvIsPending && pendingCvFile && (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={getFileTypeIconSrc(pendingCvFile.name)}
                      alt=""
                      width={28}
                      height={28}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {pendingCvFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Subiendo...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing CV attached */}
              {!uploadCvIsPending && existingCv && (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={getFileTypeIconSrc(existingCv.fileName)}
                      alt=""
                      width={28}
                      height={28}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {existingCv.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(existingCv.fileSize)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                      >
                        <HugeiconsIcon icon={MoreVerticalIcon} size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleDownloadCv(
                            existingCv.fileUrl,
                            existingCv.fileName,
                          )
                        }
                      >
                        <HugeiconsIcon
                          icon={Download04Icon}
                          size={14}
                          className="mr-2"
                        />
                        Descargar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleReplaceCv(existingCv.id)}
                        disabled={deleteAttachmentIsPending}
                      >
                        <HugeiconsIcon
                          icon={ArrowMoveUpLeftIcon}
                          size={14}
                          className="mr-2"
                        />
                        Reemplazar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteCv(existingCv.id)}
                        disabled={deleteAttachmentIsPending}
                        className="text-destructive focus:text-destructive"
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          size={14}
                          className="mr-2"
                        />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* No CV — show drop zone */}
              {!uploadCvIsPending && !existingCv && (
                <div
                  onDragEnter={cvDragEnter}
                  onDragLeave={cvDragLeave}
                  onDragOver={cvDragOver}
                  onDrop={cvDrop}
                  onClick={openCvDialog}
                  className={cn(
                    "rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
                    cvIsDragging
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50",
                  )}
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <HugeiconsIcon
                      icon={Upload01Icon}
                      size={28}
                      strokeWidth={1.5}
                      className={cn(
                        "transition-colors",
                        cvIsDragging
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {cvIsDragging
                          ? "Soltá el archivo acá"
                          : "Arrastrá o hacé clic para subir el CV"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        PDF, DOC o DOCX · Máx. 10 MB
                      </p>
                    </div>
                  </div>
                  {cvErrors.length > 0 && (
                    <p className="text-xs text-destructive text-center mt-2">
                      {cvErrors[0]}
                    </p>
                  )}
                </div>
              )}
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="edit-candidate-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
