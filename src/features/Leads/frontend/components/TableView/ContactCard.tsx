import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import type { Contact, ContactFormData } from "../../types";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  Call02Icon,
  Linkedin01Icon,
} from "@hugeicons/core-free-icons";
import { createLeadContactActions } from "./createLeadContactActions";
import { LeadContactActionsDropdown } from "./LeadContactActionsDropdown";
import { useModalState } from "@/core/shared/hooks";
import { ContactDialogFormSheet } from "./ContactDialogFormSheet";
import { useUpdateContact } from "../../hooks/useContacts";

export function ContactCard({
  contact,
  onDelete,
}: {
  contact: Contact;
  onDelete: () => void;
}) {
  const editContactMutation = useUpdateContact();

  const {
    openModal: openInteractionModal,
    isOpen: isInteractionModalOpen,
    closeModal: closeInteractionModal,
  } = useModalState();

  const {
    openModal: openEditModal,
    isOpen: isEditModalOpen,
    closeModal: closeEditModal,
  } = useModalState();

  const contactCardActions = createLeadContactActions({
    onDelete: onDelete,
    onEdit: openEditModal,
    onShowInteracciones: openInteractionModal,
  });

  const handleEditContact = async (data: ContactFormData) => {
    try {
      await editContactMutation.mutateAsync({
        contactId: contact.id,
        data,
      });
      closeEditModal();
    } catch {
      // Error already shown via toast in hook
      // Keep dialog open so user can retry
    }
  };

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

          <div onClick={(e) => e.stopPropagation()}>
            <LeadContactActionsDropdown actions={contactCardActions} />
          </div>
        </div>

        {contact.notes && (
          <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
            {contact.notes}
          </p>
        )}

        <ContactDialogFormSheet
          open={isEditModalOpen}
          onOpenChange={(open) => {
            if (!open) closeEditModal();
          }}
          onSubmit={handleEditContact}
          isLoading={editContactMutation.isPending}
          initialData={{
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email ?? undefined,
            phone: contact.phone ?? undefined,
            position: contact.position ?? undefined,
            linkedInUrl: contact.linkedInUrl ?? undefined,
            isPrimary: contact.isPrimary,
            notes: contact.notes ?? undefined,
          }}
        />
      </CardContent>
    </Card>
  );
}
