import { addDays, isWeekend, nextMonday, format } from "date-fns";
import type { VacancyServiceType } from "@features/vacancy/frontend/types/vacancy.types";

const SERVICE_TYPE_DAYS: Record<VacancyServiceType, number> = {
  END_TO_END: 9,
  SOURCING: 5,
};

export class TargetDeliveryDate {
  private constructor(private readonly date: Date) {}

  static calculate(
    assignedAt: Date,
    serviceType: VacancyServiceType,
  ): TargetDeliveryDate {
    let target = addDays(assignedAt, SERVICE_TYPE_DAYS[serviceType]);
    if (isWeekend(target)) {
      target = nextMonday(target);
    }
    return new TargetDeliveryDate(target);
  }

  static from(date: Date): TargetDeliveryDate {
    let adjusted = new Date(date);
    if (isWeekend(adjusted)) {
      adjusted = nextMonday(adjusted);
    }
    return new TargetDeliveryDate(adjusted);
  }

  get value(): Date {
    return new Date(this.date);
  }

  toISOString(): string {
    return this.date.toISOString();
  }

  toDateString(): string {
    return format(this.date, "yyyy-MM-dd");
  }
}
