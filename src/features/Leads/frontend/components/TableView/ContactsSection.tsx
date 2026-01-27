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
import { Add01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { CreateContactDialog } from "./CreateContactDialog";
import { useModalState } from "@/core/shared/hooks/useModalState";
import { DeleteContactAlertDialog } from "./DeleteContacAlertDialot";
import { ContactCard } from "./ContactCard";

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
