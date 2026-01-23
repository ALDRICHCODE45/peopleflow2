"use client";

import { useState } from "react";
import type { Lead } from "../types";
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
  const [activeTab, setActiveTab] = useState("info");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="2xl"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto"
        side={sheetSide}
      >
        <SheetHeader className="space-y-4 bg-primary-foreground">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{lead.companyName}</SheetTitle>
              {lead.rfc && (
                <p className="text-sm text-muted-foreground mt-1">
                  RFC: {lead.rfc}
                </p>
              )}
            </div>
            <div className="mr-6">
              <LeadStatusBadge status={lead.status} />
            </div>
          </div>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-6 p-5"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="contacts">
              Contactos
              {lead.contactsCount !== undefined && (
                <Badge variant="secondary" className="ml-2">
                  {lead.contactsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="interactions">Interacciones</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-4">
            {/* Información general */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Sector" value={lead.sectorName} />
                <InfoItem label="Subsector" value={lead.subsectorName} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Origen" value={lead.originName} />
                <InfoItem label="Asignado a" value={lead.assignedToName} />
              </div>

              <InfoItem label="Dirección" value={lead.address} />

              {lead.website && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sitio web
                  </p>
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {lead.website}
                  </a>
                </div>
              )}

              {lead.linkedInUrl && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    LinkedIn
                  </p>
                  <a
                    href={lead.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {lead.linkedInUrl}
                  </a>
                </div>
              )}

              {lead.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Notas
                  </p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {lead.notes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Creado
                  </p>
                  <p className="text-sm">
                    {format(new Date(lead.createdAt), "PPP", { locale: es })}
                  </p>
                  {lead.createdByName && (
                    <p className="text-xs text-muted-foreground">
                      por {lead.createdByName}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Actualizado
                  </p>
                  <p className="text-sm">
                    {format(new Date(lead.updatedAt), "PPP", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

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
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "-"}</p>
    </div>
  );
}
