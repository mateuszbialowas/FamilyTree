export function formatRelativeTime(ts: number, now: number = Date.now()): string {
  const diffMs = Math.max(0, now - ts);
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return '<1 min temu';
  if (diffMin < 60) return `${diffMin} min temu`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} godz. temu`;

  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
