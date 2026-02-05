export interface OTPVerificationEmailData {
  recipientName?: string;
  otp: string;
  expiresInMinutes: number;
}

export function generateOTPVerificationEmail(
  data: OTPVerificationEmailData
): string {
  const { recipientName, otp, expiresInMinutes } = data;
  const greeting = recipientName ? `Hola ${recipientName}` : "Hola";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Codigo de Verificacion - PeopleFlow</title>
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
                Codigo de Verificacion
              </h1>

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1c1917;">
                ${greeting},
              </p>

              <!-- Message -->
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Utiliza el siguiente codigo para verificar tu inicio de sesion en PeopleFlow:
              </p>

              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #f5f3ff; border: 2px solid #9333ea; border-radius: 12px; padding: 20px 40px;">
                          <span style="font-size: 36px; font-weight: 700; color: #9333ea; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">
                            ${otp}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Expiration Warning -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #fef3c7; border-radius: 8px; padding: 16px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400e; text-align: center;">
                      <strong>Este codigo expira en ${expiresInMinutes} minutos.</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                Si no solicitaste este codigo, puedes ignorar este correo. Tu cuenta permanece segura.
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
                Este correo fue enviado porque se solicito un codigo de verificacion para tu cuenta.
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

export function generateOTPVerificationPlainText(
  data: OTPVerificationEmailData
): string {
  const { recipientName, otp, expiresInMinutes } = data;
  const greeting = recipientName ? `Hola ${recipientName}` : "Hola";

  return `
Codigo de Verificacion

${greeting},

Utiliza el siguiente codigo para verificar tu inicio de sesion en PeopleFlow:

${otp}

Este codigo expira en ${expiresInMinutes} minutos.

Si no solicitaste este codigo, puedes ignorar este correo. Tu cuenta permanece segura.

---
© 2025 PeopleFlow
Tu sistema de gestion empresarial
`.trim();
}
