"use client";
import { Avatar, AvatarFallback } from "@/core/shared/ui/shadcn/avatar";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@shadcn/select";
import { useState } from "react";
import { useReasignLead } from "../../hooks/useLeads";
import { IconSvgElement } from "@hugeicons/react";
import { LoadingButton } from "@/core/shared/ui/shadcn/loading-button";

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
      console.log(error);
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
        <Select
          onValueChange={(value) => setSelectedUser(value)}
          value={selectedUser}
        >
          <SelectTrigger className="w-full ">
            <SelectValue placeholder="Selecciona el usuario" />
          </SelectTrigger>
          <SelectContent className="">
            <SelectGroup>
              <SelectLabel className="pl-2">Reasignar Lead</SelectLabel>
              {users?.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <Avatar className="size-5">
                    <AvatarFallback className="text-xs">U</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{item.name}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
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
