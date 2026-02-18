"use client";

import { useState } from "react";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { useInteractionsByLead } from "../../hooks/useInteractions";
import { useContactsByLead } from "../../hooks/useContacts";
import type { Interaction, InteractionType } from "../../types";
import { INTERACTION_TYPE_LABELS } from "../../types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Call02Icon,
  Mail01Icon,
  Calendar03Icon,
  Note03Icon,
  Linkedin01Icon,
  WhatsappIcon,
  TimeQuarterPassIcon,
} from "@hugeicons/core-free-icons";
import { CreateInteractionForm } from "./CreateInteractionForm";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const INTERACTION_ICONS: Record<InteractionType, typeof Call02Icon> = {
  CALL: Call02Icon,
  EMAIL: Mail01Icon,
  MEETING: Calendar03Icon,
  NOTE: Note03Icon,
  LINKEDIN: Linkedin01Icon,
  WHATSAPP: WhatsappIcon,
};

interface InteractionsTimelineProps {
  leadId: string;
}

export function InteractionsTimeline({ leadId }: InteractionsTimelineProps) {
  const { data: interactions = [], isLoading } = useInteractionsByLead(leadId);
  const { data: contacts = [] } = useContactsByLead(leadId);

  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Cargando interacciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {interactions.length}{" "}
          {interactions.length === 1 ? "interacción" : "interacciones"}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          disabled={contacts.length === 0}
        >
          <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
          Agregar interacción
        </Button>
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Agrega al menos un contacto para poder registrar interacciones.
        </div>
      )}

      {showForm && contacts.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <CreateInteractionForm
              contacts={contacts}
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {interactions.length === 0 && !showForm ? (
        <div className="text-center py-8 text-muted-foreground">
          <HugeiconsIcon
            icon={TimeQuarterPassIcon}
            className="h-12 w-12 mx-auto mb-2 opacity-50"
          />
          <p>No hay interacciones registradas</p>
          <p className="text-sm">
            {contacts.length > 0
              ? "Registra la primera interacción con un contacto"
              : "Agrega un contacto primero"}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {interactions.map((interaction) => (
              <InteractionCard key={interaction.id} interaction={interaction} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InteractionCard({ interaction }: { interaction: Interaction }) {
  const IconComponent = INTERACTION_ICONS[interaction.type] || Note03Icon;

  return (
    <div className="relative pl-10">
      {/* Timeline dot */}
      <div className="absolute left-2 top-3 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
        <HugeiconsIcon
          icon={IconComponent}
          className="h-2.5 w-2.5 text-primary"
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {INTERACTION_TYPE_LABELS[interaction.type]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(interaction.date), "PPP 'a las' p", {
                  locale: es,
                })}
              </span>
            </div>
          </div>

          <h4 className="font-medium">{interaction.subject}</h4>

          {interaction.content && (
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
              {interaction.content}
            </p>
          )}

          {interaction.createdByName && (
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              Registrado por {interaction.createdByName}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
