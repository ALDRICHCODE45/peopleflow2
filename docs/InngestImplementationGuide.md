# Guía Completa de Implementación — Inngest en Next.js

Guía práctica para implementar Inngest (background jobs event-driven) en un proyecto Next.js con TypeScript. Basada en la implementación real de PeopleFlow2.

---

## Tabla de Contenidos

1. [Qué es Inngest y cuándo usarlo](#1-qué-es-inngest-y-cuándo-usarlo)
2. [Instalación y Setup Inicial](#2-instalación-y-setup-inicial)
3. [Configuración del Cliente Inngest](#3-configuración-del-cliente-inngest)
4. [API Route — Servir funciones a Inngest](#4-api-route--servir-funciones-a-inngest)
5. [Definir y Registrar Funciones](#5-definir-y-registrar-funciones)
6. [Emitir Eventos desde tu Código](#6-emitir-eventos-desde-tu-código)
7. [Patrones Avanzados](#7-patrones-avanzados)
8. [Cola Genérica de Emails (Discriminated Union)](#8-cola-genérica-de-emails-discriminated-union)
9. [Templates de Email HTML](#9-templates-de-email-html)
10. [Inngest Dev Server — Desarrollo Local](#10-inngest-dev-server--desarrollo-local)
11. [Variables de Entorno](#11-variables-de-entorno)
12. [Estructura de Archivos Recomendada](#12-estructura-de-archivos-recomendada)
13. [Self-Hosting vs Cloud](#13-self-hosting-vs-cloud)
14. [Checklist de Implementación](#14-checklist-de-implementación)

---

## 1. Qué es Inngest y cuándo usarlo

Inngest es un motor de background jobs event-driven. En vez de CRON jobs o colas (BullMQ, SQS), declarás funciones que reaccionan a eventos.

**Usalo para:**
- Enviar emails de forma asíncrona (no bloquear la respuesta HTTP)
- Notificaciones diferidas (`step.sleep` / `step.sleepUntil`)
- Alertas de inactividad — "si no pasa nada en X días, notificame"
- Workflows multi-paso con reintentos automáticos
- Tareas periódicas (CRON) declarativas

**NO lo uses para:**
- Lógica que necesita respuesta inmediata al usuario
- Operaciones CRUD simples
- Cosas que se pueden resolver con un `revalidatePath`

**Concepto clave:** cada `step.run()` es **idempotente y durable** — si el servidor se cae a mitad de ejecución, Inngest retoma desde el último step completado, no desde cero.

---

## 2. Instalación y Setup Inicial

### Instalar el paquete

```bash
# Con bun
bun add inngest

# Con npm
npm install inngest

# Con pnpm
pnpm add inngest
```

### Instalar el CLI para desarrollo local

```bash
# No necesita instalación global — se usa con npx
npx inngest-cli@latest dev
```

Agregar script al `package.json`:

```json
{
  "scripts": {
    "inngest:dev": "npx inngest-cli@latest dev"
  }
}
```

---

## 3. Configuración del Cliente Inngest

El cliente es un **singleton** que se usa para:
1. Emitir eventos (`inngest.send(...)`)
2. Crear funciones (`inngest.createFunction(...)`)
3. Tipar eventos con TypeScript (`EventSchemas`)

### Archivo: `src/core/shared/inngest/inngest.ts`

```typescript
import { Inngest, EventSchemas } from "inngest";

// 1. Definir el schema de TODOS los eventos del sistema
type Events = {
  // Nombre del evento: "dominio/accion"
  "lead/status.changed": {
    data: {
      leadId: string;
      tenantId: string;
      oldStatus: string;
      newStatus: string;
      companyName: string;
      assignedToId: string | null;
      changedById: string;
    };
  };
  "vacancy/status.changed": {
    data: {
      vacancyId: string;
      tenantId: string;
      oldStatus: string;
      newStatus: string;
      vacancyPosition: string;
      clientName: string;
      recruiterId: string;
      recruiterName: string;
      recruiterEmail: string;
    };
  };
  "email/send": {
    data: StandaloneEmailPayload; // Ver sección 8
  };
};

// 2. Crear el cliente con tipado fuerte
export const inngest = new Inngest({
  id: "my-app",           // ID único de tu aplicación
  name: "My App",         // Nombre para el dashboard
  schemas: new EventSchemas().fromRecord<Events>(),
});
```

### Puntos clave del tipado

- `Events` es un `Record<string, { data: T }>` — cada key es el nombre del evento
- La convención de nombres es `"dominio/accion"` (e.g., `"lead/status.changed"`, `"email/send"`)
- `EventSchemas().fromRecord<Events>()` le da **autocompletado y type-safety** a `inngest.send()` y `inngest.createFunction()`
- Si emitís un evento con datos que no matchean el schema, TypeScript te lo marca en rojo

---

## 4. API Route — Servir funciones a Inngest

Inngest necesita un endpoint HTTP para descubrir y ejecutar tus funciones. En Next.js App Router, esto se hace con un API Route.

### Archivo: `src/app/api/inngest/route.ts`

```typescript
import { serve } from "inngest/next";
import { inngest } from "@core/shared/inngest/inngest";
import { functions } from "@core/shared/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
```

**Eso es todo.** Inngest se comunica con este endpoint para:
- `GET /api/inngest` — descubrir qué funciones están registradas
- `POST /api/inngest` — ejecutar funciones cuando llega un evento
- `PUT /api/inngest` — sincronizar funciones (deploy)

### Integración con otros frameworks

```typescript
// Express
import { serve } from "inngest/express";

// Fastify
import { serve } from "inngest/fastify";

// Hono
import { serve } from "inngest/hono";
```

Inngest soporta múltiples frameworks — solo cambia el import del `serve`.

---

## 5. Definir y Registrar Funciones

Las funciones son la unidad de trabajo de Inngest. Cada función:
- Reacciona a UN evento específico
- Se ejecuta en background (no bloquea la request HTTP)
- Tiene reintentos automáticos por step

### Archivo: `src/core/shared/inngest/functions.ts`

```typescript
import { inngest } from "./inngest";

// Función básica: reaccionar a un evento
const handleOrderCreated = inngest.createFunction(
  {
    id: "handle-order-created",         // ID único (slug, sin espacios)
    name: "Procesar nueva orden",       // Nombre legible (para el dashboard)
  },
  { event: "order/created" },           // El evento que dispara esta función
  async ({ event, step }) => {
    // event.data tiene el tipo exacto que definiste en Events
    const { orderId, customerEmail } = event.data;

    // Step 1: Buscar datos
    const order = await step.run("fetch-order", async () => {
      return await db.order.findUnique({ where: { id: orderId } });
    });

    if (!order) return { skipped: true, reason: "Order not found" };

    // Step 2: Enviar email
    await step.run("send-confirmation-email", async () => {
      await emailService.send({
        to: customerEmail,
        subject: `Orden #${orderId} confirmada`,
        body: "...",
      });
    });

    return { sent: true };
  }
);

// IMPORTANTE: exportar TODAS las funciones en un array
export const functions = [
  handleOrderCreated,
  // ... más funciones
];
```

### Reglas de `step.run()`

1. **Cada step tiene un ID único** — string descriptivo, sin duplicados dentro de la misma función
2. **Cada step es idempotente** — si falla, Inngest reintenta SOLO ese step
3. **El valor de retorno se memoriza** — si el step ya corrió exitosamente y la función se reintenta, Inngest usa el resultado cacheado
4. **Nunca hagas side-effects FUERA de un step** — todo lo que interactúe con DB, APIs, o servicios externos va dentro de `step.run()`

```typescript
// BIEN — side-effect dentro de step
await step.run("update-db", async () => {
  await db.order.update({ where: { id }, data: { status: "SENT" } });
});

// MAL — side-effect fuera de step (no tiene reintentos ni idempotencia)
await db.order.update({ where: { id }, data: { status: "SENT" } });
```

---

## 6. Emitir Eventos desde tu Código

Los eventos se emiten con `inngest.send()`. Hay dos patrones según el contexto:

### Patrón 1: Fire-and-forget (desde Server Actions / Use Cases)

Cuando el evento es un side-effect NO crítico — si falla, no querés que la operación principal falle.

```typescript
"use server";
import { inngest } from "@core/shared/inngest/inngest";

export async function updateLeadStatusAction(input: UpdateLeadInput) {
  // ... lógica principal ...

  // Emitir evento como side-effect (fire-and-forget)
  inngest
    .send({
      name: "lead/status.changed",
      data: {
        leadId: input.leadId,
        tenantId: input.tenantId,
        oldStatus,
        newStatus: input.newStatus,
        companyName: lead.companyName,
        assignedToId: lead.assignedToId,
        changedById: input.userId,
      },
    })
    .catch((err) => console.error("Error emitting Inngest event:", err));

  // Retornar sin esperar a que el evento se procese
  return { success: true, lead };
}
```

**Importante:** el `.catch()` al final es intencional — NO usás `await`. Si Inngest está caído, la operación principal sigue funcionando.

### Patrón 2: Await (cuando el evento es parte del flujo)

Cuando NECESITÁS que el evento se emita antes de continuar.

```typescript
// Emitir y esperar confirmación
await inngest.send({
  name: "email/send",
  data: {
    template: "recruiter-vacancy-assigned",
    tenantId,
    triggeredById: session.user.id,
    data: { /* ... */ },
  },
});
```

### Constantes de eventos (evitar strings mágicos)

Definí constantes para los nombres de eventos:

```typescript
// src/core/shared/constants/inngest-events.ts
export const InngestEvents = {
  lead: {
    statusChanged: "lead/status.changed",
  },
  vacancy: {
    prePlacementEntered: "vacancy/pre-placement.entered",
    placementCongratsEmail: "vacancy/placement.congrats-email",
    countdownSchedule: "vacancy/countdown.schedule",
    statusChanged: "vacancy/status.changed",
  },
  email: {
    send: "email/send",
  },
} as const;
```

Usá las constantes en vez de strings:

```typescript
// BIEN
inngest.send({ name: InngestEvents.lead.statusChanged, data: { ... } });

// MAL
inngest.send({ name: "lead/status.changed", data: { ... } });
```

---

## 7. Patrones Avanzados

### 7.1 Sleep — Esperar un tiempo antes de continuar

```typescript
const alertInactivity = inngest.createFunction(
  { id: "alert-inactivity" },
  { event: "lead/status.changed" },
  async ({ event, step }) => {
    const { leadId, newStatus } = event.data;

    // Dormir 16 días (NO consume recursos del servidor)
    await step.sleep("wait-for-inactivity", "16d");

    // Después de 16 días, verificar si el lead sigue igual
    const lead = await step.run("verify-status", async () => {
      return db.lead.findUnique({ where: { id: leadId } });
    });

    if (lead?.status === newStatus) {
      // El lead no se movió — enviar alerta
      await step.run("send-alert", async () => {
        await sendEmail({ /* ... */ });
      });
    }
  }
);
```

**Formatos de duración:** `"30s"`, `"5m"`, `"2h"`, `"16d"`, `"1w"`

### 7.2 SleepUntil — Esperar hasta una fecha específica

```typescript
// Esperar hasta la fecha de ingreso del candidato
await step.sleepUntil("wait-until-entry-date", new Date(entryDate));
```

### 7.3 CancelOn — Cancelar si llega otro evento

Este es el patrón más poderoso de Inngest. Permite cancelar una función en ejecución (durmiendo) si llega un evento nuevo.

```typescript
const alertInactivity = inngest.createFunction(
  {
    id: "lead-inactivity-alert",
    cancelOn: [
      {
        event: "lead/status.changed",  // Si el lead cambia de estado...
        match: "data.leadId",           // ...y el leadId coincide → CANCELAR
      },
    ],
  },
  { event: "lead/status.changed" },
  async ({ event, step }) => {
    // Si el lead cambia de estado de nuevo antes de que termine el sleep,
    // esta instancia se cancela automáticamente.
    // La NUEVA instancia (disparada por el nuevo evento) toma su lugar.
    await step.sleep("wait", "16d");
    // ... enviar alerta
  }
);
```

**Caso de uso real:** un lead cambia de estado 10 veces en un día. Sin `cancelOn`, tendrías 10 funciones durmiendo. Con `cancelOn`, solo la última sobrevive — las 9 anteriores se cancelan automáticamente.

### 7.4 Countdown — Checkpoints antes de una fecha

Patrón para enviar recordatorios N días antes de una fecha límite:

```typescript
const countdownNotification = inngest.createFunction(
  {
    id: "vacancy-countdown",
    cancelOn: [
      {
        event: "vacancy/countdown.schedule",
        match: "data.vacancyId",
      },
    ],
  },
  { event: "vacancy/countdown.schedule" },
  async ({ event, step }) => {
    const { targetDeliveryDate, vacancyId } = event.data;
    const targetDate = new Date(targetDeliveryDate);

    // Checkpoints: 7 días antes, 3 días antes, 1 día antes
    const daysBefore = [7, 3, 1];

    for (const daysAhead of daysBefore) {
      const notifyDate = new Date(targetDate);
      notifyDate.setDate(notifyDate.getDate() - daysAhead);

      // Saltar si la fecha ya pasó
      if (notifyDate <= new Date()) continue;

      await step.sleepUntil(`wait-${daysAhead}d-before`, notifyDate);

      // Verificar que la vacante sigue activa
      const vacancy = await step.run(`check-vacancy-${daysAhead}d`, async () => {
        return db.vacancy.findUnique({ where: { id: vacancyId } });
      });

      if (!vacancy || vacancy.status === "COMPLETED") return;

      // Enviar recordatorio
      await step.run(`send-reminder-${daysAhead}d`, async () => {
        await sendEmail({
          subject: `Faltan ${daysAhead} días para la entrega`,
          // ...
        });
      });
    }

    // Checkpoint final: el día de la entrega
    await step.sleepUntil("wait-day-of", targetDate);
    // ... enviar notificación del día
  }
);
```

### 7.5 Loop Repetitivo — Alertas periódicas con safety cap

Patrón para enviar notificaciones repetidas mientras una condición se mantenga:

```typescript
const staleNotification = inngest.createFunction(
  {
    id: "vacancy-stale-notification",
    cancelOn: [
      {
        event: "vacancy/status.changed",
        match: "data.vacancyId",  // Si cambia de estado → cancelar loop
      },
    ],
  },
  { event: "vacancy/status.changed" },
  async ({ event, step }) => {
    const { vacancyId, newStatus } = event.data;

    // Espera inicial (threshold de "estancado")
    await step.sleep("wait-for-stale", "7d");

    // Verificar que sigue en el mismo estado
    const vacancy = await step.run("verify-status", async () => {
      return db.vacancy.findUnique({ where: { id: vacancyId } });
    });

    if (!vacancy || vacancy.status !== newStatus) return;

    // Loop de notificaciones repetidas
    let iteration = 0;
    const MAX_ITERATIONS = 52; // Safety cap: ~1 año de notificaciones semanales

    while (iteration < MAX_ITERATIONS) {
      // Re-verificar estado en cada iteración
      const current = await step.run(`verify-${iteration}`, async () => {
        return db.vacancy.findUnique({ where: { id: vacancyId } });
      });

      if (!current || current.status !== newStatus) return;

      // Enviar alerta
      await step.run(`send-alert-${iteration}`, async () => {
        await sendEmail({ /* ... */ });
      });

      iteration++;

      // Dormir hasta la próxima iteración
      await step.sleep(`repeat-wait-${iteration}`, "7d");
    }
  }
);
```

**Regla importante:** cada `step.run()` dentro de un loop DEBE tener un ID único — incluí el número de iteración: `send-alert-${iteration}`.

### 7.6 CRON — Funciones periódicas

```typescript
const dailyReport = inngest.createFunction(
  { id: "daily-report" },
  { cron: "0 8 * * *" },  // Todos los días a las 8am
  async ({ step }) => {
    // Generar y enviar reporte diario
    const data = await step.run("fetch-data", async () => {
      return db.order.findMany({ where: { createdAt: { gte: yesterday } } });
    });

    await step.run("send-report", async () => {
      await sendEmail({ /* ... */ });
    });
  }
);
```

---

## 8. Cola Genérica de Emails (Discriminated Union)

Para emails "fire-and-forget" (sin workflow complejo), usá UNA función genérica con discriminated union en vez de una función por cada tipo de email.

### Definir el tipo con discriminated union

```typescript
// En el archivo del cliente (inngest.ts)
export type StandaloneEmailPayload =
  | {
      template: "welcome-email";
      tenantId: string;
      triggeredById: string;
      data: {
        userName: string;
        userEmail: string;
      };
    }
  | {
      template: "order-confirmation";
      tenantId: string;
      triggeredById: string;
      data: {
        customerName: string;
        customerEmail: string;
        orderId: string;
        totalAmount: number;
      };
    }
  | {
      template: "password-reset";
      tenantId: string;
      triggeredById: string;
      data: {
        userName: string;
        userEmail: string;
        resetLink: string;
      };
    };

// En el tipo Events:
type Events = {
  "email/send": {
    data: StandaloneEmailPayload;
  };
  // ... otros eventos
};
```

### Función dispatcher con switch

```typescript
const handleSendStandaloneEmail = inngest.createFunction(
  {
    id: "handle-send-standalone-email",
    name: "Cola de emails standalone",
  },
  { event: "email/send" },
  async ({ event, step }) => {
    const payload = event.data;

    switch (payload.template) {
      case "welcome-email": {
        const { data, tenantId, triggeredById } = payload;
        await step.run("send-welcome-email", async () => {
          // TypeScript sabe que data tiene userName y userEmail
          await emailService.send({
            to: data.userEmail,
            subject: `Bienvenido ${data.userName}`,
            html: generateWelcomeEmail(data),
            text: generateWelcomePlainText(data),
          });
        });
        return { sent: true, template: payload.template };
      }

      case "order-confirmation": {
        const { data, tenantId } = payload;
        await step.run("send-order-confirmation", async () => {
          // TypeScript sabe que data tiene orderId y totalAmount
          await emailService.send({
            to: data.customerEmail,
            subject: `Orden #${data.orderId} confirmada`,
            html: generateOrderConfirmationEmail(data),
            text: generateOrderConfirmationPlainText(data),
          });
        });
        return { sent: true, template: payload.template };
      }

      // ... más cases

      default:
        return { skipped: true, reason: "Unknown template" };
    }
  }
);
```

### Para agregar un nuevo tipo de email

1. Agregar nuevo miembro a `StandaloneEmailPayload` (union type)
2. Crear el template HTML + plain text
3. Agregar un `case` en el switch
4. Emitir `inngest.send({ name: "email/send", data: { template: "nuevo-tipo", ... } })`

**Cuándo NO usar este patrón:** emails con workflows complejos (sleep, cancelOn, múltiples pasos) van en su propia función Inngest dedicada.

---

## 9. Templates de Email HTML

Cada template es una función pura que recibe datos y retorna HTML. Se exportan dos funciones: HTML y plain text.

### Archivo: `templates/welcomeTemplate.ts`

```typescript
export interface WelcomeEmailData {
  userName: string;
  appUrl: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): string {
  const { userName, appUrl } = data;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="padding: 32px 40px;">
              <h1 style="margin: 0 0 16px 0; color: #09090b;">
                Bienvenido, ${userName}
              </h1>
              <p style="margin: 0 0 24px 0; color: #71717a; line-height: 1.6;">
                Tu cuenta ha sido creada exitosamente.
              </p>
              <a href="${appUrl}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px;">
                Ir a la plataforma
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateWelcomePlainText(data: WelcomeEmailData): string {
  return `Bienvenido, ${data.userName}. Tu cuenta ha sido creada. Accede en: ${data.appUrl}`;
}
```

### Reglas de templates

- **Usar inline styles** — los clientes de email no soportan `<style>` ni CSS externo
- **Usar tablas para layout** — es el único layout confiable en email
- **Siempre tener versión plain text** — algunos clientes no renderizan HTML
- **Sin JS, sin CSS externo, sin web fonts** — máxima compatibilidad

---

## 10. Inngest Dev Server — Desarrollo Local

El Dev Server es un dashboard local que te permite ver eventos, funciones, y ejecuciones en tiempo real.

### Iniciar el Dev Server

```bash
# Primero levantar tu app Next.js
bun run dev

# En otra terminal, levantar Inngest Dev Server
bun run inngest:dev
# o directamente:
npx inngest-cli@latest dev
```

El Dev Server se abre en `http://localhost:8288` y automáticamente detecta tu API Route en `http://localhost:3000/api/inngest`.

### Qué podés hacer en el Dev Server

- **Ver funciones registradas** — confirma que tu `serve()` está funcionando
- **Emitir eventos manualmente** — para testear funciones sin disparar la acción real
- **Ver ejecuciones en curso** — logs de cada step, tiempos, reintentos
- **Ver funciones durmiendo** — sleeps y sleepUntils pendientes
- **Forzar ejecución** — despertar funciones que están en sleep
- **Ver errores** — stack traces de steps fallidos

### Si el Dev Server no detecta tus funciones

1. Verificá que `bun run dev` esté corriendo
2. Verificá que la URL `http://localhost:3000/api/inngest` responde (GET)
3. Si usás un puerto diferente, pasalo: `npx inngest-cli@latest dev -u http://localhost:4000/api/inngest`

---

## 11. Variables de Entorno

### Desarrollo local

```env
# No se necesitan env vars especiales.
# El SDK detecta automáticamente el Dev Server en localhost:8288.
# INNGEST_DEV=1 se activa solo si detecta el Dev Server.
```

### Producción — Inngest Cloud

```env
# Event Key: para enviar eventos (obtenido del dashboard cloud.inngest.com)
INNGEST_EVENT_KEY=your-event-key-here

# Signing Key: para verificar que las requests vienen de Inngest
INNGEST_SIGNING_KEY=signkey-xxxxxxxx

# Opcional: deshabilitar modo dev explícitamente
INNGEST_DEV=0
```

### Producción — Self-hosted

```env
# URL del servidor Inngest self-hosted
INNGEST_BASE_URL=https://inngest.yourdomain.com

# Event Key (generala vos)
INNGEST_EVENT_KEY=your-custom-event-key

# Signing Key (DEBE ser hex válido)
INNGEST_SIGNING_KEY=$(openssl rand -hex 32)

# CRÍTICO: SIEMPRE 0 en producción
# Si queda en 1, se saltea la verificación de signing key (INSEGURO)
INNGEST_DEV=0
```

### Variables SMTP (para el email provider)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

---

## 12. Estructura de Archivos Recomendada

```
src/
├── app/
│   └── api/
│       └── inngest/
│           └── route.ts              # API Route — serve({ client, functions })
├── core/
│   ├── shared/
│   │   ├── inngest/
│   │   │   ├── inngest.ts            # Cliente Inngest + tipos de eventos
│   │   │   └── functions.ts          # Todas las funciones Inngest + export array
│   │   └── constants/
│   │       └── inngest-events.ts     # Constantes de nombres de eventos
│   └── lib/
│       └── prisma.ts                 # Prisma client (si usás Prisma)
└── features/
    └── Notifications/
        └── server/
            ├── application/
            │   └── use-cases/
            │       └── SendNotificationUseCase.ts
            ├── infrastructure/
            │   ├── providers/
            │   │   └── EmailProvider.ts       # Nodemailer wrapper
            │   └── templates/
            │       ├── welcomeTemplate.ts      # generateXxxEmail + generateXxxPlainText
            │       ├── orderConfirmationTemplate.ts
            │       └── ...
            └── domain/
                ├── entities/
                │   └── Notification.ts
                └── interfaces/
                    ├── INotificationRepository.ts
                    └── INotificationProvider.ts
```

### Reglas de organización

| Archivo | Responsabilidad |
|---------|----------------|
| `inngest.ts` | Definir cliente + tipos de eventos + StandaloneEmailPayload |
| `functions.ts` | Definir TODAS las funciones + exportar array |
| `inngest-events.ts` | Constantes con nombres de eventos (evitar strings mágicos) |
| `route.ts` | Solo serve() — sin lógica |
| `templates/*.ts` | HTML + plain text — funciones puras |

---

## 13. Self-Hosting vs Cloud

### Inngest Cloud (cloud.inngest.com)

| Aspecto | Detalle |
|---------|---------|
| **Setup** | Cero infra — solo env vars |
| **Free tier** | 50,000 ejecuciones/mes |
| **Pro** | Desde $50/mes |
| **Dashboard** | cloud.inngest.com con historial completo |
| **Mejor para** | Proyectos pequeños/medianos, equipos que no quieren administrar infra |

### Self-Hosted (en tu VPS)

| Aspecto | Detalle |
|---------|---------|
| **Setup** | Docker + PostgreSQL + Redis |
| **Límites** | Sin límites artificiales |
| **Imagen Docker** | `inngest/inngest` |
| **Puertos** | 8288 (API+Dashboard), 8289 (WebSocket gateway) |
| **Dashboard** | Tu propio dashboard en tu dominio |
| **DB por defecto** | SQLite (NO para producción) |
| **DB producción** | PostgreSQL (`--postgres-uri`) + Redis (`--redis-uri`) |
| **Licencia** | SSPL — OK para uso interno, NO para ofrecer Inngest-as-a-Service |
| **Break-even vs cloud** | ~1-2M ejecuciones/mes |

### Docker Compose para self-hosting

```yaml
version: "3.8"
services:
  inngest:
    image: inngest/inngest:latest
    ports:
      - "8288:8288"
      - "8289:8289"
    command: >
      inngest start
        --postgres-uri postgresql://user:pass@postgres:5432/inngest
        --redis-uri redis://redis:6379
    environment:
      - INNGEST_SIGNING_KEY=${INNGEST_SIGNING_KEY}
      - INNGEST_EVENT_KEY=${INNGEST_EVENT_KEY}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: inngest
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - inngest_pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - inngest_redis_data:/data

volumes:
  inngest_pg_data:
  inngest_redis_data:
```

### Generar Signing Key

```bash
openssl rand -hex 32
```

### Diferencias en el código

**Ninguna.** El código de funciones Inngest NO cambia entre Cloud y Self-Hosted. Solo cambian las env vars:
- `INNGEST_BASE_URL` (solo self-hosted — apunta a tu servidor)
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`
- `INNGEST_DEV=0` (CRÍTICO en producción)

---

## 14. Checklist de Implementación

### Setup inicial

- [ ] Instalar `inngest` (`bun add inngest`)
- [ ] Crear cliente en `src/core/shared/inngest/inngest.ts`
- [ ] Crear archivo de funciones `src/core/shared/inngest/functions.ts`
- [ ] Crear API Route `src/app/api/inngest/route.ts`
- [ ] Crear constantes de eventos `src/core/shared/constants/inngest-events.ts`
- [ ] Agregar script `inngest:dev` al `package.json`

### Primera función

- [ ] Definir evento en `Events` type
- [ ] Agregar constante en `inngest-events.ts`
- [ ] Crear función con `inngest.createFunction()`
- [ ] Agregarla al array `functions`
- [ ] Emitir evento con `inngest.send()` desde un server action
- [ ] Testear con el Dev Server

### Emails

- [ ] Crear email provider (Nodemailer, Resend, etc.)
- [ ] Definir `StandaloneEmailPayload` discriminated union
- [ ] Crear función dispatcher `handleSendStandaloneEmail`
- [ ] Crear templates HTML + plain text
- [ ] Configurar env vars SMTP

### Producción

- [ ] Configurar env vars de producción (ver sección 11)
- [ ] Elegir Cloud vs Self-Hosted
- [ ] Verificar que `INNGEST_DEV=0` en producción
- [ ] Deploy y verificar en el dashboard que las funciones se registraron

---

## Referencia Rápida

```typescript
// Emitir evento
inngest.send({ name: "event/name", data: { ... } });

// Función básica
inngest.createFunction({ id: "x" }, { event: "y" }, async ({ event, step }) => { ... });

// Sleep
await step.sleep("id", "16d");

// Sleep until date
await step.sleepUntil("id", new Date("2025-01-01"));

// Cancel on event
cancelOn: [{ event: "other/event", match: "data.entityId" }]

// CRON
inngest.createFunction({ id: "x" }, { cron: "0 8 * * *" }, async ({ step }) => { ... });

// Step (idempotente, con reintentos)
const result = await step.run("step-id", async () => { return await db.query(); });
```
