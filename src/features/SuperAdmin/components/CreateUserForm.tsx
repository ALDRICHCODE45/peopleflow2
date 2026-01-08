'use client';

import { useState } from 'react';
import { Button } from '@shadcn/button';
import { Input } from '@shadcn/input';
import { Label } from '@shadcn/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn/card';
import { createUserAction } from '@/app/actions/users';
import { useRouter } from 'next/navigation';

export function CreateUserForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('name', name);
      formData.append('password', password);

      const result = await createUserAction(formData);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setEmail('');
        setName('');
        setPassword('');
        router.refresh();
      }
    } catch (err) {
      setError('Error inesperado al crear usuario');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Usuario</CardTitle>
        <CardDescription>Crea un nuevo usuario en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-500/10 text-green-700 text-sm rounded-md">
              Usuario creado exitosamente
            </div>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creando...' : 'Crear Usuario'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
