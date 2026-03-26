"use client";

import { useState } from "react";
import { resolveCountryName, resolveRegionName } from "@lib/resolve-location";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shadcn/dropdown-menu";
import { Skeleton } from "@/core/shared/ui/shadcn/skeleton";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  UserAdd01Icon,
  RefreshIcon,
  UserMultiple02Icon,
  CheckmarkBadge01Icon,
  Alert02Icon,
  RepeatIcon,
  Clock01Icon,
  SentIcon,
  SecurityIcon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { useVacancyDetailQuery } from "../hooks/useVacancyDetailQuery";
import { VacancyStatusBadge } from "./VacancyStatusBadge";
import { CandidateCard } from "./CandidateCard";
import { AddCandidateDialog } from "./AddCandidateDialog";
import { ValidateTernaDialog } from "./ValidateTernaDialog";
import { TernaHistorySheet } from "./TernaHistorySheet";
import { RequestValidationDialog } from "./RequestValidationDialog";
import { VacancyStatusTransitionDialog } from "./VacancyStatusTransitionDialog";
import { ChecklistSection } from "./ChecklistSection";
import { AttachmentsSection } from "./AttachmentsSection";
import { useVacancyAttachmentsQuery } from "../hooks/useVacancyAttachments";
import type {
  VacancyStatusHistoryDTO,
  VacancyStatusType,
} from "../types/vacancy.types";
import {
  VACANCY_STATUS_LABELS,
  VACANCY_MODALITY_LABELS,
} from "../types/vacancy.types";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { VacancySalesTypeBadge } from "./VacancyVentaTypeBadge";
import { VacancyProgressIndicator } from "./VacancyProgressIndicator";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { usePermissions } from "@/core/shared/hooks/use-permissions";
import { ApplyWarrantyDialog } from "./ApplyWarrantyDialog";
import { RecruiterAssignmentTimeline } from "./RecruiterAssignmentTimeline";

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

  const {
    isOpen: isRequestValidationOpen,
    openModal: openRequestValidation,
    closeModal: closeRequestValidation,
  } = useModalState();

  const {
    isOpen: isWarrantyOpen,
    openModal: openWarranty,
    closeModal: closeWarranty,
  } = useModalState();

  const { hasAnyPermission, isSuperAdmin } = usePermissions();

  const canAccessCandidates =
    isSuperAdmin ||
    hasAnyPermission([
      PermissionActions.candidatos.acceder,
      PermissionActions.candidatos.gestionar,
      PermissionActions.vacantes.gestionar,
    ]);

  const [transitionInitialStatus, setTransitionInitialStatus] = useState<VacancyStatusType | undefined>(undefined);
  const [transitionDialogKey, setTransitionDialogKey] = useState(0);

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
              <SheetHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-base md:text-lg font-semibold truncate">
                      {vacancy.position}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <VacancyStatusBadge status={vacancy.status} />

                      <VacancySalesTypeBadge type={vacancy.saleType} />

                      {vacancy.isWarranty && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 gap-1">
                          <HugeiconsIcon icon={SecurityIcon} size={12} />
                          Garantía
                        </Badge>
                      )}

                      {vacancy.warrantyVacancyId && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                        >
                          Garantía aplicada
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col md:flex-row gap-1 md:gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
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
                    {/* Desktop: inline action buttons */}
                    {!isMobile && (
                      <>
                        <PermissionGuard
                          permissions={[PermissionActions.vacantes.actualizarEstado, PermissionActions.vacantes.gestionar]}
                        >
                          {vacancy.status === "PRE_PLACEMENT" && (
                            <Button
                              size="sm"
                              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                setTransitionInitialStatus("PLACEMENT");
                                setTransitionDialogKey((k) => k + 1);
                                openTransition();
                              }}
                            >
                              <HugeiconsIcon
                                icon={CheckmarkBadge01Icon}
                                size={14}
                                strokeWidth={2}
                              />
                              Confirmar placement
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTransitionInitialStatus(undefined);
                              setTransitionDialogKey((k) => k + 1);
                              openTransition();
                            }}
                            className="gap-1.5"
                          >
                            <HugeiconsIcon
                              icon={RefreshIcon}
                              size={14}
                              strokeWidth={2}
                            />
                            Cambiar estado
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard
                          permissions={[PermissionActions.vacantes.editar, PermissionActions.vacantes.gestionar]}
                        >
                          {["QUICK_MEETING", "HUNTING", "FOLLOW_UP", "PRE_PLACEMENT"].includes(vacancy.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={openRequestValidation}
                              className="gap-1.5"
                            >
                              <HugeiconsIcon
                                icon={SentIcon}
                                size={14}
                                strokeWidth={2}
                              />
                              Solicitar validación
                            </Button>
                          )}
                        </PermissionGuard>
                        <PermissionGuard
                          permissions={[
                            PermissionActions.vacantes.crear,
                            PermissionActions.vacantes.gestionar,
                          ]}
                        >
                          {vacancy.status === "PLACEMENT" &&
                            !vacancy.isWarranty &&
                            !vacancy.warrantyVacancyId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={openWarranty}
                                className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950"
                              >
                                <HugeiconsIcon
                                  icon={SecurityIcon}
                                  size={14}
                                  strokeWidth={2}
                                />
                                Aplicar garantía
                              </Button>
                            )}
                        </PermissionGuard>
                      </>
                    )}

                    {/* Mobile: actions dropdown */}
                    {isMobile && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon-sm" aria-label="Acciones">
                            <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(isSuperAdmin || hasAnyPermission([PermissionActions.vacantes.actualizarEstado, PermissionActions.vacantes.gestionar])) && vacancy.status === "PRE_PLACEMENT" && (
                            <DropdownMenuItem
                              onClick={() => {
                                setTransitionInitialStatus("PLACEMENT");
                                setTransitionDialogKey((k) => k + 1);
                                openTransition();
                              }}
                            >
                              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} />
                              Confirmar placement
                            </DropdownMenuItem>
                          )}
                          {(isSuperAdmin || hasAnyPermission([PermissionActions.vacantes.actualizarEstado, PermissionActions.vacantes.gestionar])) && (
                            <DropdownMenuItem
                              onClick={() => {
                                setTransitionInitialStatus(undefined);
                                setTransitionDialogKey((k) => k + 1);
                                openTransition();
                              }}
                            >
                              <HugeiconsIcon icon={RefreshIcon} size={14} />
                              Cambiar estado
                            </DropdownMenuItem>
                          )}
                          {(isSuperAdmin || hasAnyPermission([PermissionActions.vacantes.editar, PermissionActions.vacantes.gestionar])) && ["QUICK_MEETING", "HUNTING", "FOLLOW_UP", "PRE_PLACEMENT"].includes(vacancy.status) && (
                            <DropdownMenuItem onClick={openRequestValidation}>
                              <HugeiconsIcon icon={SentIcon} size={14} />
                              Solicitar validación
                            </DropdownMenuItem>
                          )}
                          {vacancy.status === "PLACEMENT" &&
                            !vacancy.isWarranty &&
                            !vacancy.warrantyVacancyId && (
                              <DropdownMenuItem onClick={openWarranty}>
                                <HugeiconsIcon icon={SecurityIcon} size={14} />
                                Aplicar garantía
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

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
              <div className="flex-1 px-4 md:px-6 py-3 md:py-4">
                <Tabs defaultValue="info">
                  <div className="relative">
                    {/* Gradient fade hints for scroll on mobile */}
                    <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 md:hidden" />
                    <TabsList className="w-full overflow-x-auto md:overflow-x-visible scrollbar-hide justify-start md:justify-center">
                      <TabsTrigger value="info" className="shrink-0 md:flex-1">
                        Información
                      </TabsTrigger>
                      <TabsTrigger value="files" className="shrink-0 md:flex-1">
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
                      {canAccessCandidates && (
                        <TabsTrigger value="candidates" className="shrink-0 md:flex-1">
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
                      )}
                      <TabsTrigger value="checklist" className="shrink-0 md:flex-1">
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
                      <TabsTrigger value="history" className="shrink-0 md:flex-1">
                        Historial
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* ---- Tab: Información ---- */}
                  <TabsContent value="info" className="mt-3 md:mt-4 space-y-4 md:space-y-5">
                    {/* Fechas */}
                    <div>
                      <VacancyProgressIndicator
                        currentCycleStartedAt={vacancy.currentCycleStartedAt}
                        targetDeliveryDate={vacancy.targetDeliveryDate}
                        actualDeliveryDate={vacancy.actualDeliveryDate}
                        status={vacancy.status}
                        variant="expanded"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <InfoRow
                          label="Fecha de asignación"
                          value={formatDateSafe(vacancy.assignedAt)}
                        />
                        <InfoRow
                          label="Fecha máxima de entrega"
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <InfoRow
                          label="Modalidad"
                          value={
                            vacancy.modality
                              ? VACANCY_MODALITY_LABELS[vacancy.modality]
                              : null
                          }
                        />
                        <InfoRow label="Horario" value={vacancy.schedule?.replace(/^custom:/, "")} />
                        <InfoRow label="País" value={resolveCountryName(vacancy.countryCode)} />
                        <InfoRow label="Región" value={resolveRegionName(vacancy.countryCode, vacancy.regionCode)} />
                      </div>
                    </div>

                    <Separator />

                    {/* Salario */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Compensación
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
                  <TabsContent value="files" className="mt-3 md:mt-4">
                    <AttachmentsSection
                      vacancy={vacancy}
                      attachments={attachments}
                      isLoadingAttachments={isLoadingAttachments}
                    />
                  </TabsContent>

                  {/* ---- Tab: Candidatos ---- */}
                  {canAccessCandidates && (
                    <TabsContent value="candidates" className="mt-3 md:mt-4 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 flex-wrap">
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
                          <PermissionGuard
                            permissions={[
                              PermissionActions.vacantes.validarTerna,
                              PermissionActions.vacantes.gestionar,
                            ]}
                          >
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
                          </PermissionGuard>
                          <PermissionGuard
                            permissions={[
                              PermissionActions.candidatos.crear,
                              PermissionActions.candidatos.gestionar,
                              PermissionActions.vacantes.gestionar,
                            ]}
                          >
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
                          </PermissionGuard>
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
                  )}

                  {/* ---- Tab: Checklist ---- */}
                  <TabsContent value="checklist" className="mt-3 md:mt-4">
                    <ChecklistSection vacancy={vacancy} />
                  </TabsContent>

                  {/* ---- Tab: Historial ---- */}
                  <TabsContent value="history" className="mt-3 md:mt-4 space-y-4 md:space-y-6">
                    {/* Status history */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Historial de estados
                      </h4>
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
                    </div>

                    <Separator />

                    {/* Recruiter assignment history */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Asignaciones de reclutador
                      </h4>
                      <RecruiterAssignmentTimeline vacancyId={vacancy.id} />
                    </div>
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
                key={transitionDialogKey}
                open={isTransitionOpen}
                onClose={() => {
                  closeTransition();
                  setTransitionInitialStatus(undefined);
                }}
                vacancyId={vacancyId}
                currentStatus={vacancy.status}
                candidates={vacancy.candidates ?? []}
                vacancySalaryType={vacancy.salaryType}
                vacancySalaryFixed={vacancy.salaryFixed}
                vacancyEntryDate={vacancy.entryDate}
                initialStatus={transitionInitialStatus}
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
                vacancyAssignedAt={vacancy.assignedAt}
              />
              <RequestValidationDialog
                open={isRequestValidationOpen}
                onClose={closeRequestValidation}
                vacancy={vacancy}
                attachments={attachments}
              />
              <ApplyWarrantyDialog
                vacancyId={vacancyId}
                open={isWarrantyOpen}
                onOpenChange={(o) => !o && closeWarranty()}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
