"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  Add01Icon,
  Call02Icon,
} from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/shared/ui/shadcn/card";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Avatar, AvatarFallback } from "@/core/shared/ui/shadcn/avatar";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import { cn } from "@/core/lib/utils";
import { EmptyState } from "./EmptyState";

// --- Mock contacts ---

interface MockContact {
  name: string;
  role: string;
  phone: string;
  email: string;
}

const MOCK_CONTACTS: MockContact[] = [
  {
    name: "Juan Pérez",
    role: "Director de RH",
    phone: "+52 55 1234 5678",
    email: "juan@empresa.com",
  },
  {
    name: "María López",
    role: "Gerente de Compras",
    phone: "+52 55 8765 4321",
    email: "maria@empresa.com",
  },
];

const contactColorPalette = [
  "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
];

function getContactColor(index: number): string {
  return contactColorPalette[index % contactColorPalette.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Empty state ready for when real data replaces mock
function ContactsEmptyState() {
  return (
    <EmptyState
      icon={UserMultiple02Icon}
      title="No hay contactos registrados"
      description="Agrega contactos de la empresa"
    />
  );
}

export function ClientContacts() {
  // When real data replaces mock, use:
  // if (contacts.length === 0) return <ContactsEmptyState />;
  const contacts = MOCK_CONTACTS;
  const showEmptyState = contacts.length === 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Contactos</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            disabled
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showEmptyState ? (
          <ContactsEmptyState />
        ) : (
          <div className="space-y-0">
            {contacts.map((contact, index) => (
              <div key={contact.email}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex items-start gap-3">
                  <Avatar
                    className={cn("size-9 shrink-0", getContactColor(index))}
                  >
                    <AvatarFallback className="text-xs font-medium">
                      {getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {contact.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contact.role}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <HugeiconsIcon icon={Call02Icon} className="size-3" />
                        {contact.phone}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
