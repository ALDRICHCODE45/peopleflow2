"use client";

import { useState } from "react";
import { Input } from "@shadcn/input";
import { Button } from "@shadcn/button";
import { Badge } from "@shadcn/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

interface VacancyCountdownConfigProps {
  daysBefore: number[];
  onDaysChange: (days: number[]) => void;
}

export function VacancyCountdownConfig({
  daysBefore,
  onDaysChange,
}: VacancyCountdownConfigProps) {
  const [inputValue, setInputValue] = useState("");

  const sortedDays = [...daysBefore].sort((a, b) => b - a);

  const handleAdd = () => {
    const val = Number.parseInt(inputValue, 10);
    if (!Number.isNaN(val) && val > 0 && !daysBefore.includes(val)) {
      onDaysChange([...daysBefore, val]);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (day: number) => {
    onDaysChange(daysBefore.filter((d) => d !== day));
  };

  return (
    <div className="mt-3 rounded-md border bg-muted/30 p-3 space-y-4">
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-medium">
          Días antes de la fecha tentativa de entrega
        </p>

        <div className="flex flex-wrap gap-2">
          {sortedDays.map((day) => (
            <Badge
              key={day}
              variant="secondary"
              className="gap-1 pl-2.5 pr-1.5 py-1"
            >
              {day} {day === 1 ? "día" : "días"}
              <button
                type="button"
                onClick={() => handleRemove(day)}
                className="ml-0.5 rounded-full hover:bg-muted/80 p-0.5 transition-colors"
                aria-label={`Quitar ${day} días`}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  className="size-3"
                  strokeWidth={2}
                />
              </button>
            </Badge>
          ))}
          {sortedDays.length === 0 && (
            <p className="text-muted-foreground text-xs italic">
              No hay días configurados
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            placeholder="Ej: 7"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-24"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={
              !inputValue ||
              Number.isNaN(Number.parseInt(inputValue, 10)) ||
              Number.parseInt(inputValue, 10) <= 0 ||
              daysBefore.includes(Number.parseInt(inputValue, 10))
            }
          >
            Agregar
          </Button>
        </div>

        {sortedDays.length > 0 && (
          <p className="text-muted-foreground text-xs">
            Se enviará un recordatorio{" "}
            {sortedDays.map((d, i) => (
              <span key={d}>
                {i > 0 && i < sortedDays.length - 1 && ", "}
                {i > 0 && i === sortedDays.length - 1 && " y "}
                <strong>{d}</strong>
              </span>
            ))}{" "}
            día(s) antes de la fecha tentativa de entrega
          </p>
        )}
      </div>
    </div>
  );
}
