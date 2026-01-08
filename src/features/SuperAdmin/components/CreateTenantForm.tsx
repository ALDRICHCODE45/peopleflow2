'use client';

import { useState } from 'react';
import { Button } from '@shadcn/button';
import { Input } from '@shadcn/input';
import { Label } from '@shadcn/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn/card';
import { createTenantAction } from '@/app/actions/tenants';
import { useRouter } from 'next/navigation';

export function CreateTenantForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (slug) {
        formData.append('slug', slug);
      }

      const result = await createTenantAction(formData);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setName('');
        setSlug('');
        router.refresh();
      }
    } catch (err) {
      setError('Error inesperado al crear tenant');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Tenant</CardTitle>
        <CardDescription>Crea un nuevo tenant (empresa) en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Nombre de la empresa"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug-de-la-empresa"
              required
            />
            <p className="text-xs text-muted-foreground">
              Se genera automáticamente basado en el nombre
            </p>
          </div>
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-500/10 text-green-700 text-sm rounded-md">
              Tenant creado exitosamente
            </div>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creando...' : 'Crear Tenant'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
