'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn/card';
import { Badge } from '@shadcn/badge';
import { getUserTenantsAction } from '@/app/actions/tenants';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  roles?: Array<{ id: string; name: string }>;
}

export function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setIsLoading(true);
    setError(null);
    const result = await getUserTenantsAction();
    if (result.error) {
      setError(result.error);
    } else if (result.tenants) {
      setTenants(result.tenants);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (tenants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Tenants</CardTitle>
          <CardDescription>Lista de tenants a los que perteneces</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No perteneces a ningún tenant.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Tenants</CardTitle>
        <CardDescription>Lista de tenants a los que perteneces</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">{tenant.name}</h3>
                <p className="text-sm text-muted-foreground">{tenant.slug}</p>
              </div>
              {tenant.roles && tenant.roles.length > 0 && (
                <div className="flex gap-2">
                  {tenant.roles.map((role) => (
                    <Badge key={role.id} variant="secondary">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
