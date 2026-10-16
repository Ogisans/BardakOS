/** Calendar keys use local time, not UTC (toISOString can shift the day). */
export function localDateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Parse a day without UTC conversion; noon avoids local midnight transitions. */
export function parseLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export const isLocalDate = (value: string) => parseLocalDate(value) !== null;

export function moveCalendarDay(value: string, days: number): string {
  const date = parseLocalDate(value);
  if (!date) throw new Error('Geçersiz tarih.');
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function moveCalendarMonth(value: string, months: number): string {
  const date = parseLocalDate(value);
  if (!date) throw new Error('Geçersiz tarih.');
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const end = new Date(date);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  date.setDate(Math.min(day, end.getDate()));
  return localDateKey(date);
}

export function calendarMonthDays(value: string): string[] {
  const date = parseLocalDate(value);
  if (!date) throw new Error('Geçersiz tarih.');
  date.setDate(1);
  const start = moveCalendarDay(localDateKey(date), -((date.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => moveCalendarDay(start, index));
}
