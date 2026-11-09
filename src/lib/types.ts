export type Role = 'student' | 'admin'

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type RoomStatus = 'active' | 'inactive'

export type RoomCategory =
  | 'lab-komputer'
  | 'lab-imac'
  | 'lab-fashion-design'
  | 'ruang-kelas'
  | 'ruang-kelas-s2'
  | 'studio-foto'
  | 'aula'
  | 'gedung-serba-guna'
  | 'ruang-asistensi'
  | 'studio-pola'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  nim?: string
  program?: string
  org?: string
  unit?: string
}

export interface Room {
  id: string
  name: string
  code?: string
  category: RoomCategory
  building?: string
  floor?: number
  capacity?: number
  capacityNote?: string
  facilities: string[]
  description: string
  rules: string[]
  open: string
  close: string
  status: RoomStatus
  photo?: string
  tone: number
}

export interface Reservation {
  id: string
  userId: string
  userName: string
  org?: string
  roomId: string
  date: string
  start: string
  end: string
  purpose: string
  participants: number
  notes?: string
  status: ReservationStatus
  createdAt: string
  decidedAt?: string
  decidedBy?: string
  rejectionReason?: string
  cancelledAt?: string
  cancelReason?: string
  idempotencyKey: string
}

export type ActivityAction =
  | 'create'
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'room_create'
  | 'room_update'
  | 'room_status'

export interface ActivityLog {
  id: string
  at: string
  actor: string
  actorRole: Role | 'system'
  action: ActivityAction
  target: string
  detail: string
}

export interface AppState {
  rooms: Room[]
  reservations: Reservation[]
  logs: ActivityLog[]
  session: string | null
  roomDataVersion?: number
}

export interface ReservationInput {
  roomId: string
  date: string
  start: string
  end: string
  purpose: string
  org?: string
  participants: number
  notes?: string
  idempotencyKey: string
}

export interface FieldErrors {
  [key: string]: string | undefined
}
