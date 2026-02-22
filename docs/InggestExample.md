Arquitectura de Notificaciones Basada en Eventos (Inngest)
Esta implementación utiliza un enfoque Event-Driven para gestionar notificaciones automáticas en un CRM, eliminando la necesidad de CRON jobs pesados o polling de base de datos.

1. El Disparador Universal (Backend)
Cada vez que un Lead tiene actividad o cambia de estado, el backend emite un evento. Este es el único punto de contacto entre tu lógica de negocio y el sistema de notificaciones.

JavaScript
// Ejemplo de emisión al cambiar estado
await inngest.send({
  name: "lead/status.changed",
  data: {
    leadId: "123",
    currentStatus: "Contacto Cálido",
    inactivityDays: 16 // Configurado por el usuario en la UI
  }
});

// Ejemplo de emisión al detectar cualquier actividad (mensaje, nota, etc.)
await inngest.send({
  name: "lead/activity.detected",
  data: { leadId: "123" }
});
2. Flujo A: Notificación por Cambio de Estado (Inmediata)
Este flujo reacciona al instante cuando un lead entra en un estado específico que el usuario ha marcado en la configuración.

JavaScript
export const notifyStatusChange = inngest.createFunction(
  { id: "notify-status-change" },
  { event: "lead/status.changed" },
  async ({ event, step }) => {
    const { leadId, currentStatus } = event.data;

    // Paso 1: Verificar en la configuración del usuario si este estado debe notificar
    const shouldNotify = await step.run("check-config", async () => {
      const config = await db.notificationSettings.findFirst();
      return config.notifyOnStates.includes(currentStatus);
    });

    if (!shouldNotify) return;

    // Paso 2: Enviar la notificación
    await step.run("send-email", async () => {
      await emailService.send({
        to: "vendedor@empresa.com",
        subject: `Nuevo lead en estado: ${currentStatus}`,
        body: `El lead ${leadId} ha pasado a ${currentStatus}.`
      });
    });
  }
);
3. Flujo B: Notificación por Inactividad (Diferida y Cancelable)
Este es el flujo más complejo. La función se "duerme" y solo se ejecuta si no recibe una señal de cancelación (un nuevo cambio de estado o actividad).

JavaScript
export const notifyInactivity = inngest.createFunction(
  { 
    id: "lead-inactivity-notification",
    // RETO: Cancelar si ocurre cualquiera de estos eventos antes de que termine el tiempo
    cancelOn: [
      { 
        event: "lead/status.changed",   // Si el lead cambia de estado, esta espera ya no es válida
        match: "data.leadId" 
      },
      { 
        event: "lead/activity.detected", // Si hay actividad (mensaje/llamada), el contador vuelve a cero
        match: "data.leadId" 
      }
    ]
  },
  { event: "lead/status.changed" }, // Se dispara cada vez que el lead entra en un estado
  async ({ event, step }) => {
    const { leadId, currentStatus, inactivityDays } = event.data;

    // Paso 1: Dormir la función por el tiempo configurado en la UI (ej. 16 días)
    // Durante este tiempo, la función no consume recursos del servidor.
    await step.sleep("wait-for-inactivity", `${inactivityDays}d`);

    // Paso 2: Doble verificación de seguridad al "despertar"
    // Validamos que el lead siga existiendo y siga en el mismo estado que disparó la función
    const leadStatusCheck = await step.run("verify-current-status", async () => {
      const lead = await db.lead.findUnique({ where: { id: leadId } });
      return lead?.status === currentStatus;
    });

    // Paso 3: Si el lead nunca se movió y no hubo actividad (no se canceló), notificamos
    if (leadStatusCheck) {
      await step.run("send-inactivity-alert", async () => {
        await emailService.send({
          to: "vendedor@empresa.com",
          subject: `ALERTA: Lead sin actividad`,
          body: `El lead ${leadId} lleva ${inactivityDays} días en ${currentStatus} sin movimientos.`
        });
      });
    }
  }
);
Puntos clave para la IA:
cancelOn: Es el mecanismo que resuelve la escalabilidad. Si un lead se mueve 10 veces de estado en un día, Inngest matará automáticamente las 9 funciones anteriores y solo dejará la última "durmiendo".

step.sleep: No es un setTimeout. Es un estado persistente en la infraestructura de Inngest, lo que permite que el VPS (Hostinger/Coolify) esté libre de carga.

Idempotencia: Al usar step.run, aseguramos que si hay un error de red, el correo no se envíe dos veces.
