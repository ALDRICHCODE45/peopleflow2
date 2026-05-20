import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";

export function formatRelativeNotificationTime(isoDate: string): string {
  return formatDistanceToNowStrict(new Date(isoDate), {
    addSuffix: true,
    locale: es,
  });
}
