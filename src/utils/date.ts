/** Format a Date to ISO date string (YYYY-MM-DD) */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Parse an ISO date string to a Date, returns null if invalid */
export function parseDate(dateString: string | null): Date | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
}
