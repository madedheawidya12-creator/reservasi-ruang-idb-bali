import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { RoomThumb } from '../../components/RoomThumb'
import { Field, PageHeader, StatusBadge, useToast } from '../../components/ui'
import { getConflicts } from '../../lib/availability'
import {
  campusClosedReason,
  CONFLICT_MESSAGE,
  getRoomAvailability,
  operatingHoursLabel,
} from '../../lib/campus-rules'
import { formatDateLong, formatTimeRange, todayISO } from '../../lib/format'
import { ROOM_UNKNOWN, roomCapacity, roomCapacityLimit, roomLocation, roomSubtitle } from '../../lib/room-display'
import { useCurrentUser, useStore } from '../../lib/store'
import type { FieldErrors, Reservation } from '../../lib/types'

export function Reserve() {
  const { state, createReservation } = useStore()
  const user = useCurrentUser()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { push } = useToast()

  const initialRoom =
    state.rooms.find((room) => room.id === params.get('roomId')) ??
    state.rooms.find((room) => room.status === 'active')

  const [roomId, setRoomId] = useState(initialRoom?.id ?? '')
  const [date, setDate] = useState(params.get('date') ?? todayISO())
  const [start, setStart] = useState(params.get('start') ?? '09:00')
  const [end, setEnd] = useState(params.get('end') ?? '11:00')
  const [purpose, setPurpose] = useState('')
  const [org, setOrg] = useState(user.org ?? '')
  const [participants, setParticipants] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<Reservation | null>(null)
  const [duplicate, setDuplicate] = useState(false)
  const idempotencyKey = useRef(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `key-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )

  const room = state.rooms.find((candidate) => candidate.id === roomId)
  const activeRooms = state.rooms.filter((candidate) => candidate.status === 'active')

  const conflicts = useMemo(() => {
    if (!room || !date || !start || !end) return []
    return getConflicts(state.reservations, room.id, date, start, end)
  }, [room, date, start, end, state.reservations])

  const pendingNearby = useMemo(() => {
    if (!room || !date || !start || !end) return []
    return getConflicts(state.reservations, room.id, date, start, end, { status: 'pending' })
  }, [room, date, start, end, state.reservations])

  const closedReason = date ? campusClosedReason(state.settings, date) : null
  const availability = room
    ? getRoomAvailability(state.settings, state.reservations, room, date, start, end)
    : null
  const canSubmit = !closedReason && availability?.state === 'free'

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setErrors({})

    if (closedReason) {
      setFormError(closedReason)
      return
    }

    const result = createReservation({
      roomId,
      date,
      start,
      end,
      purpose,
      org,
      participants: Number(participants),
      notes,
      idempotencyKey: idempotencyKey.current,
    })

    if (!result.ok) {
      setFormError(result.error)
      setErrors(result.fields ?? {})
      return
    }

    setDuplicate(result.duplicate)
    setSuccess(result.reservation)
    if (result.warning) push(result.warning, 'info')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (success) {
    return (
      <div className="stack confirm-wrap">
        <section className="panel confirm">
          <span className="confirm-icon">
            <Icon name="check" size={26} />
          </span>
          <h1>{duplicate ? 'Pengajuan ini sudah tercatat' : 'Pengajuan berhasil dikirim'}</h1>
          <p className="confirm-sub">
            {duplicate
              ? 'Permohonan yang sama tidak dibuat ulang. Berikut data yang sudah tersimpan.'
              : 'Admin kampus akan meninjau jadwal dan detail kegiatanmu. Pantau statusnya di Reservasi Saya.'}
          </p>

          <div className="confirm-id">
            <span>ID permohonan</span>
            <strong>{success.id}</strong>
          </div>

          <dl className="confirm-facts">
            <div>
              <dt>Ruang</dt>
              <dd>{state.rooms.find((candidate) => candidate.id === success.roomId)?.name}</dd>
            </div>
            <div>
              <dt>Jadwal</dt>
              <dd>
                {formatDateLong(success.date)}, {formatTimeRange(success.start, success.end)}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={success.status} />
              </dd>
            </div>
            <div>
              <dt>Pemohon</dt>
              <dd>{success.userName}</dd>
            </div>
          </dl>

          <div className="confirm-actions">
            <Link to={`/app/reservasi/${success.id}`} className="btn btn-primary">
              Lihat detail pengajuan
            </Link>
            <Link to="/app/reservasi" className="btn btn-secondary">
              Reservasi saya
            </Link>
            <Link to="/app" className="btn btn-ghost">
              Kembali ke beranda
            </Link>
          </div>

          <p className="confirm-note">
            Simpan ID ini. ID yang sama akan muncul lagi jika kamu mengirim ulang formulir karena
            gangguan jaringan.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHeader
        back={{ to: room ? `/app/ruang/${room.id}` : '/app/ruang', label: 'Kembali' }}
        title="Ajukan Peminjaman"
        description="Lengkapi detail kegiatan. Pengajuan diperiksa admin sebelum ruang dialokasikan."
      />

      <form className="reserve-grid" onSubmit={submit} noValidate>
        <div className="reserve-form">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Ruang dan waktu</h2>
                <p>Pilih ruang, lalu tentukan jadwal yang belum terpakai.</p>
              </div>
            </div>

            <div className="form-grid">
              <Field label="Ruang" htmlFor="room" error={errors.roomId} required className="span-2">
                <select
                  id="room"
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  aria-invalid={Boolean(errors.roomId)}
                >
                  {activeRooms.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                      {roomLocation(candidate) !== ROOM_UNKNOWN
                        ? ` · ${roomLocation(candidate)}`
                        : ''}
                      {roomCapacity(candidate) !== ROOM_UNKNOWN
                        ? ` · ${roomCapacity(candidate)}`
                        : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Tanggal" htmlFor="date" error={errors.date} required>
                <input
                  id="date"
                  type="date"
                  value={date}
                  min={todayISO()}
                  onChange={(event) => setDate(event.target.value)}
                  aria-invalid={Boolean(errors.date)}
                />
              </Field>

              <div className="time-pair">
                <Field label="Mulai" htmlFor="start" error={errors.start} required>
                  <input
                    id="start"
                    type="time"
                    value={start}
                    step={1800}
                    min={state.settings.openTime}
                    max={state.settings.closeTime}
                    onChange={(event) => setStart(event.target.value)}
                    aria-invalid={Boolean(errors.start)}
                  />
                </Field>
                <Field label="Selesai" htmlFor="end" error={errors.end} required>
                  <input
                    id="end"
                    type="time"
                    value={end}
                    step={1800}
                    min={state.settings.openTime}
                    max={state.settings.closeTime}
                    onChange={(event) => setEnd(event.target.value)}
                    aria-invalid={Boolean(errors.end)}
                  />
                </Field>
              </div>
            </div>

            {closedReason ? (
              <p className="notice notice-error" role="status">
                <Icon name="alert" size={16} />
                {closedReason}
              </p>
            ) : availability?.state === 'busy' || conflicts.length > 0 ? (
              <p className="notice notice-error" role="status">
                <Icon name="alert" size={16} />
                {CONFLICT_MESSAGE}
                {conflicts[0] ? (
                  <span>
                    {' '}
                    ({conflicts[0].id}, {formatTimeRange(conflicts[0].start, conflicts[0].end)})
                  </span>
                ) : null}
              </p>
            ) : availability?.state === 'outside' ? (
              <p className="notice notice-warning" role="status">
                <Icon name="clock" size={16} />
                {availability.reason ??
                  `Pilih waktu di dalam jam operasional kampus (${operatingHoursLabel(
                    state.settings,
                  )}).`}
              </p>
            ) : availability?.state === 'past' ? (
              <p className="notice notice-error" role="status">
                <Icon name="alert" size={16} />
                Tanggal dan waktu kegiatan sudah lewat. Silakan pilih jadwal lain.
              </p>
            ) : pendingNearby.length > 0 ? (
              <p className="notice notice-warning" role="status">
                <Icon name="clock" size={16} />
                Ada {pendingNearby.length} permohonan lain yang menunggu di slot ini. Slot belum final
                sampai admin memutuskan.
              </p>
            ) : (
              <p className="notice notice-success" role="status">
                <Icon name="check" size={16} />
                Slot ini belum terpakai. Sistem memeriksa ulang saat pengajuan dikirim dan saat
                admin menyetujui.
              </p>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Detail kegiatan</h2>
                <p>Tuliskan informasi yang dibutuhkan admin untuk menilai permohonan.</p>
              </div>
            </div>

            <div className="form-grid">
              <Field label="Nama atau jenis kegiatan" htmlFor="purpose" error={errors.purpose} required className="span-2">
                <input
                  id="purpose"
                  type="text"
                  placeholder="Contoh: Rapat koordinasi panitia Desain Fest"
                  value={purpose}
                  maxLength={120}
                  onChange={(event) => setPurpose(event.target.value)}
                  aria-invalid={Boolean(errors.purpose)}
                />
              </Field>

              <Field label="Organisasi atau penanggung jawab" htmlFor="org" hint="Opsional">
                <input
                  id="org"
                  type="text"
                  placeholder="Contoh: HMJ Desain Komunikasi Visual"
                  value={org}
                  onChange={(event) => setOrg(event.target.value)}
                />
              </Field>

              <Field
                label="Jumlah peserta"
                htmlFor="participants"
                error={errors.participants}
                hint={
                  room
                    ? room.capacity !== undefined
                      ? `Maksimal ${room.capacity} orang`
                      : 'Kapasitas belum tersedia'
                    : undefined
                }
                required
              >
                <input
                  id="participants"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={room ? roomCapacityLimit(room) : undefined}
                  placeholder="Contoh: 25"
                  value={participants}
                  onChange={(event) => setParticipants(event.target.value)}
                  aria-invalid={Boolean(errors.participants)}
                />
              </Field>

              <Field label="Catatan tambahan" htmlFor="notes" hint="Opsional" className="span-2">
                <textarea
                  id="notes"
                  rows={4}
                  placeholder="Kebutuhan khusus, susunan acara singkat, atau perlengkapan tambahan."
                  value={notes}
                  maxLength={600}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </Field>
            </div>

            {formError ? (
              <p className="notice notice-error" role="alert">
                <Icon name="alert" size={16} />
                {formError}
              </p>
            ) : null}

            <div className="form-actions">
              {!closedReason ? (
                <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
                  {canSubmit ? 'Kirim Pengajuan Peminjaman' : 'Periksa Jadwal Terlebih Dahulu'}
                </button>
              ) : null}
              <Link to="/app/ruang" className="btn btn-ghost">
                {closedReason ? 'Pilih tanggal atau ruang lain' : 'Batal'}
              </Link>
            </div>
          </section>
        </div>

        <aside className="reserve-side">
          <section className="panel summary-panel">
            <h2>Ringkasan</h2>
            {room ? (
              <>
                <RoomThumb room={room} className="summary-thumb" />
                <h3>{room.name}</h3>
                <p className="summary-location">
                  {roomSubtitle(room)}
                </p>
                <dl className="summary-facts">
                  <div>
                    <dt>Tanggal</dt>
                    <dd>{formatDateLong(date)}</dd>
                  </div>
                  <div>
                    <dt>Waktu</dt>
                    <dd>{formatTimeRange(start, end)}</dd>
                  </div>
                  <div>
                    <dt>Peserta</dt>
                    <dd>{participants || '—'} orang</dd>
                  </div>
                  <div>
                    <dt>Pemohon</dt>
                    <dd>{user.name}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="muted">Pilih ruang untuk melihat ringkasan.</p>
            )}
            <div className="summary-note">
              <Icon name="info" size={16} />
              <p>
                Jam layanan kampus {operatingHoursLabel(state.settings)}. Minggu dan hari libur
                kampus tutup. Status awal adalah <strong>Menunggu persetujuan</strong>; ruang baru
                teralokasi setelah admin menyetujui.
              </p>
            </div>
          </section>

          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => navigate('/app/reservasi')}
          >
            Lihat reservasi saya
          </button>
        </aside>
      </form>
    </div>
  )
}
