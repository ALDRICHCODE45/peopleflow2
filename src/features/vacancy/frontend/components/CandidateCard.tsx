"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  Call02Icon,
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
import { CandidateDetailSheet } from "./CandidateDetailSheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@shadcn/tooltip";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@shadcn/item";
import type {
  VacancyCandidateDTO,
  CandidateStatus,
  VacancyChecklistItemDTO,
} from "../types/vacancy.types";
import { CANDIDATE_STATUS_LABELS } from "../types/vacancy.types";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { PermissionActions } from "@/core/shared/constants/permissions";

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

export function CandidateCard({
  candidate,
  vacancyId,
  checklistItems = [],
}: CandidateCardProps) {
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  const cvAttachment = candidate.attachments?.find((a) => a.subType === "CV");

  const initials =
    `${candidate.firstName.charAt(0)}${candidate.lastName.charAt(0)}`.toUpperCase();

  const removeCandidateMutation = useRemoveCandidate();
  const { hasAnyPermission, isSuperAdmin } = usePermissions();

  const canEdit =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.candidatos.editar,
      PermissionActions.candidatos.gestionar,
      PermissionActions.vacantes.gestionar,
    ]);
  const canDelete =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.candidatos.eliminar,
      PermissionActions.candidatos.gestionar,
      PermissionActions.vacantes.gestionar,
    ]);
  const canChecklist =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.candidatos.editar,
      PermissionActions.candidatos.gestionar,
      PermissionActions.vacantes.gestionar,
    ]);

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

  const {
    isOpen: isDetailOpen,
    openModal: openDetail,
    closeModal: closeDetail,
  } = useModalState();

  const handleDelete = () => {
    removeCandidateMutation.mutate({
      candidateId: candidate.id,
      vacancyId,
    });
    closeDelete();
  };

  const dropdownActions = [
    ...(canEdit
      ? [
          {
            id: "edit",
            label: "Editar",
            onClick: openEdit,
          },
        ]
      : []),
    ...(canChecklist
      ? [
          {
            id: "checklist",
            label: "Checklist",
            onClick: openChecklist,
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            id: "delete",
            label: "Eliminar",
            variant: "destructive" as const,
            onClick: openDelete,
          },
        ]
      : []),
  ];

  return (
    <>
      <Item variant="outline" size="sm" className="group">
        {/* Avatar */}
        <ItemMedia variant="image">
          <div
            className={cn(
              "size-full flex items-center justify-center rounded-full",
              "text-xs font-semibold tracking-wide",
              candidate.isInTerna
                ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300"
                : "bg-muted text-muted-foreground",
            )}
          >
            {initials}
          </div>
        </ItemMedia>

        {/* Content: name + icons row */}
        <ItemContent>
          <ItemTitle>
            <button
              type="button"
              onClick={openDetail}
              className="font-medium hover:text-primary transition-colors cursor-pointer"
            >
              {fullName}
            </button>
            <Badge
              variant="outline"
              className={cn(
                candidateStatusColorMap[candidate.status],
                "text-[10px] font-medium",
              )}
            >
              {CANDIDATE_STATUS_LABELS[candidate.status]}
            </Badge>
          </ItemTitle>

          {/* Quick-action icon row as description */}
          <ItemDescription className="!p-0">
            <div
              className="flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {candidate.email && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`mailto:${candidate.email}`}
                      className={cn(
                        "inline-flex items-center justify-center",
                        "size-6 rounded-md",
                        "text-muted-foreground hover:text-foreground",
                        "hover:bg-muted/80 transition-colors",
                      )}
                    >
                      <HugeiconsIcon icon={Mail01Icon} className="size-3.5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>{candidate.email}</TooltipContent>
                </Tooltip>
              )}

              {candidate.phone && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`tel:${candidate.phone}`}
                      className={cn(
                        "inline-flex items-center justify-center",
                        "size-6 rounded-md",
                        "text-muted-foreground hover:text-foreground",
                        "hover:bg-muted/80 transition-colors",
                      )}
                    >
                      <HugeiconsIcon icon={Call02Icon} className="size-3.5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>{candidate.phone}</TooltipContent>
                </Tooltip>
              )}

              {cvAttachment && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={cvAttachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center justify-center",
                        "size-6 rounded-md",
                        "text-muted-foreground hover:text-primary",
                        "hover:bg-primary/10 transition-colors",
                      )}
                    >
                      <HugeiconsIcon
                        icon={FileAttachmentIcon}
                        className="size-3.5"
                      />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>CV: {cvAttachment.fileName}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </ItemDescription>
        </ItemContent>

        {/* Dropdown — visible only on hover, hidden if no actions available */}
        {dropdownActions.length > 0 && (
          <ItemActions
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <CandidateActionsDropdown actions={dropdownActions} />
          </ItemActions>
        )}
      </Item>

      {/* Dialogs — fuera del Item para no afectar layout */}
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

      <CandidateDetailSheet
        open={isDetailOpen}
        onClose={closeDetail}
        candidate={candidate}
      />
    </>
  );
}
