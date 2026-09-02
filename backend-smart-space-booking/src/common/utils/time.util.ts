import * as crypto from 'crypto';

export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) {
    throw new Error(
      `Format waktu tidak valid: ${timeStr}. Gunakan format HH:mm (contoh: 09:00).`,
    );
  }
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(
      `Nilai jam atau menit di luar rentang yang valid (00:00 - 23:59): ${timeStr}`,
    );
  }

  return hours * 60 + minutes;
}

export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function isTimeOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && endA > startB;
}

export function normalizeDateToStartOfDay(dateInput: Date | string): Date {
  const d = new Date(dateInput);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

export function generateQrCode(): string {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SSB-${timestamp}-${randomSuffix}`;
}
