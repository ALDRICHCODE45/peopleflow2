"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/core/shared/ui/shadcn/sheet";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Checkbox } from "@/core/shared/ui/shadcn/checkbox";
import { Label } from "@/core/shared/ui/shadcn/label";
import { useIsMobile } from "@/core/shared/hooks/use-mobile";
import { useUpdateUserRoles, useAvailableRolesQuery } from "../hooks/useUsers";
import type { TenantUser } from "../types";

interface UserRolesSheetProps {
  user: TenantUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserRolesSheet({ user, open, onOpenChange }: UserRolesSheetProps) {
  const isMobile = useIsMobile();
  const sheetSide = isMobile ? "bottom" : "right";

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const { data: roles = [] } = useAvailableRolesQuery();
  const updateRolesMutation = useUpdateUserRoles();

  useEffect(() => {
    if (user && open) {
      setSelectedRoleIds(user.roles.map((r) => r.id));
    }
  }, [user, open]);

  const handleToggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async () => {
    await updateRolesMutation.mutateAsync({
      userId: user.id,
      roleIds: selectedRoleIds,
    });
    onOpenChange(false);
  };

  const isLoading = updateRolesMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="md"
        className="md:mr-8 ml-0 rounded-3xl dark:bg-[#18181B]"
        side={sheetSide}
      >
        <SheetHeader>
          <SheetTitle>Asignar Roles</SheetTitle>
          <SheetDescription>
            Selecciona los roles para {user.email}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4">
          {roles.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No hay roles disponibles
            </p>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoleIds.includes(role.id)}
                    onCheckedChange={() => handleToggleRole(role.id)}
                  />
                  <Label
                    htmlFor={`role-${role.id}`}
                    className="font-normal cursor-pointer"
                  >
                    {role.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <SheetFooter className="p-4 pt-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Roles"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
