const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function formatISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDayShort(date: Date): string {
  return DAYS_ES[getDayIndex(date)];
}

export function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()]}`;
}

export function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const mMonth = MONTHS_ES[monday.getMonth()];
  const sMonth = MONTHS_ES[sunday.getMonth()];
  if (mMonth === sMonth) {
    return `${monday.getDate()} — ${sunday.getDate()} ${mMonth} ${monday.getFullYear()}`;
  }
  return `${monday.getDate()} ${mMonth} — ${sunday.getDate()} ${sMonth} ${monday.getFullYear()}`;
}

export function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function getDayIndex(date: Date): number {
  return (date.getDay() + 6) % 7; // 0=Mon, 6=Sun
}
