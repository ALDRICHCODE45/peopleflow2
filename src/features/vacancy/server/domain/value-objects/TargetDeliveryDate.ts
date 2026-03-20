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
    const date = new Date(assignedAt);
    date.setDate(date.getDate() + SERVICE_TYPE_DAYS[serviceType]);
    return new TargetDeliveryDate(TargetDeliveryDate.adjustForWeekend(date));
  }

  static from(date: Date): TargetDeliveryDate {
    return new TargetDeliveryDate(TargetDeliveryDate.adjustForWeekend(new Date(date)));
  }

  private static adjustForWeekend(date: Date): Date {
    const day = date.getDay();
    if (day === 6) date.setDate(date.getDate() + 2); // Saturday -> Monday
    if (day === 0) date.setDate(date.getDate() + 1); // Sunday -> Monday
    return date;
  }

  get value(): Date {
    return new Date(this.date);
  }

  toISOString(): string {
    return this.date.toISOString();
  }

  toDateString(): string {
    return this.date.toISOString().split("T")[0];
  }
}
