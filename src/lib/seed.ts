import { createDefaultCampusSettings } from './campus-settings'
import { formatDateShort, shiftDate } from './format'
import type { ActivityLog, AppState, Reservation, Room, User } from './types'

export const DEMO_PASSWORD = 'ruangidb'

export const USERS: User[] = [
  {
    id: 'u-dhea',
    name: 'Dhea Widya',
    email: 'dhea@idb.ac.id',
    role: 'student',
    nim: '246120940006',
    program: 'Desain Komunikasi Visual',
    org: 'HMJ Desain Komunikasi Visual',
  },
  {
    id: 'u-bagus',
    name: 'Bagus Pramana',
    email: 'bagus@idb.ac.id',
    role: 'student',
    nim: '246120940018',
    program: 'Desain Produk',
    org: 'UKM Fotografi',
  },
  {
    id: 'u-admin',
    name: 'Ayu Sari',
    email: 'admin@idb.ac.id',
    role: 'admin',
    unit: 'Bagian Umum dan Fasilitas',
  },
]

const COMMON_RULES = [
  'Kembalikan tata letak furnitur seperti semula setelah kegiatan.',
  'Jaga kebersihan dan buang sampah pada tempatnya.',
  'Kegiatan harus selesai sesuai waktu yang disetujui.',
]

function room(partial: Omit<Room, 'rules' | 'open' | 'close' | 'status'> & { rules?: string[] }): Room {
  return {
    open: '08:00',
    close: '20:00',
    status: 'active',
    ...partial,
    rules: [...(partial.rules ?? COMMON_RULES)],
    facilities: [...partial.facilities],
  }
}

export const ROOM_DATA_VERSION = 2

const CLASSROOM_FACILITIES = ['LCD Proyektor', 'Komputer presentasi', 'Whiteboard', 'Bangku kuliah']
const LAB_KOMPUTER_FACILITIES = ['Komputer Intel 12th gen', 'GPU NVIDIA', 'Jaringan LAN']
const LAB_IMAC_FACILITIES = ['iMac M1', 'Sistem operasi macOS']
const ASISTENSI_FACILITIES = ['Meja', 'Kursi', 'Taman mini', 'Area outdoor']
const GEDUNG_SERBA_GUNA_FACILITIES = ['Area parkir', 'Area olahraga', 'Area kegiatan ekstrakurikuler']
const STUDIO_FOTO_FACILITIES = ['Background', 'Properti penunjang']
const RUANG_KELAS_S2_FACILITIES = ['Kamera', 'Peralatan digital', 'Fasilitas kuliah daring']
const STUDIO_POLA_FACILITIES = ['Meja pola', 'Area potong bahan']

const CLASSROOM_DESCRIPTION =
  'Ruang perkuliahan non-praktik dengan LCD proyektor, komputer presentasi, whiteboard, dan bangku kuliah.'
const LAB_KOMPUTER_DESCRIPTION =
  'Laboratorium komputer dengan CPU Intel generasi ke-12, GPU NVIDIA, dan jaringan LAN. Kapasitas kelas 24–36 mahasiswa.'
const LAB_IMAC_DESCRIPTION =
  'Laboratorium iMac berchip M1 untuk praktik desain. Terletak di lantai 1.'
const LAB_FASHION_DESCRIPTION =
  'Laboratorium desain mode untuk eksplorasi teknik, pola, dan pengembangan produk fashion. Terletak di lantai 1.'
const AULA_DESCRIPTION =
  'Aula kampus untuk seminar, workshop, pelatihan, kegiatan UKM, dan acara kampus lainnya.'
const GEDUNG_SERBA_GUNA_DESCRIPTION =
  'Gedung luas untuk parkir, olahraga, ekstrakurikuler, dan kegiatan kampus berskala besar.'
const ASISTENSI_DESCRIPTION =
  'Ruang asistensi dengan area outdoor, taman mini, meja, dan tempat duduk. Terletak di lantai 3.'
const STUDIO_FOTO_DESCRIPTION =
  'Studio untuk fotografi dan videografi dengan background dan properti penunjang. Terletak di lantai 1.'
const RUANG_KELAS_S2_DESCRIPTION =
  'Ruang kelas magister dengan kamera dan peralatan digital untuk perkuliahan tatap muka maupun daring.'
const STUDIO_POLA_DESCRIPTION =
  'Studio untuk menggambar pola dan memotong bahan bagi mahasiswa Desain Mode. Terletak di lantai 1.'

export const ROOMS: Room[] = [
  room({
    id: 'kelas-a-1-2',
    name: 'Ruang Kelas A.1.2',
    code: 'A.1.2',
    category: 'ruang-kelas',
    building: 'Gedung A',
    facilities: CLASSROOM_FACILITIES,
    description: CLASSROOM_DESCRIPTION,
    tone: 0,
  }),
  room({
    id: 'kelas-a-2-1',
    name: 'Ruang Kelas A.2.1',
    code: 'A.2.1',
    category: 'ruang-kelas',
    building: 'Gedung A',
    facilities: CLASSROOM_FACILITIES,
    description: CLASSROOM_DESCRIPTION,
    tone: 1,
  }),
  room({
    id: 'kelas-b-1-3',
    name: 'Ruang Kelas B.1.3',
    code: 'B.1.3',
    category: 'ruang-kelas',
    building: 'Gedung B',
    facilities: CLASSROOM_FACILITIES,
    description: CLASSROOM_DESCRIPTION,
    tone: 2,
  }),
  room({
    id: 'kelas-b-2-2',
    name: 'Ruang Kelas B.2.2',
    code: 'B.2.2',
    category: 'ruang-kelas',
    building: 'Gedung B',
    facilities: CLASSROOM_FACILITIES,
    description: CLASSROOM_DESCRIPTION,
    tone: 3,
  }),
  room({
    id: 'kelas-c-1-3',
    name: 'Ruang Kelas C.1.3',
    code: 'C.1.3',
    category: 'ruang-kelas',
    building: 'Gedung C',
    facilities: CLASSROOM_FACILITIES,
    description: CLASSROOM_DESCRIPTION,
    tone: 4,
  }),
  room({
    id: 'kelas-c-2-1',
    name: 'Ruang Kelas C.2.1',
    code: 'C.2.1',
    category: 'ruang-kelas',
    building: 'Gedung C',
    facilities: CLASSROOM_FACILITIES,
    description: CLASSROOM_DESCRIPTION,
    tone: 5,
  }),
  room({
    id: 'kelas-c-2-3',
    name: 'Ruang Kelas C.2.3',
    code: 'C.2.3',
    category: 'ruang-kelas',
    building: 'Gedung C',
    facilities: CLASSROOM_FACILITIES,
    description: CLASSROOM_DESCRIPTION,
    tone: 6,
  }),
  room({
    id: 'kelas-c-3-1',
    name: 'Ruang Kelas C.3.1',
    code: 'C.3.1',
    category: 'ruang-kelas',
    building: 'Gedung C',
    facilities: CLASSROOM_FACILITIES,
    description: CLASSROOM_DESCRIPTION,
    tone: 7,
  }),
  room({
    id: 'auditorium',
    name: 'Aula',
    category: 'aula',
    facilities: [],
    description: AULA_DESCRIPTION,
    tone: 1,
  }),
  room({
    id: 'kolaborasi-1',
    name: 'Ruang Asistensi',
    category: 'ruang-asistensi',
    floor: 3,
    facilities: ASISTENSI_FACILITIES,
    description: ASISTENSI_DESCRIPTION,
    tone: 2,
  }),
  room({
    id: 'studio-desain',
    name: 'Lab Komputer A1.1',
    code: 'A1.1',
    category: 'lab-komputer',
    building: 'Gedung A',
    floor: 1,
    capacity: 36,
    capacityNote: '24–36 orang',
    facilities: LAB_KOMPUTER_FACILITIES,
    description: LAB_KOMPUTER_DESCRIPTION,
    tone: 3,
  }),
  room({
    id: 'lab-komputer-a-2-2',
    name: 'Lab Komputer A.2.2',
    code: 'A.2.2',
    category: 'lab-komputer',
    building: 'Gedung A',
    floor: 1,
    capacity: 36,
    capacityNote: '24–36 orang',
    facilities: LAB_KOMPUTER_FACILITIES,
    description: LAB_KOMPUTER_DESCRIPTION,
    tone: 4,
  }),
  room({
    id: 'lab-komputer-a-2-3',
    name: 'Lab Komputer A.2.3',
    code: 'A.2.3',
    category: 'lab-komputer',
    building: 'Gedung A',
    floor: 1,
    capacity: 36,
    capacityNote: '24–36 orang',
    facilities: LAB_KOMPUTER_FACILITIES,
    description: LAB_KOMPUTER_DESCRIPTION,
    tone: 5,
  }),
  room({
    id: 'lab-komputer-c-1-1',
    name: 'Lab Komputer C.1.1',
    code: 'C.1.1',
    category: 'lab-komputer',
    building: 'Gedung C',
    floor: 1,
    capacity: 36,
    capacityNote: '24–36 orang',
    facilities: LAB_KOMPUTER_FACILITIES,
    description: LAB_KOMPUTER_DESCRIPTION,
    tone: 6,
  }),
  room({
    id: 'lab-komputer-c-1-2',
    name: 'Lab Komputer C.1.2',
    code: 'C.1.2',
    category: 'lab-komputer',
    building: 'Gedung C',
    floor: 1,
    capacity: 36,
    capacityNote: '24–36 orang',
    facilities: LAB_KOMPUTER_FACILITIES,
    description: LAB_KOMPUTER_DESCRIPTION,
    tone: 7,
  }),
  room({
    id: 'aula-serbaguna',
    name: 'Gedung Serba Guna',
    category: 'gedung-serba-guna',
    facilities: GEDUNG_SERBA_GUNA_FACILITIES,
    description: GEDUNG_SERBA_GUNA_DESCRIPTION,
    tone: 5,
  }),
  room({
    id: 'studio-foto',
    name: 'Studio Foto',
    category: 'studio-foto',
    floor: 1,
    facilities: STUDIO_FOTO_FACILITIES,
    description: STUDIO_FOTO_DESCRIPTION,
    tone: 7,
  }),
  room({
    id: 'lab-imac-b-1-1',
    name: 'Lab iMac B.1.1',
    code: 'B.1.1',
    category: 'lab-imac',
    building: 'Gedung B',
    floor: 1,
    facilities: LAB_IMAC_FACILITIES,
    description: LAB_IMAC_DESCRIPTION,
    tone: 1,
  }),
  room({
    id: 'lab-fashion-design-b-1-2',
    name: 'Lab Fashion Design B.1.2',
    code: 'B.1.2',
    category: 'lab-fashion-design',
    building: 'Gedung B',
    floor: 1,
    facilities: [],
    description: LAB_FASHION_DESCRIPTION,
    tone: 2,
  }),
  room({
    id: 'ruang-kelas-s2',
    name: 'Ruang Kelas S2',
    category: 'ruang-kelas-s2',
    facilities: RUANG_KELAS_S2_FACILITIES,
    description: RUANG_KELAS_S2_DESCRIPTION,
    tone: 4,
  }),
  room({
    id: 'studio-pola',
    name: 'Studio Pola',
    category: 'studio-pola',
    floor: 1,
    facilities: STUDIO_POLA_FACILITIES,
    description: STUDIO_POLA_DESCRIPTION,
    tone: 6,
  }),
]

function stamp(daysAgo: number, hour: number, minute = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function reservationId(date: string, index: number): string {
  return `R${date.replace(/-/g, '')}-${String(index).padStart(3, '0')}`
}

export function createSeedState(): AppState {
  const today = shiftDate(0)
  const tomorrow = shiftDate(1)
  const yesterday = shiftDate(-1)
  const twoDaysAgo = shiftDate(-2)
  const inTwoDays = shiftDate(2)
  const inThreeDays = shiftDate(3)

  const reservations: Reservation[] = [
    {
      id: reservationId(today, 1),
      userId: 'u-bagus',
      userName: 'Bagus Pramana',
      org: 'UKM Fotografi',
      roomId: 'kelas-a-1-2',
      date: today,
      start: '09:00',
      end: '11:00',
      purpose: 'Rapat koordinasi UKM Fotografi',
      participants: 12,
      status: 'approved',
      createdAt: stamp(2, 9, 15),
      decidedAt: stamp(1, 10, 5),
      decidedBy: 'Ayu Sari',
      idempotencyKey: 'seed-1',
    },
    {
      id: reservationId(today, 2),
      userId: 'u-dhea',
      userName: 'Dhea Widya',
      org: 'HMJ Desain Komunikasi Visual',
      roomId: 'kolaborasi-1',
      date: today,
      start: '13:00',
      end: '15:00',
      purpose: 'Review portofolio anggota HMJ',
      participants: 18,
      status: 'approved',
      createdAt: stamp(3, 14, 20),
      decidedAt: stamp(2, 8, 45),
      decidedBy: 'Ayu Sari',
      idempotencyKey: 'seed-2',
    },
    {
      id: reservationId(today, 3),
      userId: 'u-dhea',
      userName: 'Dhea Widya',
      org: 'HMJ Desain Komunikasi Visual',
      roomId: 'kolaborasi-1',
      date: today,
      start: '16:00',
      end: '17:30',
      purpose: 'Rapat panitia Desain Fest',
      participants: 10,
      notes: 'Membahas rundown dan pembagian tugas hari-H.',
      status: 'pending',
      createdAt: stamp(0, 7, 40),
      idempotencyKey: 'seed-3',
    },
    {
      id: reservationId(tomorrow, 1),
      userId: 'u-bagus',
      userName: 'Bagus Pramana',
      org: 'UKM Fotografi',
      roomId: 'auditorium',
      date: tomorrow,
      start: '10:00',
      end: '12:00',
      purpose: 'Sosialisasi UKM Fotografi',
      participants: 80,
      status: 'pending',
      createdAt: stamp(0, 8, 10),
      idempotencyKey: 'seed-4',
    },
    {
      id: reservationId(tomorrow, 2),
      userId: 'u-bagus',
      userName: 'Bagus Pramana',
      org: 'UKM Fotografi',
      roomId: 'studio-desain',
      date: tomorrow,
      start: '08:00',
      end: '10:00',
      purpose: 'Workshop fotografi produk',
      participants: 20,
      status: 'approved',
      createdAt: stamp(4, 11, 0),
      decidedAt: stamp(3, 9, 30),
      decidedBy: 'Ayu Sari',
      idempotencyKey: 'seed-5',
    },
    {
      id: reservationId(yesterday, 1),
      userId: 'u-dhea',
      userName: 'Dhea Widya',
      org: 'HMJ Desain Komunikasi Visual',
      roomId: 'kelas-a-1-2',
      date: yesterday,
      start: '14:00',
      end: '16:00',
      purpose: 'Kuliah tamu alumni',
      participants: 55,
      status: 'rejected',
      createdAt: stamp(5, 10, 20),
      decidedAt: stamp(4, 13, 15),
      decidedBy: 'Ayu Sari',
      rejectionReason:
        'Ruang sudah dialokasikan untuk kegiatan akademik pada jam tersebut. Silakan pilih waktu setelah pukul 16.00.',
      idempotencyKey: 'seed-6',
    },
    {
      id: reservationId(twoDaysAgo, 1),
      userId: 'u-bagus',
      userName: 'Bagus Pramana',
      org: 'UKM Fotografi',
      roomId: 'aula-serbaguna',
      date: twoDaysAgo,
      start: '09:00',
      end: '12:00',
      purpose: 'Open recruitment UKM Fotografi',
      participants: 45,
      status: 'approved',
      createdAt: stamp(8, 9, 0),
      decidedAt: stamp(7, 9, 20),
      decidedBy: 'Ayu Sari',
      idempotencyKey: 'seed-7',
    },
    {
      id: reservationId(yesterday, 2),
      userId: 'u-dhea',
      userName: 'Dhea Widya',
      org: 'HMJ Desain Komunikasi Visual',
      roomId: 'kolaborasi-1',
      date: yesterday,
      start: '15:00',
      end: '16:30',
      purpose: 'Bimbingan proposal kegiatan',
      participants: 6,
      status: 'cancelled',
      createdAt: stamp(6, 15, 0),
      cancelledAt: stamp(5, 8, 10),
      cancelReason: 'Kegiatan dipindahkan ke ruang lain.',
      idempotencyKey: 'seed-8',
    },
    {
      id: reservationId(inTwoDays, 1),
      userId: 'u-dhea',
      userName: 'Dhea Widya',
      org: 'HMJ Desain Komunikasi Visual',
      roomId: 'aula-serbaguna',
      date: inTwoDays,
      start: '13:00',
      end: '16:00',
      purpose: 'Desain Fest: sesi talkshow',
      participants: 100,
      notes: 'Butuh sound system tambahan dan area registrasi di depan aula.',
      status: 'pending',
      createdAt: stamp(1, 16, 25),
      idempotencyKey: 'seed-9',
    },
    {
      id: reservationId(inThreeDays, 1),
      userId: 'u-bagus',
      userName: 'Bagus Pramana',
      org: 'UKM Fotografi',
      roomId: 'studio-foto',
      date: inThreeDays,
      start: '09:00',
      end: '11:00',
      purpose: 'Pemotretan katalog produk',
      participants: 8,
      status: 'approved',
      createdAt: stamp(2, 10, 0),
      decidedAt: stamp(1, 11, 40),
      decidedBy: 'Ayu Sari',
      idempotencyKey: 'seed-10',
    },
  ]

  const logs: ActivityLog[] = [
    {
      id: 'log-1',
      at: stamp(0, 7, 40),
      actor: 'Dhea Widya',
      actorRole: 'student',
      action: 'create',
      target: reservationId(today, 3),
      detail: `Mengajukan Ruang Asistensi untuk ${formatDateShort(today)}, 16.00-17.30.`,
    },
    {
      id: 'log-2',
      at: stamp(0, 8, 10),
      actor: 'Bagus Pramana',
      actorRole: 'student',
      action: 'create',
      target: reservationId(tomorrow, 1),
      detail: `Mengajukan Aula untuk ${formatDateShort(tomorrow)}, 10.00-12.00.`,
    },
    {
      id: 'log-3',
      at: stamp(1, 16, 25),
      actor: 'Dhea Widya',
      actorRole: 'student',
      action: 'create',
      target: reservationId(inTwoDays, 1),
      detail: `Mengajukan Gedung Serba Guna untuk ${formatDateShort(inTwoDays)}, 13.00-16.00.`,
    },
    {
      id: 'log-4',
      at: stamp(1, 11, 40),
      actor: 'Ayu Sari',
      actorRole: 'admin',
      action: 'approve',
      target: reservationId(inThreeDays, 1),
      detail: 'Menyetujui permohonan Studio Foto setelah pemeriksaan konflik jadwal.',
    },
    {
      id: 'log-5',
      at: stamp(2, 8, 45),
      actor: 'Ayu Sari',
      actorRole: 'admin',
      action: 'approve',
      target: reservationId(today, 2),
      detail: 'Menyetujui permohonan Ruang Kolaborasi 1.',
    },
    {
      id: 'log-6',
      at: stamp(4, 13, 15),
      actor: 'Ayu Sari',
      actorRole: 'admin',
      action: 'reject',
      target: reservationId(yesterday, 1),
      detail: 'Menolak permohonan Ruang Kelas A.1.2 karena benturan kegiatan akademik.',
    },
    {
      id: 'log-7',
      at: stamp(5, 8, 10),
      actor: 'Dhea Widya',
      actorRole: 'student',
      action: 'cancel',
      target: reservationId(yesterday, 2),
      detail: 'Membatalkan permohonan Ruang Asistensi.',
    },
    {
      id: 'log-8',
      at: stamp(7, 9, 20),
      actor: 'Ayu Sari',
      actorRole: 'admin',
      action: 'approve',
      target: reservationId(twoDaysAgo, 1),
      detail: 'Menyetujui permohonan Gedung Serba Guna.',
    },
  ]

  return {
    rooms: ROOMS.map((item) => ({
      ...item,
      facilities: [...item.facilities],
      rules: [...item.rules],
    })),
    reservations,
    logs: logs.sort((a, b) => b.at.localeCompare(a.at)),
    settings: createDefaultCampusSettings(),
    session: null,
    roomDataVersion: ROOM_DATA_VERSION,
  }
}
