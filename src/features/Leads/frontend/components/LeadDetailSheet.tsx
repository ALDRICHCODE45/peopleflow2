"use client";

import { useState } from "react";
import type { Lead } from "../types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcn/sheet";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { HugeiconsIcon } from "@hugeicons/react";
import { Comment01Icon, ExternalLink } from "@hugeicons/core-free-icons";
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
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B] overflow-y-auto p-5"
        side={sheetSide}
      >
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex w-full justify-envently gap-5 items-center">
              <div className="flex flex-col ">
                <SheetTitle className="text-xl">{lead.companyName}</SheetTitle>
                {lead.rfc && (
                  <p className="text-sm text-muted-foreground mt-1">
                    RFC: {lead.rfc}
                  </p>
                )}
              </div>

              <NotesDialog
                trigger={
                  <Button
                    buttonTooltip
                    buttonTooltipText="Notas"
                    variant="outline"
                    size="icon"
                  >
                    <HugeiconsIcon icon={Comment01Icon} />
                  </Button>
                }
                notes={lead.notes ?? "No hay notas disponibles por el momento"}
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              <LeadStatusBadge status={lead.status} />

              {lead.website && (
                <Link
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm flex text-primary hover:underline mr-12 "
                >
                  <span className="truncate">{lead.website}</span>
                  <HugeiconsIcon icon={ExternalLink} size={17} />
                </Link>
              )}
            </div>
          </div>
        </SheetHeader>
        <Separator />

        <section className="">
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
        </section>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-6  w0-full max-w-full"
          defaultValue="contacts"
        >
          <TabsList className="rounded-none border-b p-0 bg-transparent">
            <TabsTrigger
              value="contacts"
              className="bg-transparent dark:bg-transparent data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-active:bg-transparent dark:data-active:bg-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary h-full rounded-none border-0 border-t-0 border-l-0 border-r-0 border-b-2 border-transparent data-[state=active]:border-b-2 shadow-none"
            >
              Contactos
              {lead.contactsCount !== undefined && (
                <Badge variant="secondary" className="ml-2">
                  {lead.contactsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              className="bg-transparent dark:bg-transparent data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-active:bg-transparent dark:data-active:bg-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary h-full rounded-none border-0 border-t-0 border-l-0 border-r-0 border-b-2 border-transparent data-[state=active]:border-b-2 shadow-none"
              value="interactions"
            >
              Interacciones
            </TabsTrigger>
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
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "-"}</p>
    </div>
  );
}
