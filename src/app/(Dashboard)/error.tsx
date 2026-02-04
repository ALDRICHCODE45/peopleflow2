"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "@shadcn/spinner";
import { Button } from "@shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shadcn/card";

const MAX_AUTO_RETRIES = 3;

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const retryCount = useRef(0);
  const hasExhaustedRetries = retryCount.current >= MAX_AUTO_RETRIES;

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  useEffect(() => {
    if (retryCount.current < MAX_AUTO_RETRIES) {
      const timeout = setTimeout(() => {
        retryCount.current += 1;
        reset();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [reset]);

  if (!hasExhaustedRetries) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-background">
        <Spinner className="size-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-background">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="size-6 text-destructive"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <CardTitle>Algo salió mal</CardTitle>
          <CardDescription>
            Ocurrió un error inesperado. Puedes intentar recargar o seleccionar
            otra organización.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button
            onClick={() => {
              retryCount.current = 0;
              reset();
            }}
          >
            Reintentar
          </Button>
          <Button variant="outline" asChild>
            <a href="/select-tenant">Seleccionar otra organización</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
