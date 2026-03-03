const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Format a single ISO date string (YYYY-MM-DD) as "Mon 1st Jan '26" */
export function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00"); // noon to avoid timezone shifts
  const day = DAYS[d.getDay()];
  const date = ordinal(d.getDate());
  const month = MONTHS[d.getMonth()];
  const year = `'${String(d.getFullYear()).slice(2)}`;
  return `${day} ${date} ${month} ${year}`;
}

/**
 * Format a date range from two ISO date strings.
 *
 * Same month+year:  "1st - 2nd May '26"
 * Same year:        "Mon 1st May - Tue 2nd Jul '26"
 * Different years:  "Mon 1st Dec '25 - Tue 2nd Jan '26"
 * Single date:      "Mon 1st Jan '26"
 */
export function formatDateRange(startIso?: string, endIso?: string): string {
  if (!startIso && !endIso) return "";
  if (startIso && !endIso) return formatDate(startIso);
  if (!startIso && endIso) return formatDate(endIso);

  const s = new Date(startIso! + "T12:00:00");
  const e = new Date(endIso! + "T12:00:00");

  const sYear = s.getFullYear();
  const eYear = e.getFullYear();
  const sMonth = s.getMonth();
  const eMonth = e.getMonth();

  const yearSuffix = `'${String(eYear).slice(2)}`;

  // Same month and year: "1st - 2nd May '26"
  if (sYear === eYear && sMonth === eMonth) {
    return `${ordinal(s.getDate())} - ${ordinal(e.getDate())} ${MONTHS[eMonth]} ${yearSuffix}`;
  }

  // Same year: "Mon 1st May - Tue 2nd Jul '26"
  if (sYear === eYear) {
    const sDay = DAYS[s.getDay()];
    const eDay = DAYS[e.getDay()];
    return `${sDay} ${ordinal(s.getDate())} ${MONTHS[sMonth]} - ${eDay} ${ordinal(e.getDate())} ${MONTHS[eMonth]} ${yearSuffix}`;
  }

  // Different years: full format for both
  return `${formatDate(startIso!)} - ${formatDate(endIso!)}`;
}
