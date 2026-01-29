"use client";

import { useState } from "react";
import { Button } from "@/core/shared/ui/shadcn/button";
import {
  useContactsByLead,
  useAddContact,
  useDeleteContact,
} from "../../hooks/useContacts";
import type { Contact, ContactFormData } from "../../types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, UserCircleIcon } from "@hugeicons/core-free-icons";
import { DeleteContactAlertDialog } from "./DeleteContacAlertDialot";
import { ContactCard } from "./ContactCard";
import { ContactDialogFormSheet } from "./ContactDialogFormSheet";
import { useModalState } from "@/core/shared/hooks";

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
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="size-8 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando contactos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {contacts.length} {contacts.length === 1 ? "contacto" : "contactos"}
        </p>

        {isOpenEditDialog && (
          <ContactDialogFormSheet
            open={true}
            onOpenChange={closeEditDialog}
            onSubmit={handleAddContact}
            isLoading={addContactMutation.isPending}
          />
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={openEditDialog}
          className="h-8 px-3 text-xs font-medium hover:bg-primary/5 hover:text-primary"
        >
          <HugeiconsIcon icon={Add01Icon} className="mr-1.5 size-3.5" />
          Agregar
        </Button>
      </div>

      {/* Contact list or empty state */}
      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-border/60 bg-muted/30">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <HugeiconsIcon
              icon={UserCircleIcon}
              className="size-6 text-muted-foreground/60"
            />
          </div>
          <p className="text-sm font-medium text-foreground/80">
            Sin contactos
          </p>
          <p className="text-xs text-muted-foreground mt-1 text-center max-w-[200px]">
            Agrega contactos para gestionar la comunicación con este lead
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={openEditDialog}
            className="mt-4 h-8 text-xs"
          >
            <HugeiconsIcon icon={Add01Icon} className="mr-1.5 size-3.5" />
            Agregar primer contacto
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onDelete={() => setContactToDelete(contact)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
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
