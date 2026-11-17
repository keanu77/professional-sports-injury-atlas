export type DiscoveryPeriod = "" | "recent-2y" | "custom" | "unknown";
export type DiscoverySort = "editorial" | "event-newest" | "updated-newest";

export interface DiscoveryDates {
  eventDate?: string | null;
  checkedAt?: string | null;
}

export function validDiscoveryDate(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return "";
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
    ? value
    : "";
}

/** Date-only filters use the site's Taiwan day, not a visitor's UTC offset. */
export function taipeiToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join("-");
}

export function recentTwoYearRange(today: string): {
  from: string;
  to: string;
} {
  if (!validDiscoveryDate(today))
    throw new Error("Invalid discovery reference date");
  const [year, month, day] = today.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const startYear = year - 2;
  const lastDay = new Date(Date.UTC(startYear, month, 0)).getUTCDate();
  return {
    from: `${startYear}-${String(month).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`,
    to: today,
  };
}

export function matchesDiscoveryDate(
  eventDate: string | null | undefined,
  period: DiscoveryPeriod,
  from = "",
  to = "",
  today = taipeiToday(),
): boolean {
  const date = validDiscoveryDate(eventDate);
  if (period === "unknown") return !date;
  if (!period) return true;
  if (!date) return false;
  const range =
    period === "recent-2y"
      ? recentTwoYearRange(today)
      : { from: validDiscoveryDate(from), to: validDiscoveryDate(to) };
  return (!range.from || date >= range.from) && (!range.to || date <= range.to);
}

/** Stable ties keep editorial order. Unknown dates always follow known dates. */
export function sortDiscoveryDates<T extends DiscoveryDates>(
  items: readonly T[],
  sort: DiscoverySort,
): T[] {
  if (sort === "editorial") return [...items];
  const key = sort === "event-newest" ? "eventDate" : "checkedAt";
  return [...items].sort((a, b) =>
    validDiscoveryDate(b[key]).localeCompare(validDiscoveryDate(a[key])),
  );
}
