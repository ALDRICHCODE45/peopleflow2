"use client";

import { useState } from "react";
import { Button } from "@shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/card";
import { Badge } from "@shadcn/badge";
import { switchTenantAction } from "../../server/presentation/actions/tenant.actions";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  roles: string[];
}

interface SelectTenantPageProps {
  tenants: Tenant[];
  userName: string;
}

export function SelectTenantPage({ tenants, userName }: SelectTenantPageProps) {
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTenant = async (tenantId: string) => {
    setIsSelecting(tenantId);
    setError(null);

    try {
      const result = await switchTenantAction(tenantId);

      if (result.error) {
        setError(result.error);
        setIsSelecting(null);
        return;
      }

      // Full page reload para limpiar todos los cachés
      // Navega directamente a la ruta del dashboard sin pasar por page.tsx
      window.location.href = result.redirectUrl || "/";
    } catch (err) {
      console.error("Error al seleccionar tenant:", err);
      setError("Error al seleccionar la organización");
      setIsSelecting(null);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">¡Bienvenido, {userName}!</CardTitle>
        <CardDescription>
          Tienes acceso a varias organizaciones. Selecciona con cuál deseas
          trabajar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() =>
                !isSelecting && handleSelectTenant(tenant.id)
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{tenant.name}</CardTitle>
                <CardDescription>{tenant.slug}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {tenant.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
                <Button
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTenant(tenant.id);
                  }}
                  disabled={!!isSelecting}
                >
                  {isSelecting === tenant.id ? "Seleccionando..." : "Seleccionar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
