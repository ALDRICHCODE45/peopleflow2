"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/shared/ui/shadcn/dialog";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { useInteractionsByContact } from "../../hooks/useInteractions";
import type { Interaction, InteractionType, Contact } from "../../types";
import { INTERACTION_TYPE_LABELS } from "../../types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Call02Icon,
  Mail01Icon,
  Calendar03Icon,
  Note03Icon,
  Linkedin01Icon,
  WhatsappIcon,
  TimeQuarterPassIcon,
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/core/lib/utils";

const INTERACTION_ICONS: Record<InteractionType, typeof Call02Icon> = {
  CALL: Call02Icon,
  EMAIL: Mail01Icon,
  MEETING: Calendar03Icon,
  NOTE: Note03Icon,
  LINKEDIN: Linkedin01Icon,
  WHATSAPP: WhatsappIcon,
};

interface ContactInteractionsDialogProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactInteractionsDialog({
  contact,
  open,
  onOpenChange,
}: ContactInteractionsDialogProps) {
  // Only fetch when dialog is open (lazy loading)
  const { data: interactions = [], isLoading } = useInteractionsByContact(
    open ? contact.id : null
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Interacciones</span>
            <span className="text-muted-foreground font-normal">-</span>
            <span className="font-normal text-muted-foreground">
              {contact.firstName} {contact.lastName}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Cargando interacciones...</p>
            </div>
          ) : interactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HugeiconsIcon
                icon={TimeQuarterPassIcon}
                className="h-12 w-12 mx-auto mb-2 opacity-50"
              />
              <p>No hay interacciones registradas</p>
              <p className="text-sm">
                Las interacciones con este contacto aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {interactions.map((interaction) => (
                <InteractionItem
                  key={interaction.id}
                  interaction={interaction}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InteractionItem({ interaction }: { interaction: Interaction }) {
  const IconComponent = INTERACTION_ICONS[interaction.type] || Note03Icon;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 p-3",
        "bg-gradient-to-b from-background to-muted/20"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
          <HugeiconsIcon icon={IconComponent} className="size-4 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {INTERACTION_TYPE_LABELS[interaction.type]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(interaction.date), "d MMM yyyy, HH:mm", {
                locale: es,
              })}
            </span>
          </div>

          <h4 className="font-medium text-sm">{interaction.subject}</h4>

          {interaction.content && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {interaction.content}
            </p>
          )}

          {interaction.createdByName && (
            <p className="text-xs text-muted-foreground/80 pt-1">
              Por {interaction.createdByName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
