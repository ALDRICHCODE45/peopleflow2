export interface PasswordResetEmailData {
  recipientName?: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function generatePasswordResetEmail(
  data: PasswordResetEmailData
): string {
  const { recipientName, resetUrl, expiresInMinutes } = data;
  const greeting = recipientName ? `Hola ${recipientName}` : "Hola";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Restablecer Contraseña - PeopleFlow</title>
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
                Restablecer Contraseña
              </h1>

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1c1917;">
                ${greeting},
              </p>

              <!-- Message -->
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en PeopleFlow. Haz clic en el boton de abajo para crear una nueva contraseña:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-radius: 8px; background-color: #9333ea;">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                            Restablecer Contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #71717a; text-align: center;">
                Si el boton no funciona, copia y pega el siguiente enlace en tu navegador:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #9333ea; word-break: break-all; text-align: center;">
                ${resetUrl}
              </p>

              <!-- Expiration Warning -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #fef3c7; border-radius: 8px; padding: 16px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400e; text-align: center;">
                      <strong>Este enlace expira en ${expiresInMinutes} minutos.</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                Si no solicitaste restablecer tu contraseña, puedes ignorar este correo. Tu cuenta permanece segura y tu contraseña no sera modificada.
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
                Este correo fue enviado porque se solicito restablecer la contraseña de tu cuenta.
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

export function generatePasswordResetPlainText(
  data: PasswordResetEmailData
): string {
  const { recipientName, resetUrl, expiresInMinutes } = data;
  const greeting = recipientName ? `Hola ${recipientName}` : "Hola";

  return `
Restablecer Contraseña

${greeting},

Recibimos una solicitud para restablecer la contraseña de tu cuenta en PeopleFlow.

Para crear una nueva contraseña, visita el siguiente enlace:

${resetUrl}

Este enlace expira en ${expiresInMinutes} minutos.

Si no solicitaste restablecer tu contraseña, puedes ignorar este correo. Tu cuenta permanece segura y tu contraseña no sera modificada.

---
© 2025 PeopleFlow
Tu sistema de gestion empresarial
`.trim();
}
