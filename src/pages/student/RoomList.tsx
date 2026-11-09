import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AvailabilityRibbon } from '../../components/AvailabilityRibbon'
import { Icon } from '../../components/Icon'
import { RoomThumb } from '../../components/RoomThumb'
import { EmptyState, PageHeader } from '../../components/ui'
import { buildSlots, getConflicts } from '../../lib/availability'
import { formatDateLong, todayISO } from '../../lib/format'
import { roomCapacity, roomCode, roomFacilities, roomLocation, roomSearchText } from '../../lib/room-display'
import { useStore } from '../../lib/store'

export function RoomList() {
  const { state } = useStore()
  const [params, setParams] = useSearchParams()

  const [query, setQuery] = useState(params.get('q') ?? '')
  const [date, setDate] = useState(params.get('date') ?? todayISO())
  const [start, setStart] = useState(params.get('start') ?? '09:00')
  const [end, setEnd] = useState(params.get('end') ?? '11:00')
  const [capacity, setCapacity] = useState(params.get('capacity') ?? '')
  const [facility, setFacility] = useState(params.get('facility') ?? '')

  const facilities = useMemo(() => {
    const set = new Set<string>()
    state.rooms.forEach((room) => room.facilities.forEach((item) => set.add(item)))
    return [...set].sort((a, b) => a.localeCompare(b, 'id'))
  }, [state.rooms])

  const rooms = state.rooms.filter((room) => room.status === 'active')

  const filtered = rooms.filter((room) => {
    if (query.trim() && !roomSearchText(room).includes(query.trim().toLowerCase())) return false
    if (capacity && (room.capacity === undefined || room.capacity < Number(capacity))) return false
    if (facility && !room.facilities.includes(facility)) return false
    return true
  })

  const apply = (event: FormEvent) => {
    event.preventDefault()
    const next = new URLSearchParams()
    if (query.trim()) next.set('q', query.trim())
    if (date) next.set('date', date)
    if (start) next.set('start', start)
    if (end) next.set('end', end)
    if (capacity) next.set('capacity', capacity)
    if (facility) next.set('facility', facility)
    setParams(next, { replace: true })
  }

  const reset = () => {
    setQuery('')
    setCapacity('')
    setFacility('')
    setDate(todayISO())
    setStart('09:00')
    setEnd('11:00')
    setParams(new URLSearchParams(), { replace: true })
  }

  const activeFilterCount = [query, capacity, facility].filter(Boolean).length

  return (
    <div className="stack">
      <PageHeader
        title="Daftar ruang"
        description="Pilih ruang berdasarkan jadwal, kapasitas, dan fasilitas yang kamu butuhkan."
        actions={
          <Link to="/app/reservasi/baru" className="btn btn-secondary">
            <Icon name="plus" size={17} />
            Ajukan tanpa pilih ruang
          </Link>
        }
      />

      <form className="filter-panel" onSubmit={apply} aria-label="Filter ruang">
        <div className="filter-row">
          <label className="filter-search">
            <span>Cari ruang</span>
            <span className="input-affix">
              <input
                type="search"
                placeholder="Nama ruang, gedung, atau fasilitas"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <span className="affix-icon">
                <Icon name="search" size={17} />
              </span>
            </span>
          </label>
          <label>
            <span>Tanggal</span>
            <input type="date" value={date} min={todayISO()} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label>
            <span>Mulai</span>
            <input type="time" value={start} step={1800} min="08:00" max="20:00" onChange={(event) => setStart(event.target.value)} />
          </label>
          <label>
            <span>Selesai</span>
            <input type="time" value={end} step={1800} min="08:00" max="20:00" onChange={(event) => setEnd(event.target.value)} />
          </label>
        </div>
        <div className="filter-row filter-row-secondary">
          <label>
            <span>Kapasitas minimal</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="Contoh: 20"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
            />
          </label>
          <label>
            <span>Fasilitas</span>
            <select value={facility} onChange={(event) => setFacility(event.target.value)}>
              <option value="">Semua fasilitas</option>
              {facilities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="filter-actions">
            <button type="submit" className="btn btn-primary">
              Terapkan filter
            </button>
            {activeFilterCount > 0 ? (
              <button type="button" className="btn btn-ghost" onClick={reset}>
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </form>

      <h2 className="sr-only">Hasil pencarian ruang</h2>

      <div className="results-head">
        <p>
          <strong>{filtered.length}</strong> ruang ditemukan
          {activeFilterCount > 0 ? ' untuk filter yang dipilih' : ''}
        </p>
        <p className="results-date">
          <Icon name="calendar" size={15} />
          {formatDateLong(date)} · {start.replace(':', '.')}–{end.replace(':', '.')}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title="Belum ada ruang yang cocok"
          description="Coba longgarkan kapasitas, pilih fasilitas lain, atau ganti rentang waktu."
          action={
            <button type="button" className="btn btn-secondary" onClick={reset}>
              Reset filter
            </button>
          }
        />
      ) : (
        <div className="room-grid">
          {filtered.map((room) => {
            const slots = buildSlots(state.reservations, room.id, date)
            const conflicts = getConflicts(state.reservations, room.id, date, start, end)
            const freeSlots = slots.filter((slot) => slot.state === 'free').length
            const bookable = conflicts.length === 0
            return (
              <article className="room-card" key={room.id}>
                <Link to={`/app/ruang/${room.id}`} className="room-card-media" aria-label={`Lihat detail ${room.name}`}>
                  <RoomThumb room={room} />
                </Link>
                <div className="room-card-body">
                  <div className="room-card-top">
                    <h3>
                      <Link to={`/app/ruang/${room.id}`}>{room.name}</Link>
                    </h3>
                    <span className="code-chip">{roomCode(room)}</span>
                  </div>
                  <p className="room-card-meta">
                    <Icon name="pin" size={15} />
                    {roomLocation(room)}
                    <span className="dot-sep" aria-hidden="true" />
                    <Icon name="users" size={15} />
                    {roomCapacity(room)}
                  </p>
                  <p className="room-card-facilities">{roomFacilities(room)}</p>

                  <div className="room-card-availability">
                    <AvailabilityRibbon slots={slots} compact label={`Ketersediaan ${room.name} pada ${formatDateLong(date)}`} />
                    <span>{freeSlots} dari 24 slot kosong</span>
                  </div>

                  <div className="room-card-foot">
                    <span className={`slot-state ${bookable ? 'is-free' : 'is-busy'}`}>
                      <Icon name={bookable ? 'check' : 'alert'} size={15} />
                      {bookable ? 'Tersedia di jam ini' : 'Bentrok jadwal'}
                    </span>
                    <div className="room-card-actions">
                      <Link to={`/app/ruang/${room.id}`} className="btn btn-ghost btn-sm">
                        Lihat Detail
                      </Link>
                      {bookable ? (
                        <Link
                          to={`/app/reservasi/baru?roomId=${room.id}&date=${date}&start=${start}&end=${end}`}
                          className="btn btn-primary btn-sm"
                        >
                          Ajukan Peminjaman
                        </Link>
                      ) : (
                        <Link to={`/app/ruang/${room.id}`} className="btn btn-secondary btn-sm">
                          Cek jadwal
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
    </div>
  )
}
