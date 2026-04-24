export interface VacancyStatusFollowUpData {
  recruiterName: string;
  vacancyPosition: string;
  clientName: string;
  vacancyId: string;
  appUrl: string;
}

export function generateVacancyStatusFollowUpEmail(
  data: VacancyStatusFollowUpData
): string {
  const { recruiterName, vacancyPosition, clientName, vacancyId, appUrl } = data;
  const vacancyUrl = `${appUrl}/reclutamiento/vacantes?vacancyId=${vacancyId}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Candidatos Entregados - PeopleFlow</title>
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
                \u00a1Felicidades! Candidatos Entregados
              </h1>

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1c1917;">
                \u00a1Hola <strong>${recruiterName}</strong>!
              </p>

              <!-- Message -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                \u00a1Felicidades! Tus candidatos para la vacante <strong style="color: #9333ea;">${vacancyPosition}</strong> (<strong style="color: #9333ea;">${clientName}</strong>) han sido entregados al cliente. Ahora estamos en fase de <strong>Seguimiento</strong>.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Te recomendamos no dejar de buscar candidatos, ya que el cliente podr\u00eda solicitar m\u00e1s perfiles. \u00a1Sigue as\u00ed!
              </p>

              <!-- Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #f3e8ff; border-left: 4px solid #9333ea; border-radius: 4px; padding: 16px;">
                    <p style="margin: 0; font-size: 14px; color: #6b21a8; line-height: 1.5;">
                      La terna ha sido validada y los candidatos fueron presentados al cliente. Mant\u00e9n la b\u00fasqueda activa por si se necesitan perfiles adicionales.
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
                Este correo fue enviado porque la terna de tu vacante fue validada en PeopleFlow.
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

export function generateVacancyStatusFollowUpPlainText(
  data: VacancyStatusFollowUpData
): string {
  const { recruiterName, vacancyPosition, clientName, vacancyId, appUrl } = data;
  const vacancyUrl = `${appUrl}/reclutamiento/vacantes?vacancyId=${vacancyId}`;

  return `
\u00a1Felicidades! Candidatos Entregados

\u00a1Hola ${recruiterName}!

\u00a1Felicidades! Tus candidatos para la vacante "${vacancyPosition}" (${clientName}) han sido entregados al cliente. Ahora estamos en fase de Seguimiento.

Te recomendamos no dejar de buscar candidatos, ya que el cliente podr\u00eda solicitar m\u00e1s perfiles. \u00a1Sigue as\u00ed!

La terna ha sido validada y los candidatos fueron presentados al cliente. Mant\u00e9n la b\u00fasqueda activa por si se necesitan perfiles adicionales.

Ver vacante: ${vacancyUrl}

---
\u00a9 2025 PeopleFlow
Tu sistema de gestion empresarial
`.trim();
}
