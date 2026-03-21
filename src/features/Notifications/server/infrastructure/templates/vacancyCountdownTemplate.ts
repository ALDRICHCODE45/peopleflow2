export interface VacancyCountdownData {
  recipientName: string;
  vacancyPosition: string;
  clientName: string;
  daysRemaining: number;
  targetDate: string;
  vacancyId: string;
  appUrl: string;
}

function getCountdownMessage(
  daysRemaining: number,
  vacancyPosition: string,
  clientName: string,
): string {
  if (daysRemaining === 0) {
    return `¡Hoy es el último día! La fecha tentativa de entrega de la vacante <strong style="color: #9333ea;">${vacancyPosition}</strong> (${clientName}) es hoy. Si aún no has entregado tu terna, es momento de hacerlo.`;
  }
  if (daysRemaining === 1) {
    return `¡Mañana es la fecha tentativa de entrega! Asegurate de que todo esté listo para la vacante <strong style="color: #9333ea;">${vacancyPosition}</strong> (${clientName}).`;
  }
  return `Faltan <strong>${daysRemaining} días</strong> para la fecha tentativa de entrega de la vacante <strong style="color: #9333ea;">${vacancyPosition}</strong> (${clientName}). Asegurate de tener los candidatos listos.`;
}

function getCountdownPlainMessage(
  daysRemaining: number,
  vacancyPosition: string,
  clientName: string,
): string {
  if (daysRemaining === 0) {
    return `¡Hoy es el último día! La fecha tentativa de entrega de la vacante "${vacancyPosition}" (${clientName}) es hoy. Si aún no has entregado tu terna, es momento de hacerlo.`;
  }
  if (daysRemaining === 1) {
    return `¡Mañana es la fecha tentativa de entrega! Asegurate de que todo esté listo para la vacante "${vacancyPosition}" (${clientName}).`;
  }
  return `Faltan ${daysRemaining} días para la fecha tentativa de entrega de la vacante "${vacancyPosition}" (${clientName}). Asegurate de tener los candidatos listos.`;
}

function getCountdownTitle(daysRemaining: number): string {
  if (daysRemaining === 0) return "¡Hoy es el Día de Entrega!";
  if (daysRemaining === 1) return "¡Mañana es la Fecha de Entrega!";
  return `Faltan ${daysRemaining} Días para la Entrega`;
}

function getUrgencyColor(daysRemaining: number): {
  bg: string;
  border: string;
  text: string;
} {
  if (daysRemaining === 0) return { bg: "#fef2f2", border: "#ef4444", text: "#991b1b" };
  if (daysRemaining === 1) return { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" };
  return { bg: "#f3e8ff", border: "#9333ea", text: "#6b21a8" };
}

export function generateVacancyCountdownEmail(
  data: VacancyCountdownData,
): string {
  const {
    recipientName,
    vacancyPosition,
    clientName,
    daysRemaining,
    targetDate,
    vacancyId,
    appUrl,
  } = data;
  const vacancyUrl = `${appUrl}/reclutamiento/vacantes/${vacancyId}`;
  const title = getCountdownTitle(daysRemaining);
  const message = getCountdownMessage(daysRemaining, vacancyPosition, clientName);
  const urgency = getUrgencyColor(daysRemaining);
  const formattedDate = new Date(targetDate).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title} - PeopleFlow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 32px 40px 24px 40px; background-color: #ffffff;">
              <img src="https://res.cloudinary.com/dpvxqsf6s/image/upload/b_rgb:FFFFFF/v1769654329/logo-principal_b47vfa.webp" alt="PeopleFlow" width="180" style="display: block; max-width: 180px; height: auto; background-color: #ffffff;">
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-bottom: 1px solid #e4e4e7;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <!-- Title -->
              <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #1c1917; text-align: center;">
                ${title}
              </h1>

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1c1917;">
                ¡Hola <strong>${recipientName}</strong>!
              </p>

              <!-- Message -->
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                ${message}
              </p>

              <!-- Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: ${urgency.bg}; border-left: 4px solid ${urgency.border}; border-radius: 4px; padding: 16px;">
                    <p style="margin: 0; font-size: 14px; color: ${urgency.text}; line-height: 1.5;">
                      <strong>Fecha tentativa de entrega:</strong> ${formattedDate}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${vacancyUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; background-color: #9333ea; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Ver Vacante
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
                      &copy; 2025 PeopleFlow
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                      Tu sistema de gestion empresarial
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Footer Links -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td align="center" style="padding: 24px 20px;">
              <p style="margin: 0; font-size: 12px; color: #71717a;">
                Este correo es un recordatorio de entrega de vacante en PeopleFlow.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function generateVacancyCountdownPlainText(
  data: VacancyCountdownData,
): string {
  const {
    recipientName,
    vacancyPosition,
    clientName,
    daysRemaining,
    targetDate,
    vacancyId,
    appUrl,
  } = data;
  const vacancyUrl = `${appUrl}/reclutamiento/vacantes/${vacancyId}`;
  const title = getCountdownTitle(daysRemaining);
  const message = getCountdownPlainMessage(daysRemaining, vacancyPosition, clientName);
  const formattedDate = new Date(targetDate).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
${title}

¡Hola ${recipientName}!

${message}

Fecha tentativa de entrega: ${formattedDate}

Ver vacante: ${vacancyUrl}

---
© 2025 PeopleFlow
Tu sistema de gestion empresarial
`.trim();
}
