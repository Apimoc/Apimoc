/**
 * Formatting helpers. US date formats throughout, per the brief.
 * These produce no user-facing words of their own beyond month names, which
 * come from the Intl tables rather than being written here.
 */

const LOCALE = "en-US";

/** "March 4, 2026" */
export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** "Mar 2026", used in the dated rent-roll rows. */
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

/** "2024" */
export function formatYear(date: Date): string {
  return String(date.getUTCFullYear());
}

/** Machine-readable, for <time datetime>. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * A role's period as it appears in the career rent roll. An open-ended role
 * gets a trailing en dash and no end year, which is the convention on a CV
 * and reads correctly when a screen reader hits it.
 */
export function formatPeriod(start: Date, end?: Date): string {
  const from = formatYear(start);
  return end ? `${from}–${formatYear(end)}` : `${from}–`;
}

/** Sorts newest first, using `order` as the primary key. */
export function byOrderThenDate<
  T extends { data: { order?: number; startDate?: Date; date?: Date } },
>(a: T, b: T): number {
  const ao = a.data.order ?? 0;
  const bo = b.data.order ?? 0;
  if (ao !== bo) return ao - bo;
  const ad = (a.data.startDate ?? a.data.date)?.getTime() ?? 0;
  const bd = (b.data.startDate ?? b.data.date)?.getTime() ?? 0;
  return bd - ad;
}
