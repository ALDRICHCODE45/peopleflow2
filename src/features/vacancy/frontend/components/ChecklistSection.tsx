"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@shadcn/badge";
import { Button } from "@shadcn/button";
import { Input } from "@shadcn/input";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import { Label } from "@/core/shared/ui/shadcn/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/core/shared/ui/shadcn/dialog";
import { CandidateActionsDropdown } from "./CandidateActionsDropdown";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import {
  useAddChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from "../hooks/useVacancyDetailMutations";
import {
  useValidateChecklist,
  useRejectChecklist,
} from "../hooks/useVacancyAttachments";
import type { VacancyChecklistItemDTO, VacancyDTO } from "../types/vacancy.types";

// ─── Delete Checklist Item Alert Dialog ───────────────────────────────────────

interface DeleteChecklistItemAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirementText: string;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteChecklistItemAlertDialog({
  open,
  onOpenChange,
  requirementText,
  onConfirm,
  isPending,
}: DeleteChecklistItemAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Eliminar este requisito?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará el requisito{" "}
            <strong className="text-foreground">&quot;{requirementText}&quot;</strong> del
            checklist. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button asChild variant="destructive">
            <AlertDialogAction disabled={isPending} onClick={onConfirm}>
              {isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Edit Checklist Item Dialog ───────────────────────────────────────────────

interface EditChecklistItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRequirement: string;
  onConfirm: (newRequirement: string) => void;
  isPending: boolean;
}

function EditChecklistItemDialog({
  open,
  onOpenChange,
  currentRequirement,
  onConfirm,
  isPending,
}: EditChecklistItemDialogProps) {
  const [value, setValue] = useState(currentRequirement);

  // Sync value when dialog opens with new currentRequirement
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setValue(currentRequirement);
    }
    onOpenChange(isOpen);
  };

  const canSave = value.trim().length > 0 && value.trim() !== currentRequirement;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar requisito</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="edit-checklist-requirement">Requisito</Label>
          <Input
            id="edit-checklist-requirement"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave) onConfirm(value.trim());
            }}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm(value.trim())}
            disabled={!canSave || isPending}
          >
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Checklist Item Row ───────────────────────────────────────────────────────

interface ChecklistItemRowProps {
  item: VacancyChecklistItemDTO;
  index: number;
  vacancyId: string;
  canManage: boolean;
}

function ChecklistItemRow({ item, index, vacancyId, canManage }: ChecklistItemRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const updateMutation = useUpdateChecklistItem();
  const deleteMutation = useDeleteChecklistItem();

  const handleEdit = (newRequirement: string) => {
    updateMutation.mutate(
      { itemId: item.id, vacancyId, requirement: newRequirement },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { itemId: item.id, vacancyId },
      { onSuccess: () => setDeleteOpen(false) },
    );
  };

  const dropdownActions = canManage
    ? [
        {
          id: "edit",
          label: "Editar",
          onClick: () => setEditOpen(true),
        },
        {
          id: "delete",
          label: "Eliminar",
          variant: "destructive" as const,
          onClick: () => setDeleteOpen(true),
        },
      ]
    : [];

  return (
    <>
      <Item variant="outline" size="sm" className="group">
        <ItemMedia className="size-7 shrink-0 self-start">
          <div className="size-full flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold">
            {index + 1}
          </div>
        </ItemMedia>

        <ItemContent>
          <ItemTitle>
            <span className="text-sm">{item.requirement}</span>
          </ItemTitle>
          <ItemDescription>
            Requisito #{index + 1}
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
      <EditChecklistItemDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        currentRequirement={item.requirement}
        onConfirm={handleEdit}
        isPending={updateMutation.isPending}
      />

      <DeleteChecklistItemAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        requirementText={item.requirement}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}

// ─── Checklist Validation Section ─────────────────────────────────────────────

function ChecklistValidationSection({ vacancy }: { vacancy: VacancyDTO }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const validateChecklist = useValidateChecklist(vacancy.id);
  const rejectChecklist = useRejectChecklist(vacancy.id);
  const { hasAnyPermission, isSuperAdmin } = usePermissions();

  const canValidate =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.vacantes.validarChecklist,
      PermissionActions.vacantes.gestionar,
    ]);

  const canReject =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.vacantes.rechazarChecklist,
      PermissionActions.vacantes.gestionar,
    ]);

  function handleReject() {
    if (!rejectReason.trim()) return;
    rejectChecklist.mutate(rejectReason.trim(), {
      onSuccess: () => {
        setRejectOpen(false);
        setRejectReason("");
      },
    });
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Validación del Checklist (Admin)
      </h4>

      {vacancy.checklistValidatedAt ? (
        <div className="rounded-lg border bg-green-50 border-green-200 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={16}
              className="text-green-600"
            />
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              Checklist Validado
            </Badge>
          </div>
        </div>
      ) : vacancy.checklistRejectionReason ? (
        <div className="rounded-lg border bg-red-50 border-red-200 px-3 py-2 space-y-1">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={16}
              className="text-red-600"
            />
            <span className="text-xs font-medium text-red-700">
              Checklist Rechazado
            </span>
          </div>
          <p className="text-xs text-red-700">
            {vacancy.checklistRejectionReason}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-3">
          <p className="text-xs text-muted-foreground">
            El checklist aún no ha sido validado por un administrador.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {canValidate && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs text-green-700 border-green-300 hover:bg-green-50"
            disabled={
              validateChecklist.isPending || !!vacancy.checklistValidatedAt
            }
            onClick={() => validateChecklist.mutate()}
          >
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
            Validar Checklist
          </Button>
        )}
        {canReject && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs text-red-700 border-red-300 hover:bg-red-50"
            disabled={rejectChecklist.isPending}
            onClick={() => setRejectOpen(true)}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={13} />
            Rechazar Checklist
          </Button>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog
        open={rejectOpen}
        onOpenChange={(o) => !o && setRejectOpen(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar Checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="checklist-reject-reason">Motivo del rechazo</Label>
            <Textarea
              id="checklist-reject-reason"
              placeholder="Describe el motivo..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectChecklist.isPending}
            >
              {rejectChecklist.isPending ? "Rechazando..." : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main ChecklistSection Component ──────────────────────────────────────────

interface ChecklistSectionProps {
  vacancy: VacancyDTO;
}

export function ChecklistSection({ vacancy }: ChecklistSectionProps) {
  const [newChecklistText, setNewChecklistText] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const addChecklistMutation = useAddChecklistItem();
  const { hasAnyPermission, isSuperAdmin } = usePermissions();

  const canManage =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.vacantes.editar,
      PermissionActions.vacantes.gestionar,
    ]);

  const checklistItems = vacancy.checklistItems ?? [];
  const sortedItems = [...checklistItems].sort((a, b) => a.order - b.order);

  const handleAddItem = async () => {
    if (!newChecklistText.trim()) return;
    await addChecklistMutation.mutateAsync({
      vacancyId: vacancy.id,
      requirement: newChecklistText.trim(),
      order: checklistItems.length + 1,
    });
    setNewChecklistText("");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {checklistItems.length} requisito(s) definido(s)
        </span>
        <PermissionGuard
          permissions={[
            PermissionActions.vacantes.editar,
            PermissionActions.vacantes.gestionar,
          ]}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="gap-1.5"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2} />
            Agregar ítem
          </Button>
        </PermissionGuard>
      </div>

      {/* List */}
      {sortedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={32}
            strokeWidth={1.5}
          />
          <p className="text-sm">No hay requisitos en el checklist</p>
          <p className="text-xs text-center max-w-xs">
            Agregá los requisitos que debe cumplir el candidato ideal para esta
            posición.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item, index) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              index={index}
              vacancyId={vacancy.id}
              canManage={canManage}
            />
          ))}
        </div>
      )}

      {/* Inline add form */}
      <PermissionGuard
        permissions={[
          PermissionActions.vacantes.editar,
          PermissionActions.vacantes.gestionar,
        ]}
      >
        {showAddForm && (
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Nuevo requerimiento..."
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddItem();
                if (e.key === "Escape") {
                  setShowAddForm(false);
                  setNewChecklistText("");
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleAddItem}
              disabled={
                !newChecklistText.trim() || addChecklistMutation.isPending
              }
            >
              Agregar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddForm(false);
                setNewChecklistText("");
              }}
            >
              Cancelar
            </Button>
          </div>
        )}
      </PermissionGuard>

      <Separator />

      {/* Checklist Validation */}
      <PermissionGuard
        permissions={[
          PermissionActions.vacantes.validarChecklist,
          PermissionActions.vacantes.rechazarChecklist,
          PermissionActions.vacantes.gestionar,
        ]}
      >
        <ChecklistValidationSection vacancy={vacancy} />
      </PermissionGuard>
    </div>
  );
}
