import type { Room } from './types'

export const ROOM_UNKNOWN = 'Belum tersedia'

type RoomCodeSource = Pick<Room, 'code'>
type RoomLocationSource = Pick<Room, 'building' | 'floor'>
type RoomCapacitySource = Pick<Room, 'capacity' | 'capacityNote'>
type RoomFacilitiesSource = Pick<Room, 'facilities'>

export function roomCode(room: RoomCodeSource): string {
  return room.code?.trim() || ROOM_UNKNOWN
}

export function roomLocation(room: RoomLocationSource): string {
  const building = room.building?.trim()
  const floor = room.floor

  if (building && floor !== undefined) return `${building}, lantai ${floor}`
  if (building) return building
  if (floor !== undefined) return `Lantai ${floor}`
  return ROOM_UNKNOWN
}

export function roomCapacity(room: RoomCapacitySource): string {
  if (room.capacityNote?.trim()) return room.capacityNote.trim()
  if (room.capacity !== undefined && room.capacity > 0) return `${room.capacity} orang`
  return ROOM_UNKNOWN
}

export function roomFacilities(room: RoomFacilitiesSource): string {
  return room.facilities.length > 0 ? room.facilities.join(', ') : ROOM_UNKNOWN
}

export function roomFacilityCount(room: RoomFacilitiesSource): string {
  return room.facilities.length > 0 ? `${room.facilities.length} item` : ROOM_UNKNOWN
}

export function roomSubtitle(room: RoomLocationSource & RoomCodeSource): string {
  const location = roomLocation(room)
  const code = room.code?.trim()

  if (location === ROOM_UNKNOWN && !code) return ROOM_UNKNOWN
  if (!code) return location
  if (location === ROOM_UNKNOWN) return `Kode ${code}`
  return `${location} · ${code}`
}

export function roomSearchText(room: Room): string {
  return [
    room.name,
    room.code ?? '',
    room.building ?? '',
    room.facilities.join(' '),
    room.capacityNote ?? '',
  ]
    .join(' ')
    .toLowerCase()
}

export function roomCapacityLimit(room: RoomCapacitySource): number | undefined {
  return room.capacity !== undefined && room.capacity > 0 ? room.capacity : undefined
}
