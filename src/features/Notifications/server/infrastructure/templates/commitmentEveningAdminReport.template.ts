import type { CommitmentReportRow } from "@features/vacancy/server/domain/interfaces/IVacancyCommitmentRepository";

export interface CommitmentEveningAdminReportEmailData {
  adminName: string;
  dueTodayCommitments: CommitmentReportRow[];
  appUrl: string;
}

export function generateCommitmentEveningAdminReportEmail(
  data: CommitmentEveningAdminReportEmailData
): string {
  const { adminName, dueTodayCommitments, appUrl } = data;

  const completedCount = dueTodayCommitments.filter(
    (c) => c.status === "COMPLETED"
  ).length;
  const pendingCount = dueTodayCommitments.filter(
    (c) => c.status === "PENDING"
  ).length;

  // Group by recruiter → vacancy, PENDING first
  const byRecruiter = new Map<
    string,
    { recruiterName: string | null; vacancies: Map<string, CommitmentReportRow[]> }
  >();

  for (const c of dueTodayCommitments) {
    if (!byRecruiter.has(c.recruiterId)) {
      byRecruiter.set(c.recruiterId, {
        recruiterName: c.recruiterName,
        vacancies: new Map(),
      });
    }
    const recruiterData = byRecruiter.get(c.recruiterId)!;
    if (!recruiterData.vacancies.has(c.vacancyId)) {
      recruiterData.vacancies.set(c.vacancyId, []);
    }
    recruiterData.vacancies.get(c.vacancyId)!.push(c);
  }

  const recruiterSections = Array.from(byRecruiter.entries())
    .map(([, { recruiterName, vacancies }]) => {
      const vacancySections = Array.from(vacancies.entries())
        .map(([, commitments]) => {
          const vacancy = commitments[0];
          const commitmentItems = commitments
            .map((c) => {
              const isPending = c.status === "PENDING";
              const statusLabel = isPending ? "PENDIENTE" : "COMPLETADO";
              const statusColor = isPending ? "#dc2626" : "#16a34a";
              const bgColor = isPending ? "#fef2f2" : "#f0fdf4";
              const borderColor = isPending ? "#dc2626" : "#16a34a";

              return `
                <li style="margin-bottom: 8px; padding: 10px; background-color: ${bgColor}; border-radius: 6px; border-left: 3px solid ${borderColor};">
                  <div style="font-size: 13px; color: #1c1917; margin-bottom: 4px;">
                    ${c.description}
                  </div>
                  <div style="font-size: 12px; color: #71717a;">
                    Estado: <strong style="color: ${statusColor};">${statusLabel}</strong>
                  </div>
                </li>
              `;
            })
            .join("");

          return `
            <div style="margin-bottom: 14px; padding-left: 12px;">
              <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #9333ea;">
                ${vacancy.vacancyPosition} — ${vacancy.clientName}
              </h4>
              <ul style="margin: 0; padding: 0; list-style: none;">
                ${commitmentItems}
              </ul>
            </div>
          `;
        })
        .join("");

      return `
        <div style="margin-bottom: 24px; padding: 18px; background-color: #fafafa; border-radius: 10px;">
          <h3 style="margin: 0 0 14px 0; font-size: 17px; font-weight: 700; color: #1c1917; border-bottom: 2px solid #e4e4e7; padding-bottom: 6px;">
            ${recruiterName || "Reclutador sin nombre"}
          </h3>
          ${vacancySections}
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
  <title>Reporte Vespertino de Compromisos - PeopleFlow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" width="700" cellspacing="0" cellpadding="0" border="0" style="max-width: 700px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

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
                <span style="font-size: 32px;">📅</span> Reporte Vespertino de Compromisos
              </h1>

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1c1917;">
                Hola <strong>${adminName}</strong>,
              </p>

              <!-- Message -->
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Este es el resumen de los compromisos que vencieron hoy. A continuación se muestra el estado actual de cada compromiso (completados vs. pendientes).
              </p>

              <!-- Summary Stats -->
              <div style="margin-bottom: 24px; padding: 16px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #1e3a8a;">
                  <strong>Total de compromisos que vencían hoy:</strong> ${dueTodayCommitments.length}
                </p>
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #16a34a;">
                  <strong>Completados:</strong> ${completedCount}
                </p>
                <p style="margin: 0; font-size: 15px; color: #dc2626;">
                  <strong>Aún pendientes:</strong> ${pendingCount}
                </p>
              </div>

              <!-- Commitments by Recruiter -->
              ${recruiterSections}

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
        <table role="presentation" width="700" cellspacing="0" cellpadding="0" border="0" style="max-width: 700px; width: 100%;">
          <tr>
            <td align="center" style="padding: 24px 20px;">
              <p style="margin: 0; font-size: 12px; color: #71717a;">
                Este reporte se envía automáticamente al final del día a los administradores de notificaciones.
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

export function generateCommitmentEveningAdminReportPlainText(
  data: CommitmentEveningAdminReportEmailData
): string {
  const { adminName, dueTodayCommitments, appUrl } = data;

  const completedCount = dueTodayCommitments.filter(
    (c) => c.status === "COMPLETED"
  ).length;
  const pendingCount = dueTodayCommitments.filter(
    (c) => c.status === "PENDING"
  ).length;

  const byRecruiter = new Map<
    string,
    { recruiterName: string | null; vacancies: Map<string, CommitmentReportRow[]> }
  >();

  for (const c of dueTodayCommitments) {
    if (!byRecruiter.has(c.recruiterId)) {
      byRecruiter.set(c.recruiterId, {
        recruiterName: c.recruiterName,
        vacancies: new Map(),
      });
    }
    const recruiterData = byRecruiter.get(c.recruiterId)!;
    if (!recruiterData.vacancies.has(c.vacancyId)) {
      recruiterData.vacancies.set(c.vacancyId, []);
    }
    recruiterData.vacancies.get(c.vacancyId)!.push(c);
  }

  const recruiterSections = Array.from(byRecruiter.entries())
    .map(([, { recruiterName, vacancies }]) => {
      const vacancySections = Array.from(vacancies.entries())
        .map(([, commitments]) => {
          const vacancy = commitments[0];
          const commitmentItems = commitments
            .map((c) => {
              const statusLabel = c.status === "PENDING" ? "PENDIENTE" : "COMPLETADO";
              return `    - ${c.description} [${statusLabel}]`;
            })
            .join("\n");
          return `  ${vacancy.vacancyPosition} — ${vacancy.clientName}\n${commitmentItems}`;
        })
        .join("\n\n");

      return `${recruiterName || "Reclutador sin nombre"}\n${vacancySections}`;
    })
    .join("\n\n---\n\n");

  return `
Reporte Vespertino de Compromisos

Hola ${adminName},

Este es el resumen de los compromisos que vencieron hoy. A continuación se muestra el estado actual de cada compromiso.

RESUMEN:
- Total de compromisos que vencían hoy: ${dueTodayCommitments.length}
- Completados: ${completedCount}
- Aún pendientes: ${pendingCount}

${recruiterSections}

Ver en sistema: ${appUrl}

---
© 2025 PeopleFlow
Tu sistema de gestión empresarial
`.trim();
}
