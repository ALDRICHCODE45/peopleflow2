"use client";

import { useState, type ReactNode } from "react";
import Folder from "@/core/shared/ui/Folder/Folder";
import { Badge } from "@shadcn/badge";
import { cn } from "@lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FolderSectionProps {
  /** Section title displayed next to the folder */
  title: string;
  /** Folder color theme */
  color?: string;
  /** Number of files in this section */
  fileCount: number;
  /** Content shown inside the folder items (max 3 ReactNode) */
  folderItems?: ReactNode[];
  /** Content rendered when the section is expanded */
  children: ReactNode;
  /** Whether the section starts expanded */
  defaultOpen?: boolean;
  /** Optional action element rendered at the right end of the header (e.g. upload button) */
  headerAction?: ReactNode;
  /** Additional className for the root container */
  className?: string;
}

// ─── File count label ─────────────────────────────────────────────────────────

function fileCountLabel(count: number): string {
  if (count === 0) return "Sin archivos";
  if (count === 1) return "1 archivo";
  return `${count} archivos`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FolderSection({
  title,
  color = "#5227FF",
  fileCount,
  folderItems = [],
  children,
  defaultOpen = false,
  headerAction,
  className,
}: FolderSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("rounded-lg", className)}>
      {/* ── Clickable header row ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
          "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {/* Folder icon — controlled mode */}
        <div className="flex-shrink-0">
          <Folder
            color={color}
            size={0.5}
            items={folderItems}
            open={isOpen}
            onToggle={() => setIsOpen((prev) => !prev)}
          />
        </div>

        {/* Title + badge */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className="text-sm font-semibold truncate">{title}</span>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs shrink-0",
              fileCount === 0 && "text-muted-foreground",
            )}
          >
            {fileCountLabel(fileCount)}
          </Badge>
        </div>

        {/* Chevron indicator */}
        <svg
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* ── Header action (rendered outside the button to avoid nested interactives) ── */}
      {headerAction && isOpen && (
        <div className="flex justify-end px-3 pt-1">{headerAction}</div>
      )}

      {/* ── Collapsible content area (CSS grid-rows animation) ── */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
