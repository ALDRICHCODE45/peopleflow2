export interface PasswordChangeCampaignEmailData {
  recipientName?: string;
  forgotPasswordUrl: string;
}

export function generatePasswordChangeCampaignEmail(
  data: PasswordChangeCampaignEmailData
): string {
  const { recipientName, forgotPasswordUrl } = data;
  const greeting = recipientName ? `Hola ${recipientName}` : "Hola";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Actualiza tu contraseña - PeopleFlow</title>
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
                Actualiza tu contraseña
              </h1>

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1c1917;">
                ${greeting},
              </p>

              <!-- Message -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Como parte de nuestras buenas prácticas de seguridad, te invitamos a actualizar la contraseña de tu cuenta de PeopleFlow.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Es especialmente importante si todavía estás usando la contraseña que te asignamos al darte de alta. Tener una contraseña personal y robusta protege tu información y la de tu equipo.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-radius: 8px; background-color: #9333ea;">
                          <a href="${forgotPasswordUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                            Cambiar mi contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #71717a; text-align: center;">
                Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #9333ea; word-break: break-all; text-align: center;">
                ${forgotPasswordUrl}
              </p>

              <!-- Steps -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #f5f3ff; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #6b21a8;">
                      ¿Cómo funciona?
                    </p>
                    <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.7; color: #3f3f46;">
                      <li>Hacé clic en el botón de arriba.</li>
                      <li>Ingresá tu correo y pedí el enlace de cambio.</li>
                      <li>Vas a recibir un correo con un enlace seguro para crear tu nueva contraseña.</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- Recommendations -->
              <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1c1917;">
                Recomendaciones para una buena contraseña
              </p>
              <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; line-height: 1.7; color: #3f3f46;">
                <li>Al menos 8 caracteres.</li>
                <li>Combiná mayúsculas, minúsculas, números y símbolos.</li>
                <li>Evitá datos personales fáciles de adivinar.</li>
                <li>No la reutilices de otros sitios.</li>
              </ul>

              <!-- Security Note -->
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                Si tenés alguna duda o algo no funciona, contactá al administrador de tu organización.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
                      &copy; ${new Date().getFullYear()} PeopleFlow
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                      Tu sistema de gestión empresarial
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
                Recibiste este correo porque sos usuario activo de PeopleFlow.
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

export function generatePasswordChangeCampaignPlainText(
  data: PasswordChangeCampaignEmailData
): string {
  const { recipientName, forgotPasswordUrl } = data;
  const greeting = recipientName ? `Hola ${recipientName}` : "Hola";

  return `
Actualiza tu contraseña

${greeting},

Como parte de nuestras buenas prácticas de seguridad, te invitamos a actualizar la contraseña de tu cuenta de PeopleFlow.

Es especialmente importante si todavía estás usando la contraseña que te asignamos al darte de alta. Tener una contraseña personal y robusta protege tu información y la de tu equipo.

¿Cómo funciona?
1. Visitá el siguiente enlace.
2. Ingresá tu correo y pedí el enlace de cambio.
3. Vas a recibir un correo con un enlace seguro para crear tu nueva contraseña.

Enlace:
${forgotPasswordUrl}

Recomendaciones para una buena contraseña:
- Al menos 8 caracteres.
- Combiná mayúsculas, minúsculas, números y símbolos.
- Evitá datos personales fáciles de adivinar.
- No la reutilices de otros sitios.

Si tenés alguna duda o algo no funciona, contactá al administrador de tu organización.

---
© ${new Date().getFullYear()} PeopleFlow
Tu sistema de gestión empresarial
`.trim();
}
