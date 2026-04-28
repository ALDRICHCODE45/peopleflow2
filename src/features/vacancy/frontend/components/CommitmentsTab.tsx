"use client";

import { useState } from "react";
import { format, startOfDay, isBefore, parse, isValid } from "date-fns";
import { Button } from "@shadcn/button";
import { Textarea } from "@shadcn/textarea";
import { Label } from "@shadcn/label";
import { Card, CardContent, CardHeader } from "@shadcn/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { PermissionGuard } from "@/core/shared/components/PermissionGuard";
import { PermissionActions } from "@/core/shared/constants/permissions";
import { useCommitmentsQuery } from "../hooks/useCommitmentsQuery";
import { useCreateCommitment } from "../hooks/useCreateCommitment";
import { CommitmentItem } from "./CommitmentItem";
import { Skeleton } from "@shadcn/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shadcn/collapsible";
import { DatePicker } from "@/core/shared/ui/shadcn/date-picker";

interface CommitmentsTabProps {
  vacancyId: string;
}

export function CommitmentsTab({ vacancyId }: CommitmentsTabProps) {
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showClosedCommitments, setShowClosedCommitments] = useState(false);

  const { data: commitments, isLoading } = useCommitmentsQuery(vacancyId);
  const createCommitment = useCreateCommitment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !dueDate) return;

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
        },
      }
    );
  };

  const activeCommitments =
    commitments?.filter((c) => c.status === "PENDING") ?? [];
  const closedCommitments =
    commitments?.filter((c) => c.status !== "PENDING") ?? [];

  // Calculate overdue count for active commitments
  const today = startOfDay(new Date());
  const overdueCount = activeCommitments.filter((c) => {
    const dueDate = parse(c.dueDate, "yyyy-MM-dd", new Date());
    if (!isValid(dueDate)) return false;
    return isBefore(dueDate, today);
  }).length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-500/25 dark:bg-amber-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={18}
                className="text-amber-700 dark:text-amber-300"
              />
            </div>
            <div>
              <p className="text-2xl font-semibold text-amber-900 dark:text-amber-200">
                {activeCommitments.length}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">Activos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/30 dark:border-red-500/25 dark:bg-red-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={18}
                className="text-red-700 dark:text-red-300"
              />
            </div>
            <div>
              <p className="text-2xl font-semibold text-red-900 dark:text-red-200">
                {overdueCount}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">Vencidos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50/30 dark:border-gray-500/25 dark:bg-gray-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-500/15">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={18}
                className="text-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-200">
                {closedCommitments.length}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300">Cerrados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form - Compact Composer */}
      <PermissionGuard
        permissions={[
          PermissionActions.vacantesCompromisos.crear,
          PermissionActions.vacantesCompromisos.gestionar,
        ]}
      >
        <Card className="dark:border-border/70 dark:bg-card/60">
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">Crear compromiso</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 grid-cols-1 md:grid-cols-[1fr_280px]">
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Descripción <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="¿Qué compromiso se debe cumplir?"
                    rows={2}
                    maxLength={500}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length}/500 caracteres
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">
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
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    !description.trim() ||
                    !dueDate ||
                    description.length < 2 ||
                    createCommitment.isPending
                  }
                  className="gap-1.5"
                >
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    size={14}
                    strokeWidth={2}
                  />
                  {createCommitment.isPending
                    ? "Creando..."
                    : "Crear compromiso"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </PermissionGuard>

      {/* Active Commitments */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Compromisos activos
        </h3>
        {activeCommitments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={32}
                strokeWidth={1.5}
              />
              <p className="text-sm font-medium">No hay compromisos activos</p>
              <p className="text-xs">
                Los compromisos te ayudan a dar seguimiento a tareas importantes
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeCommitments.map((commitment) => (
              <CommitmentItem
                key={commitment.id}
                commitment={commitment}
                vacancyId={vacancyId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Closed Commitments (Collapsible) */}
      {closedCommitments.length > 0 && (
        <Collapsible
          open={showClosedCommitments}
          onOpenChange={setShowClosedCommitments}
        >
          <div className="space-y-3">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                {showClosedCommitments ? "Ocultar" : "Mostrar"} compromisos
                cerrados ({closedCommitments.length})
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              {closedCommitments.map((commitment) => (
                <CommitmentItem
                  key={commitment.id}
                  commitment={commitment}
                  vacancyId={vacancyId}
                />
              ))}
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );
}
