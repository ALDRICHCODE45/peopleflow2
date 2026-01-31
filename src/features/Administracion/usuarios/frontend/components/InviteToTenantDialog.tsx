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
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/core/shared/ui/shadcn/combobox";
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
import type { TenantUser, InvitableTenant } from "../types";

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
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Queries
  const { data: tenants = [], isLoading: isLoadingTenants } =
    useInvitableTenantsQuery();

  const { data: roles = [], isLoading: isLoadingRoles } =
    useTenantRolesQuery(selectedTenantId);

  // Mutation
  const inviteMutation = useInviteToTenant();

  // Reset roles cuando cambia el tenant
  useEffect(() => {
    setSelectedRoleIds([]);
  }, [selectedTenantId]);

  // Reset state cuando se cierra el dialog
  useEffect(() => {
    if (!open) {
      setSelectedTenantId(null);
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

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);
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
              <Combobox
                value={selectedTenantId}
                onValueChange={(value) =>
                  setSelectedTenantId(value as string | null)
                }
              >
                <ComboboxInput
                  placeholder="Selecciona una organizacion..."
                  disabled={isLoading}
                />
                <ComboboxContent>
                  <ComboboxList>
                    {tenants.map((tenant) => (
                      <ComboboxItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </ComboboxItem>
                    ))}
                    <ComboboxEmpty>
                      No se encontraron organizaciones
                    </ComboboxEmpty>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
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
