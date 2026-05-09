"use client";

import { useState } from "react";
import { format, startOfDay, isBefore, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcn/sheet";
import { Button } from "@shadcn/button";
import { Textarea } from "@shadcn/textarea";
import { Label } from "@shadcn/label";
import { Card, CardContent, CardHeader } from "@shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shadcn/dialog";
import { Separator } from "@shadcn/separator";
import { Badge } from "@shadcn/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Add01Icon,

  Clock01Icon,
  Edit02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { useCommitmentsQuery } from "../hooks/useCommitmentsQuery";
import { useCreateCommitment } from "../hooks/useCreateCommitment";
import { useVacancyDetailQuery } from "../hooks/useVacancyDetailQuery";
import { CommitmentItem } from "./CommitmentItem";
import { Skeleton } from "@shadcn/skeleton";
import { DatePicker } from "@/core/shared/ui/shadcn/date-picker";

import type { VacancyCommitmentDTO } from "../types/vacancy.types";

interface CommitmentsSheetProps {
  vacancyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CommitmentTimelineEvent({
  event,
}: {
  event: {
    type: "created" | "edited" | "completed" | "cancelled" | "reprogrammed";
    timestamp: string;
    actor: string | null;
    description: string;
  };
}) {
  const iconMap = {
    created: Add01Icon,
    edited: Edit02Icon,
    completed: CheckmarkCircle02Icon,
    cancelled: Cancel01Icon,
    reprogrammed: Clock01Icon,
  };

  const colorMap = {
    created: "text-blue-600 dark:text-blue-400",
    edited: "text-amber-600 dark:text-amber-400",
    completed: "text-green-600 dark:text-green-400",
    cancelled: "text-gray-600 dark:text-gray-400",
    reprogrammed: "text-purple-600 dark:text-purple-400",
  };

  const icon = iconMap[event.type];
  const color = colorMap[event.type];

  return (
    <div className="flex gap-3 relative">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
          <HugeiconsIcon icon={icon} size={14} className={color} />
        </div>
        <div className="w-px flex-1 bg-border min-h-4" />
      </div>
      <div className="flex-1 pb-4 min-w-0">
        <p className="text-sm font-medium">{event.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>
            {format(new Date(event.timestamp), "eee dd/MM/yyyy HH:mm", {
              locale: es,
            })}
          </span>
          {event.actor && <span>· {event.actor}</span>}
        </div>
      </div>
    </div>
  );
}

function CommitmentTimeline({
  commitment,
}: {
  commitment: VacancyCommitmentDTO;
}) {
  // Build timeline events from commitment data
  const events: Array<{
    type: "created" | "edited" | "completed" | "cancelled" | "reprogrammed";
    timestamp: string;
    actor: string | null;
    description: string;
  }> = [];

  // Created event
  events.push({
    type: "created",
    timestamp: commitment.createdAt,
    actor: null,
    description: "Compromiso creado",
  });

  // Parse commitment events (status changes)
  if (commitment.events && commitment.events.length > 0) {
    commitment.events.forEach((evt) => {
      if (evt.previousStatus === "PENDING" && evt.newStatus === "COMPLETED") {
        events.push({
          type: "completed",
          timestamp: evt.createdAt,
          actor: evt.changedByName || null,
          description: evt.note || "Compromiso completado",
        });
      } else if (
        evt.previousStatus === "PENDING" &&
        evt.newStatus === "CANCELLED"
      ) {
        events.push({
          type: "cancelled",
          timestamp: evt.createdAt,
          actor: evt.changedByName || null,
          description: evt.note || "Compromiso cancelado",
        });
      } else {
        events.push({
          type: "edited",
          timestamp: evt.createdAt,
          actor: evt.changedByName || null,
          description: evt.note || "Compromiso modificado",
        });
      }
    });
  }

  // Sort chronologically (most recent first)
  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-0">
      {events.map((event, idx) => (
        <CommitmentTimelineEvent key={idx} event={event} />
      ))}
    </div>
  );
}

export function CommitmentsSheet({
  vacancyId,
  open,
  onOpenChange,
}: CommitmentsSheetProps) {
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [historyCommitment, setHistoryCommitment] =
    useState<VacancyCommitmentDTO | null>(null);

  const { data: commitments, isLoading } = useCommitmentsQuery(
    vacancyId || ""
  );
  const { data: vacancy } = useVacancyDetailQuery(vacancyId);
  const createCommitment = useCreateCommitment();

  const handleCreateCommitment = () => {
    if (!description.trim() || !dueDate || !vacancyId) return;

    createCommitment.mutate(
      {
        vacancyId,
        description: description.trim(),
        dueDate,
      },
      {
        onSuccess: () => {
          setDescription("");
          setDueDate("");
          setShowCreateDialog(false);
        },
      }
    );
  };

  const activeCommitments =
    commitments?.filter((c) => c.status === "PENDING") ?? [];
  const closedCommitments =
    commitments?.filter((c) => c.status !== "PENDING") ?? [];

  // Calculate overdue count
  const today = startOfDay(new Date());
  const overdueCount = activeCommitments.filter((c) => {
    const dueDate = parse(c.dueDate, "yyyy-MM-dd", new Date());
    if (!isValid(dueDate)) return false;
    return isBefore(dueDate, today);
  }).length;

  // Sort active commitments: overdue first, then by due date
  const sortedActiveCommitments = [...activeCommitments].sort((a, b) => {
    const dateA = parse(a.dueDate, "yyyy-MM-dd", new Date());
    const dateB = parse(b.dueDate, "yyyy-MM-dd", new Date());
    const isOverdueA = isValid(dateA) && isBefore(dateA, today);
    const isOverdueB = isValid(dateB) && isBefore(dateB, today);

    if (isOverdueA && !isOverdueB) return -1;
    if (!isOverdueA && isOverdueB) return 1;
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          width="2xl"
          className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-0"
          showCloseButton={false}
        >
          {isLoading || !vacancy ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <>
              {/* Header */}
              <SheetHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b sticky top-0 bg-background z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-base md:text-lg font-semibold leading-tight">
                      Compromisos
                    </SheetTitle>
                    <div className="mt-1.5 space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {vacancy.position}
                      </p>
                      <div className="flex flex-col md:flex-row gap-1 md:gap-4 text-xs text-muted-foreground flex-wrap">
                        {vacancy.clientName && (
                          <span>
                            <span className="font-medium text-foreground">
                              Cliente:
                            </span>{" "}
                            {vacancy.clientName}
                          </span>
                        )}
                        {vacancy.recruiterName && (
                          <span>
                            <span className="font-medium text-foreground">
                              Reclutador:
                            </span>{" "}
                            {vacancy.recruiterName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onOpenChange(false)}
                    aria-label="Cerrar"
                  >
                    ✕
                  </Button>
                </div>
              </SheetHeader>

              {/* Content */}
              <div className="px-4 md:px-6 py-4 space-y-5">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-500/25 dark:bg-amber-500/10">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15 shrink-0">
                          <HugeiconsIcon
                            icon={Calendar03Icon}
                            size={16}
                            className="text-amber-700 dark:text-amber-300"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xl font-semibold text-amber-900 dark:text-amber-200">
                            {activeCommitments.length}
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 truncate">
                            Activos
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 bg-red-50/30 dark:border-red-500/25 dark:bg-red-500/10">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15 shrink-0">
                          <HugeiconsIcon
                            icon={AlertCircleIcon}
                            size={16}
                            className="text-red-700 dark:text-red-300"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xl font-semibold text-red-900 dark:text-red-200">
                            {overdueCount}
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-300 truncate">
                            Vencidos
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50/30 dark:border-green-500/25 dark:bg-green-500/10">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/15 shrink-0">
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            size={16}
                            className="text-green-700 dark:text-green-300"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xl font-semibold text-green-900 dark:text-green-200">
                            {closedCommitments.length}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300 truncate">
                            Cerrados
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Create Button */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold">
                    Compromisos activos
                  </h3>
                  <PermissionGuard
                    permissions={[
                      PermissionActions.vacantesCompromisos.crear,
                      PermissionActions.vacantesCompromisos.gestionar,
                    ]}
                  >
                    <Button
                      size="sm"
                      onClick={() => setShowCreateDialog(true)}
                      className="gap-1.5"
                    >
                      <HugeiconsIcon
                        icon={Add01Icon}
                        size={14}
                        strokeWidth={2}
                      />
                      Crear compromiso
                    </Button>
                  </PermissionGuard>
                </div>

                {/* Active Commitments List */}
                {sortedActiveCommitments.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        size={32}
                        strokeWidth={1.5}
                      />
                      <p className="text-sm font-medium">
                        No hay compromisos activos
                      </p>
                      <p className="text-xs">
                        Los compromisos te ayudan a dar seguimiento a tareas
                        importantes
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {sortedActiveCommitments.map((commitment) => (
                      <CommitmentItem
                        key={commitment.id}
                        commitment={commitment}
                        vacancyId={vacancyId || ""}
                        onShowHistory={setHistoryCommitment}
                      />
                    ))}
                  </div>
                )}

                {/* Closed Commitments Section */}
                {closedCommitments.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">
                        Compromisos cerrados
                      </h3>
                      {closedCommitments.map((commitment) => (
                        <Card
                          key={commitment.id}
                          className="dark:bg-card/60 dark:border-border/70"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 space-y-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                  {commitment.description}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className={
                                      commitment.status === "COMPLETED"
                                        ? "text-green-700 border-green-300 dark:text-green-300 dark:border-green-500/50"
                                        : "text-gray-500 border-gray-300 dark:text-gray-400 dark:border-gray-500/50"
                                    }
                                  >
                                    {commitment.status === "COMPLETED"
                                      ? "Completado"
                                      : "Cancelado"}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-muted-foreground dark:text-muted-foreground dark:border-border/70"
                                  >
                                    <HugeiconsIcon
                                      icon={Calendar03Icon}
                                      size={12}
                                      className="mr-1"
                                    />
                                    {format(
                                      parse(
                                        commitment.dueDate,
                                        "yyyy-MM-dd",
                                        new Date()
                                      ),
                                      "eee dd/MM/yyyy",
                                      {
                                        locale: es,
                                      }
                                    )}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          {commitment.events && commitment.events.length > 0 && (
                            <div className="px-6 pb-3 pt-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setHistoryCommitment(commitment)}
                                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 -ml-2"
                              >
                                <HugeiconsIcon icon={Clock01Icon} size={13} />
                                Ver historial ({commitment.events.length})
                              </Button>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Commitment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear compromiso</DialogTitle>
            <DialogDescription>
              Define un compromiso para esta vacante
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="create-description">
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="create-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿Qué compromiso se debe cumplir?"
                rows={3}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 caracteres
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-dueDate">
                Fecha de vencimiento <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="Seleccionar fecha"
                minDate={format(new Date(), "yyyy-MM-dd")}
                displayFormat="eee dd/MM/yyyy"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateDialog(false);
                setDescription("");
                setDueDate("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCommitment}
              disabled={
                !description.trim() ||
                !dueDate ||
                description.length < 2 ||
                createCommitment.isPending
              }
            >
              {createCommitment.isPending ? "Creando..." : "Crear compromiso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Sub-Sheet */}
      <Sheet
        open={historyCommitment !== null}
        onOpenChange={(o) => !o && setHistoryCommitment(null)}
      >
        <SheetContent
          side="right"
          width="lg"
          className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-0"
          showCloseButton={false}
        >
          {historyCommitment && (
            <>
              <SheetHeader className="px-5 pt-5 pb-4 border-b sticky top-0 bg-background z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-base font-semibold">
                      Historial
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {historyCommitment.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={
                          historyCommitment.status === "PENDING"
                            ? "text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-500/50"
                            : historyCommitment.status === "COMPLETED"
                              ? "text-green-700 border-green-300 dark:text-green-300 dark:border-green-500/50"
                              : "text-gray-500 border-gray-300 dark:text-gray-400 dark:border-gray-500/50"
                        }
                      >
                        {historyCommitment.status === "PENDING"
                          ? "Pendiente"
                          : historyCommitment.status === "COMPLETED"
                            ? "Completado"
                            : "Cancelado"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        <HugeiconsIcon
                          icon={Calendar03Icon}
                          size={12}
                          className="mr-1"
                        />
                        {format(
                          parse(
                            historyCommitment.dueDate,
                            "yyyy-MM-dd",
                            new Date()
                          ),
                          "eee dd/MM/yyyy",
                          { locale: es }
                        )}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setHistoryCommitment(null)}
                    aria-label="Cerrar historial"
                  >
                    ✕
                  </Button>
                </div>
              </SheetHeader>
              <div className="px-5 py-4">
                <CommitmentTimeline commitment={historyCommitment} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
