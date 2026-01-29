"use client";

import { useState } from "react";
import type { Lead } from "../../types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcn/sheet";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/core/shared/ui/shadcn/tabs";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { ContactsSection } from "./ContactsSection";
import { InteractionsTimeline } from "./InteractionsTimeline";
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
                    {lead.companyName}
                  </SheetTitle>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                  {lead.companyName}
                </TooltipContent>
              </Tooltip>
              {lead.rfc && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  RFC: {lead.rfc}
                </p>
              )}
            </div>
            <div className="md:mr-4">
              <LeadStatusBadge status={lead.status} />
            </div>
          </div>

          {/* Secondary row: links + notes */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {lead.website && (
              <Link
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {(() => {
                  try {
                    return new URL(lead.website).hostname;
                  } catch {
                    return lead.website;
                  }
                })()}
              </Link>
            )}
            {lead.linkedInUrl && (
              <Link
                href={lead.linkedInUrl}
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
              notes={lead.notes ?? "No hay notas disponibles"}
            />
          </div>
        </SheetHeader>

        <Separator />

        {/* Info Section */}
        <section className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem label="Sector" value={lead.sectorName} />
            <InfoItem label="Subsector" value={lead.subsectorName} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem label="Origen" value={lead.originName} />
            <InfoItem label="Asignado a" value={lead.assignedToName} />
          </div>

          <InfoItem label="Dirección" value={lead.address} />

          {/* Dates */}
          <div className="pt-3 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Creado
                </p>
                <p className="text-sm mt-0.5">
                  {format(new Date(lead.createdAt), "d MMM yyyy", {
                    locale: es,
                  })}
                </p>
                {lead.createdByName && (
                  <p className="text-xs text-muted-foreground">
                    por {lead.createdByName}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actualizado
                </p>
                <p className="text-sm mt-0.5">
                  {format(new Date(lead.updatedAt), "d MMM yyyy", {
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
              {lead.contactsCount !== undefined && lead.contactsCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-5 min-w-5 px-1.5 text-xs"
                >
                  {lead.contactsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="interactions">Interacciones</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="mt-4">
            <ContactsSection leadId={lead.id} />
          </TabsContent>

          <TabsContent value="interactions" className="mt-4">
            <InteractionsTimeline leadId={lead.id} />
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
