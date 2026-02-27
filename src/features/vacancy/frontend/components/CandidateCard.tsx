"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  SmartPhone01Icon,
  FileAttachmentIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@shadcn/badge";
import { cn } from "@/core/lib/utils";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { useRemoveCandidate } from "../hooks/useVacancyDetailMutations";
import { CandidateActionsDropdown } from "./CandidateActionsDropdown";
import { DeleteCandidateAlertDialog } from "./DeleteCandidateAlertDialog";
import { EditCandidateDialog } from "./EditCandidateDialog";
import { CandidateChecklistSheet } from "./CandidateChecklistSheet";
import type { VacancyCandidateDTO, CandidateStatus, VacancyChecklistItemDTO } from "../types/vacancy.types";
import { CANDIDATE_STATUS_LABELS } from "../types/vacancy.types";

interface CandidateCardProps {
  candidate: VacancyCandidateDTO;
  vacancyId: string;
  checklistItems?: VacancyChecklistItemDTO[];
}

const candidateStatusColorMap: Record<CandidateStatus, string> = {
  EN_PROCESO: "bg-blue-100 text-blue-700 border-blue-200",
  EN_TERNA: "bg-violet-100 text-violet-700 border-violet-200",
  CONTRATADO: "bg-green-100 text-green-700 border-green-200",
  DESCARTADO: "bg-slate-100 text-slate-600 border-slate-200",
};

export function CandidateCard({ candidate, vacancyId, checklistItems = [] }: CandidateCardProps) {
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  const cvAttachment = candidate.attachments?.find((a) => a.subType === "CV");

  const initials =
    `${candidate.firstName.charAt(0)}${candidate.lastName.charAt(0)}`.toUpperCase();

  const removeCandidateMutation = useRemoveCandidate();

  const {
    isOpen: isEditOpen,
    openModal: openEdit,
    closeModal: closeEdit,
  } = useModalState();

  const {
    isOpen: isDeleteOpen,
    openModal: openDelete,
    closeModal: closeDelete,
  } = useModalState();

  const {
    isOpen: isChecklistOpen,
    openModal: openChecklist,
    closeModal: closeChecklist,
  } = useModalState();

  const handleDelete = () => {
    removeCandidateMutation.mutate({
      candidateId: candidate.id,
      vacancyId,
    });
    closeDelete();
  };

  const dropdownActions = [
    {
      id: "edit",
      label: "Editar",
      onClick: openEdit,
    },
    {
      id: "checklist",
      label: "Checklist",
      onClick: openChecklist,
    },
    {
      id: "delete",
      label: "Eliminar",
      variant: "destructive" as const,
      onClick: openDelete,
    },
  ];

  return (
    <div
      className={cn(
        "group relative",
        "rounded-xl border border-border/40",
        "bg-gradient-to-b from-background to-muted/20",
        "p-4 transition-all duration-200",
        "hover:border-border/80 hover:shadow-sm",
      )}
    >
      {/* Main content row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 size-10 rounded-full",
            "flex items-center justify-center",
            "text-xs font-semibold tracking-wide",
            candidate.isInTerna
              ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300"
              : "bg-muted text-muted-foreground",
          )}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Name row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{fullName}</span>
            <Badge
              variant="outline"
              className={cn(
                candidateStatusColorMap[candidate.status],
                "text-xs font-medium shrink-0",
              )}
            >
              {CANDIDATE_STATUS_LABELS[candidate.status]}
            </Badge>
          </div>

          {/* Contact info */}
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {candidate.email && (
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  size={12}
                  className="shrink-0"
                />
                <span className="truncate">{candidate.email}</span>
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={SmartPhone01Icon}
                  size={12}
                  className="shrink-0"
                />
                <span>{candidate.phone}</span>
              </div>
            )}
            {candidate.salaryExpectation != null && (
              <div className="flex items-center gap-1">
                <span className="text-foreground/60">Expectativa:</span>
                <span>
                  ${candidate.salaryExpectation.toLocaleString("es-MX")}
                </span>
              </div>
            )}
            {cvAttachment && (
              <a
                href={cvAttachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline w-fit"
              >
                <HugeiconsIcon
                  icon={FileAttachmentIcon}
                  size={12}
                  className="shrink-0"
                />
                <span className="truncate">{cvAttachment.fileName}</span>
              </a>
            )}
          </div>
        </div>

        {/* Actions — visible only on hover */}
        <div
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <CandidateActionsDropdown actions={dropdownActions} />
        </div>
      </div>

      {/* Dialogs */}
      <EditCandidateDialog
        open={isEditOpen}
        onClose={closeEdit}
        candidate={candidate}
        vacancyId={vacancyId}
      />

      <DeleteCandidateAlertDialog
        isOpen={isDeleteOpen}
        onOpenChange={closeDelete}
        candidateNameToDelete={fullName}
        onConfirmDelete={handleDelete}
        isLoading={removeCandidateMutation.isPending}
      />

      <CandidateChecklistSheet
        open={isChecklistOpen}
        onClose={closeChecklist}
        candidate={candidate}
        checklistItems={checklistItems}
        vacancyId={vacancyId}
      />
    </div>
  );
}
