"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Mail01Icon,
  Call02Icon,
  FileAttachmentIcon,
  Building04Icon,
  MoneyBag01Icon,
  Location01Icon,
  Briefcase01Icon,
  StarIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@shadcn/badge";
import { Separator } from "@shadcn/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcn/sheet";
import { cn } from "@/core/lib/utils";
import { resolveCountryName, resolveRegionName } from "@lib/resolve-location";
import {
  CANDIDATE_STATUS_LABELS,
  VACANCY_MODALITY_LABELS,
  type VacancyCandidateDTO,
  type CandidateStatus,
} from "../types/vacancy.types";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";

interface CandidateDetailSheetProps {
  candidate: VacancyCandidateDTO;
  open: boolean;
  onClose: () => void;
}

const candidateStatusColorMap: Record<CandidateStatus, string> = {
  EN_PROCESO: "bg-blue-100 text-blue-700 border-blue-200",
  EN_TERNA: "bg-violet-100 text-violet-700 border-violet-200",
  CONTRATADO: "bg-green-100 text-green-700 border-green-200",
  DESCARTADO: "bg-slate-100 text-slate-600 border-slate-200",
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: IconSvgElement;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 size-7 rounded-md bg-muted/60 flex items-center justify-center">
        <HugeiconsIcon icon={icon} className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </span>
        <span className="text-sm text-foreground">{value}</span>
      </div>
    </div>
  );
}

function SalaryBlock({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  if (value == null) return null;
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-muted/50 border border-border/40">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
      <span className="text-base font-semibold text-foreground tabular-nums">
        ${value.toLocaleString("es-MX")}
      </span>
    </div>
  );
}

export function CandidateDetailSheet({
  candidate,
  open,
  onClose,
}: CandidateDetailSheetProps) {
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  const initials =
    `${candidate.firstName.charAt(0)}${candidate.lastName.charAt(0)}`.toUpperCase();

  const cvAttachment = candidate.attachments?.find((a) => a.subType === "CV");

  const hasSalaryInfo =
    candidate.currentSalary != null ||
    candidate.salaryExpectation != null ||
    candidate.finalSalary != null;

  const hasLocationInfo = !!(candidate.countryCode || candidate.regionCode);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={sheetSide}
        width="lg"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-0"
        showCloseButton={false}

      //className="w-full sm:max-w-md overflow-y-auto"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{fullName}</SheetTitle>
        </SheetHeader>

        {/* ── Hero: avatar + nombre + estado ── */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-5">
          <div
            className={cn(
              "size-14 rounded-full shrink-0",
              "flex items-center justify-center",
              "text-base font-bold tracking-wide",
              candidate.isInTerna
                ? "bg-violet-100 text-violet-700 ring-2 ring-violet-300"
                : "bg-muted text-muted-foreground",
            )}
          >
            {initials}
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <h2 className="text-lg font-semibold leading-tight truncate">
              {fullName}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  candidateStatusColorMap[candidate.status],
                  "text-xs font-medium",
                )}
              >
                {CANDIDATE_STATUS_LABELS[candidate.status]}
              </Badge>
              {candidate.isInTerna && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600">
                  <HugeiconsIcon icon={StarIcon} className="size-3" />
                  En terna
                </span>
              )}
              {candidate.isFinalist && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-green-600">
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    className="size-3"
                  />
                  Finalista
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Sección: Contacto ── */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Contacto
          </p>
          <div className="space-y-3">
            {candidate.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="flex items-center gap-3 group/link"
              >
                <div className="shrink-0 size-7 rounded-md bg-muted/60 flex items-center justify-center">
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    className="size-3.5 text-muted-foreground"
                  />
                </div>
                <span className="text-sm text-foreground group-hover/link:text-primary transition-colors truncate">
                  {candidate.email}
                </span>
              </a>
            )}
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone}`}
                className="flex items-center gap-3 group/link"
              >
                <div className="shrink-0 size-7 rounded-md bg-muted/60 flex items-center justify-center">
                  <HugeiconsIcon
                    icon={Call02Icon}
                    className="size-3.5 text-muted-foreground"
                  />
                </div>
                <span className="text-sm text-foreground group-hover/link:text-primary transition-colors">
                  {candidate.phone}
                </span>
              </a>
            )}
            {cvAttachment && (
              <a
                href={cvAttachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group/link"
              >
                <div className="shrink-0 size-7 rounded-md bg-muted/60 flex items-center justify-center">
                  <HugeiconsIcon
                    icon={FileAttachmentIcon}
                    className="size-3.5 text-muted-foreground group-hover/link:text-primary transition-colors"
                  />
                </div>
                <span className="text-sm text-foreground group-hover/link:text-primary transition-colors truncate">
                  {cvAttachment.fileName}
                </span>
              </a>
            )}
          </div>
        </div>

        <Separator />

        {/* ── Sección: Situación actual ── */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Situación actual
          </p>
          <div className="space-y-3">
            <InfoRow
              icon={Building04Icon}
              label="Empresa"
              value={candidate.currentCompany}
            />
            <InfoRow
              icon={Briefcase01Icon}
              label="Modalidad"
              value={
                candidate.currentModality
                  ? (VACANCY_MODALITY_LABELS[candidate.currentModality] ??
                    candidate.currentModality)
                  : null
              }
            />
            {hasLocationInfo && (
              <InfoRow
                icon={Location01Icon}
                label="Ubicación"
                value={
                  [
                    resolveRegionName(candidate.countryCode, candidate.regionCode),
                    resolveCountryName(candidate.countryCode),
                  ]
                    .filter(Boolean)
                    .join(", ") || null
                }
              />
            )}
            {candidate.isCurrentlyEmployed != null && (
              <div className="flex items-center gap-3">
                <div className="shrink-0 size-7 rounded-md bg-muted/60 flex items-center justify-center">
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    className="size-3.5 text-muted-foreground"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                    Actualmente empleado
                  </span>
                  <span className="text-sm text-foreground">
                    {candidate.isCurrentlyEmployed ? "Sí" : "No"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sección: Compensación ── */}
        {hasSalaryInfo && (
          <>
            <Separator />
            <div className="px-6 py-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Compensación
              </p>
              <div className="grid grid-cols-2 gap-2">
                <SalaryBlock
                  label="Salario actual"
                  value={candidate.currentSalary}
                />
                <SalaryBlock
                  label="Expectativa"
                  value={candidate.salaryExpectation}
                />
                {candidate.finalSalary != null && (
                  <div className="col-span-2">
                    <SalaryBlock
                      label="Salario final pactado"
                      value={candidate.finalSalary}
                    />
                  </div>
                )}
              </div>
              {candidate.currentCommissions && (
                <InfoRow
                  icon={MoneyBag01Icon}
                  label="Comisiones actuales"
                  value={candidate.currentCommissions}
                />
              )}
              {candidate.currentBenefits && (
                <InfoRow
                  icon={MoneyBag01Icon}
                  label="Beneficios actuales"
                  value={candidate.currentBenefits}
                />
              )}
              {candidate.otherBenefits && (
                <InfoRow
                  icon={MoneyBag01Icon}
                  label="Otros beneficios"
                  value={candidate.otherBenefits}
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
