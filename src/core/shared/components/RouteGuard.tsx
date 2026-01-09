"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { canAccessRouteAction } from "@/features/auth-rbac/server/presentation/actions/permission.actions";

interface RouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Intervalo para verificación silenciosa de permisos (1 minuto)
 * Detecta si un admin cambió los permisos del usuario
 */
const SILENT_PERMISSION_CHECK_INTERVAL = 60000; // 1 minuto

/**
 * RouteGuard - Componente que protege rutas basándose en permisos del tenant activo
 *
 * Características:
 * - Verifica permisos en la carga inicial (con loading)
 * - Verifica permisos silenciosamente cada minuto (sin loading)
 * - Si detecta pérdida de permisos, redirige a /access-denied
 * - No interrumpe al usuario con recargas innecesarias
 */
export function RouteGuard({ children, fallback }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenant, isLoading: isTenantLoading } = useTenant();

  const [isInitialCheck, setIsInitialCheck] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Ref para evitar múltiples checks simultáneos
  const isCheckingRef = useRef(false);

  /**
   * Verifica acceso a la ruta actual
   * @param silent - Si es true, no muestra loading ni actualiza isInitialCheck
   */
  const checkAccess = useCallback(
    async (silent: boolean = false) => {
      // Evitar checks simultáneos
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        const result = await canAccessRouteAction(
          pathname,
          tenant?.id || null
        );

        if (!result.canAccess) {
          // Sin acceso - redirigir
          // Usar replace para no agregar al historial
          router.replace("/access-denied");
          setHasAccess(false);
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error("Error checking route access:", error);
        // FAIL-CLOSED: En caso de error, denegar acceso por seguridad
        // Esto previene acceso no autorizado si hay problemas de red o servidor
        if (!silent) {
          setHasAccess(false);
          router.replace("/access-denied?error=verification_failed");
        }
        // Si es silent (verificación periódica), mantener estado actual
        // para no interrumpir al usuario por errores temporales
      } finally {
        isCheckingRef.current = false;
        if (!silent) {
          setIsInitialCheck(false);
        }
      }
    },
    [pathname, tenant?.id, router]
  );

  // Verificación inicial cuando cambia el pathname o tenant
  useEffect(() => {
    if (isTenantLoading) return;

    // Reset para nueva ruta
    setIsInitialCheck(true);
    setHasAccess(false);

    checkAccess(false); // Verificación con loading
  }, [pathname, tenant?.id, isTenantLoading, checkAccess]);

  // Verificación silenciosa periódica
  useEffect(() => {
    // Solo iniciar después de la verificación inicial exitosa
    if (isTenantLoading || isInitialCheck || !hasAccess) return;

    const interval = setInterval(() => {
      checkAccess(true); // Verificación silenciosa
    }, SILENT_PERMISSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isTenantLoading, isInitialCheck, hasAccess, checkAccess]);

  // Loading solo durante la verificación inicial
  if (isTenantLoading || isInitialCheck) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-background">
          <div
            className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent 
                        border-gray-900 dark:border-foreground/20 dark:border-t-transparent"
            role="status"
            aria-label="Verificando permisos..."
          />
        </div>
      )
    );
  }

  // Si no tiene acceso, no mostrar nada (se está redirigiendo)
  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
