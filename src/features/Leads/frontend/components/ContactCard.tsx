import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import type { Contact } from "../types";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  Call02Icon,
  Linkedin01Icon,
  MoreVertical,
} from "@hugeicons/core-free-icons";
import { Button } from "@/core/shared/ui/shadcn/button";

export function ContactCard({
  contact,
  onDelete,
}: {
  contact: Contact;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {contact.firstName} {contact.lastName}
              </span>
              {contact.isPrimary && (
                <Badge variant="secondary" className="text-xs">
                  Principal
                </Badge>
              )}
            </div>
            {contact.position && (
              <p className="text-sm text-muted-foreground">
                {contact.position}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mt-2">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                >
                  <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4" />
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                >
                  <HugeiconsIcon icon={Call02Icon} className="h-4 w-4" />
                  {contact.phone}
                </a>
              )}
              {contact.linkedInUrl && (
                <a
                  href={contact.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                >
                  <HugeiconsIcon icon={Linkedin01Icon} className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <HugeiconsIcon icon={MoreVertical} className="h-4 w-4" />
          </Button>
        </div>

        {contact.notes && (
          <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
            {contact.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
