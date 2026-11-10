import { getConflicts, isPast, toMinutes } from './availability'
import { isValidTime, WEEKDAY_LABELS } from './campus-settings'
import { formatTimeRange, parseISO, todayISO } from './format'
import type {
  AppState,
  CampusSettings,
  FieldErrors,
  Holiday,
  Reservation,
  Room,
} from './types'

export const SUNDAY_CLOSED_MESSAGE =
  'Maaf, peminjaman ruangan tidak tersedia pada hari Minggu karena kampus tutup. Silakan pilih hari lain.'
export const CONFLICT_MESSAGE =
  'Maaf, ruangan sudah digunakan pada waktu tersebut. Silakan pilih jadwal atau ruangan lain.'
export const OUTSIDE_HOURS_MESSAGE =
  'Peminjaman hanya dapat dilakukan pada jam operasional kampus.'

export type AvailabilityState = 'free' | 'busy' | 'closed' | 'outside' | 'past' | 'invalid'

export interface RoomAvailability {
  state: AvailabilityState
  label: string
  detail?: string
  reason?: string
  pendingCount: number
}

export interface ReservationValidationInput {
  roomId: string
  date: string
  start: string
  end: string
  purpose: string
  participants: number
}

export interface ReservationValidationResult {
  ok: boolean
  fields: FieldErrors
  error?: string
  room?: Room
  availability?: RoomAvailability
  pendingConflicts: Reservation[]
}

export function weekdayForDate(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const parsed = parseISO(date)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.getDay()
}

export function findHoliday(settings: CampusSettings, date: string): Holiday | undefined {
  return settings.holidays.find((holiday) => holiday.date === date)
}

export function operatingHoursLabel(settings: CampusSettings): string {
  return formatTimeRange(settings.openTime, settings.closeTime)
}

/**
 * Alasan kampus tidak dapat menerima peminjaman pada tanggal tersebut.
 * Minggu selalu tutup; hari libur hanya berasal dari daftar yang dikelola admin.
 */
export function campusClosedReason(settings: CampusSettings, date: string): string | null {
  const weekday = weekdayForDate(date)
  if (weekday === null) return 'Tanggal tidak valid. Pilih tanggal lain.'

  if (weekday === 0) return SUNDAY_CLOSED_MESSAGE

  const holiday = findHoliday(settings, date)
  if (holiday) {
    return `Kampus tutup pada tanggal tersebut (${holiday.name}). Silakan pilih hari lain.`
  }

  if (!settings.openDays.includes(weekday)) {
    return `Kampus tutup pada hari ${WEEKDAY_LABELS[weekday]}. Silakan pilih hari lain.`
  }

  return null
}

export function isWithinOperatingHours(
  settings: CampusSettings,
  start: string,
  end: string,
): boolean {
  if (!isValidTime(start) || !isValidTime(end)) return false
  const startMinutes = toMinutes(start)
  const endMinutes = toMinutes(end)
  return (
    endMinutes > startMinutes &&
    startMinutes >= toMinutes(settings.openTime) &&
    endMinutes <= toMinutes(settings.closeTime)
  )
}

export function getRoomAvailability(
  settings: CampusSettings,
  reservations: Reservation[],
  room: Room,
  date: string,
  start: string,
  end: string,
): RoomAvailability {
  if (!date || !isValidTime(start) || !isValidTime(end)) {
    return { state: 'invalid', label: 'Pilih tanggal dan waktu', pendingCount: 0 }
  }

  const closedReason = campusClosedReason(settings, date)
  if (closedReason) {
    return {
      state: 'closed',
      label: 'Kampus Tutup',
      reason: closedReason,
      pendingCount: 0,
    }
  }

  if (date < todayISO()) {
    return { state: 'past', label: 'Tanggal sudah lewat', pendingCount: 0 }
  }

  const startMinutes = toMinutes(start)
  const endMinutes = toMinutes(end)
  if (endMinutes <= startMinutes) {
    return {
      state: 'outside',
      label: 'Di Luar Jam Operasional',
      detail: 'Jam mulai harus lebih awal daripada jam selesai.',
      reason: 'Jam mulai harus lebih awal daripada jam selesai.',
      pendingCount: 0,
    }
  }

  if (!isWithinOperatingHours(settings, start, end)) {
    return {
      state: 'outside',
      label: 'Di Luar Jam Operasional',
      detail: `Jam layanan ${operatingHoursLabel(settings)}.`,
      reason: `Peminjaman hanya dapat dilakukan pada jam operasional kampus (${operatingHoursLabel(
        settings,
      )}).`,
      pendingCount: 0,
    }
  }

  if (isPast(date, end)) {
    return { state: 'past', label: 'Waktu sudah lewat', pendingCount: 0 }
  }

  const pending = getConflicts(reservations, room.id, date, start, end, { status: 'pending' })
  const conflicts = getConflicts(reservations, room.id, date, start, end)
  if (conflicts.length > 0) {
    const first = conflicts[0]!
    return {
      state: 'busy',
      label: 'Tidak Tersedia',
      detail: `Bentrok ${formatTimeRange(first.start, first.end)}.`,
      reason: CONFLICT_MESSAGE,
      pendingCount: pending.length,
    }
  }

  return { state: 'free', label: 'Tersedia', pendingCount: pending.length }
}

/**
 * Validasi tunggal untuk UI dan store. Store memanggil fungsi ini lagi saat
 * pengajuan dikirim dan saat admin menyetujui, sehingga validasi tidak hanya
 * bergantung pada tombol yang disembunyikan.
 */
export function validateReservationRequest(
  state: Pick<AppState, 'rooms' | 'reservations' | 'settings'>,
  input: ReservationValidationInput,
  options: { ignoreReservationId?: string } = {},
): ReservationValidationResult {
  const fields: FieldErrors = {}
  const room = state.rooms.find((candidate) => candidate.id === input.roomId)

  if (!room) {
    fields.roomId = 'Pilih ruang yang ingin diajukan.'
  } else if (room.status === 'inactive') {
    fields.roomId = 'Ruang sedang dinonaktifkan dan belum dapat menerima permohonan baru.'
  }

  if (!input.date) {
    fields.date = 'Tentukan tanggal kegiatan.'
  } else if (weekdayForDate(input.date) === null) {
    fields.date = 'Tanggal kegiatan tidak valid.'
  }

  if (!input.start) {
    fields.start = 'Tentukan waktu mulai.'
  } else if (!isValidTime(input.start)) {
    fields.start = 'Format waktu mulai tidak valid.'
  }

  if (!input.end) {
    fields.end = 'Tentukan waktu selesai.'
  } else if (!isValidTime(input.end)) {
    fields.end = 'Format waktu selesai tidak valid.'
  }

  if (!input.purpose.trim() || input.purpose.trim().length < 5) {
    fields.purpose = 'Tuliskan tujuan kegiatan, minimal 5 karakter.'
  }

  if (!Number.isFinite(input.participants) || input.participants < 1) {
    fields.participants = 'Isi jumlah peserta, minimal 1 orang.'
  }

  if (
    room &&
    room.capacity !== undefined &&
    room.capacity > 0 &&
    Number.isFinite(input.participants) &&
    input.participants > room.capacity
  ) {
    fields.participants = `Jumlah peserta melebihi kapasitas ${room.name} (${room.capacity} orang). Silakan pilih ruangan lain atau kurangi jumlah peserta.`
  }

  if (
    input.start &&
    input.end &&
    isValidTime(input.start) &&
    isValidTime(input.end) &&
    toMinutes(input.end) <= toMinutes(input.start)
  ) {
    fields.end = 'Jam mulai harus lebih awal daripada jam selesai.'
  }

  const closedReason = input.date ? campusClosedReason(state.settings, input.date) : null
  if (closedReason) {
    fields.date = closedReason
  } else if (input.date && input.date < todayISO()) {
    fields.date = 'Tanggal kegiatan tidak boleh sebelum hari ini.'
  }

  if (
    !closedReason &&
    input.date &&
    input.start &&
    input.end &&
    isValidTime(input.start) &&
    isValidTime(input.end)
  ) {
    const startMinutes = toMinutes(input.start)
    const endMinutes = toMinutes(input.end)
    const openMinutes = toMinutes(state.settings.openTime)
    const closeMinutes = toMinutes(state.settings.closeTime)

    if (startMinutes < openMinutes) {
      fields.start = `Waktu mulai tidak boleh lebih awal dari jam buka kampus (${state.settings.openTime.replace(
        ':',
        '.',
      )}).`
    }
    if (endMinutes > closeMinutes) {
      fields.end = `Waktu selesai tidak boleh melewati jam tutup kampus (${state.settings.closeTime.replace(
        ':',
        '.',
      )}).`
    }
  }

  const availability =
    room && input.date && input.start && input.end
      ? getRoomAvailability(
          state.settings,
          state.reservations,
          room,
          input.date,
          input.start,
          input.end,
        )
      : undefined

  if (availability?.state === 'busy') {
    fields.start = CONFLICT_MESSAGE
  }

  if (availability?.state === 'past') {
    fields.date = availability.label
  }

  const pendingConflicts =
    room && input.date && input.start && input.end
      ? getConflicts(
          state.reservations,
          room.id,
          input.date,
          input.start,
          input.end,
          { status: 'pending', ignoreId: options.ignoreReservationId },
        )
      : []

  let error: string | undefined
  if (closedReason) {
    error = closedReason
  } else if (availability?.state === 'past') {
    error = 'Tanggal dan waktu kegiatan sudah lewat. Silakan pilih jadwal lain.'
  } else if (availability?.state === 'busy') {
    error = CONFLICT_MESSAGE
  } else if (availability?.state === 'outside') {
    error = availability.reason ?? OUTSIDE_HOURS_MESSAGE
  } else if (fields.participants) {
    error = fields.participants
  } else if (fields.roomId) {
    error = fields.roomId
  } else if (fields.date) {
    error = fields.date
  } else if (fields.start || fields.end) {
    error = fields.start ?? fields.end
  } else if (fields.purpose) {
    error = fields.purpose
  }

  return {
    ok: Object.keys(fields).length === 0,
    fields,
    error: error ?? (Object.keys(fields).length > 0 ? 'Periksa kembali isian yang ditandai.' : undefined),
    room,
    availability,
    pendingConflicts,
  }
}
