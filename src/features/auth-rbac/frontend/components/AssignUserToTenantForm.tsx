"use client";

import { useState, useEffect } from "react";
import { Button } from "@shadcn/button";
import { Label } from "@shadcn/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn/select";
import { Input } from "@shadcn/input";
import { useRouter } from "next/navigation";
import { assignUserToTenantAction } from "../../server/presentation/actions/user.actions";
import { getUserTenantsAction } from "@/features/tenants/server/presentation/actions/tenant.actions";
import { ALL_ROLES } from "../../server/domain/constants/permissions";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export function AssignUserToTenantForm() {
  const [userId, setUserId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      // Cargar tenants
      const tenantsResult = await getUserTenantsAction();
      if (!tenantsResult.error && tenantsResult.tenants) {
        setTenants(tenantsResult.tenants);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("tenantId", tenantId);
      formData.append("roleName", roleName);

      const result = await assignUserToTenantAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setUserId("");
        setTenantId("");
        setRoleName("");
        router.refresh();
      }
    } catch (err) {
      setError("Error inesperado al asignar usuario");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asignar Usuario a Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignar Usuario a Tenant</CardTitle>
        <CardDescription>
          Asigna un usuario a un tenant con un rol específico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Usuario</Label>
            <Input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="ID del usuario"
              required
            />
            <p className="text-xs text-muted-foreground">
              Ingresa el ID del usuario (en producción esto sería un select con
              lista de usuarios)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantId">Tenant</Label>
            <Select value={tenantId} onValueChange={setTenantId} required>
              <SelectTrigger id="tenantId">
                <SelectValue placeholder="Selecciona un tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="roleName">Rol</Label>
            <Select value={roleName} onValueChange={setRoleName} required>
              <SelectTrigger id="roleName">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-500/10 text-green-700 text-sm rounded-md">
              Usuario asignado exitosamente
            </div>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Asignando..." : "Asignar Usuario"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
