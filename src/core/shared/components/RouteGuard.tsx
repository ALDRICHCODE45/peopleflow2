"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTenant } from "@/features/tenants/frontend/context/TenantContext";
import { canAccessRouteAction } from "@/features/auth-rbac/server/presentation/actions/permission.actions";
import { Spinner } from "@shadcn/spinner";

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
 * - NO desmonta los children durante navegación para preservar estado del sidebar
 * - Usa un overlay semitransparente durante verificación de navegación
 */
export function RouteGuard({ children, fallback }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenant, isLoading: isTenantLoading } = useTenant();

  const [isInitialCheck, setIsInitialCheck] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [wasAccessGranted, setWasAccessGranted] = useState(false);

  // Ref para evitar múltiples checks simultáneos
  const isCheckingRef = useRef(false);
  const previousPathRef = useRef<string | null>(null);

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
        const result = await canAccessRouteAction(pathname, tenant?.id || null);

        if (!result.canAccess) {
          // Sin acceso - redirigir
          // Usar replace para no agregar al historial
          router.replace("/access-denied");
          setHasAccess(false);
          return;
        }

        setHasAccess(true);
        setWasAccessGranted(true);
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
    [pathname, tenant?.id, router],
  );

  // Verificación cuando cambia el pathname o tenant
  useEffect(() => {
    if (isTenantLoading) return;

    const isNavigating =
      previousPathRef.current !== null && previousPathRef.current !== pathname;
    previousPathRef.current = pathname;

    if (isNavigating && wasAccessGranted) {
      // Navegación con acceso previo: overlay sin desmontar children
      setIsInitialCheck(true);
      // No resetear hasAccess - mantener children montados
      checkAccess(false);
    } else if (!wasAccessGranted) {
      // Primera carga: verificación completa con loading
      setIsInitialCheck(true);
      setHasAccess(false);
      checkAccess(false);
    } else {
      // Mismo pathname, ya con acceso - verificación silenciosa
      checkAccess(true);
    }
  }, [pathname, tenant?.id, isTenantLoading, checkAccess, wasAccessGranted]);

  // Verificación silenciosa periódica
  useEffect(() => {
    // Solo iniciar después de la verificación inicial exitosa
    if (isTenantLoading || isInitialCheck || !hasAccess) return;

    const interval = setInterval(() => {
      checkAccess(true); // Verificación silenciosa
    }, SILENT_PERMISSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isTenantLoading, isInitialCheck, hasAccess, checkAccess]);

  // Primera carga - loading completo (antes de tener acceso por primera vez)
  if ((isTenantLoading || isInitialCheck) && !wasAccessGranted) {
    return (
      fallback || (
        <div
          className="flex items-center justify-center min-h-screen bg-white
  dark:bg-background"
        >
          <Spinner className="size-10 text-primary" />
        </div>
      )
    );
  }

  // Sin acceso y no verificando - se está redirigiendo
  if (!hasAccess && !isInitialCheck) {
    return null;
  }

  // Con acceso (o verificando durante navegación)
  // Los children permanecen montados para preservar el estado del sidebar
  return (
    <div className="relative min-h-screen">
      {/* Overlay de verificación durante navegación - no desmonta children */}
      {isInitialCheck && wasAccessGranted && (
        <div
          className="absolute inset-0 z-[100] flex items-center justify-center
                     bg-white/60 dark:bg-background/60 backdrop-blur-[2px]
                     transition-opacity duration-150"
        >
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent
                        border-gray-600 dark:border-foreground/40"
            role="status"
            aria-label="Verificando permisos..."
          />
        </div>
      )}
      {children}
    </div>
  );
}
