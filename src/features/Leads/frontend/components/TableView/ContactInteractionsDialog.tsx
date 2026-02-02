"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/shared/ui/shadcn/dialog";
import { Badge } from "@/core/shared/ui/shadcn/badge";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Card, CardContent } from "@/core/shared/ui/shadcn/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/shared/ui/shadcn/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/shared/ui/shadcn/dropdown-menu";
import {
  useInteractionsByContact,
  useAddInteraction,
  useUpdateInteraction,
  useDeleteInteraction,
} from "../../hooks/useInteractions";
import type {
  Interaction,
  InteractionType,
  Contact,
  InteractionFormData,
} from "../../types";
import { INTERACTION_TYPE_LABELS } from "../../types";
import { InteractionForm } from "./InteractionForm";
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
  MoreVerticalIcon,
  PencilEdit01Icon,
  Delete02Icon,
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
  const [showForm, setShowForm] = useState(false);
  const [editingInteraction, setEditingInteraction] =
    useState<Interaction | null>(null);
  const [deletingInteractionId, setDeletingInteractionId] = useState<
    string | null
  >(null);

  // Only fetch when dialog is open (lazy loading)
  const { data: interactions = [], isLoading } = useInteractionsByContact(
    open ? contact.id : null,
  );

  const addInteractionMutation = useAddInteraction();
  const updateInteractionMutation = useUpdateInteraction();
  const deleteInteractionMutation = useDeleteInteraction();

  const handleAddInteraction = async (data: InteractionFormData) => {
    await addInteractionMutation.mutateAsync(data);
    setShowForm(false);
  };

  const handleEditInteraction = async (data: InteractionFormData) => {
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
  };

  const handleDeleteInteraction = async () => {
    if (!deletingInteractionId) return;
    await deleteInteractionMutation.mutateAsync(deletingInteractionId);
    setDeletingInteractionId(null);
  };

  const handleOpenEdit = (interaction: Interaction) => {
    setEditingInteraction(interaction);
    setShowForm(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingInteraction(null);
  };

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
              {!showForm && !editingInteraction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(true)}
                >
                  <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
                  Nueva
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Add Form */}
            {showForm && (
              <Card>
                <CardContent className="pt-4">
                  <InteractionForm
                    contacts={[contact]}
                    onSubmit={handleAddInteraction}
                    onCancel={handleCancelForm}
                    isLoading={addInteractionMutation.isPending}
                    hideContactSelector
                    fixedContactId={contact.id}
                  />
                </CardContent>
              </Card>
            )}

            {/* Edit Form */}
            {editingInteraction && (
              <Card>
                <CardContent className="pt-4">
                  <h4 className="text-sm font-medium mb-3">
                    Editando interacción
                  </h4>
                  <InteractionForm
                    contacts={[contact]}
                    onSubmit={handleEditInteraction}
                    onCancel={handleCancelForm}
                    isLoading={updateInteractionMutation.isPending}
                    isEditMode
                    hideContactSelector
                    fixedContactId={contact.id}
                    initialData={{
                      type: editingInteraction.type,
                      subject: editingInteraction.subject,
                      content: editingInteraction.content ?? "",
                      date: new Date(editingInteraction.date)
                        .toISOString()
                        .slice(0, 16),
                      contactId: editingInteraction.contactId,
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">
                  Cargando interacciones...
                </p>
              </div>
            ) : interactions.length === 0 && !showForm ? (
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
                    onDelete={() => setDeletingInteractionId(interaction.id)}
                    disabled={!!editingInteraction || showForm}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingInteractionId}
        onOpenChange={(open) => !open && setDeletingInteractionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar interacción</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta interacción? Esta acción
              no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInteraction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInteractionMutation.isPending
                ? "Eliminando..."
                : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function InteractionItem({
  interaction,
  onEdit,
  onDelete,
  disabled,
}: {
  interaction: Interaction;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const IconComponent = INTERACTION_ICONS[interaction.type] || Note03Icon;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 p-3",
        "bg-gradient-to-b from-background to-muted/20",
        "group",
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

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={disabled}
              >
                <HugeiconsIcon icon={MoreVerticalIcon} className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <HugeiconsIcon
                  icon={PencilEdit01Icon}
                  className="h-4 w-4 mr-2"
                />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
