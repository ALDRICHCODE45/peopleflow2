"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/shared/ui/shadcn/dialog";
import { Checkbox } from "@/core/shared/ui/shadcn/checkbox";
import { Label } from "@/core/shared/ui/shadcn/label";
import { LoadingButton } from "@/core/shared/ui/shadcn/loading-button";
import { Button } from "@/core/shared/ui/shadcn/button";
import { Spinner } from "@/core/shared/ui/shadcn/spinner";
import {
  useInvitableTenantsQuery,
  useTenantRolesQuery,
  useInviteToTenant,
} from "../hooks/useInviteToTenant";
import type { TenantUser } from "../types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/core/shared/ui/shadcn/select";

interface InviteToTenantDialogProps {
  user: TenantUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteToTenantDialog({
  user,
  open,
  onOpenChange,
}: InviteToTenantDialogProps) {
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(
    undefined,
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Queries
  const { data: tenants = [], isLoading: isLoadingTenants } =
    useInvitableTenantsQuery();

  const { data: roles = [], isLoading: isLoadingRoles } = useTenantRolesQuery(
    selectedTenantId!,
  );

  // Mutation
  const inviteMutation = useInviteToTenant();

  // Reset roles cuando cambia el tenant
  useEffect(() => {
    setSelectedRoleIds([]);
  }, [selectedTenantId]);

  // Reset state cuando se cierra el dialog
  useEffect(() => {
    if (!open) {
      setSelectedTenantId(undefined);
      setSelectedRoleIds([]);
    }
  }, [open]);

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoleIds((prev) => [...prev, roleId]);
    } else {
      setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
    }
  };

  const handleInvite = async () => {
    if (!selectedTenantId || selectedRoleIds.length === 0) return;

    await inviteMutation.mutateAsync({
      userId: user.id,
      tenantId: selectedTenantId,
      roleIds: selectedRoleIds,
    });

    onOpenChange(false);
  };

  const isValid = selectedTenantId && selectedRoleIds.length > 0;
  const isLoading = inviteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar a Tenant</DialogTitle>
          <DialogDescription>
            Invita a <strong>{user.name || user.email}</strong> a otra
            organizacion del sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Selector de Tenant */}
          <div className="space-y-2">
            <Label>Organizacion destino</Label>
            {isLoadingTenants ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Cargando organizaciones...
              </div>
            ) : tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tienes permisos para invitar a ninguna organizacion.
              </p>
            ) : (
              <Select
                value={selectedTenantId}
                onValueChange={setSelectedTenantId}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una organizacion..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Organizaciones disponibles</SelectLabel>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selector de Roles (aparece despues de seleccionar tenant) */}
          {selectedTenantId && (
            <div className="space-y-2">
              <Label>Roles a asignar</Label>
              {isLoadingRoles ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" />
                  Cargando roles...
                </div>
              ) : roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay roles disponibles en esta organizacion.
                </p>
              ) : (
                <div className="space-y-2 rounded-md border p-3">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoleIds.includes(role.id)}
                        onCheckedChange={(checked) =>
                          handleRoleToggle(role.id, checked === true)
                        }
                        disabled={isLoading}
                      />
                      <Label
                        htmlFor={`role-${role.id}`}
                        className="cursor-pointer font-normal"
                      >
                        {role.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <LoadingButton
            onClick={handleInvite}
            disabled={!isValid}
            isLoading={isLoading}
            loadingText="Invitando..."
          >
            Invitar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
