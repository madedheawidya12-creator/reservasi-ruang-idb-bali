import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { RoomThumb } from '../../components/RoomThumb'
import { EmptyState, StatusBadge } from '../../components/ui'
import { toMinutes, toTime } from '../../lib/availability'
import {
  campusClosedReason,
  getRoomAvailability,
  operatingHoursLabel,
  type AvailabilityState,
} from '../../lib/campus-rules'
import { ROOM_CATEGORIES, categoryFor, categoryMeta } from '../../lib/categories'
import {
  formatDateLong,
  formatRelativeDay,
  formatTimeRange,
  todayISO,
} from '../../lib/format'
import { roomCapacity, roomCode, roomLocation, roomSearchText } from '../../lib/room-display'
import { useCurrentUser, useStore } from '../../lib/store'
import type { CampusSettings, RoomCategory } from '../../lib/types'

type CategoryFilter = 'all' | RoomCategory

interface SearchFilters {
  query: string
  date: string
  start: string
  end: string
  category: CategoryFilter
}

function initialFilters(settings: CampusSettings): SearchFilters {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const open = toMinutes(settings.openTime)
  const close = toMinutes(settings.closeTime)
  const latestStart = Math.max(open, close - 120)
  const roundedStart = Math.min(
    latestStart,
    Math.max(open, Math.ceil((minutes + 15) / 30) * 30),
  )

  // Default to today's date, with the next usable two-hour window.
  return {
    query: '',
    date: todayISO(),
    start: toTime(roundedStart),
    end: toTime(Math.min(close, roundedStart + 120)),
    category: 'all',
  }
}

export function StudentDashboard() {
  const { state } = useStore()
  const user = useCurrentUser()
  const today = todayISO()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filters, setFilters] = useState<SearchFilters>(() => initialFilters(state.settings))
  const [applied, setApplied] = useState<SearchFilters>(() => initialFilters(state.settings))
  const [searchError, setSearchError] = useState<string | null>(null)

  const myReservations = useMemo(
    () =>
      state.reservations
        .filter((reservation) => reservation.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.reservations, user.id],
  )

  const activeRooms = useMemo(
    () => state.rooms.filter((room) => room.status === 'active'),
    [state.rooms],
  )

  const categoryCounts = useMemo(() => {
    const counts = new Map<RoomCategory, number>()
    for (const category of ROOM_CATEGORIES) counts.set(category.value, 0)
    for (const room of activeRooms) {
      const value = categoryFor(room)
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
    return counts
  }, [activeRooms])

  const filteredRooms = useMemo(() => {
    const query = applied.query.trim().toLowerCase()
    return activeRooms.filter((room) => {
      if (applied.category !== 'all' && categoryFor(room) !== applied.category) return false
      if (!query) return true
      return roomSearchText(room).includes(query)
    })
  }, [activeRooms, applied])

  const roomResults = useMemo(() => {
    const order: Record<AvailabilityState, number> = {
      free: 0,
      busy: 1,
      outside: 2,
      closed: 3,
      past: 4,
      invalid: 5,
    }
    return filteredRooms
      .map((room) => ({
        room,
        availability: getRoomAvailability(
          state.settings,
          state.reservations,
          room,
          applied.date,
          applied.start,
          applied.end,
        ),
      }))
      .sort(
        (a, b) =>
          order[a.availability.state] - order[b.availability.state] ||
          a.room.name.localeCompare(b.room.name, 'id'),
      )
  }, [filteredRooms, state.settings, state.reservations, applied.date, applied.start, applied.end])

  const availableCount = roomResults.filter(
    (result) => result.availability.state === 'free',
  ).length
  const unavailableCount = roomResults.length - availableCount
  const closedCount = roomResults.filter(
    (result) => result.availability.state === 'closed',
  ).length
  const outsideCount = roomResults.filter(
    (result) => result.availability.state === 'outside',
  ).length
  const pendingRoomCount = roomResults.filter(
    (result) => result.availability.pendingCount > 0,
  ).length
  const campusNotice = campusClosedReason(state.settings, applied.date)
  const outsideHoursNotice =
    !campusNotice &&
    outsideCount > 0 &&
    (toMinutes(applied.start) < toMinutes(state.settings.openTime) ||
      toMinutes(applied.end) > toMinutes(state.settings.closeTime) ||
      toMinutes(applied.end) <= toMinutes(applied.start))

  const pendingCount = myReservations.filter((reservation) => reservation.status === 'pending').length
  const approvedCount = myReservations.filter((reservation) => reservation.status === 'approved').length
  const rejectedCount = myReservations.filter((reservation) => reservation.status === 'rejected').length
  const latestReservations = myReservations.slice(0, 4)
  const selectedCategory =
    applied.category === 'all'
      ? null
      : ROOM_CATEGORIES.find((category) => category.value === applied.category) ?? null

  const updateFilter = (patch: Partial<SearchFilters>) => {
    setFilters((previous) => ({ ...previous, ...patch }))
  }

  const scrollToRooms = () => {
    document.getElementById('jelajahi-ruangan')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const focusSearch = () => {
    document.getElementById('cari-ruangan')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    window.setTimeout(() => searchInputRef.current?.focus(), 320)
  }

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    if (!filters.date) {
      setSearchError('Pilih tanggal kegiatan terlebih dahulu.')
      return
    }
    if (filters.date < today) {
      setSearchError('Tanggal kegiatan tidak boleh sebelum hari ini.')
      return
    }
    if (toMinutes(filters.end) <= toMinutes(filters.start)) {
      setSearchError('Jam selesai harus lebih lambat dari jam mulai.')
      return
    }
    setSearchError(null)
    setApplied({ ...filters })
    window.setTimeout(scrollToRooms, 0)
  }

  const selectCategory = (value: RoomCategory) => {
    const nextCategory: CategoryFilter = filters.category === value ? 'all' : value
    const next = { ...filters, category: nextCategory }
    setFilters(next)
    setApplied(next)
    setSearchError(null)
    window.setTimeout(scrollToRooms, 0)
  }

  const resetSearch = () => {
    const next = initialFilters(state.settings)
    setFilters(next)
    setApplied(next)
    setSearchError(null)
  }

  return (
    <div className="stack student-dashboard">
      <div className="hero-stack">
        <section className="student-hero" aria-labelledby="student-hero-title">
          <img
            src="/campus/gedung-idb-bali.jpg"
            alt="Gedung kampus IDB Bali"
            width={1920}
            height={670}
            fetchPriority="high"
          />
          <span className="student-hero-overlay" aria-hidden="true" />
          <div className="student-hero-content">
            <span className="hero-kicker">
              <span className="hero-kicker-dot" aria-hidden="true" />
              RuangIDB · Institut Desain dan Bisnis Bali
            </span>
            <h1 id="student-hero-title">Selamat Datang di RuangIDB</h1>
            <p>
              Platform reservasi ruangan kampus IDB Bali untuk mendukung kegiatan akademik,
              organisasi, dan kreativitas mahasiswa.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn btn-accent" onClick={focusSearch}>
                <Icon name="search" size={17} />
                Cek Ketersediaan
              </button>
              <Link to="/app/reservasi" className="btn btn-hero-secondary">
                Lihat Reservasi Saya
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
            <div className="hero-meta">
              <span>
                <Icon name="calendar" size={15} />
                {formatDateLong(today)}
              </span>
              <span>
                <Icon name="door" size={15} />
                {activeRooms.length} ruang aktif
              </span>
            </div>
          </div>
          <span className="hero-credit">Gedung IDB Bali</span>
        </section>

        <section
          className="campus-search-section"
          id="cari-ruangan"
          aria-labelledby="cari-ruangan-title"
        >
          <div className="campus-search-head">
            <div>
              <h2 id="cari-ruangan-title">Cek Ketersediaan Ruangan</h2>
              <p>
                Pilih tanggal dan rentang waktu untuk melihat ruangan yang tersedia. Hasil diambil
                dari jadwal reservasi kampus, bukan data statis.
              </p>
            </div>
            <p className="campus-search-note">
              <Icon name="info" size={15} />
              Jam layanan {operatingHoursLabel(state.settings)}. Minggu dan hari libur kampus
              tutup. Reservasi yang disetujui membuat ruangan tidak tersedia; pengajuan yang
              menunggu ditandai sebagai potensi bentrok.
            </p>
          </div>

          <form className="campus-search-form" onSubmit={submitSearch} role="search">
            <label className="campus-search-query">
              <span>Nama atau kode ruang</span>
              <span className="campus-search-input">
                <Icon name="search" size={17} />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={filters.query}
                  onChange={(event) => updateFilter({ query: event.target.value })}
                  placeholder="Contoh: Aula atau A.1.2"
                  aria-describedby={searchError ? 'campus-search-error' : undefined}
                />
              </span>
            </label>
            <label>
              <span>Tanggal</span>
              <input
                type="date"
                value={filters.date}
                min={today}
                onChange={(event) => updateFilter({ date: event.target.value })}
              />
            </label>
            <label>
              <span>Mulai</span>
              <input
                type="time"
                value={filters.start}
                min={state.settings.openTime}
                max={state.settings.closeTime}
                step={1800}
                onChange={(event) => updateFilter({ start: event.target.value })}
              />
            </label>
            <label>
              <span>Selesai</span>
              <input
                type="time"
                value={filters.end}
                min={state.settings.openTime}
                max={state.settings.closeTime}
                step={1800}
                onChange={(event) => updateFilter({ end: event.target.value })}
              />
            </label>
            <label>
              <span>Jenis ruangan</span>
              <select
                value={filters.category}
                onChange={(event) =>
                  updateFilter({ category: event.target.value as CategoryFilter })
                }
              >
                <option value="all">Semua jenis</option>
                {ROOM_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-primary campus-search-submit">
              <Icon name="search" size={17} />
              Cek Ketersediaan
            </button>
          </form>

          {searchError ? (
            <p className="campus-search-error" id="campus-search-error" role="alert">
              <Icon name="alert" size={15} />
              {searchError}
            </p>
          ) : null}

          {campusNotice ? (
            <p className="notice notice-error" role="status">
              <Icon name="alert" size={16} />
              {campusNotice}
            </p>
          ) : null}

          {outsideHoursNotice ? (
            <p className="notice notice-warning" role="status">
              <Icon name="clock" size={16} />
              Waktu yang dipilih berada di luar jam operasional kampus (
              {operatingHoursLabel(state.settings)}). Pilih waktu lain untuk mengajukan
              peminjaman.
            </p>
          ) : null}
        </section>
      </div>

      <section
        className="campus-section"
        id="jelajahi-ruangan"
        aria-labelledby="ruangan-title"
      >
        <div className="section-head section-head-results">
          <div>
            <h2 id="ruangan-title">Ketersediaan Ruangan</h2>
            <p>
              {selectedCategory
                ? `Ruang kategori ${selectedCategory.label} untuk tanggal dan jam yang dipilih.`
                : 'Ruangan tersedia ditampilkan lebih dulu. Ruangan yang tidak tersedia tetap dapat dilihat.'}
            </p>
          </div>
          <div className="room-results-meta">
            <span>
              <Icon name="calendar" size={15} />
              {formatDateLong(applied.date)} · {formatTimeRange(applied.start, applied.end)}
            </span>
            <strong aria-live="polite">
              {availableCount} tersedia · {roomResults.length} ruang
            </strong>
          </div>
        </div>

        {applied.query || applied.category !== 'all' ? (
          <div className="active-filters">
            <span className="active-filters-label">Filter aktif</span>
            {applied.query ? (
              <span className="filter-chip">Pencarian: {applied.query}</span>
            ) : null}
            {selectedCategory ? (
              <span className="filter-chip">{selectedCategory.label}</span>
            ) : null}
            <button type="button" className="filter-reset" onClick={resetSearch}>
              <Icon name="refresh" size={14} />
              Reset filter
            </button>
          </div>
        ) : null}

        {roomResults.length > 0 ? (
          <div className="availability-summary" aria-label="Ringkasan ketersediaan">
            <span className="availability-stat is-free">
              <strong>{availableCount}</strong> tersedia
            </span>
            <span className="availability-stat is-busy">
              <strong>{unavailableCount}</strong> tidak tersedia
            </span>
            {closedCount > 0 ? (
              <span className="availability-stat is-closed">
                <strong>{closedCount}</strong> kampus tutup
              </span>
            ) : null}
            {outsideCount > 0 ? (
              <span className="availability-stat is-outside">
                <strong>{outsideCount}</strong> di luar jam operasional
              </span>
            ) : null}
            {pendingRoomCount > 0 ? (
              <span className="availability-stat is-pending">
                <strong>{pendingRoomCount}</strong> ruang punya pengajuan menunggu
              </span>
            ) : null}
          </div>
        ) : null}

        {roomResults.length === 0 ? (
          <EmptyState
            icon="search"
            title="Belum ada ruang yang cocok"
            description={
              selectedCategory
                ? `Kategori ${selectedCategory.label} belum memiliki data ruang pada prototipe ini. Coba kategori lain atau reset filter.`
                : 'Coba kata kunci lain, ubah tanggal dan waktu, atau reset filter untuk melihat semua ruang.'
            }
            action={
              <button type="button" className="btn btn-secondary" onClick={resetSearch}>
                <Icon name="refresh" size={16} />
                Reset filter
              </button>
            }
          />
        ) : (
          <div className="campus-room-grid">
            {roomResults.map(({ room, availability }) => {
              const meta = categoryMeta(categoryFor(room))
              const reserveHref = `/app/reservasi/baru?roomId=${room.id}&date=${applied.date}&start=${applied.start}&end=${applied.end}`
              return (
                <article className="room-card campus-room-card" key={room.id}>
                  <Link
                    to={`/app/ruang/${room.id}`}
                    className="room-card-media"
                    aria-label={`Lihat detail ${room.name}`}
                  >
                    <RoomThumb room={room} />
                    <span className="room-thumb-category">
                      <Icon name={meta.icon} size={13} />
                      {meta.label}
                    </span>
                  </Link>
                  <div className="room-card-body">
                    <div className="room-card-top">
                      <div className="room-card-title">
                        <span className="room-card-code">{roomCode(room)}</span>
                        <h3>
                          <Link to={`/app/ruang/${room.id}`}>{room.name}</Link>
                        </h3>
                      </div>
                      <span
                        className={`room-availability is-${availability.state}`}
                        title={availability.detail ?? availability.reason}
                        aria-label={`${availability.label}${
                          availability.detail ? `, ${availability.detail}` : ''
                        }`}
                      >
                        <span className="room-availability-dot" aria-hidden="true" />
                        {availability.label}
                      </span>
                    </div>
                    <p className="room-card-meta">
                      <Icon name="pin" size={14} />
                      {roomLocation(room)}
                      <span className="room-card-capacity">
                        <Icon name="users" size={14} />
                        {roomCapacity(room)}
                      </span>
                    </p>
                    <p className="room-card-facilities">
                      {room.facilities.length > 0
                        ? room.facilities.slice(0, 3).join(' · ')
                        : 'Belum tersedia'}
                    </p>
                    {availability.pendingCount > 0 ? (
                      <p className="room-pending-note">
                        <Icon name="clock" size={13} />
                        {availability.pendingCount} pengajuan menunggu di slot ini
                      </p>
                    ) : null}
                    <div className="room-card-foot">
                      <div className="room-card-actions">
                        <Link to={`/app/ruang/${room.id}`} className="btn btn-secondary btn-sm">
                          Lihat Detail
                        </Link>
                        {availability.state === 'free' ? (
                          <Link to={reserveHref} className="btn btn-primary btn-sm">
                            Ajukan Peminjaman
                          </Link>
                        ) : (
                          <Link to={`/app/ruang/${room.id}`} className="btn btn-ghost btn-sm">
                            Cek Jadwal
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="campus-section" aria-labelledby="kategori-title">
        <div className="section-head">
          <div>
            <h2 id="kategori-title">Filter jenis ruangan</h2>
            <p>
              Ingin melihat jenis ruang tertentu? Gunakan kategori berikut atau pilih jenis ruangan
              pada formulir pencarian di atas.
            </p>
          </div>
          <Link to="/app/ruang" className="section-link">
            Lihat semua ruangan
            <Icon name="arrow-right" size={15} />
          </Link>
        </div>

        <div className="category-grid" role="group" aria-label="Filter kategori ruangan">
          {ROOM_CATEGORIES.map((category) => {
            const count = categoryCounts.get(category.value) ?? 0
            const active = applied.category === category.value
            return (
              <button
                key={category.value}
                type="button"
                className={`category-card ${active ? 'is-active' : ''} ${count === 0 ? 'is-empty' : ''}`}
                aria-pressed={active}
                onClick={() => selectCategory(category.value)}
                aria-label={`${category.label}, ${count > 0 ? `${count} ruang` : 'belum ada ruang'}`}
              >
                <span className="category-icon">
                  <Icon name={category.icon} size={20} />
                </span>
                <span className="category-copy">
                  <strong>{category.label}</strong>
                  <span>{count > 0 ? `${count} ruang` : 'Belum ada ruang'}</span>
                </span>
                <Icon name="chevron-right" size={16} className="category-arrow" />
              </button>
            )
          })}
        </div>
        <p className="category-note">
          Kategori bertanda “Belum ada ruang” belum memiliki data pada prototipe ini.
        </p>
      </section>

      <section
        className="campus-section reservation-section"
        id="reservasi-saya"
        aria-labelledby="reservasi-title"
        aria-label="Ringkasan reservasi saya"
      >
        <div className="section-head">
          <div>
            <h2 id="reservasi-title">Reservasi Saya</h2>
            <p>Ringkasan pengajuanmu dan status terbaru dari admin.</p>
          </div>
          <Link to="/app/reservasi" className="btn btn-secondary btn-sm">
            Lihat semua reservasi
            <Icon name="arrow-right" size={15} />
          </Link>
        </div>

        <div className="reservation-summary-grid">
          <article className="reservation-summary-card is-pending">
            <span className="reservation-summary-icon">
              <Icon name="clock" size={20} />
            </span>
            <div>
              <span>Menunggu persetujuan</span>
              <strong>{pendingCount}</strong>
              <small>pengajuan</small>
            </div>
          </article>
          <article className="reservation-summary-card is-approved">
            <span className="reservation-summary-icon">
              <Icon name="check" size={20} />
            </span>
            <div>
              <span>Disetujui</span>
              <strong>{approvedCount}</strong>
              <small>pengajuan</small>
            </div>
          </article>
          <article className="reservation-summary-card is-rejected">
            <span className="reservation-summary-icon">
              <Icon name="x" size={20} />
            </span>
            <div>
              <span>Ditolak</span>
              <strong>{rejectedCount}</strong>
              <small>pengajuan</small>
            </div>
          </article>
        </div>

        <div className="reservation-latest">
          <div className="reservation-latest-head">
            <div>
              <h3>Pengajuan terbaru</h3>
              <p>Empat pengajuan terakhir yang kamu buat.</p>
            </div>
            <Link to="/app/reservasi/baru" className="text-link">
              Ajukan reservasi
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>

          {latestReservations.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Belum ada reservasi"
              description="Pilih ruang yang tersedia di atas, lalu ajukan kegiatan pertamamu."
              action={
                <Link to="/app/ruang" className="btn btn-primary">
                  Jelajahi ruangan
                </Link>
              }
            />
          ) : (
            <div className="recent-list">
              {latestReservations.map((reservation) => {
                const room = state.rooms.find((candidate) => candidate.id === reservation.roomId)
                return (
                  <Link
                    to={`/app/reservasi/${reservation.id}`}
                    key={reservation.id}
                    className="recent-row"
                  >
                    {room ? <RoomThumb room={room} className="recent-thumb" /> : null}
                    <div className="recent-main">
                      <div className="recent-title">
                        <h3>{reservation.purpose}</h3>
                        <StatusBadge status={reservation.status} short />
                      </div>
                      <p>
                        {room?.name ?? 'Ruang tidak ditemukan'} ·{' '}
                        {formatRelativeDay(reservation.date)},{' '}
                        {formatTimeRange(reservation.start, reservation.end)}
                      </p>
                      <span className="id-chip">{reservation.id}</span>
                    </div>
                    <Icon name="chevron-right" size={18} />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
