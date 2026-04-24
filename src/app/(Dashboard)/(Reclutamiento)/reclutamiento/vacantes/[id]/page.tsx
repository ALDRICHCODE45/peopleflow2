import { redirect } from "next/navigation";

interface VacancyLegacyRouteProps {
  params: Promise<{ id: string }>;
}

/**
 * Legacy route for email deeplinks with path-based vacancy ID.
 * Redirects to canonical query-param-based URL.
 *
 * Example:
 * /reclutamiento/vacantes/abc123 → /reclutamiento/vacantes?vacancyId=abc123
 */
export default async function VacancyLegacyRoute({
  params,
}: VacancyLegacyRouteProps) {
  const resolvedParams = await params;
  const id = (resolvedParams?.id ?? "").trim();
  const isPlaceholderId = /^(\[.+\]|<.+>)$/.test(id);

  if (!id || isPlaceholderId) {
    redirect("/reclutamiento/vacantes");
  }

  redirect(`/reclutamiento/vacantes?vacancyId=${encodeURIComponent(id)}`);
}
