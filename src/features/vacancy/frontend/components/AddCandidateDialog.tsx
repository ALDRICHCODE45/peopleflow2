"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shadcn/dialog";
import { Button } from "@shadcn/button";
import { ScrollArea } from "@shadcn/scroll-area";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@lib/utils";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import { useAddCandidateForm } from "../hooks/useAddCandidateForm";
import { CandidateFormFields } from "./CandidateFormFields";

interface AddCandidateDialogProps {
  open: boolean;
  onClose: () => void;
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

export function AddCandidateDialog({
  open,
  onClose,
  vacancyId,
}: AddCandidateDialogProps) {
  const {
    form,
    isSubmitting,
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
  } = useAddCandidateForm({ vacancyId, onClose });

  const cvFile = cvFiles[0]?.file instanceof File ? cvFiles[0].file : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar candidato</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="py-2 px-1 pr-4"
            id="add-candidate-form"
          >
            <CandidateFormFields form={form} />

            {/* ── CV Section (upload on submit) ─────────────────── */}
            <div className="mt-6">
              <SectionHeader title="CV del candidato" />
              <input {...getCvInputProps()} className="hidden" />
              {cvFile ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={getFileTypeIconSrc(cvFile.name)}
                      alt=""
                      width={28}
                      height={28}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {cvFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(cvFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => removeCvFile(cvFiles[0]?.id ?? "")}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                  </Button>
                </div>
              ) : (
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
                        cvIsDragging ? "text-primary" : "text-muted-foreground",
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
            form="add-candidate-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creando candidato..." : "Agregar candidato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
