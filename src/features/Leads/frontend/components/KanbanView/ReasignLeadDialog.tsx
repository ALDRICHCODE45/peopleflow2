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
import { useReasignLead } from "../../hooks/useLeads";
import { IconSvgElement } from "@hugeicons/react";
import { LoadingButton } from "@/core/shared/ui/shadcn/loading-button";
import { SearchableSelect } from "@/core/shared/components/SearchableSelect";

interface Props {
  isOpen: boolean;
  onOpenChange: () => void;
  leadId: string;
  icon?: IconSvgElement;
}

export const ReasignLeadDialog = ({ isOpen, onOpenChange, leadId }: Props) => {
  const { data: users, isPending } = useTenantUsersQuery();
  const reasignLeadMutation = useReasignLead();

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
    if (!selectedUser || !leadId) {
      return;
    }

    try {
      await reasignLeadMutation.mutateAsync({
        leadId,
        newUserId: selectedUser,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reasignar Lead</DialogTitle>
          <DialogDescription>
            Selecciona el generador nuevo a continuacion:
          </DialogDescription>
        </DialogHeader>

        <SearchableSelect
          options={userOptions}
          value={selectedUser}
          onChange={(value) => setSelectedUser(value)}
          placeholder="Selecciona el usuario"
          searchPlaceholder="Buscar usuario..."
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
            <Button variant={"outline"}>cancelar</Button>
          </DialogClose>

          <LoadingButton
            variant="default"
            isLoading={reasignLeadMutation.isPending}
            loadingText="Reasignando..."
            onClick={handleSubmit}
          >
            Reasignar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
