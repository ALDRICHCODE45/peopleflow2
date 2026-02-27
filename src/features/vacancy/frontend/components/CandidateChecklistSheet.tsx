"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcn/sheet";
import { Textarea } from "@/core/shared/ui/shadcn/textarea";
import { Badge } from "@shadcn/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/core/lib/utils";
import { useSaveCandidateMatch } from "../hooks/useVacancyDetailMutations";
import type {
  VacancyCandidateDTO,
  VacancyChecklistItemDTO,
  CandidateMatchRating,
} from "../types/vacancy.types";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";

interface CandidateChecklistSheetProps {
  open: boolean;
  onClose: () => void;
  candidate: VacancyCandidateDTO;
  checklistItems: VacancyChecklistItemDTO[];
  vacancyId: string;
}

type ItemState = {
  rating: CandidateMatchRating | null;
  feedback: string;
  noteOpen: boolean;
};

const RATING_OPTIONS: {
  value: CandidateMatchRating;
  label: string;
  icon: typeof CheckmarkCircle02Icon;
  className: string;
}[] = [
    {
      value: "CUMPLE",
      label: "Cumple",
      icon: CheckmarkCircle02Icon,
      className: "border-green-300 bg-green-50 text-green-700 hover:bg-green-100",
    },
    {
      value: "PARCIAL",
      label: "Parcial",
      icon: Alert02Icon,
      className: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
    },
    {
      value: "NO_CUMPLE",
      label: "No cumple",
      icon: Cancel01Icon,
      className: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
    },
  ];

export function CandidateChecklistSheet({
  open,
  onClose,
  candidate,
  checklistItems,
  vacancyId,
}: CandidateChecklistSheetProps) {
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  const saveMutation = useSaveCandidateMatch(vacancyId);

  const isMobile = useIsMobile();

  const sheetSide = isMobile ? "bottom" : "right";

  // Initialize state from existing matches
  const buildInitialState = (): Record<string, ItemState> => {
    const initial: Record<string, ItemState> = {};
    for (const item of checklistItems) {
      const existing = candidate.checklistMatches?.find(
        (m) => m.checklistItemId === item.id,
      );
      initial[item.id] = {
        rating: (existing?.rating as CandidateMatchRating | null) ?? null,
        feedback: existing?.feedback ?? "",
        noteOpen: !!existing?.feedback,
      };
    }
    return initial;
  };

  const [itemStates, setItemStates] =
    useState<Record<string, ItemState>>(buildInitialState);

  // Re-initialize when candidate changes
  useEffect(() => {
    setItemStates(buildInitialState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate.id, checklistItems]);

  function handleRatingChange(itemId: string, rating: CandidateMatchRating) {
    const current = itemStates[itemId];
    // Toggle off if same rating clicked
    const newRating = current?.rating === rating ? null : rating;
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], rating: newRating },
    }));
    // Auto-save
    saveMutation.mutate({
      candidateId: candidate.id,
      checklistItemId: itemId,
      rating: newRating,
      feedback: current?.feedback ?? null,
    });
  }

  function handleFeedbackBlur(itemId: string) {
    const state = itemStates[itemId];
    if (!state) return;
    saveMutation.mutate({
      candidateId: candidate.id,
      checklistItemId: itemId,
      rating: state.rating,
      feedback: state.feedback.trim() || null,
    });
  }

  const ratedCount = checklistItems.filter(
    (item) => itemStates[item.id]?.rating !== null,
  ).length;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side={sheetSide}
        width="lg"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-0"

      //side="right" width="lg" className="overflow-y-auto p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-base">Checklist — {fullName}</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Evaluá cada requisito de la vacante para este candidato.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                ratedCount === checklistItems.length &&
                  checklistItems.length > 0
                  ? "bg-green-50 text-green-700 border-green-300"
                  : "text-muted-foreground",
              )}
            >
              {ratedCount}/{checklistItems.length} evaluados
            </Badge>
          </div>
        </SheetHeader>

        <div className="px-6 py-4 space-y-4">
          {checklistItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <p className="text-sm">
                Esta vacante no tiene checklist definido.
              </p>
            </div>
          ) : (
            checklistItems
              .sort((a, b) => a.order - b.order)
              .map((item, index) => {
                const state = itemStates[item.id] ?? {
                  rating: null,
                  feedback: "",
                  noteOpen: false,
                };
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    {/* Requirement */}
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground font-mono w-5 shrink-0 mt-0.5">
                        {index + 1}.
                      </span>
                      <p className="text-sm font-medium flex-1">
                        {item.requirement}
                      </p>
                    </div>

                    {/* Rating toggles */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {RATING_OPTIONS.map((option) => {
                        const isSelected = state.rating === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              handleRatingChange(item.id, option.value)
                            }
                            disabled={saveMutation.isPending}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all",
                              isSelected
                                ? option.className
                                : "border-border bg-background text-muted-foreground hover:bg-muted",
                            )}
                          >
                            <HugeiconsIcon
                              icon={option.icon}
                              size={13}
                              strokeWidth={isSelected ? 2.5 : 1.5}
                            />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Note toggle */}
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                      onClick={() =>
                        setItemStates((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            noteOpen: !prev[item.id].noteOpen,
                          },
                        }))
                      }
                    >
                      {state.noteOpen ? "Ocultar nota" : "Agregar nota"}
                    </button>

                    {state.noteOpen && (
                      <Textarea
                        placeholder="Observaciones sobre este requisito..."
                        value={state.feedback}
                        onChange={(e) =>
                          setItemStates((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              feedback: e.target.value,
                            },
                          }))
                        }
                        onBlur={() => handleFeedbackBlur(item.id)}
                        rows={2}
                        className="text-xs resize-none"
                      />
                    )}
                  </div>
                );
              })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
