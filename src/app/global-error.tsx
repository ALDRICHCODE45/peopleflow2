"use client";

import { useEffect, useRef } from "react";

const MAX_AUTO_RETRIES = 3;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const retryCount = useRef(0);
  const hasExhaustedRetries = retryCount.current >= MAX_AUTO_RETRIES;

  useEffect(() => {
    console.error("Global error:", error);
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
      <html lang="es">
        <body>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  margin: "0 auto 16px",
                  border: "3px solid #e2e8f0",
                  borderTopColor: "#6366f1",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p style={{ color: "#64748b", fontSize: "14px" }}>
                Cargando...
              </p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <body>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: "400px",
              width: "100%",
              margin: "0 16px",
              padding: "32px",
              background: "white",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#0f172a",
                marginBottom: "8px",
              }}
            >
              Algo salió mal
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              Ocurrió un error inesperado. Puedes intentar recargar la página o
              seleccionar otra organización.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <button
                onClick={() => {
                  retryCount.current = 0;
                  reset();
                }}
                style={{
                  padding: "10px 20px",
                  background: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Reintentar
              </button>
              <a
                href="/select-tenant"
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  color: "#6366f1",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "block",
                }}
              >
                Seleccionar otra organización
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
