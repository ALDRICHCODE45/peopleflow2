import type { CommitmentReportRow } from "@features/vacancy/server/domain/interfaces/IVacancyCommitmentRepository";

export interface CommitmentDailyReminderEmailData {
  recruiterName: string;
  dueTodayCommitments: CommitmentReportRow[];
  appUrl: string;
}

export function generateCommitmentDailyReminderEmail(
  data: CommitmentDailyReminderEmailData
): string {
  const { recruiterName, dueTodayCommitments, appUrl } = data;

  // Group by vacancy
  const byVacancy = new Map<string, CommitmentReportRow[]>();
  for (const c of dueTodayCommitments) {
    if (!byVacancy.has(c.vacancyId)) {
      byVacancy.set(c.vacancyId, []);
    }
    byVacancy.get(c.vacancyId)!.push(c);
  }

  const vacancySections = Array.from(byVacancy.entries())
    .map(([, commitments]) => {
      const vacancy = commitments[0];
      const commitmentItems = commitments
        .map((c) => {
          return `
            <li style="margin-bottom: 10px; padding: 12px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
              <div style="font-size: 14px; color: #1c1917; font-weight: 600;">
                ${c.description}
              </div>
            </li>
          `;
        })
        .join("");

      return `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 17px; font-weight: 700; color: #9333ea;">
            ${vacancy.vacancyPosition} — ${vacancy.clientName}
          </h3>
          <ul style="margin: 0; padding: 0; list-style: none;">
            ${commitmentItems}
          </ul>
        </div>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Recordatorio de Compromisos de Hoy - PeopleFlow</title>
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
              <!-- Title with Alarm Icon -->
              <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #1c1917; text-align: center;">
                <span style="font-size: 32px;">⏰</span> Recordatorio de Compromisos
              </h1>

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1c1917;">
                ¡Buenos días <strong>${recruiterName}</strong>!
              </p>

              <!-- Urgent Message -->
              <div style="margin-bottom: 24px; padding: 16px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px;">
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #dc2626;">
                  Tienes ${dueTodayCommitments.length} compromiso${dueTodayCommitments.length === 1 ? "" : "s"} que vence${dueTodayCommitments.length === 1 ? "" : "n"} HOY
                </p>
              </div>

              <!-- Message -->
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                No olvides completar estos compromisos antes de que termine el día:
              </p>

              <!-- Commitments by Vacancy -->
              ${vacancySections}

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; background-color: #9333ea; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; transition: background-color 0.2s ease;">
                      Ver en Sistema
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
                Este recordatorio se envía automáticamente para compromisos que vencen hoy.
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

export function generateCommitmentDailyReminderPlainText(
  data: CommitmentDailyReminderEmailData
): string {
  const { recruiterName, dueTodayCommitments, appUrl } = data;

  const byVacancy = new Map<string, CommitmentReportRow[]>();
  for (const c of dueTodayCommitments) {
    if (!byVacancy.has(c.vacancyId)) {
      byVacancy.set(c.vacancyId, []);
    }
    byVacancy.get(c.vacancyId)!.push(c);
  }

  const vacancySections = Array.from(byVacancy.entries())
    .map(([, commitments]) => {
      const vacancy = commitments[0];
      const commitmentItems = commitments
        .map((c) => `  - ${c.description}`)
        .join("\n");
      return `${vacancy.vacancyPosition} — ${vacancy.clientName}\n${commitmentItems}`;
    })
    .join("\n\n");

  return `
Recordatorio de Compromisos

¡Buenos días ${recruiterName}!

Tienes ${dueTodayCommitments.length} compromiso${dueTodayCommitments.length === 1 ? "" : "s"} que vence${dueTodayCommitments.length === 1 ? "" : "n"} HOY.

No olvides completar estos compromisos antes de que termine el día:

${vacancySections}

Ver en sistema: ${appUrl}

---
© 2025 PeopleFlow
Tu sistema de gestión empresarial
`.trim();
}
