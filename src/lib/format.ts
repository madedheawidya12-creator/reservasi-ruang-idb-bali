const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayISO(): string {
  return isoDate(new Date())
}

export function shiftDate(days: number, from: Date = new Date()): string {
  const date = new Date(from)
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return isoDate(date)
}

export function parseISO(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0)
}

export function formatDateLong(value: string): string {
  const date = parseISO(value)
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export function formatDateShort(value: string): string {
  const date = parseISO(value)
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`
}

export function formatDateCompact(value: string): string {
  const date = parseISO(value)
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`
}

export function formatRelativeDay(value: string): string {
  const today = todayISO()
  if (value === today) return 'Hari ini'
  if (value === shiftDate(1)) return 'Besok'
  if (value === shiftDate(-1)) return 'Kemarin'
  return formatDateShort(value)
}

export function formatTimeRange(start: string, end: string): string {
  return `${start.replace(':', '.')}–${end.replace(':', '.')}`
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}, ${pad(
    date.getHours(),
  )}.${pad(date.getMinutes())}`
}

export function formatClock(iso: string): string {
  const date = new Date(iso)
  return `${pad(date.getHours())}.${pad(date.getMinutes())}`
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function pluralPeople(count: number): string {
  return `${count} orang`
}
