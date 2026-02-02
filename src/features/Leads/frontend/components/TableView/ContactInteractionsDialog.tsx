"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/shared/ui/shadcn/dialog";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Spinner } from "@/core/shared/ui/shadcn/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, TimeQuarterPassIcon } from "@hugeicons/core-free-icons";
import { useModalState } from "@/core/shared/hooks";
import {
  useInteractionsByContact,
  useAddInteraction,
  useUpdateInteraction,
  useDeleteInteraction,
} from "../../hooks/useInteractions";
import type { Interaction, Contact, InteractionFormData } from "../../types";
import { InteractionItem } from "./InteractionItem";

const DeleteInteractionAlertDialog = dynamic(
  () =>
    import("./DeleteInteractionAlertDialog").then((mod) => ({
      default: mod.DeleteInteractionAlertDialog,
    })),
  {
    loading: () => (
      <div className="flex justify-center items-center p-8">
        <Spinner className="size-10" />
      </div>
    ),
    ssr: true,
  }
);

const ContactInteractionDialog = dynamic(
  () =>
    import("./ContactInteractionDialog").then((mod) => ({
      default: mod.ContactInteractionDialog,
    })),
  {
    loading: () => (
      <div className="flex justify-center items-center p-8">
        <Spinner className="size-10" />
      </div>
    ),
    ssr: true,
  }
);

const EditInteractionDialog = dynamic(
  () =>
    import("./EditInteractionDialog").then((mod) => ({
      default: mod.EditInteractionDialog,
    })),
  {
    loading: () => (
      <div className="flex justify-center items-center p-8">
        <Spinner className="size-10" />
      </div>
    ),
    ssr: true,
  }
);

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
  const {
    isOpen: isDeletingOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModalState();
  const {
    isOpen: isInteractionOpen,
    openModal: openInteraction,
    closeModal: closeInteraction,
  } = useModalState();
  const {
    isOpen: isEditOpen,
    openModal: openEdit,
    closeModal: closeEdit,
  } = useModalState();

  const [editingInteraction, setEditingInteraction] =
    useState<Interaction | null>(null);
  const [deletingInteractionId, setDeletingInteractionId] = useState<
    string | null
  >(null);

  // Only fetch when dialog is open (lazy loading)
  const { data: interactions = [], isLoading } = useInteractionsByContact(
    open ? contact.id : null
  );

  const addInteractionMutation = useAddInteraction();
  const updateInteractionMutation = useUpdateInteraction();
  const deleteInteractionMutation = useDeleteInteraction();

  const handleAddInteraction = useCallback(
    async (data: InteractionFormData) => {
      await addInteractionMutation.mutateAsync(data);
      closeInteraction();
    },
    [addInteractionMutation, closeInteraction]
  );

  const handleEditInteraction = useCallback(
    async (data: InteractionFormData) => {
      if (!editingInteraction) return;
      await updateInteractionMutation.mutateAsync({
        interactionId: editingInteraction.id,
        data: {
          type: data.type,
          subject: data.subject,
          content: data.content ?? null,
          date: data.date,
        },
      });
      setEditingInteraction(null);
      closeEdit();
    },
    [editingInteraction, updateInteractionMutation, closeEdit]
  );

  const handleDeleteInteraction = useCallback(async () => {
    if (!deletingInteractionId) return;
    await deleteInteractionMutation.mutateAsync(deletingInteractionId);
    setDeletingInteractionId(null);
    closeDeleteModal();
  }, [deletingInteractionId, deleteInteractionMutation, closeDeleteModal]);

  const handleOpenEdit = useCallback(
    (interaction: Interaction) => {
      setEditingInteraction(interaction);
      openEdit();
    },
    [openEdit]
  );

  const handleOpenDelete = useCallback(
    (interactionId: string) => {
      setDeletingInteractionId(interactionId);
      openDeleteModal();
    },
    [openDeleteModal]
  );

  const handleCancelAdd = useCallback(() => {
    closeInteraction();
  }, [closeInteraction]);

  const handleCancelEdit = useCallback(() => {
    setEditingInteraction(null);
    closeEdit();
  }, [closeEdit]);

  const isAnyDialogOpen = isInteractionOpen || isEditOpen;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-sm md:min-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="flex items-center gap-2">
                <span>Interacciones</span>
                <span className="text-muted-foreground font-normal">-</span>
                <span className="font-normal text-muted-foreground">
                  {contact.firstName} {contact.lastName}
                </span>
              </DialogTitle>
              {!isAnyDialogOpen && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => openInteraction()}
                >
                  <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
                  Nueva
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">
                  Cargando interacciones...
                </p>
              </div>
            ) : interactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <HugeiconsIcon
                  icon={TimeQuarterPassIcon}
                  className="h-12 w-12 mx-auto mb-2 opacity-50"
                />
                <p>No hay interacciones registradas</p>
                <p className="text-sm">
                  Registra la primera interacción con este contacto
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {interactions.map((interaction) => (
                  <InteractionItem
                    key={interaction.id}
                    interaction={interaction}
                    onEdit={() => handleOpenEdit(interaction)}
                    onDelete={() => handleOpenDelete(interaction.id)}
                    disabled={isAnyDialogOpen}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isDeletingOpen && (
        <DeleteInteractionAlertDialog
          isOpen={isDeletingOpen}
          onOpenChange={() => closeDeleteModal()}
          textToConfirm="Deseo eliminar esta interaccion"
          onConfirmDelete={handleDeleteInteraction}
          isLoading={deleteInteractionMutation.isPending}
        />
      )}

      {isInteractionOpen && (
        <ContactInteractionDialog
          contact={contact}
          onSubmit={handleAddInteraction}
          onCancel={handleCancelAdd}
          isLoading={addInteractionMutation.isPending}
          hideContactSelector
          fixedContactId={contact.id}
          onOpenChange={() => closeInteraction()}
          isOpen={isInteractionOpen}
        />
      )}

      {isEditOpen && editingInteraction && (
        <EditInteractionDialog
          isOpen={isEditOpen}
          onOpenChange={(open) => !open && handleCancelEdit()}
          contact={contact}
          interaction={editingInteraction}
          onSubmit={handleEditInteraction}
          onCancel={handleCancelEdit}
          isLoading={updateInteractionMutation.isPending}
        />
      )}
    </>
  );
}
