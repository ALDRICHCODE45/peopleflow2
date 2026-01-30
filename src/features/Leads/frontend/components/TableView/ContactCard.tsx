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
import { ContactInteractionsDialog } from "./ContactInteractionsDialog";
import { useUpdateContact } from "../../hooks/useContacts";
import { cn } from "@/core/lib/utils";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/shared/ui/shadcn/tooltip";

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

  // Generate initials for avatar
  const initials =
    `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();

  // Check if contact has any contact methods
  const hasContactMethods =
    contact.email || contact.phone || contact.linkedInUrl;

  return (
    <div
      className={cn(
        "group relative",
        "rounded-xl border border-border/40",
        "bg-gradient-to-b from-background to-muted/20",
        "p-4 transition-all duration-200",
        "hover:border-border/80 hover:shadow-sm",
      )}
    >
      {/* Main content row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 size-10 rounded-full",
            "flex items-center justify-center",
            "text-xs font-semibold tracking-wide",
            contact.isPrimary
              ? "bg-primary/10 text-primary ring-1 ring-primary/20"
              : "bg-muted text-muted-foreground",
          )}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Name row */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {contact.firstName} {contact.lastName}
            </span>
            {contact.isPrimary && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-primary/10 text-primary">
                Principal
              </span>
            )}
          </div>

          {/* Position */}
          {contact.position && (
            <p className="text-xs text-muted-foreground truncate">
              {contact.position}
            </p>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <LeadContactActionsDropdown actions={contactCardActions} />
        </div>
      </div>

      {/* Contact methods - compact inline display */}
      {hasContactMethods && (
        <div className="flex items-center gap-1 mt-3 ml-13">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className={cn(
                "inline-flex items-center justify-center",
                "size-7 rounded-md",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted/80 transition-colors",
              )}
              title={contact.email}
            >
              <Tooltip>
                <TooltipTrigger>
                  <HugeiconsIcon icon={Mail01Icon} className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>{contact.email}</TooltipContent>
              </Tooltip>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className={cn(
                "inline-flex items-center justify-center",
                "size-7 rounded-md",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted/80 transition-colors",
              )}
              title={contact.phone}
            >
              <Tooltip>
                <TooltipTrigger>
                  <HugeiconsIcon icon={Call02Icon} className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>{contact.phone}</TooltipContent>
              </Tooltip>
            </a>
          )}
          {contact.linkedInUrl && (
            <Link
              href={contact.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center justify-center",
                "size-7 rounded-md",
                "text-muted-foreground hover:text-[#0A66C2]",
                "hover:bg-[#0A66C2]/10 transition-colors",
              )}
              title="LinkedIn"
            >
              <Tooltip>
                <TooltipTrigger>
                  <HugeiconsIcon icon={Linkedin01Icon} className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>{contact.linkedInUrl}</TooltipContent>
              </Tooltip>
            </Link>
          )}

          {/* Inline contact info - show primary method */}
          {contact.email && (
            <span className="ml-1 text-xs text-muted-foreground truncate max-w-[140px]">
              {contact.email}
            </span>
          )}
        </div>
      )}

      {/* Notes - subtle display */}
      {contact.notes && (
        <p className="mt-3 ml-13 text-xs text-muted-foreground/80 line-clamp-2 italic">
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

      <ContactInteractionsDialog
        contact={contact}
        open={isInteractionModalOpen}
        onOpenChange={(open) => {
          if (!open) closeInteractionModal();
        }}
      />
    </div>
  );
}
