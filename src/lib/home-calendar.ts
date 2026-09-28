export type CalendarKind = 'arrangement' | 'funeral' | 'wake' | 'visitation' | 'preneed' | 'other';
export type CalendarStatus = 'confirmed' | 'tentative' | 'cancelled';
export type CalendarItem = {
  id: string;
  caseId: string | null;
  title: string;
  kind: CalendarKind;
  date: string;
  time: string | null;
  endTime: string | null;
  location: string;
  staff: string;
  status: CalendarStatus;
  source: 'manual' | 'google_voice_group' | 'case_appointment' | 'arrangement_sheet';
  notes: string;
};

const centralDateTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function centralParts(value: string) {
  const parts = Object.fromEntries(centralDateTime.formatToParts(new Date(value)).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function monthValue(value: string | undefined, now: Date) {
  const fallback = centralParts(now.toISOString()).date.slice(0, 7);
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return fallback;
  const year = Number(value.slice(0, 4));
  return year >= 2020 && year <= 2100 ? value : fallback;
}

export function shiftMonth(month: string, offset: number) {
  const [year, number] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, number - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function gridDates(month: string) {
  const [year, number] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const start = Date.UTC(year, number - 1, 1 - first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => new Date(start + index * 86400000).toISOString().slice(0, 10));
}

export function parseSheetDate(value: string | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(text);
  let year: number, month: number, day: number;
  if (iso) { year = Number(iso[1]); month = Number(iso[2]); day = Number(iso[3]); }
  else if (us) { year = Number(us[3]); if (year < 100) year += 2000; month = Number(us[1]); day = Number(us[2]); }
  else {
    if (!/\b20\d{2}\b/.test(text)) return null;
    const parsed = Date.parse(text);
    if (!Number.isFinite(parsed)) return null;
    return new Date(parsed).toISOString().slice(0, 10);
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day
    ? date.toISOString().slice(0, 10) : null;
}

export function parseSheetTime(value: string | undefined): string | null {
  const text = value?.trim().toLowerCase();
  if (!text) return null;
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/.exec(text);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? '0');
  if (minute > 59 || hour > (match[3] ? 12 : 23) || (match[3] && hour < 1)) return null;
  if (match[3]) hour = hour % 12 + (match[3] === 'pm' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function timeLabel(time: string | null) {
  if (!time) return 'Time TBD';
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}
