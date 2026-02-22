"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/shared/ui/shadcn/avatar";
import { Button } from "@/core/shared/ui/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/shared/ui/shadcn/dialog";
import { useTenantUsersQuery } from "@/features/Administracion/usuarios/frontend/hooks/useUsers";
import { useMemo, useState } from "react";
import { useBulkReasignLeads } from "../../hooks/useLeads";
import { LoadingButton } from "@/core/shared/ui/shadcn/loading-button";
import { SearchableSelect } from "@/core/shared/components/SearchableSelect";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeadIds: string[];
  selectedCount: number;
}

export const BulkReasignLeadsDialog = ({
  isOpen,
  onOpenChange,
  selectedLeadIds,
  selectedCount,
}: Props) => {
  const { data: users, isPending: isLoadingUsers } = useTenantUsersQuery();
  const bulkReasignMutation = useBulkReasignLeads();

  const [selectedUser, setSelectedUser] = useState<string | undefined>(
    undefined,
  );

  const userOptions = useMemo(
    () =>
      (users ?? []).map((u) => ({
        value: u.id,
        label: u.name ?? u.email,
        avatar: u.avatar,
      })),
    [users],
  );

  const handleSubmit = async () => {
    if (!selectedUser || selectedLeadIds.length === 0) return;

    try {
      await bulkReasignMutation.mutateAsync({
        leadIds: selectedLeadIds,
        newUserId: selectedUser,
      });
      onOpenChange(false);
      setSelectedUser(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) setSelectedUser(undefined);
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reasignar Leads</DialogTitle>
          <DialogDescription>
            Selecciona el nuevo generador para{" "}
            <b>
              {selectedCount} lead{selectedCount !== 1 ? "s" : ""}
            </b>
            :
          </DialogDescription>
        </DialogHeader>

        <SearchableSelect
          options={userOptions}
          value={selectedUser}
          onChange={(value) => setSelectedUser(value)}
          placeholder="Selecciona el usuario"
          searchPlaceholder="Buscar usuario..."
          disabled={isLoadingUsers}
          renderOption={(opt) => (
            <>
              <Avatar className="size-6">
                <AvatarImage src={opt.avatar ?? ""} alt="usuario" />
                <AvatarFallback className="text-xs">U</AvatarFallback>
              </Avatar>
              <span className="truncate">{opt.label}</span>
            </>
          )}
          renderSelected={(opt) => (
            <span className="flex items-center gap-2 truncate">
              <Avatar className="size-6">
                <AvatarImage src={opt.avatar ?? ""} alt="usuario" />
                <AvatarFallback className="text-xs">U</AvatarFallback>
              </Avatar>
              {opt.label}
            </span>
          )}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={bulkReasignMutation.isPending}
            >
              Cancelar
            </Button>
          </DialogClose>

          <LoadingButton
            variant="default"
            isLoading={bulkReasignMutation.isPending}
            loadingText="Reasignando..."
            onClick={handleSubmit}
            disabled={!selectedUser || isLoadingUsers}
          >
            Reasignar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
