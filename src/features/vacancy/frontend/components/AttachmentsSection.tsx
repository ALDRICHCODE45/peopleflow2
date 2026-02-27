"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Delete02Icon,
  DownloadCircle01Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@shadcn/badge";
import { Button } from "@shadcn/button";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/core/shared/ui/shadcn/dialog";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import { Label } from "@/core/shared/ui/shadcn/label";
import { FileUploadButton, FileDropZone } from "./FileUploadButton";
import {
  useDeleteVacancyAttachment,
  useValidateAttachment,
  useRejectAttachment,
} from "../hooks/useVacancyAttachments";
import type { AttachmentDTO, VacancyDTO } from "../types/vacancy.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateSafe(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return format(new Date(isoString), "dd MMM yyyy", { locale: es });
  } catch {
    return "—";
  }
}

function ValidationBadge({ attachment }: { attachment: AttachmentDTO }) {
  if (attachment.isValidated) {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={11} />
        Validado
      </Badge>
    );
  }
  if (attachment.rejectionReason) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1">
        <HugeiconsIcon icon={Cancel01Icon} size={11} />
        Rechazado
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Pendiente
    </Badge>
  );
}

// ─── Reject Dialog ────────────────────────────────────────────────────────────

interface RejectDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

function RejectDialog({ open, title, onClose, onConfirm, isPending }: RejectDialogProps) {
  const [reason, setReason] = useState("");

  function handleConfirm() {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  }

  function handleClose() {
    setReason("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="reject-reason">Motivo del rechazo</Label>
          <Textarea
            id="reject-reason"
            placeholder="Describe el motivo del rechazo..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={!reason.trim() || isPending}
          >
            {isPending ? "Rechazando..." : "Rechazar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Attachment Row ───────────────────────────────────────────────────────────

interface AttachmentRowProps {
  attachment: AttachmentDTO;
  vacancyId: string;
  showAdminActions?: boolean;
}

function AttachmentRow({ attachment, vacancyId, showAdminActions = false }: AttachmentRowProps) {
  const [rejectOpen, setRejectOpen] = useState(false);

  const deleteMutation = useDeleteVacancyAttachment(vacancyId);
  const validateMutation = useValidateAttachment(vacancyId);
  const rejectMutation = useRejectAttachment(vacancyId);

  function handleReject(reason: string) {
    rejectMutation.mutate(
      { attachmentId: attachment.id, reason },
      { onSuccess: () => setRejectOpen(false) },
    );
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* File info row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(attachment.fileSize)}</p>
        </div>
        <ValidationBadge attachment={attachment} />
      </div>

      {/* Rejection reason callout */}
      {attachment.rejectionReason && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          <span className="font-medium">Motivo de rechazo: </span>
          {attachment.rejectionReason}
        </div>
      )}

      {/* Validation date */}
      {attachment.isValidated && attachment.validatedAt && (
        <p className="text-xs text-muted-foreground">
          Validado el {formatDateSafe(attachment.validatedAt)}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Download */}
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" asChild>
          <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" download>
            <HugeiconsIcon icon={DownloadCircle01Icon} size={13} />
            Descargar
          </a>
        </Button>

        {/* Admin actions */}
        {showAdminActions && (
          <>
            {!attachment.isValidated && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1 text-green-700 hover:text-green-800 hover:bg-green-50"
                disabled={validateMutation.isPending}
                onClick={() => validateMutation.mutate(attachment.id)}
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
                Validar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-red-700 hover:text-red-800 hover:bg-red-50"
              disabled={rejectMutation.isPending}
              onClick={() => setRejectOpen(true)}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={13} />
              Rechazar
            </Button>
          </>
        )}

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate(attachment.id)}
        >
          <HugeiconsIcon icon={Delete02Icon} size={13} />
          Eliminar
        </Button>
      </div>

      <RejectDialog
        open={rejectOpen}
        title="Rechazar archivo"
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        isPending={rejectMutation.isPending}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AttachmentsSectionProps {
  vacancy: VacancyDTO;
  attachments: AttachmentDTO[];
  isLoadingAttachments?: boolean;
}

export function AttachmentsSection({
  vacancy,
  attachments,
  isLoadingAttachments = false,
}: AttachmentsSectionProps) {
  const jobDescriptions = attachments.filter((a) => a.subType === "JOB_DESCRIPTION");
  const perfilesMuestra = attachments.filter((a) => a.subType === "PERFIL_MUESTRA");

  const hasJobDescription = jobDescriptions.length > 0;

  if (isLoadingAttachments) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Job Description ── */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Job Description
        </h4>

        {hasJobDescription ? (
          <div className="space-y-2">
            {jobDescriptions.map((attachment) => (
              <AttachmentRow
                key={attachment.id}
                attachment={attachment}
                vacancyId={vacancy.id}
                showAdminActions
              />
            ))}
          </div>
        ) : (
          <FileDropZone
            vacancyId={vacancy.id}
            subType="JOB_DESCRIPTION"
            accept=".pdf,.doc,.docx"
            label="Arrastrá o hacé clic para subir el Job Description"
            description="PDF, DOC o DOCX"
          />
        )}
      </div>

      <Separator />

      {/* ── Perfiles Muestra ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Perfiles Muestra
          </h4>
          <FileUploadButton
            vacancyId={vacancy.id}
            subType="PERFIL_MUESTRA"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            label="Agregar perfil"
          />
        </div>

        {perfilesMuestra.length === 0 ? (
          <FileDropZone
            vacancyId={vacancy.id}
            subType="PERFIL_MUESTRA"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            label="Arrastrá o hacé clic para subir un Perfil Muestra"
            description="PDF, DOC, DOCX, JPG o PNG"
          />
        ) : (
          <div className="space-y-2">
            {perfilesMuestra.map((attachment) => (
              <AttachmentRow
                key={attachment.id}
                attachment={attachment}
                vacancyId={vacancy.id}
                showAdminActions
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
