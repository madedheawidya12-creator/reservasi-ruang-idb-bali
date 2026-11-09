import type { IconName } from '../components/Icon'
import type { Room, RoomCategory } from './types'

export interface RoomCategoryMeta {
  value: RoomCategory
  label: string
  description: string
  icon: IconName
  photo: string
  photoCredit: string
  photoSource: string
  photoOfficial: boolean
}

/**
 * Category labels follow the room types requested for the dashboard.
 * A category can exist without a room yet; the UI shows that honestly.
 * Photos come from the official IDB Bali facilities page and represent
 * the facility category, not necessarily a specific room.
 */
export const ROOM_CATEGORIES: RoomCategoryMeta[] = [
  {
    value: 'lab-komputer',
    label: 'Lab Komputer',
    description: 'Kelas praktik perangkat lunak dan komputer desain.',
    icon: 'monitor',
    photo: '/rooms/lab-komputer.jpg',
    photoCredit: 'IDB Bali · Fasilitas Kampus',
    photoSource: 'https://www.idbbali.ac.id/fasilitas-kampus/',
    photoOfficial: true,
  },
  {
    value: 'lab-imac',
    label: 'Lab iMac',
    description: 'Studio praktik dengan komputer iMac.',
    icon: 'monitor',
    photo: '/rooms/lab-imac.jpg',
    photoCredit: 'IDB Bali · Fasilitas Kampus',
    photoSource: 'https://www.idbbali.ac.id/fasilitas-kampus/',
    photoOfficial: true,
  },
  {
    value: 'lab-fashion-design',
    label: 'Lab Fashion Design',
    description: 'Ruang praktik desain mode dan produksi busana.',
    icon: 'scissors',
    photo: '/rooms/lab-fashion-design.jpg',
    photoCredit: 'IDB Bali · Fasilitas Kampus',
    photoSource: 'https://www.idbbali.ac.id/fasilitas-kampus/',
    photoOfficial: true,
  },
  {
    value: 'ruang-kelas',
    label: 'Ruang Kelas',
    description: 'Kelas teori, seminar, dan kuliah tamu.',
    icon: 'board',
    photo: '/rooms/ruang-kelas.jpg',
    photoCredit: 'IDB Bali · Fasilitas Kampus',
    photoSource: 'https://www.idbbali.ac.id/fasilitas-kampus/',
    photoOfficial: true,
  },
  {
    value: 'ruang-kelas-s2',
    label: 'Ruang Kelas S2',
    description: 'Kelas program magister dan diskusi lanjutan.',
    icon: 'users',
    photo: '/rooms/ruang-kelas-s2.jpg',
    photoCredit: 'IDB Bali · Fasilitas Kampus',
    photoSource: 'https://www.idbbali.ac.id/fasilitas-kampus/',
    photoOfficial: true,
  },
  {
    value: 'studio-foto',
    label: 'Studio Foto',
    description: 'Pemotretan produk, portofolio, dan tugas fotografi.',
    icon: 'camera',
    photo: '/rooms/studio-foto.jpg',
    photoCredit: 'IDB Bali · Fasilitas Kampus',
    photoSource: 'https://www.idbbali.ac.id/fasilitas-kampus/',
    photoOfficial: true,
  },
  {
    value: 'aula',
    label: 'Aula',
    description: 'Kegiatan besar, talkshow, dan pertunjukan.',
    icon: 'speaker',
    photo: '/rooms/aula.jpg',
    photoCredit: 'IDB Bali · Fasilitas Kampus',
    photoSource: 'https://www.idbbali.ac.id/fasilitas-kampus/',
    photoOfficial: true,
  },
  {
    value: 'gedung-serba-guna',
    label: 'Gedung Serba Guna',
    description: 'Area fleksibel untuk pameran, bazar, dan komunitas.',
    icon: 'building',
    photo: '/rooms/gedung-serba-guna.jpg',
    photoCredit: 'IDB Bali · Fasilitas Kampus',
    photoSource: 'https://www.idbbali.ac.id/fasilitas-kampus/',
    photoOfficial: true,
  },
  {
    value: 'ruang-asistensi',
    label: 'Ruang Asistensi',
    description: 'Bimbingan, review karya, dan kerja kelompok.',
    icon: 'clipboard',
    photo: '/rooms/ruang-asistensi.jpg',
    photoCredit: 'IDB Bali · Fasilitas Kampus',
    photoSource: 'https://www.idbbali.ac.id/fasilitas-kampus/',
    photoOfficial: true,
  },
  {
    value: 'studio-pola',
    label: 'Studio Pola',
    description: 'Praktik pola, jahit, dan eksplorasi busana.',
    icon: 'ruler',
    photo: '/rooms/studio-pola.jpg',
    photoCredit: 'IDB Bali · Fasilitas Kampus',
    photoSource: 'https://www.idbbali.ac.id/fasilitas-kampus/',
    photoOfficial: true,
  },
]

export const CATEGORY_LABEL = Object.fromEntries(
  ROOM_CATEGORIES.map((category) => [category.value, category.label]),
) as Record<RoomCategory, string>

type CategorySource = Pick<Room, 'name'> & {
  id?: string
  category?: RoomCategory
}

const CATEGORY_VALUES = new Set(ROOM_CATEGORIES.map((category) => category.value))

/**
 * Keeps rooms created before the category field was introduced usable.
 * The mapping only uses information already present in the room name.
 */
export function inferRoomCategory(room: CategorySource): RoomCategory {
  const haystack = `${room.id ?? ''} ${room.name}`.toLowerCase()
  if (haystack.includes('foto')) return 'studio-foto'
  if (haystack.includes('serbaguna') || haystack.includes('serba guna')) return 'gedung-serba-guna'
  if (haystack.includes('auditorium') || haystack.includes('aula')) return 'aula'
  if (haystack.includes('imac')) return 'lab-imac'
  if (haystack.includes('fashion') || haystack.includes('pola')) {
    return haystack.includes('pola') ? 'studio-pola' : 'lab-fashion-design'
  }
  if (haystack.includes('s2') || haystack.includes('magister')) return 'ruang-kelas-s2'
  if (haystack.includes('seminar') || haystack.includes('kelas')) return 'ruang-kelas'
  if (haystack.includes('komputer') || haystack.includes('studio desain')) return 'lab-komputer'
  if (
    haystack.includes('kolaborasi') ||
    haystack.includes('diskusi') ||
    haystack.includes('rapat') ||
    haystack.includes('asistensi')
  ) {
    return 'ruang-asistensi'
  }
  return 'ruang-kelas'
}

export function categoryFor(room: CategorySource): RoomCategory {
  if (room.category && CATEGORY_VALUES.has(room.category)) return room.category
  return inferRoomCategory(room)
}

export function categoryMeta(value: RoomCategory): RoomCategoryMeta {
  return ROOM_CATEGORIES.find((category) => category.value === value) ?? ROOM_CATEGORIES[3]!
}
