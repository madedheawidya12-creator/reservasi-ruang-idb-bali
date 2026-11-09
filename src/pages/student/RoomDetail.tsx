import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AvailabilityRibbon, RibbonLegend } from '../../components/AvailabilityRibbon'
import { Icon } from '../../components/Icon'
import { RoomThumb } from '../../components/RoomThumb'
import { EmptyState, PageHeader } from '../../components/ui'
import { buildSlots, firstFreeRange, getConflicts, isFullDayBlocked } from '../../lib/availability'
import { categoryMeta } from '../../lib/categories'
import { formatDateLong, formatTimeRange, todayISO } from '../../lib/format'
import { roomCapacity, roomCode, roomLocation, roomSubtitle } from '../../lib/room-display'
import { useStore } from '../../lib/store'

export function RoomDetail() {
  const { id } = useParams()
  const { state } = useStore()
  const [date, setDate] = useState(todayISO())
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('11:00')

  const room = state.rooms.find((candidate) => candidate.id === id)

  const slots = useMemo(
    () => (room ? buildSlots(state.reservations, room.id, date) : []),
    [room, state.reservations, date],
  )

  if (!room) {
    return (
      <EmptyState
        icon="door"
        title="Ruang tidak ditemukan"
        description="Ruang mungkin sudah dihapus atau tautannya tidak lagi berlaku."
        action={
          <Link to="/app/ruang" className="btn btn-secondary">
            Kembali ke daftar ruang
          </Link>
        }
      />
    )
  }

  const category = categoryMeta(room.category)
  const usingReferencePhoto = !room.photo?.trim()
  const range = firstFreeRange(slots)
  const full = isFullDayBlocked(slots)
  const conflicts = getConflicts(state.reservations, room.id, date, start, end)
  const bookable = conflicts.length === 0 && room.status === 'active'
  const daySchedule = state.reservations
    .filter(
      (reservation) =>
        reservation.roomId === room.id &&
        reservation.date === date &&
        (reservation.status === 'approved' || reservation.status === 'pending'),
    )
    .sort((a, b) => a.start.localeCompare(b.start))

  return (
    <div className="stack">
      <PageHeader
        back={{ to: '/app/ruang', label: 'Daftar ruang' }}
        title={room.name}
        description={roomSubtitle(room)}
        actions={
          <span className={`badge ${room.status === 'active' ? 'badge-approved' : 'badge-cancelled'}`}>
            <span className="badge-dot" aria-hidden="true" />
            {room.status === 'active' ? 'Ruangan aktif' : 'Dinonaktifkan'}
          </span>
        }
      />

      <div className="detail-grid">
        <div className="detail-main">
          <RoomThumb room={room} className="detail-thumb" />
          {usingReferencePhoto ? (
            <p className="photo-caption">
              {category.photoOfficial
                ? `Foto fasilitas IDB Bali untuk kategori ${category.label}; bukan foto spesifik ruangan ini.`
                : `Foto referensi kategori ${category.label}, bukan foto asli ruangan IDB Bali.`}{' '}
              Sumber:{' '}
              <a href={category.photoSource} target="_blank" rel="noreferrer">
                {category.photoCredit}
              </a>
              .
            </p>
          ) : null}

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Tentang ruang</h2>
                <p>Kapasitas dan kelengkapan yang tercatat untuk ruang ini.</p>
              </div>
            </div>
            <p className="detail-desc">{room.description}</p>
            <dl className="fact-grid">
              <div>
                <dt>
                  <Icon name="users" size={16} /> Kapasitas
                </dt>
                <dd>{roomCapacity(room)}</dd>
              </div>
              <div>
                <dt>
                  <Icon name="pin" size={16} /> Lokasi
                </dt>
                <dd>{roomLocation(room)}</dd>
              </div>
              <div>
                <dt>
                  <Icon name="clock" size={16} /> Jam layanan
                </dt>
                <dd>
                  {room.open.replace(':', '.')}–{room.close.replace(':', '.')}
                </dd>
              </div>
              <div>
                <dt>
                  <Icon name="door" size={16} /> Kode ruang
                </dt>
                <dd>{roomCode(room)}</dd>
              </div>
            </dl>

            <h3 className="subhead">Fasilitas</h3>
            {room.facilities.length > 0 ? (
              <ul className="facility-list">
                {room.facilities.map((facility) => (
                  <li key={facility}>
                    <Icon name="check" size={15} />
                    {facility}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Data fasilitas belum tersedia.</p>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Aturan penggunaan</h2>
                <p>Berlaku untuk seluruh kegiatan yang disetujui.</p>
              </div>
            </div>
            <ol className="rule-list">
              {room.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
              <li>Permohonan yang disetujui tidak dapat dipindahtangankan tanpa persetujuan admin.</li>
            </ol>
          </section>
        </div>

        <aside className="detail-side">
          <section className="panel booking-panel">
            <h2>Cek ketersediaan</h2>
            <label className="booking-date">
              <span>Tanggal</span>
              <input type="date" value={date} min={todayISO()} onChange={(event) => setDate(event.target.value)} />
            </label>

            <div className="booking-ribbon">
              <AvailabilityRibbon slots={slots} showAxis label={`Ketersediaan ${room.name} pada ${formatDateLong(date)}`} />
              <RibbonLegend />
            </div>

            <p className={`booking-summary ${full ? 'is-busy' : ''}`}>
              {full
                ? 'Semua slot pada tanggal ini sudah terpakai.'
                : range
                  ? `Slot kosong terdekat: ${range.start.replace(':', '.')}–${range.end.replace(':', '.')}`
                  : 'Belum ada slot kosong.'}
            </p>

            <div className="booking-time">
              <label>
                <span>Mulai</span>
                <input type="time" value={start} step={1800} min={room.open} max={room.close} onChange={(event) => setStart(event.target.value)} />
              </label>
              <label>
                <span>Selesai</span>
                <input type="time" value={end} step={1800} min={room.open} max={room.close} onChange={(event) => setEnd(event.target.value)} />
              </label>
            </div>

            {conflicts.length > 0 ? (
              <p className="notice notice-error">
                <Icon name="alert" size={16} />
                Slot ini sudah terpakai. Pilih waktu lain atau lihat jadwal di bawah.
              </p>
            ) : null}

            {bookable ? (
              <Link
                to={`/app/reservasi/baru?roomId=${room.id}&date=${date}&start=${start}&end=${end}`}
                className="btn btn-primary btn-block"
              >
                Ajukan Peminjaman
              </Link>
            ) : room.status === 'inactive' ? (
              <button type="button" className="btn btn-primary btn-block" disabled>
                Ruang dinonaktifkan
              </button>
            ) : range ? (
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  setStart(range.start)
                  setEnd(range.end)
                }}
              >
                Gunakan slot {range.start.replace(':', '.')}–{range.end.replace(':', '.')}
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-block" disabled>
                Tanggal ini penuh
              </button>
            )}
            <p className="booking-note">
              Pengajuan akan berstatus menunggu sampai admin kampus memberi keputusan.
            </p>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Jadwal {formatDateLong(date)}</h2>
                <p>Hanya menampilkan waktu, bukan identitas pemohon.</p>
              </div>
            </div>
            {daySchedule.length === 0 ? (
              <p className="muted">Belum ada kegiatan terjadwal pada tanggal ini.</p>
            ) : (
              <ul className="schedule-list">
                {daySchedule.map((reservation) => (
                  <li key={reservation.id}>
                    <span className="schedule-time">{formatTimeRange(reservation.start, reservation.end)}</span>
                    <span className={`schedule-state is-${reservation.status}`}>
                      {reservation.status === 'approved' ? 'Terpakai' : 'Menunggu'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
