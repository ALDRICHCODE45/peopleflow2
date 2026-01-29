import { Avatar, AvatarFallback } from "@/core/shared/ui/shadcn/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface Props {
  isOpen: boolean;
  onOpenChange: () => void;
  leadId: string;
}

export const ReasignLeadDialog = ({ isOpen, onOpenChange }: Props) => {
  const { data: users, isPending } = useTenantUsersQuery();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reasignar Lead</DialogTitle>
          <DialogDescription>
            Selecciona el generador nuevo a continuacion:
          </DialogDescription>
        </DialogHeader>
        <Select>
          <SelectTrigger className="w-full ">
            <SelectValue placeholder="Select framework" />
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
      </DialogContent>
    </Dialog>
  );
};
