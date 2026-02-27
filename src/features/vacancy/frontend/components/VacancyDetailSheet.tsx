"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcn/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/core/shared/ui/shadcn/tabs";
import { Badge } from "@shadcn/badge";
import { Button } from "@shadcn/button";
import { Skeleton } from "@/core/shared/ui/shadcn/skeleton";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import { Input } from "@shadcn/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/core/shared/ui/shadcn/dialog";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import { Label } from "@/core/shared/ui/shadcn/label";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  UserAdd01Icon,
  RefreshIcon,
  UserMultiple02Icon,
  CheckmarkBadge01Icon,
  Alert02Icon,
  RepeatIcon,
  Cancel01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { useVacancyDetailQuery } from "../hooks/useVacancyDetailQuery";
import {
  useAddChecklistItem,
  useConfirmPlacement,
} from "../hooks/useVacancyDetailMutations";
import {
  useValidateChecklist,
  useRejectChecklist,
} from "../hooks/useVacancyAttachments";
import { VacancyStatusBadge } from "./VacancyStatusBadge";
import { CandidateCard } from "./CandidateCard";
import { AddCandidateDialog } from "./AddCandidateDialog";
import { ValidateTernaDialog } from "./ValidateTernaDialog";
import { TernaHistorySheet } from "./TernaHistorySheet";
import { VacancyStatusTransitionDialog } from "./VacancyStatusTransitionDialog";
import { AttachmentsSection } from "./AttachmentsSection";
import { useVacancyAttachmentsQuery } from "../hooks/useVacancyAttachments";
import type {
  VacancyStatusHistoryDTO,
  VacancyStatusType,
  VacancyDTO,
} from "../types/vacancy.types";
import {
  VACANCY_STATUS_LABELS,
  VACANCY_MODALITY_LABELS,
} from "../types/vacancy.types";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { VacancySalesTypeBadge } from "./VacancyVentaTypeBadge";

interface VacancyDetailSheetProps {
  vacancyId: string | null;
  onClose: () => void;
}

function formatDateSafe(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return format(new Date(isoString), "dd MMM yyyy", { locale: es });
  } catch {
    return "—";
  }
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

function HistoryItem({ item }: { item: VacancyStatusHistoryDTO }) {
  return (
    <div className="flex gap-3 relative">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium">
            {VACANCY_STATUS_LABELS[item.previousStatus as VacancyStatusType]}
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={12}
            className="text-muted-foreground shrink-0"
          />
          <span className="text-xs font-medium">
            {VACANCY_STATUS_LABELS[item.newStatus as VacancyStatusType]}
          </span>
          {item.isRollback && (
            <Badge
              variant="outline"
              className="text-xs bg-amber-50 text-amber-700 border-amber-200"
            >
              Retroceso
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-0.5">
          {formatDateSafe(item.createdAt)}
          {item.changedByName && ` · ${item.changedByName}`}
        </div>

        {item.reason && (
          <p className="text-xs text-foreground/70 mt-1 bg-muted/50 rounded px-2 py-1">
            {item.reason}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

// ─── ChecklistValidationSection ───────────────────────────────────────────────

function ChecklistValidationSection({ vacancy }: { vacancy: VacancyDTO }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const validateChecklist = useValidateChecklist(vacancy.id);
  const rejectChecklist = useRejectChecklist(vacancy.id);

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

// ─── Main component ───────────────────────────────────────────────────────────

export function VacancyDetailSheet({
  vacancyId,
  onClose,
}: VacancyDetailSheetProps) {
  const { data: vacancy, isLoading } = useVacancyDetailQuery(vacancyId);
  const { data: attachments = [], isLoading: isLoadingAttachments } =
    useVacancyAttachmentsQuery(vacancyId);

  const isMobile = useIsMobile();

  const sheetSide = isMobile ? "bottom" : "right";

  const {
    isOpen: isAddCandidateOpen,
    openModal: openAddCandidate,
    closeModal: closeAddCandidate,
  } = useModalState();

  const {
    isOpen: isTransitionOpen,
    openModal: openTransition,
    closeModal: closeTransition,
  } = useModalState();

  const {
    isOpen: isValidateTernaOpen,
    openModal: openValidateTerna,
    closeModal: closeValidateTerna,
  } = useModalState();

  const {
    isOpen: isTernaHistoryOpen,
    openModal: openTernaHistory,
    closeModal: closeTernaHistory,
  } = useModalState();

  const addChecklistMutation = useAddChecklistItem();
  const confirmPlacementMutation = useConfirmPlacement();

  const [newChecklistText, setNewChecklistText] = useState("");
  const [showAddChecklist, setShowAddChecklist] = useState(false);

  const handleAddChecklistItem = async () => {
    if (!newChecklistText.trim() || !vacancyId) return;
    await addChecklistMutation.mutateAsync({
      vacancyId,
      requirement: newChecklistText.trim(),
      order: (vacancy?.checklistItems?.length ?? 0) + 1,
    });
    setNewChecklistText("");
    setShowAddChecklist(false);
  };

  return (
    <>
      <Sheet open={vacancyId !== null} onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          side={sheetSide}
          width="2xl"
          className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-0"
          showCloseButton={false}
        >
          {isLoading || !vacancy ? (
            <DetailSkeleton />
          ) : (
            <>
              {/* Header */}
              <SheetHeader className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-lg font-semibold truncate">
                      {vacancy.position}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <VacancyStatusBadge status={vacancy.status} />

                      <VacancySalesTypeBadge type={vacancy.saleType} />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
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
                      {/* Indicador de intentos (downgrades) */}
                      {vacancy.rollbackCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <HugeiconsIcon icon={RepeatIcon} size={11} />
                          <span>
                            {vacancy.rollbackCount} retroceso
                            {vacancy.rollbackCount !== 1 ? "s" : ""}
                          </span>
                        </span>
                      )}
                      {/* Indicador de entrega en tiempo */}
                      {vacancy.actualDeliveryDate &&
                        vacancy.targetDeliveryDate && (
                          <span
                            className={
                              new Date(vacancy.actualDeliveryDate) <=
                                new Date(vacancy.targetDeliveryDate)
                                ? "flex items-center gap-1 text-green-600"
                                : "flex items-center gap-1 text-red-500"
                            }
                          >
                            <HugeiconsIcon icon={Alert02Icon} size={11} />
                            <span>
                              {new Date(vacancy.actualDeliveryDate) <=
                                new Date(vacancy.targetDeliveryDate)
                                ? "Terna en tiempo"
                                : "Terna fuera de tiempo"}
                            </span>
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {vacancy.status === "PRE_PLACEMENT" && (
                      <Button
                        size="sm"
                        className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() =>
                          confirmPlacementMutation.mutate(vacancy.id)
                        }
                        disabled={confirmPlacementMutation.isPending}
                      >
                        <HugeiconsIcon
                          icon={CheckmarkBadge01Icon}
                          size={14}
                          strokeWidth={2}
                        />
                        {confirmPlacementMutation.isPending
                          ? "Confirmando..."
                          : "Confirmar placement"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openTransition}
                      className="gap-1.5"
                    >
                      <HugeiconsIcon
                        icon={RefreshIcon}
                        size={14}
                        strokeWidth={2}
                      />
                      Cambiar estado
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onClose}
                      aria-label="Cerrar"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              {/* Tabs */}
              <div className="flex-1 px-6 py-4">
                <Tabs defaultValue="info">
                  <TabsList className="w-full">
                    <TabsTrigger value="info" className="flex-1">
                      Información
                    </TabsTrigger>
                    <TabsTrigger value="files" className="flex-1">
                      Archivos{" "}
                      {attachments.length > 0 && (
                        <Badge
                          variant="outline"
                          className="ml-1 text-xs size-5 p-0 flex items-center justify-center"
                        >
                          {attachments.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="candidates" className="flex-1">
                      Candidatos{" "}
                      {vacancy.candidates && vacancy.candidates.length > 0 && (
                        <Badge
                          variant="outline"
                          className="ml-1 text-xs size-5 p-0 flex items-center justify-center"
                        >
                          {vacancy.candidates.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="checklist" className="flex-1">
                      Checklist{" "}
                      {vacancy.checklistItems &&
                        vacancy.checklistItems.length > 0 && (
                          <Badge
                            variant="outline"
                            className="ml-1 text-xs size-5 p-0 flex items-center justify-center"
                          >
                            {vacancy.checklistItems.length}
                          </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex-1">
                      Historial
                    </TabsTrigger>
                  </TabsList>

                  {/* ---- Tab: Información ---- */}
                  <TabsContent value="info" className="mt-4 space-y-5">
                    {/* Fechas */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Fechas
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <InfoRow
                          label="Fecha de asignación"
                          value={formatDateSafe(vacancy.assignedAt)}
                        />
                        <InfoRow
                          label="Fecha objetivo de entrega"
                          value={formatDateSafe(vacancy.targetDeliveryDate)}
                        />
                        <InfoRow
                          label="Fecha real de entrega"
                          value={formatDateSafe(vacancy.actualDeliveryDate)}
                        />
                        <InfoRow
                          label="Fecha de ingreso"
                          value={formatDateSafe(vacancy.entryDate)}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Condiciones laborales */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Condiciones laborales
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <InfoRow
                          label="Modalidad"
                          value={
                            vacancy.modality
                              ? VACANCY_MODALITY_LABELS[vacancy.modality]
                              : null
                          }
                        />
                        <InfoRow label="Horario" value={vacancy.schedule} />
                        <InfoRow label="País" value={vacancy.countryCode} />
                        <InfoRow label="Región" value={vacancy.regionCode} />
                      </div>
                    </div>

                    <Separator />

                    {/* Salario */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Compensación
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <InfoRow
                          label="Salario mínimo"
                          value={
                            vacancy.salaryMin != null
                              ? `$${vacancy.salaryMin.toLocaleString("es-MX")}`
                              : null
                          }
                        />
                        <InfoRow
                          label="Salario máximo"
                          value={
                            vacancy.salaryMax != null
                              ? `$${vacancy.salaryMax.toLocaleString("es-MX")}`
                              : null
                          }
                        />
                        <InfoRow
                          label="Salario fijo (placement)"
                          value={
                            vacancy.salaryFixed != null
                              ? `$${vacancy.salaryFixed.toLocaleString("es-MX")}`
                              : null
                          }
                        />
                        <InfoRow
                          label="Comisiones"
                          value={vacancy.commissions}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Extras */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Extras
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        <InfoRow label="Beneficios" value={vacancy.benefits} />
                        <InfoRow
                          label="Herramientas requeridas"
                          value={vacancy.tools}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            ¿Requiere psicometría?
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              vacancy.requiresPsychometry
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                            }
                          >
                            {vacancy.requiresPsychometry ? "Sí" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ---- Tab: Archivos ---- */}
                  <TabsContent value="files" className="mt-4">
                    <AttachmentsSection
                      vacancy={vacancy}
                      attachments={attachments}
                      isLoadingAttachments={isLoadingAttachments}
                    />
                  </TabsContent>

                  {/* ---- Tab: Candidatos ---- */}
                  <TabsContent value="candidates" className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {vacancy.candidates?.length ?? 0} candidato(s)
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={openTernaHistory}
                          className="gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <HugeiconsIcon
                            icon={Clock01Icon}
                            size={14}
                            strokeWidth={2}
                          />
                          Historial
                        </Button>
                        {vacancy.status === "HUNTING" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openValidateTerna}
                            className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                          >
                            <HugeiconsIcon
                              icon={UserMultiple02Icon}
                              size={14}
                              strokeWidth={2}
                            />
                            Validar terna
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openAddCandidate}
                          className="gap-1.5"
                        >
                          <HugeiconsIcon
                            icon={UserAdd01Icon}
                            size={14}
                            strokeWidth={2}
                          />
                          Agregar candidato
                        </Button>
                      </div>
                    </div>

                    {!vacancy.candidates || vacancy.candidates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                        <HugeiconsIcon
                          icon={UserAdd01Icon}
                          size={32}
                          strokeWidth={1.5}
                        />
                        <p className="text-sm">No hay candidatos aún</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {vacancy.candidates.map((candidate) => (
                          <CandidateCard
                            key={candidate.id}
                            candidate={candidate}
                            vacancyId={vacancy.id}
                            checklistItems={vacancy.checklistItems ?? []}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* ---- Tab: Checklist ---- */}
                  <TabsContent value="checklist" className="mt-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {vacancy.checklistItems?.length ?? 0} requisito(s)
                        definido(s)
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddChecklist(true)}
                        className="gap-1.5"
                      >
                        <HugeiconsIcon
                          icon={PlusSignIcon}
                          size={14}
                          strokeWidth={2}
                        />
                        Agregar ítem
                      </Button>
                    </div>

                    {/* List — purely informational, no checkboxes */}
                    {!vacancy.checklistItems ||
                      vacancy.checklistItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={32}
                          strokeWidth={1.5}
                        />
                        <p className="text-sm">
                          No hay requisitos en el checklist
                        </p>
                        <p className="text-xs text-center max-w-xs">
                          Agregá los requisitos que debe cumplir el candidato
                          ideal para esta posición.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {vacancy.checklistItems
                          .sort((a, b) => a.order - b.order)
                          .map((item, index) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 rounded-md border px-3 py-2.5 bg-muted/30"
                            >
                              <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">
                                {index + 1}.
                              </span>
                              <span className="text-sm flex-1">
                                {item.requirement}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Inline add form */}
                    {showAddChecklist && (
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Nuevo requerimiento..."
                          value={newChecklistText}
                          onChange={(e) => setNewChecklistText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddChecklistItem();
                            if (e.key === "Escape") {
                              setShowAddChecklist(false);
                              setNewChecklistText("");
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleAddChecklistItem}
                          disabled={
                            !newChecklistText.trim() ||
                            addChecklistMutation.isPending
                          }
                        >
                          Agregar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowAddChecklist(false);
                            setNewChecklistText("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}

                    <Separator />

                    {/* Checklist Validation (Admin) */}
                    <ChecklistValidationSection vacancy={vacancy} />
                  </TabsContent>

                  {/* ---- Tab: Historial ---- */}
                  <TabsContent value="history" className="mt-4">
                    {!vacancy.statusHistory ||
                      vacancy.statusHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={32}
                          strokeWidth={1.5}
                        />
                        <p className="text-sm">Sin historial de estados</p>
                      </div>
                    ) : (
                      <div className="space-y-0 mt-2">
                        {[...vacancy.statusHistory]
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime(),
                          )
                          .map((item) => (
                            <HistoryItem key={item.id} item={item} />
                          ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Sub-dialogs */}
      {vacancyId && (
        <>
          <AddCandidateDialog
            open={isAddCandidateOpen}
            onClose={closeAddCandidate}
            vacancyId={vacancyId}
          />
          {vacancy && (
            <>
              <VacancyStatusTransitionDialog
                open={isTransitionOpen}
                onClose={closeTransition}
                vacancyId={vacancyId}
                currentStatus={vacancy.status}
                candidates={vacancy.candidates ?? []}
              />
              <ValidateTernaDialog
                open={isValidateTernaOpen}
                onClose={closeValidateTerna}
                vacancyId={vacancyId}
                candidates={vacancy.candidates ?? []}
              />
              <TernaHistorySheet
                open={isTernaHistoryOpen}
                onClose={closeTernaHistory}
                vacancyId={vacancyId}
                vacancyPosition={vacancy.position}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
