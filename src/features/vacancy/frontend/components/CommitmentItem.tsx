"use client";

import { useState } from "react";
import { format, startOfDay, isBefore, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@shadcn/badge";
import { Button } from "@shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shadcn/dialog";
import { Textarea } from "@shadcn/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Calendar03Icon,
  AlertCircleIcon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { useCompleteCommitment } from "../hooks/useCompleteCommitment";
import { useCancelCommitment } from "../hooks/useCancelCommitment";
import { useUpdateCommitment } from "../hooks/useUpdateCommitment";
import { Label } from "@shadcn/label";
import type { VacancyCommitmentDTO } from "../types/vacancy.types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shadcn/collapsible";
import { DatePicker } from "@/core/shared/ui/shadcn/date-picker";

interface CommitmentItemProps {
  commitment: VacancyCommitmentDTO;
  vacancyId: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-500/50">
          Pendiente
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="outline" className="text-green-700 border-green-300 dark:text-green-300 dark:border-green-500/50">
          Completado
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="text-gray-500 border-gray-300 dark:text-gray-400 dark:border-gray-500/50">
          Cancelado
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function CommitmentItem({ commitment, vacancyId }: CommitmentItemProps) {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [completeNote, setCompleteNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [editDescription, setEditDescription] = useState(commitment.description);
  
  // Parse dueDate as date-only string (yyyy-MM-dd) to avoid timezone issues
  const parseDueDateOnly = (dateStr: string): string => {
    // Extract yyyy-MM-dd from ISO string or use as-is if already date-only
    return dateStr.split("T")[0];
  };
  
  const [editDueDate, setEditDueDate] = useState(
    parseDueDateOnly(commitment.dueDate)
  );
  const [showHistory, setShowHistory] = useState(false);

  const completeCommitment = useCompleteCommitment();
  const cancelCommitment = useCancelCommitment();
  const updateCommitment = useUpdateCommitment();

  // Parse due date as date-only and compare calendar days (no timezone offset)
  const dueDateOnly = parseDueDateOnly(commitment.dueDate);
  const dueDate = parse(dueDateOnly, "yyyy-MM-dd", new Date());
  const today = startOfDay(new Date());
  const isOverdue =
    commitment.status === "PENDING" &&
    isValid(dueDate) &&
    isBefore(startOfDay(dueDate), today);

  const isPending = commitment.status === "PENDING";

  const handleComplete = () => {
    completeCommitment.mutate(
      {
        commitmentId: commitment.id,
        vacancyId,
        note: completeNote.trim() || null,
      },
      {
        onSuccess: () => {
          setShowCompleteDialog(false);
          setCompleteNote("");
        },
      }
    );
  };

  const handleCancel = () => {
    cancelCommitment.mutate(
      {
        commitmentId: commitment.id,
        vacancyId,
        reason: cancelReason.trim() || null,
      },
      {
        onSuccess: () => {
          setShowCancelDialog(false);
          setCancelReason("");
        },
      }
    );
  };

  const handleEdit = () => {
    updateCommitment.mutate(
      {
        commitmentId: commitment.id,
        vacancyId,
        description: editDescription,
        dueDate: editDueDate,
      },
      {
        onSuccess: () => {
          setShowEditDialog(false);
        },
      }
    );
  };

  return (
    <>
      <Card className={isOverdue ? "border-red-300 bg-red-50/30 dark:border-red-500/40 dark:bg-red-950/20" : "dark:bg-card/60 dark:border-border/70"}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 flex-col sm:flex-row">
            <div className="flex-1 space-y-1 w-full sm:w-auto">
              <CardDescription className="text-sm font-medium text-foreground">
                {commitment.description}
              </CardDescription>
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(commitment.status)}
                {commitment.dueDate && isValid(dueDate) && (
                  <Badge
                    variant="outline"
                    className={
                      isOverdue
                        ? "text-red-700 border-red-300 bg-red-50 dark:text-red-300 dark:border-red-500/50 dark:bg-red-950/30"
                        : "text-muted-foreground dark:text-muted-foreground dark:border-border/70"
                    }
                  >
                    <HugeiconsIcon
                      icon={isOverdue ? AlertCircleIcon : Calendar03Icon}
                      size={12}
                      className="mr-1"
                    />
                    {format(dueDate, "eee dd/MM/yyyy", {
                      locale: es,
                    })}
                  </Badge>
                )}
                {commitment.responsibleUserName && (
                  <Badge variant="outline" className="text-muted-foreground dark:text-muted-foreground dark:border-border/70">
                    Responsable: {commitment.responsibleUserName}
                  </Badge>
                )}
              </div>
            </div>
            {isPending && (
              <div className="flex gap-1 flex-wrap w-full justify-start sm:w-auto sm:justify-end">
                <PermissionGuard
                  permissions={[
                    PermissionActions.vacantesCompromisos.editar,
                    PermissionActions.vacantesCompromisos.gestionar,
                  ]}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                    className="h-8 gap-1"
                  >
                    <HugeiconsIcon
                      icon={PencilEdit02Icon}
                      size={14}
                      strokeWidth={2}
                    />
                    Editar
                  </Button>
                </PermissionGuard>
                <PermissionGuard
                  permissions={[
                    PermissionActions.vacantesCompromisos.completar,
                    PermissionActions.vacantesCompromisos.gestionar,
                  ]}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCompleteDialog(true)}
                    className="h-8 gap-1 text-green-700 hover:text-green-800 hover:bg-green-50"
                  >
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      size={14}
                      strokeWidth={2}
                    />
                    Completar
                  </Button>
                </PermissionGuard>
                <PermissionGuard
                  permissions={[
                    PermissionActions.vacantesCompromisos.cancelar,
                    PermissionActions.vacantesCompromisos.gestionar,
                  ]}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCancelDialog(true)}
                    className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      size={14}
                      strokeWidth={2}
                    />
                    Cancelar
                  </Button>
                </PermissionGuard>
              </div>
            )}
          </div>
        </CardHeader>

        {commitment.events && commitment.events.length > 0 && (
          <CardContent className="pt-0">
            <Collapsible open={showHistory} onOpenChange={setShowHistory}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showHistory ? "Ocultar" : "Ver"} historial ({commitment.events.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2 border-l-2 border-muted pl-3">
                {commitment.events.map((event) => {
                  const eventTime = new Date(event.createdAt);
                  
                  return (
                    <div key={event.id} className="text-xs space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {event.note && (
                          <span className="font-medium text-foreground">
                            {event.note}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {format(eventTime, "eee dd/MM/yyyy HH:mm", {
                            locale: es,
                          })}
                        </span>
                      </div>
                      {event.changedByName && (
                        <p className="text-muted-foreground">
                          por {event.changedByName}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        )}
      </Card>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar compromiso</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de marcar este compromiso como completado?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nota (opcional)
            </label>
            <Textarea
              value={completeNote}
              onChange={(e) => setCompleteNote(e.target.value)}
              placeholder="Agrega una nota sobre la finalización..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCompleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleComplete}
              disabled={completeCommitment.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeCommitment.isPending ? "Completando..." : "Completar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar compromiso</DialogTitle>
            <DialogDescription>
              Modifica la descripción o fecha de vencimiento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="¿Qué compromiso se debe cumplir?"
                rows={2}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {editDescription.length}/500 caracteres
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">
                Fecha de vencimiento <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                value={editDueDate}
                onChange={setEditDueDate}
                placeholder="Seleccionar fecha"
                minDate={format(new Date(), "yyyy-MM-dd")}
                displayFormat="eee dd/MM/yyyy"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowEditDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                !editDescription.trim() ||
                !editDueDate ||
                editDescription.length < 2 ||
                updateCommitment.isPending
              }
            >
              {updateCommitment.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar compromiso</DialogTitle>
            <DialogDescription>
              Indica el motivo de la cancelación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Motivo (opcional)
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Opcionalmente explica por qué se cancela..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCancelDialog(false)}
            >
              Volver
            </Button>
            <Button
              onClick={handleCancel}
              disabled={cancelCommitment.isPending}
              variant="destructive"
            >
              {cancelCommitment.isPending ? "Cancelando..." : "Cancelar compromiso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
