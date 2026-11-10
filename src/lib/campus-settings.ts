import { isoDate, parseISO } from './format'
import type { CampusSettings, Holiday } from './types'

export const DEFAULT_OPEN_DAYS = [1, 2, 3, 4, 5, 6]
export const DEFAULT_OPEN_TIME = '08:00'
export const DEFAULT_CLOSE_TIME = '18:00'

export const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
] as const

export const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Minggu',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
}

export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return isoDate(parseISO(value)) === value
}

export function createDefaultCampusSettings(): CampusSettings {
  return {
    openDays: [...DEFAULT_OPEN_DAYS],
    openTime: DEFAULT_OPEN_TIME,
    closeTime: DEFAULT_CLOSE_TIME,
    holidays: [],
    updatedAt: new Date().toISOString(),
  }
}

function normalizeHoliday(value: unknown, index: number): Holiday | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (!isValidDateString(record.date)) return null

  const name =
    typeof record.name === 'string' && record.name.trim()
      ? record.name.trim()
      : 'Libur kampus'
  const note =
    typeof record.note === 'string' && record.note.trim() ? record.note.trim() : undefined
  const createdAt =
    typeof record.createdAt === 'string' && record.createdAt
      ? record.createdAt
      : new Date().toISOString()

  return {
    id:
      typeof record.id === 'string' && record.id.trim()
        ? record.id
        : `holiday-${record.date}-${index}`,
    date: record.date,
    name,
    note,
    createdAt,
  }
}

/**
 * Menormalkan data pengaturan dari localStorage. Data lama yang belum memiliki
 * pengaturan kampus akan mendapat aturan default tanpa menghapus reservasi.
 */
export function normalizeCampusSettings(value: unknown): CampusSettings {
  const defaults = createDefaultCampusSettings()
  if (!value || typeof value !== 'object') return defaults

  const source = value as Record<string, unknown>
  const rawDays = Array.isArray(source.openDays) ? source.openDays : DEFAULT_OPEN_DAYS
  const openDays = [...new Set(
    rawDays.filter(
      (day): day is number =>
        typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 6,
    ),
  )].sort((a, b) => a - b)

  let openTime = isValidTime(source.openTime) ? source.openTime : DEFAULT_OPEN_TIME
  let closeTime = isValidTime(source.closeTime) ? source.closeTime : DEFAULT_CLOSE_TIME
  if (openTime >= closeTime) {
    openTime = DEFAULT_OPEN_TIME
    closeTime = DEFAULT_CLOSE_TIME
  }

  const rawHolidays = Array.isArray(source.holidays) ? source.holidays : []
  const holidays: Holiday[] = []
  const seenDates = new Set<string>()
  rawHolidays.forEach((holiday, index) => {
    const normalized = normalizeHoliday(holiday, index)
    if (!normalized || seenDates.has(normalized.date)) return
    seenDates.add(normalized.date)
    holidays.push(normalized)
  })
  holidays.sort((a, b) => a.date.localeCompare(b.date))

  return {
    openDays,
    openTime,
    closeTime,
    holidays,
    updatedAt:
      typeof source.updatedAt === 'string' && source.updatedAt
        ? source.updatedAt
        : defaults.updatedAt,
  }
}
