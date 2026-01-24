"use client";

import { useState } from "react";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import {
  useContactsByLead,
  useAddContact,
  useDeleteContact,
} from "../hooks/useContacts";
import type { Contact, ContactFormData } from "../types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete01Icon,
  Mail01Icon,
  Call02Icon,
  Linkedin01Icon,
  UserIcon,
  MoreVertical,
} from "@hugeicons/core-free-icons";
import { CreateContactDialog } from "./CreateContactDialog";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { DeleteContactAlertDialog } from "./DeleteContacAlertDialot";

interface ContactsSectionProps {
  leadId: string;
}

export function ContactsSection({ leadId }: ContactsSectionProps) {
  const { data: contacts = [], isLoading } = useContactsByLead(leadId);
  const addContactMutation = useAddContact();
  const deleteContactMutation = useDeleteContact();

  const {
    openModal: openEditDialog,
    isOpen: isOpenEditDialog,
    closeModal: closeEditDialog,
  } = useModalState();

  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const handleAddContact = async (data: ContactFormData) => {
    await addContactMutation.mutateAsync({
      leadId,
      data,
    });
    closeEditDialog();
  };

  const handleDeleteContact = async () => {
    if (contactToDelete) {
      await deleteContactMutation.mutateAsync(contactToDelete.id);
      setContactToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Cargando contactos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {contacts.length} {contacts.length === 1 ? "contacto" : "contactos"}
        </h3>

        {isOpenEditDialog && (
          <CreateContactDialog
            open={true}
            onOpenChange={closeEditDialog}
            onSubmit={handleAddContact}
            isLoading={addContactMutation.isPending}
          />
        )}

        <Button variant="outline" size="sm" onClick={openEditDialog}>
          <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
          Agregar contacto
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <HugeiconsIcon
            icon={UserIcon}
            className="h-12 w-12 mx-auto mb-2 opacity-50"
          />
          <p>No hay contactos registrados</p>
          <p className="text-sm">Agrega el primer contacto para este lead</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onDelete={() => setContactToDelete(contact)}
            />
          ))}
        </div>
      )}

      {/* Dialog de confirmación para eliminar */}

      {!!contactToDelete && (
        <DeleteContactAlertDialog
          isOpen={true}
          onOpenChange={() => setContactToDelete(null)}
          contactNameToDelete={contactToDelete.firstName}
          onConfirmDelete={handleDeleteContact}
          isLoading={deleteContactMutation.isPending}
        />
      )}
    </div>
  );
}

function ContactCard({
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
