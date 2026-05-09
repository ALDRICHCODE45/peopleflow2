import type { CommitmentReportRow } from "@features/vacancy/server/domain/interfaces/IVacancyCommitmentRepository";

export interface CommitmentMeetingReportEmailData {
  recruiterName: string;
  commitments: CommitmentReportRow[];
  dueTodayCommitmentIds: string[];
  appUrl: string;
}

export function generateCommitmentMeetingReportEmail(
  data: CommitmentMeetingReportEmailData
): string {
  const { recruiterName, commitments, dueTodayCommitmentIds, appUrl } = data;

  // Group commitments by vacancy for better readability
  const byVacancy = new Map<string, CommitmentReportRow[]>();
  for (const c of commitments) {
    if (!byVacancy.has(c.vacancyId)) {
      byVacancy.set(c.vacancyId, []);
    }
    byVacancy.get(c.vacancyId)!.push(c);
  }

  const vacancySections = Array.from(byVacancy.entries())
    .map(([, vacancyCommitments]) => {
      const vacancy = vacancyCommitments[0];
      const commitmentItems = vacancyCommitments
        .map((c) => {
          const isDueToday = dueTodayCommitmentIds.includes(c.commitmentId);
          const dueDateStr = new Date(c.dueDate).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          const badge = isDueToday
            ? `<span style="display: inline-block; padding: 4px 12px; background-color: #dc2626; color: #ffffff; font-size: 12px; font-weight: 600; border-radius: 6px; margin-left: 8px;">Vence HOY</span>`
            : "";
          return `
            <li style="margin-bottom: 12px; padding: 12px; background-color: ${isDueToday ? "#fef2f2" : "#fafafa"}; border-radius: 8px; border-left: 4px solid ${isDueToday ? "#dc2626" : "#9333ea"};">
              <div style="font-size: 14px; color: #1c1917; margin-bottom: 4px;">
                <strong>${c.description}</strong> ${badge}
              </div>
              <div style="font-size: 13px; color: #71717a;">
                Fecha de vencimiento: <strong>${dueDateStr}</strong>
              </div>
            </li>
          `;
        })
        .join("");

      return `
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #9333ea;">
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
  <title>Reporte de Compromisos de Junta - PeopleFlow</title>
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
                <span style="font-size: 32px;">📋</span> Reporte de Compromisos
              </h1>

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1c1917;">
                Hola <strong>${recruiterName}</strong>,
              </p>

              <!-- Message -->
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Este es tu reporte de compromisos de la junta. A continuación se listan tus ${commitments.length} compromisos pendientes, organizados por vacante. Los compromisos que <strong style="color: #dc2626;">vencen HOY</strong> están destacados en rojo.
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
                Este correo fue enviado porque tienes compromisos asignados en PeopleFlow.
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

export function generateCommitmentMeetingReportPlainText(
  data: CommitmentMeetingReportEmailData
): string {
  const { recruiterName, commitments, dueTodayCommitmentIds, appUrl } = data;

  const byVacancy = new Map<string, CommitmentReportRow[]>();
  for (const c of commitments) {
    if (!byVacancy.has(c.vacancyId)) {
      byVacancy.set(c.vacancyId, []);
    }
    byVacancy.get(c.vacancyId)!.push(c);
  }

  const vacancySections = Array.from(byVacancy.entries())
    .map(([, vacancyCommitments]) => {
      const vacancy = vacancyCommitments[0];
      const commitmentItems = vacancyCommitments
        .map((c) => {
          const isDueToday = dueTodayCommitmentIds.includes(c.commitmentId);
          const dueDateStr = new Date(c.dueDate).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          const badge = isDueToday ? " [VENCE HOY]" : "";
          return `  - ${c.description}${badge}\n    Vencimiento: ${dueDateStr}`;
        })
        .join("\n");

      return `${vacancy.vacancyPosition} — ${vacancy.clientName}\n${commitmentItems}`;
    })
    .join("\n\n");

  return `
Reporte de Compromisos de Junta

Hola ${recruiterName},

Este es tu reporte de compromisos de la junta. A continuación se listan tus ${commitments.length} compromisos pendientes, organizados por vacante. Los compromisos que vencen HOY están marcados con [VENCE HOY].

${vacancySections}

Ver en sistema: ${appUrl}

---
© 2025 PeopleFlow
Tu sistema de gestión empresarial
`.trim();
}
