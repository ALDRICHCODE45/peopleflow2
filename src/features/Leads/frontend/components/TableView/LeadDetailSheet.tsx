"use client";

import { useState } from "react";
import type { Lead } from "../../types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcn/sheet";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { useLeadById } from "../../hooks/useLeadById";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/core/shared/ui/shadcn/tabs";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { ContactsSection } from "./ContactsSection";
import { LeadStatusHistoryTimeline } from "./LeadStatusHistoryTimeline";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import Link from "next/link";
import { Button } from "@/core/shared/ui/shadcn/button";
import { NotesDialog } from "./NotesDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/shared/ui/shadcn/tooltip";

interface LeadDetailSheetProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
}: LeadDetailSheetProps) {
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";
  const [activeTab, setActiveTab] = useState("contacts");

  // Fetch complete lead data (handles Kanban's minimal query case)
  const { data: fullLead } = useLeadById(open ? lead.id : null);

  // Use fetched data if available, otherwise fall back to prop data
  const displayLead = fullLead ?? lead;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="2xl"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-0"
        side={sheetSide}
      >
        {/* Header */}
        <SheetHeader className="p-4 pb-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <SheetTitle className="text-xl font-semibold truncate">
                    {displayLead.companyName}
                  </SheetTitle>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                  {displayLead.companyName}
                </TooltipContent>
              </Tooltip>
              {displayLead.rfc && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  RFC: {displayLead.rfc}
                </p>
              )}
            </div>
            <div className="md:mr-4">
              <LeadStatusBadge status={displayLead.status} />
            </div>
          </div>

          {/* Secondary row: links + notes */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {displayLead.website && (
              <Link
                href={displayLead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {(() => {
                  try {
                    return new URL(displayLead.website).hostname;
                  } catch {
                    return displayLead.website;
                  }
                })()}
              </Link>
            )}
            {displayLead.linkedInUrl && (
              <Link
                href={displayLead.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                LinkedIn
              </Link>
            )}
            <div className="flex-1" />
            <NotesDialog
              trigger={
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  Notas
                </Button>
              }
              notes={displayLead.notes ?? "No hay notas disponibles"}
            />
          </div>
        </SheetHeader>

        <Separator />

        {/* Info Section */}
        <section className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem label="Sector" value={displayLead.sectorName} />
            <InfoItem label="Subsector" value={displayLead.subsectorName} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem label="Origen" value={displayLead.originName} />
            <InfoItem label="Asignado a" value={displayLead.assignedToName} />
          </div>

          <InfoItem label="Dirección" value={displayLead.address} />

          {/* Dates */}
          <div className="pt-3 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Creado
                </p>
                <p className="text-sm mt-0.5">
                  {format(new Date(displayLead.createdAt), "d MMM yyyy", {
                    locale: es,
                  })}
                </p>
                {displayLead.createdByName && (
                  <p className="text-xs text-muted-foreground">
                    por {displayLead.createdByName}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actualizado
                </p>
                <p className="text-sm mt-0.5">
                  {format(new Date(displayLead.updatedAt), "d MMM yyyy", {
                    locale: es,
                  })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="px-4 pb-4"
          defaultValue="contacts"
        >
          <TabsList variant="line">
            <TabsTrigger value="contacts">
              Contactos
              {displayLead.contactsCount !== undefined && displayLead.contactsCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-5 min-w-5 px-1.5 text-xs"
                >
                  {displayLead.contactsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="mt-4">
            <ContactsSection leadId={displayLead.id} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <LeadStatusHistoryTimeline leadId={displayLead.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}
