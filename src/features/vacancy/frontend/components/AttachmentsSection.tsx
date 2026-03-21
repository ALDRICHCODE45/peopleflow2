"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shadcn/alert-dialog";
import { FolderSection } from "@/core/shared/ui/FolderSection/FolderSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/core/shared/ui/shadcn/dialog";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import { Label } from "@/core/shared/ui/shadcn/label";
import { CandidateActionsDropdown } from "./CandidateActionsDropdown";
import { FileUploadButton, FileDropZone } from "./FileUploadButton";
import {
  useDeleteVacancyAttachment,
  useValidateAttachment,
  useRejectAttachment,
} from "../hooks/useVacancyAttachments";
import type { CandidateAction } from "./CandidateActionsDropdown";
import type { AttachmentDTO, VacancyDTO } from "../types/vacancy.types";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { PermissionActions } from "@/core/shared/constants/permissions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** SVG file-type icons used as Folder paper items */
/* eslint-disable @next/next/no-img-element */
function FileIconItem({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex items-center justify-center w-full h-full p-1">
      <img src={src} alt={alt} className="w-full h-full object-contain" />
    </div>
  );
}

/** Static decorative items for each folder — always shows 3 file-type icons */
const JOB_DESCRIPTION_ITEMS = [
  <FileIconItem key="pdf" src="/icons/pdf.svg" alt="PDF" />,
  <FileIconItem key="word" src="/icons/microsoft-word.svg" alt="Word" />,
  <FileIconItem key="sheets" src="/icons/google-sheets.svg" alt="Sheets" />,
];

const PERFILES_MUESTRA_ITEMS = [
  <FileIconItem key="pdf" src="/icons/pdf.svg" alt="PDF" />,
  <FileIconItem key="word" src="/icons/microsoft-word.svg" alt="Word" />,
  <FileIconItem key="sheets" src="/icons/google-sheets.svg" alt="Sheets" />,
];
/* eslint-enable @next/next/no-img-element */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeIcon(fileName: string): { src: string; alt: string } {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { src: "/icons/pdf.svg", alt: "PDF" };
  if (ext === "doc" || ext === "docx") return { src: "/icons/microsoft-word.svg", alt: "Word" };
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return { src: "/icons/google-sheets.svg", alt: "Sheets" };
  return { src: "/icons/pdf.svg", alt: "Archivo" };
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

// ─── Validate Attachment Alert Dialog ─────────────────────────────────────────

interface ValidateAttachmentAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  onConfirm: () => void;
  isPending: boolean;
}

function ValidateAttachmentAlertDialog({
  open,
  onOpenChange,
  fileName,
  onConfirm,
  isPending,
}: ValidateAttachmentAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Validar archivo</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas validar el archivo{" "}
            <span className="font-semibold">{fileName}</span>? Esta acción no se
            puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button asChild>
            <AlertDialogAction onClick={onConfirm} disabled={isPending}>
              {isPending ? "Validando..." : "Validar"}
            </AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Attachment Row ───────────────────────────────────────────────────────────

interface AttachmentRowProps {
  attachment: AttachmentDTO;
  vacancyId: string;
  showReviewActions?: boolean;
  showDeleteAction?: boolean;
}

/* eslint-disable @next/next/no-img-element */
function AttachmentRow({
  attachment,
  vacancyId,
  showReviewActions = false,
  showDeleteAction = false,
}: AttachmentRowProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);

  const deleteMutation = useDeleteVacancyAttachment(vacancyId);
  const validateMutation = useValidateAttachment(vacancyId);
  const rejectMutation = useRejectAttachment(vacancyId);

  const fileIcon = getFileTypeIcon(attachment.fileName);

  function handleReject(reason: string) {
    rejectMutation.mutate(
      { attachmentId: attachment.id, reason },
      { onSuccess: () => setRejectOpen(false) },
    );
  }

  function handleValidate() {
    validateMutation.mutate(attachment.id, {
      onSuccess: () => setValidateOpen(false),
    });
  }

  // Build dropdown actions
  const dropdownActions: CandidateAction[] = [
    {
      id: "download",
      label: "Descargar",
      onClick: () => window.open(attachment.fileUrl, "_blank"),
    },
    ...(showReviewActions && !attachment.isValidated
      ? [
          {
            id: "validate",
            label: "Validar",
            onClick: () => setValidateOpen(true),
          },
        ]
      : []),
    ...(showReviewActions
      ? [
          {
            id: "reject",
            label: "Rechazar",
            onClick: () => setRejectOpen(true),
          },
        ]
      : []),
    ...(showDeleteAction
      ? [
          {
            id: "delete",
            label: "Eliminar",
            variant: "destructive" as const,
            onClick: () => deleteMutation.mutate(attachment.id),
          },
        ]
      : []),
  ];

  // Build description parts
  const descriptionParts: string[] = [formatBytes(attachment.fileSize)];
  if (attachment.isValidated && attachment.validatedAt) {
    descriptionParts.push(`Validado el ${formatDateSafe(attachment.validatedAt)}`);
  }

  return (
    <>
      <Item variant="outline" size="sm" className="group">
        <ItemMedia className="size-9 shrink-0 self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fileIcon.src} alt={fileIcon.alt} className="size-9 object-contain" />
        </ItemMedia>

        <ItemContent>
          <ItemTitle>
            <span className="truncate">{attachment.fileName}</span>
            <ValidationBadge attachment={attachment} />
          </ItemTitle>

          <ItemDescription>
            {descriptionParts.join(" · ")}
            {attachment.rejectionReason && (
              <span className="text-red-600">
                {" — "}Motivo: {attachment.rejectionReason}
              </span>
            )}
          </ItemDescription>
        </ItemContent>

        {dropdownActions.length > 0 && (
          <ItemActions
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <CandidateActionsDropdown actions={dropdownActions} />
          </ItemActions>
        )}
      </Item>

      {/* Dialogs — outside Item to avoid layout interference */}
      <ValidateAttachmentAlertDialog
        open={validateOpen}
        onOpenChange={setValidateOpen}
        fileName={attachment.fileName}
        onConfirm={handleValidate}
        isPending={validateMutation.isPending}
      />

      <RejectDialog
        open={rejectOpen}
        title="Rechazar archivo"
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        isPending={rejectMutation.isPending}
      />
    </>
  );
}
/* eslint-enable @next/next/no-img-element */

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
  const { hasAnyPermission, isSuperAdmin } = usePermissions();

  const canReviewAttachments =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.vacantes.revisarArchivos,
      PermissionActions.vacantes.gestionar,
    ]);

  const canDeleteAttachments =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.vacantes.eliminarArchivos,
      PermissionActions.vacantes.gestionar,
    ]);

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
    <div className="space-y-3">
      {/* ── Job Description ── */}
      <FolderSection
        title="Job Description"
        color="#5227FF"
        fileCount={jobDescriptions.length}
        defaultOpen={false}
        folderItems={JOB_DESCRIPTION_ITEMS}
      >
        {hasJobDescription ? (
          <div className="space-y-2">
            {jobDescriptions.map((attachment) => (
              <AttachmentRow
                key={attachment.id}
                attachment={attachment}
                vacancyId={vacancy.id}
                showReviewActions={canReviewAttachments}
                showDeleteAction={canDeleteAttachments}
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
      </FolderSection>

      {/* ── Perfiles Muestra ── */}
      <FolderSection
        title="Perfiles Muestra"
        color="#FF6B35"
        fileCount={perfilesMuestra.length}
        defaultOpen={false}
        folderItems={PERFILES_MUESTRA_ITEMS}
        headerAction={
          <FileUploadButton
            vacancyId={vacancy.id}
            subType="PERFIL_MUESTRA"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            label="Agregar perfil"
          />
        }
      >
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
                showReviewActions={canReviewAttachments}
                showDeleteAction={canDeleteAttachments}
              />
            ))}
          </div>
        )}
      </FolderSection>
    </div>
  );
}
