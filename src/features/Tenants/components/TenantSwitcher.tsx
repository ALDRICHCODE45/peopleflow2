'use client';

import { useState, useEffect } from 'react';
import { Button } from '@shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@shadcn/dropdown-menu';
import { useTenant } from '../context/TenantContext';
import { getUserTenantsAction, switchTenantAction, getCurrentTenantAction } from '@/app/actions/tenants';
import { useRouter } from 'next/navigation';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  roles?: Array<{ id: string; name: string }>;
}

export function TenantSwitcher() {
  const { tenant, refresh } = useTenant();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setIsLoading(true);
    const result = await getUserTenantsAction();
    if (!result.error && result.tenants) {
      setTenants(result.tenants);
    }
    setIsLoading(false);
  };

  const handleSwitchTenant = async (tenantId: string | null) => {
    const result = await switchTenantAction(tenantId);
    if (!result.error) {
      await refresh();
      router.refresh();
    }
  };

  if (isLoading) {
    return <Button disabled>Cargando...</Button>;
  }

  if (tenants.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {tenant ? tenant.name : 'Seleccionar Tenant'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {tenant && (
          <>
            <DropdownMenuItem disabled>
              Actual: {tenant.name}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {tenants.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => handleSwitchTenant(t.id)}
            disabled={tenant?.id === t.id}
          >
            {t.name}
            {t.roles && t.roles.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({t.roles.map(r => r.name).join(', ')})
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
