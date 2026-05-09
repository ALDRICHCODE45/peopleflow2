import type { CommitmentReportRow } from "@features/vacancy/server/domain/interfaces/IVacancyCommitmentRepository";

export interface CommitmentAdminMeetingReportEmailData {
  adminName: string;
  allCommitments: CommitmentReportRow[];
  dueTodayCommitmentIds: string[];
  appUrl: string;
}

export function generateCommitmentAdminMeetingReportEmail(
  data: CommitmentAdminMeetingReportEmailData
): string {
  const { adminName, allCommitments, dueTodayCommitmentIds, appUrl } = data;

  // Group by recruiter → vacancy
  const byRecruiter = new Map<
    string,
    { recruiterName: string | null; vacancies: Map<string, CommitmentReportRow[]> }
  >();

  for (const c of allCommitments) {
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
              const isDueToday = dueTodayCommitmentIds.includes(c.commitmentId);
              const dueDateStr = new Date(c.dueDate).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const badge = isDueToday
                ? `<span style="display: inline-block; padding: 3px 10px; background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 600; border-radius: 4px; margin-left: 6px;">HOY</span>`
                : "";
              return `
                <li style="margin-bottom: 8px; padding: 10px; background-color: ${isDueToday ? "#fef2f2" : "#fafafa"}; border-radius: 6px; border-left: 3px solid ${isDueToday ? "#dc2626" : "#9333ea"};">
                  <div style="font-size: 13px; color: #1c1917;">
                    ${c.description} ${badge}
                  </div>
                  <div style="font-size: 12px; color: #71717a; margin-top: 4px;">
                    Vencimiento: <strong>${dueDateStr}</strong>
                  </div>
                </li>
              `;
            })
            .join("");

          return `
            <div style="margin-bottom: 16px; padding-left: 16px;">
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
        <div style="margin-bottom: 28px; padding: 20px; background-color: #fafafa; border-radius: 12px;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #1c1917; border-bottom: 2px solid #e4e4e7; padding-bottom: 8px;">
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
  <title>Reporte Administrativo de Compromisos - PeopleFlow</title>
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
                <span style="font-size: 32px;">📊</span> Reporte Administrativo de Compromisos
              </h1>

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1c1917;">
                Hola <strong>${adminName}</strong>,
              </p>

              <!-- Message -->
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                A continuación se presenta el reporte completo de todos los compromisos de la junta. Los datos están agrupados por <strong>reclutador → vacante</strong>. Los compromisos que <strong style="color: #dc2626;">vencen HOY</strong> aparecen primero.
              </p>

              <!-- Summary -->
              <div style="margin-bottom: 24px; padding: 16px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
                <p style="margin: 0; font-size: 15px; color: #1e3a8a; font-weight: 600;">
                  Total de compromisos: ${allCommitments.length}
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
                Este correo fue enviado porque estás configurado como administrador de notificaciones.
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

export function generateCommitmentAdminMeetingReportPlainText(
  data: CommitmentAdminMeetingReportEmailData
): string {
  const { adminName, allCommitments, dueTodayCommitmentIds, appUrl } = data;

  const byRecruiter = new Map<
    string,
    { recruiterName: string | null; vacancies: Map<string, CommitmentReportRow[]> }
  >();

  for (const c of allCommitments) {
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
              const isDueToday = dueTodayCommitmentIds.includes(c.commitmentId);
              const dueDateStr = new Date(c.dueDate).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const badge = isDueToday ? " [HOY]" : "";
              return `    - ${c.description}${badge}\n      Vencimiento: ${dueDateStr}`;
            })
            .join("\n");

          return `  ${vacancy.vacancyPosition} — ${vacancy.clientName}\n${commitmentItems}`;
        })
        .join("\n\n");

      return `${recruiterName || "Reclutador sin nombre"}\n${vacancySections}`;
    })
    .join("\n\n---\n\n");

  return `
Reporte Administrativo de Compromisos

Hola ${adminName},

A continuación se presenta el reporte completo de todos los compromisos de la junta. Los datos están agrupados por reclutador → vacante. Los compromisos que vencen HOY están marcados con [HOY].

Total de compromisos: ${allCommitments.length}

${recruiterSections}

Ver en sistema: ${appUrl}

---
© 2025 PeopleFlow
Tu sistema de gestión empresarial
`.trim();
}
