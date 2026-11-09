import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isPast, getConflicts, toMinutes } from './availability'
import { inferRoomCategory } from './categories'
import { formatDateShort, formatTimeRange, todayISO } from './format'
import { createSeedState, DEMO_PASSWORD, ROOMS, ROOM_DATA_VERSION, USERS } from './seed'
import type {
  ActivityAction,
  AppState,
  FieldErrors,
  Reservation,
  ReservationInput,
  ReservationStatus,
  Room,
  RoomStatus,
  User,
} from './types'

const STORAGE_KEY = 'ruangidb.v1'

const LEGACY_ROOM_ID_MAP: Record<string, string> = {
  seminar: 'kelas-a-1-2',
  'rapat-bisnis': 'kolaborasi-1',
  'diskusi-3': 'kolaborasi-1',
}

function cloneRooms(): Room[] {
  return ROOMS.map((room) => ({
    ...room,
    facilities: [...room.facilities],
    rules: [...room.rules],
  }))
}

function migrateRoomData(parsed: AppState): AppState {
  const reservations = parsed.reservations.map((reservation) => {
    const mappedRoomId = LEGACY_ROOM_ID_MAP[reservation.roomId]
    return mappedRoomId ? { ...reservation, roomId: mappedRoomId } : reservation
  })

  const migrationLog = {
    id: `log-migration-${Date.now()}`,
    at: new Date().toISOString(),
    actor: 'Sistem',
    actorRole: 'system' as const,
    action: 'room_update' as const,
    target: 'Data ruangan',
    detail:
      'Data ruangan dimigrasikan ke daftar resmi kampus (21 ruang). Riwayat Ruang Seminar dipetakan ke Ruang Kelas A.1.2; riwayat Ruang Rapat Bisnis dan Ruang Diskusi 3 dipetakan ke Ruang Asistensi.',
  }

  return {
    ...parsed,
    rooms: cloneRooms(),
    reservations,
    logs: [migrationLog, ...parsed.logs],
    roomDataVersion: ROOM_DATA_VERSION,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (Array.isArray(parsed.rooms) && Array.isArray(parsed.reservations) && Array.isArray(parsed.logs)) {
        const migrated =
          parsed.roomDataVersion === ROOM_DATA_VERSION ? parsed : migrateRoomData(parsed)
        return {
          ...migrated,
          rooms: migrated.rooms.map((room) => ({
            ...room,
            category: room.category ?? inferRoomCategory(room),
          })),
        }
      }
    }
  } catch {
    // Data demo rusak: mulai ulang dari data awal.
  }
  return createSeedState()
}

function nextReservationId(reservations: Reservation[], date: string): string {
  const prefix = `R${date.replace(/-/g, '')}`
  const used = new Set(reservations.map((reservation) => reservation.id))
  let index = reservations.filter((reservation) => reservation.id.startsWith(prefix)).length + 1
  while (used.has(`${prefix}-${String(index).padStart(3, '0')}`)) index += 1
  return `${prefix}-${String(index).padStart(3, '0')}`
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export type CreateResult =
  | { ok: true; reservation: Reservation; duplicate: boolean; warning?: string }
  | { ok: false; error: string; fields?: FieldErrors }

export type ActionResult = { ok: true; warning?: string } | { ok: false; error: string }

interface StoreValue {
  state: AppState
  currentUser: User | null
  login: (email: string, password: string) => { ok: true; user: User } | { ok: false; error: string }
  logout: () => void
  resetDemo: () => void
  createReservation: (input: ReservationInput) => CreateResult
  cancelReservation: (id: string, reason: string) => ActionResult
  decideReservation: (id: string, decision: 'approved' | 'rejected', reason?: string) => ActionResult
  saveRoom: (room: Room) => ActionResult
  setRoomStatus: (id: string, status: RoomStatus) => ActionResult
  getRoom: (id: string) => Room | undefined
  getUser: (id: string) => User | undefined
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Penyimpanan penuh atau diblokir: aplikasi tetap berjalan di memori.
    }
  }, [state])

  const currentUser = useMemo(
    () => USERS.find((user) => user.id === state.session) ?? null,
    [state.session],
  )

  const pushLog = useCallback(
    (
      draft: AppState,
      actor: string,
      actorRole: User['role'] | 'system',
      action: ActivityAction,
      target: string,
      detail: string,
    ) => {
      draft.logs = [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          at: new Date().toISOString(),
          actor,
          actorRole,
          action,
          target,
          detail,
        },
        ...draft.logs,
      ]
    },
    [],
  )

  const login: StoreValue['login'] = useCallback((email, password) => {
    const user = USERS.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase())
    if (!user) {
      return { ok: false, error: 'Email belum terdaftar. Gunakan akun demo yang tersedia.' }
    }
    if (password !== DEMO_PASSWORD) {
      return { ok: false, error: 'Kata sandi belum tepat. Untuk prototipe, gunakan “ruangidb”.' }
    }
    setState((previous) => ({ ...previous, session: user.id }))
    return { ok: true, user }
  }, [])

  const logout = useCallback(() => {
    setState((previous) => ({ ...previous, session: null }))
  }, [])

  const resetDemo = useCallback(() => {
    setState((previous) => ({ ...createSeedState(), session: previous.session }))
  }, [])

  const createReservation: StoreValue['createReservation'] = useCallback(
    (input) => {
      if (!currentUser) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' }

      const fields: FieldErrors = {}
      const room = state.rooms.find((candidate) => candidate.id === input.roomId)

      if (!room) fields.roomId = 'Pilih ruang yang ingin diajukan.'
      if (!input.date) fields.date = 'Tentukan tanggal kegiatan.'
      if (!input.start) fields.start = 'Tentukan waktu mulai.'
      if (!input.end) fields.end = 'Tentukan waktu selesai.'
      if (!input.purpose.trim() || input.purpose.trim().length < 5) {
        fields.purpose = 'Tuliskan tujuan kegiatan, minimal 5 karakter.'
      }
      if (!Number.isFinite(input.participants) || input.participants < 1) {
        fields.participants = 'Isi jumlah peserta, minimal 1 orang.'
      }

      if (room && room.capacity !== undefined && input.participants > room.capacity) {
        fields.participants = `Jumlah peserta melebihi kapasitas ${room.name} (${room.capacity} orang).`
      }

      if (input.start && input.end) {
        if (toMinutes(input.end) <= toMinutes(input.start)) {
          fields.end = 'Waktu selesai harus lebih lambat dari waktu mulai.'
        } else if (room && (toMinutes(input.start) < toMinutes(room.open) || toMinutes(input.end) > toMinutes(room.close))) {
          fields.end = `Ruang tersedia antara pukul ${room.open.replace(':', '.')} dan ${room.close.replace(':', '.')}.`
        }
      }

      if (room && room.status === 'inactive') {
        fields.roomId = 'Ruang sedang dinonaktifkan dan belum dapat menerima permohonan baru.'
      }

      if (input.date && isPast(input.date, input.end || '23:59')) {
        fields.date = 'Tanggal dan waktu kegiatan sudah lewat.'
      }

      if (Object.keys(fields).length > 0 || !room) {
        return { ok: false, error: 'Periksa kembali isian yang ditandai.', fields }
      }

      const duplicate = state.reservations.find(
        (reservation) => reservation.idempotencyKey === input.idempotencyKey,
      )
      if (duplicate) {
        return { ok: true, reservation: duplicate, duplicate: true }
      }

      const conflicts = getConflicts(
        state.reservations,
        input.roomId,
        input.date,
        input.start,
        input.end,
      )
      if (conflicts.length > 0) {
        return {
          ok: false,
          error: `Ruang sudah dipakai pada ${formatTimeRange(conflicts[0]!.start, conflicts[0]!.end)} (${conflicts[0]!.id}). Pilih waktu lain.`,
          fields: { start: 'Slot ini sudah terisi reservasi yang disetujui.' },
        }
      }

      const pendingConflicts = getConflicts(
        state.reservations,
        input.roomId,
        input.date,
        input.start,
        input.end,
        { status: 'pending' },
      )

      const reservation: Reservation = {
        id: nextReservationId(state.reservations, input.date),
        userId: currentUser.id,
        userName: currentUser.name,
        org: input.org?.trim() || currentUser.org,
        roomId: input.roomId,
        date: input.date,
        start: input.start,
        end: input.end,
        purpose: input.purpose.trim(),
        participants: input.participants,
        notes: input.notes?.trim() || undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
        idempotencyKey: input.idempotencyKey,
      }

      setState((previous) => {
        const draft: AppState = { ...previous, reservations: [reservation, ...previous.reservations] }
        pushLog(
          draft,
          currentUser.name,
          currentUser.role,
          'create',
          reservation.id,
          `Mengajukan ${room.name} untuk ${formatDateShort(reservation.date)}, ${formatTimeRange(
            reservation.start,
            reservation.end,
          )}.`,
        )
        return draft
      })

      return {
        ok: true,
        reservation,
        duplicate: false,
        warning:
          pendingConflicts.length > 0
            ? `Ada ${pendingConflicts.length} permohonan lain yang masih menunggu di slot ini. Slot belum final sampai admin memutuskan.`
            : undefined,
      }
    },
    [currentUser, pushLog, state.reservations, state.rooms],
  )

  const cancelReservation: StoreValue['cancelReservation'] = useCallback(
    (id, reason) => {
      const reservation = state.reservations.find((candidate) => candidate.id === id)
      if (!reservation) return { ok: false, error: 'Permohonan tidak ditemukan.' }
      if (!currentUser) return { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.' }
      if (currentUser.role !== 'admin' && reservation.userId !== currentUser.id) {
        return { ok: false, error: 'Kamu tidak berwenang membatalkan permohonan ini.' }
      }
      if (reservation.status !== 'pending' && reservation.status !== 'approved') {
        return { ok: false, error: 'Permohonan ini sudah berada pada status akhir.' }
      }
      if (isPast(reservation.date, reservation.end)) {
        return { ok: false, error: 'Reservasi yang sudah lewat tidak dapat dibatalkan.' }
      }

      setState((previous) => {
        const draft: AppState = {
          ...previous,
          reservations: previous.reservations.map((candidate) =>
            candidate.id === id
              ? {
                  ...candidate,
                  status: 'cancelled' as ReservationStatus,
                  cancelledAt: new Date().toISOString(),
                  cancelReason: reason.trim() || undefined,
                }
              : candidate,
          ),
        }
        pushLog(
          draft,
          currentUser.name,
          currentUser.role,
          'cancel',
          id,
          `Membatalkan permohonan ${id}. ${reason.trim() ? `Alasan: ${reason.trim()}` : ''}`.trim(),
        )
        return draft
      })

      return { ok: true }
    },
    [currentUser, pushLog, state.reservations],
  )

  const decideReservation: StoreValue['decideReservation'] = useCallback(
    (id, decision, reason) => {
      if (!currentUser || currentUser.role !== 'admin') {
        return { ok: false, error: 'Hanya admin kampus yang dapat memutuskan permohonan.' }
      }
      const reservation = state.reservations.find((candidate) => candidate.id === id)
      if (!reservation) return { ok: false, error: 'Permohonan tidak ditemukan.' }
      if (reservation.status !== 'pending') {
        return { ok: false, error: 'Permohonan ini sudah diputuskan. Muat ulang halaman untuk melihat status terbaru.' }
      }
      if (decision === 'rejected' && (!reason || reason.trim().length < 10)) {
        return { ok: false, error: 'Tuliskan alasan penolakan minimal 10 karakter agar pemohon memahami keputusan.' }
      }

      if (decision === 'approved') {
        const conflicts = getConflicts(
          state.reservations,
          reservation.roomId,
          reservation.date,
          reservation.start,
          reservation.end,
          { ignoreId: reservation.id },
        )
        if (conflicts.length > 0) {
          return {
            ok: false,
            error: `Jadwal bertabrakan dengan ${conflicts[0]!.id} (${formatTimeRange(
              conflicts[0]!.start,
              conflicts[0]!.end,
            )}). Tinjau ulang atau tolak permohonan ini.`,
          }
        }
      }

      setState((previous) => {
        const draft: AppState = {
          ...previous,
          reservations: previous.reservations.map((candidate) =>
            candidate.id === id
              ? {
                  ...candidate,
                  status: decision,
                  decidedAt: new Date().toISOString(),
                  decidedBy: currentUser.name,
                  rejectionReason: decision === 'rejected' ? reason?.trim() : undefined,
                }
              : candidate,
          ),
        }
        pushLog(
          draft,
          currentUser.name,
          'admin',
          decision === 'approved' ? 'approve' : 'reject',
          id,
          decision === 'approved'
            ? `Menyetujui permohonan ${id} setelah pemeriksaan konflik jadwal.`
            : `Menolak permohonan ${id}. Alasan: ${reason?.trim() ?? ''}`,
        )
        return draft
      })

      return { ok: true }
    },
    [currentUser, pushLog, state.reservations],
  )

  const saveRoom: StoreValue['saveRoom'] = useCallback(
    (room) => {
      if (!currentUser || currentUser.role !== 'admin') {
        return { ok: false, error: 'Hanya admin kampus yang dapat mengubah data ruang.' }
      }
      if (!room.name.trim()) {
        return { ok: false, error: 'Nama ruang wajib diisi.' }
      }
      if (room.capacity !== undefined && (!Number.isFinite(room.capacity) || room.capacity < 1)) {
        return { ok: false, error: 'Kapasitas ruang harus lebih dari 0 atau dikosongkan.' }
      }

      const exists = state.rooms.some((candidate) => candidate.id === room.id)
      const id = exists ? room.id : slugify(room.name) || `ruang-${Date.now()}`
      const nextRoom: Room = {
        ...room,
        id,
        code: room.code?.trim() || undefined,
        building: room.building?.trim() || undefined,
        category: room.category ?? inferRoomCategory(room),
        photo: room.photo?.trim() || undefined,
      }

      setState((previous) => {
        const draft: AppState = {
          ...previous,
          rooms: exists
            ? previous.rooms.map((candidate) => (candidate.id === id ? nextRoom : candidate))
            : [...previous.rooms, nextRoom],
        }
        pushLog(
          draft,
          currentUser.name,
          'admin',
          exists ? 'room_update' : 'room_create',
          nextRoom.name,
          exists
            ? `Memperbarui data ruang ${nextRoom.name}${nextRoom.code ? ` (${nextRoom.code})` : ''}.`
            : `Menambahkan ruang baru ${nextRoom.name}${nextRoom.code ? ` (${nextRoom.code})` : ''}.`,
        )
        return draft
      })

      return { ok: true }
    },
    [currentUser, pushLog, state.rooms],
  )

  const setRoomStatus: StoreValue['setRoomStatus'] = useCallback(
    (id, status) => {
      if (!currentUser || currentUser.role !== 'admin') {
        return { ok: false, error: 'Hanya admin kampus yang dapat mengubah status ruang.' }
      }
      const room = state.rooms.find((candidate) => candidate.id === id)
      if (!room) return { ok: false, error: 'Ruang tidak ditemukan.' }

      const pending = state.reservations.filter(
        (reservation) => reservation.roomId === id && reservation.status === 'pending',
      ).length

      setState((previous) => {
        const draft: AppState = {
          ...previous,
          rooms: previous.rooms.map((candidate) =>
            candidate.id === id ? { ...candidate, status } : candidate,
          ),
        }
        pushLog(
          draft,
          currentUser.name,
          'admin',
          'room_status',
          room.name,
          status === 'inactive'
            ? `Menonaktifkan ${room.name}. Permohonan baru diblokir, riwayat tetap disimpan.`
            : `Mengaktifkan kembali ${room.name}.`,
        )
        return draft
      })

      return {
        ok: true,
        warning:
          status === 'inactive' && pending > 0
            ? `Masih ada ${pending} permohonan menunggu untuk ruang ini. Selesaikan keputusannya.`
            : undefined,
      }
    },
    [currentUser, pushLog, state.rooms, state.reservations],
  )

  const value = useMemo<StoreValue>(
    () => ({
      state,
      currentUser,
      login,
      logout,
      resetDemo,
      createReservation,
      cancelReservation,
      decideReservation,
      saveRoom,
      setRoomStatus,
      getRoom: (id) => state.rooms.find((room) => room.id === id),
      getUser: (id) => USERS.find((user) => user.id === id),
    }),
    [
      state,
      currentUser,
      login,
      logout,
      resetDemo,
      createReservation,
      cancelReservation,
      decideReservation,
      saveRoom,
      setRoomStatus,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore harus dipakai di dalam StoreProvider')
  return context
}

export function useCurrentUser(): User {
  const { currentUser } = useStore()
  if (!currentUser) throw new Error('Tidak ada sesi aktif')
  return currentUser
}

export const DEMO_ACCOUNTS = USERS
export { DEMO_PASSWORD, todayISO }
