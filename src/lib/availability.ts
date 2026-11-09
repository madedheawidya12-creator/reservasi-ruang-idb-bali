import type { Reservation } from './types'

export const DAY_START = 8 * 60
export const DAY_END = 20 * 60
export const SLOT_MINUTES = 30
export const SLOT_COUNT = (DAY_END - DAY_START) / SLOT_MINUTES

export type SlotState = 'free' | 'pending' | 'approved'

export interface Slot {
  start: number
  end: number
  state: SlotState
}

export function toMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return (hour ?? 0) * 60 + (minute ?? 0)
}

export function toTime(minutes: number): string {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(aEnd) > toMinutes(bStart)
}

export function isPast(date: string, end: string): boolean {
  return new Date(`${date}T${end}:00`).getTime() < Date.now()
}

export function getConflicts(
  reservations: Reservation[],
  roomId: string,
  date: string,
  start: string,
  end: string,
  options: { ignoreId?: string; status?: 'approved' | 'pending' } = {},
): Reservation[] {
  const status = options.status ?? 'approved'
  return reservations.filter(
    (reservation) =>
      reservation.id !== options.ignoreId &&
      reservation.roomId === roomId &&
      reservation.date === date &&
      reservation.status === status &&
      overlaps(start, end, reservation.start, reservation.end),
  )
}

export function buildSlots(reservations: Reservation[], roomId: string, date: string): Slot[] {
  const dayReservations = reservations.filter(
    (reservation) =>
      reservation.roomId === roomId &&
      reservation.date === date &&
      (reservation.status === 'approved' || reservation.status === 'pending'),
  )

  return Array.from({ length: SLOT_COUNT }, (_, index) => {
    const start = DAY_START + index * SLOT_MINUTES
    const end = start + SLOT_MINUTES
    const approved = dayReservations.some(
      (reservation) =>
        reservation.status === 'approved' &&
        toMinutes(reservation.start) < end &&
        toMinutes(reservation.end) > start,
    )
    const pending = dayReservations.some(
      (reservation) =>
        reservation.status === 'pending' &&
        toMinutes(reservation.start) < end &&
        toMinutes(reservation.end) > start,
    )
    return { start, end, state: approved ? 'approved' : pending ? 'pending' : 'free' }
  })
}

export function firstFreeRange(slots: Slot[]): { start: string; end: string } | null {
  let start: number | null = null
  for (const slot of slots) {
    if (slot.state === 'free' && start === null) start = slot.start
    if (slot.state !== 'free' && start !== null) {
      return { start: toTime(start), end: toTime(slot.start) }
    }
  }
  if (start !== null) return { start: toTime(start), end: toTime(DAY_END) }
  return null
}

export function isFullDayBlocked(slots: Slot[]): boolean {
  return slots.every((slot) => slot.state === 'approved')
}

export function slotLabel(state: SlotState): string {
  if (state === 'approved') return 'Sudah terpakai'
  if (state === 'pending') return 'Menunggu keputusan'
  return 'Tersedia'
}
