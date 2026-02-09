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
import { switchTenantAction } from "@/features/tenants/server/presentation/actions/tenant.actions";
import { authClient } from "@/core/lib/auth-client";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  userCount: number;
  createdAt: string;
}

interface Stats {
  totalTenants: number;
  totalUsers: number;
  totalRoles: number;
  totalPermissions: number;
}

interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
}

interface SuperAdminDashboardProps {
  tenants: Tenant[];
  stats: Stats;
  currentUser: CurrentUser;
}

export function SuperAdminDashboard({
  tenants,
  stats,
  currentUser,
}: SuperAdminDashboardProps) {
  const [isEntering, setIsEntering] = useState<string | null>(null);

  const handleEnterTenant = async (tenantId: string) => {
    setIsEntering(tenantId);
    try {
      const result = await switchTenantAction(tenantId);
      if (!result.error) {
        // Full page reload para limpiar TODOS los cachés:
        // - React Query cache
        // - Next.js Router Cache
        // - Better Auth session cache
        // Esto garantiza datos frescos del nuevo tenant
        // Nota: No usar result.redirectUrl porque para super admins siempre
        // retorna /super-admin (tiene permiso super:admin). Al "entrar" a un
        // tenant, el destino correcto es el dashboard del tenant.
        window.location.href = "/admin/usuarios";
      }
    } catch (error) {
      console.error("Error al entrar al tenant:", error);
      setIsEntering(null);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/sign-in";
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-200">
              Total Tenants
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {stats.totalTenants}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-200">
              Total Usuarios
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {stats.totalUsers}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-200">
              Total Roles
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {stats.totalRoles}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-200">
              Total Permisos
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {stats.totalPermissions}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tenants List */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Tenants del Sistema</CardTitle>
          <CardDescription className="text-purple-200">
            Selecciona un tenant para administrarlo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map((tenant) => (
              <Card
                key={tenant.id}
                className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white">
                    {tenant.name}
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    {tenant.slug}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-purple-300">
                      <span className="font-medium">{tenant.userCount}</span>{" "}
                      usuarios
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleEnterTenant(tenant.id)}
                      disabled={isEntering === tenant.id}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isEntering === tenant.id ? "Entrando..." : "Entrar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tenants.length === 0 && (
            <div className="text-center py-8 text-purple-300">
              No hay tenants creados aún.
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Info & Logout */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Tu Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">
                {currentUser.name || "Super Admin"}
              </p>
              <p className="text-purple-300 text-sm">{currentUser.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
