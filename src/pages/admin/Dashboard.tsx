import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import {
  EmptyState,
  Field,
  Modal,
  RoomStatusBadge,
  StatusBadge,
  useToast,
} from '../../components/ui'
import { getConflicts } from '../../lib/availability'
import { validateReservationRequest } from '../../lib/campus-rules'
import { categoryFor, categoryMeta } from '../../lib/categories'
import { roomCapacity, roomCode, roomLocation } from '../../lib/room-display'
import {
  formatDateLong,
  formatRelativeDay,
  formatTimeRange,
  todayISO,
} from '../../lib/format'
import { useStore } from '../../lib/store'
import type { Reservation, ReservationStatus, Room } from '../../lib/types'

type StatusFilter = 'all' | ReservationStatus
type DecisionType = 'approve' | 'reject'

interface DecisionState {
  reservation: Reservation
  type: DecisionType
}

const STATUS_ORDER: Record<ReservationStatus, number> = {
  pending: 0,
  approved: 1,
  rejected: 2,
  cancelled: 3,
}

export function AdminDashboard() {
  const { state, decideReservation } = useStore()
  const { push } = useToast()
  const today = todayISO()
  const month = today.slice(0, 7)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [roomFilter, setRoomFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [decision, setDecision] = useState<DecisionState | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [decisionError, setDecisionError] = useState<string | null>(null)

  const roomById = useMemo(
    () => new Map(state.rooms.map((room) => [room.id, room])),
    [state.rooms],
  )

  const pending = useMemo(
    () =>
      state.reservations
        .filter((reservation) => reservation.status === 'pending')
        .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)),
    [state.reservations],
  )

  const approvedThisMonth = state.reservations.filter(
    (reservation) => reservation.status === 'approved' && reservation.date.startsWith(month),
  ).length
  const rejectedThisMonth = state.reservations.filter(
    (reservation) => reservation.status === 'rejected' && reservation.date.startsWith(month),
  ).length
  const activeRooms = state.rooms.filter((room) => room.status === 'active').length

  const statusCounts = useMemo(
    () => ({
      pending: state.reservations.filter((reservation) => reservation.status === 'pending').length,
      approved: state.reservations.filter((reservation) => reservation.status === 'approved').length,
      rejected: state.reservations.filter((reservation) => reservation.status === 'rejected').length,
      cancelled: state.reservations.filter((reservation) => reservation.status === 'cancelled').length,
    }),
    [state.reservations],
  )

  const filteredReservations = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return state.reservations
      .filter((reservation) => {
        if (statusFilter !== 'all' && reservation.status !== statusFilter) return false
        if (dateFilter && reservation.date !== dateFilter) return false
        if (roomFilter !== 'all' && reservation.roomId !== roomFilter) return false
        if (!needle) return true
        const room = roomById.get(reservation.roomId)
        const haystack =
          `${reservation.id} ${reservation.userName} ${reservation.org ?? ''} ${reservation.purpose} ${room?.name ?? ''} ${room?.code ?? ''}`.toLowerCase()
        return haystack.includes(needle)
      })
      .sort((a, b) => {
        if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        if (a.status === 'pending') return `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)
        return `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`)
      })
  }, [state.reservations, statusFilter, dateFilter, roomFilter, query, roomById])

  const hasFilters = statusFilter !== 'all' || dateFilter !== '' || roomFilter !== 'all' || query !== ''

  const decisionConflicts = useMemo(() => {
    if (!decision || decision.type !== 'approve') return []
    return getConflicts(
      state.reservations,
      decision.reservation.roomId,
      decision.reservation.date,
      decision.reservation.start,
      decision.reservation.end,
      { ignoreId: decision.reservation.id },
    )
  }, [decision, state.reservations])

  const decisionPendingConflicts = useMemo(() => {
    if (!decision || decision.type !== 'approve') return []
    return getConflicts(
      state.reservations,
      decision.reservation.roomId,
      decision.reservation.date,
      decision.reservation.start,
      decision.reservation.end,
      { ignoreId: decision.reservation.id, status: 'pending' },
    )
  }, [decision, state.reservations])

  const decisionValidation = useMemo(() => {
    if (!decision || decision.type !== 'approve') return null
    return validateReservationRequest(state, decision.reservation, {
      ignoreReservationId: decision.reservation.id,
    })
  }, [decision, state])

  const decisionBlocked = Boolean(decisionValidation && !decisionValidation.ok)

  const resetFilters = () => {
    setStatusFilter('all')
    setDateFilter('')
    setRoomFilter('all')
    setQuery('')
  }

  const openDecision = (reservation: Reservation, type: DecisionType) => {
    setDecision({ reservation, type })
    setReason('')
    setReasonError(null)
    setDecisionError(null)
  }

  const closeDecision = () => {
    setDecision(null)
    setReason('')
    setReasonError(null)
    setDecisionError(null)
  }

  const submitDecision = () => {
    if (!decision) return
    setReasonError(null)
    setDecisionError(null)

    if (decision.type === 'reject' && reason.trim().length < 10) {
      setReasonError('Alasan penolakan minimal 10 karakter agar pemohon memahami keputusan.')
      return
    }

    const result = decideReservation(
      decision.reservation.id,
      decision.type === 'approve' ? 'approved' : 'rejected',
      decision.type === 'reject' ? reason : undefined,
    )

    if (!result.ok) {
      setDecisionError(result.error)
      return
    }

    push(
      decision.type === 'approve'
        ? `Permohonan ${decision.reservation.id} disetujui.`
        : `Permohonan ${decision.reservation.id} ditolak dan alasannya sudah dicatat.`,
      decision.type === 'approve' ? 'success' : 'info',
    )
    closeDecision()
  }

  const decisionRoom = decision ? roomById.get(decision.reservation.roomId) : undefined

  return (
    <div className="stack admin-dashboard">
      <header className="admin-campus-hero">
        <div className="admin-hero-content">
          <span className="hero-kicker">
            <span className="hero-kicker-dot" aria-hidden="true" />
            RuangIDB · Panel admin
          </span>
          <h1>Pusat kendali reservasi</h1>
          <p>
            Tinjau pengajuan, periksa bentrok jadwal, dan kelola ruang kampus. Setiap keputusan
            tetap dilakukan admin dan tercatat di log aktivitas.
          </p>
          <div className="hero-actions">
            <Link to="/admin/permohonan" className="btn btn-accent">
              Buka semua permohonan
              <Icon name="arrow-right" size={16} />
            </Link>
            <Link to="/admin/ruang" className="btn btn-hero-secondary">
              Kelola ruang
            </Link>
          </div>
        </div>

        <aside className="admin-hero-status" aria-label="Ringkasan antrean">
          <span>Menunggu keputusan</span>
          <strong>{pending.length}</strong>
          <p>
            {pending.length > 0
              ? 'Periksa jadwal sebelum menyetujui permohonan.'
              : 'Antrean bersih. Tidak ada permohonan yang menunggu.'}
          </p>
          <Link to="/admin/permohonan" className="admin-hero-link">
            Lihat antrean
            <Icon name="arrow-right" size={15} />
          </Link>
        </aside>
      </header>

      <p className="admin-decision-note">
        <Icon name="shield" size={16} />
        Sistem tidak menyetujui permohonan secara otomatis. Keputusan admin dan alasannya tercatat
        pada log aktivitas.
      </p>

      <section className="admin-summary-grid" aria-label="Ringkasan reservasi">
        <article className="admin-summary-card is-pending">
          <span className="admin-summary-icon">
            <Icon name="clock" size={20} />
          </span>
          <div>
            <span>Menunggu keputusan</span>
            <strong>{pending.length}</strong>
            <small>perlu ditinjau</small>
          </div>
        </article>
        <article className="admin-summary-card is-approved">
          <span className="admin-summary-icon">
            <Icon name="check" size={20} />
          </span>
          <div>
            <span>Disetujui bulan ini</span>
            <strong>{approvedThisMonth}</strong>
            <small>bulan berjalan</small>
          </div>
        </article>
        <article className="admin-summary-card is-rejected">
          <span className="admin-summary-icon">
            <Icon name="x" size={20} />
          </span>
          <div>
            <span>Ditolak bulan ini</span>
            <strong>{rejectedThisMonth}</strong>
            <small>alasan tercatat</small>
          </div>
        </article>
        <article className="admin-summary-card is-rooms">
          <span className="admin-summary-icon">
            <Icon name="building" size={20} />
          </span>
          <div>
            <span>Ruang aktif</span>
            <strong>
              {activeRooms}
              <em>/{state.rooms.length}</em>
            </strong>
            <small>dapat diajukan</small>
          </div>
        </article>
      </section>

      <section className="campus-section" aria-labelledby="admin-requests-title">
        <div className="section-head">
          <div>
            <h2 id="admin-requests-title">Pengajuan terbaru</h2>
            <p>
              Filter berdasarkan status, tanggal, atau ruang. Aksi setujui dan tolak tersedia
              langsung pada setiap baris.
            </p>
          </div>
          <Link to="/admin/permohonan" className="section-link">
            Buka halaman permohonan
            <Icon name="arrow-right" size={15} />
          </Link>
        </div>

        <div className="admin-filter-card" role="search" aria-label="Filter pengajuan reservasi">
          <label className="admin-filter-field admin-filter-search" htmlFor="admin-search">
            <span>Cari pengajuan</span>
            <span className="admin-search-input">
              <Icon name="search" size={17} />
              <input
                id="admin-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ID, pemohon, kegiatan, atau ruang"
              />
            </span>
          </label>
          <label className="admin-filter-field" htmlFor="admin-status">
            <span>Status</span>
            <select
              id="admin-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="all">Semua status</option>
              <option value="pending">Menunggu ({statusCounts.pending})</option>
              <option value="approved">Disetujui ({statusCounts.approved})</option>
              <option value="rejected">Ditolak ({statusCounts.rejected})</option>
              <option value="cancelled">Dibatalkan ({statusCounts.cancelled})</option>
            </select>
          </label>
          <label className="admin-filter-field" htmlFor="admin-date">
            <span>Tanggal kegiatan</span>
            <input
              id="admin-date"
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>
          <label className="admin-filter-field" htmlFor="admin-room">
            <span>Ruang</span>
            <select
              id="admin-room"
              value={roomFilter}
              onChange={(event) => setRoomFilter(event.target.value)}
            >
              <option value="all">Semua ruang</option>
              {[...state.rooms]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                    {room.code ? ` (${room.code})` : ''}
                  </option>
                ))}
            </select>
          </label>
          <div className="admin-filter-foot">
            <span aria-live="polite">
              {filteredReservations.length} dari {state.reservations.length} pengajuan
            </span>
            {hasFilters ? (
              <button type="button" className="filter-reset" onClick={resetFilters}>
                <Icon name="refresh" size={14} />
                Reset filter
              </button>
            ) : null}
          </div>
        </div>

        {filteredReservations.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="Tidak ada pengajuan yang cocok"
            description="Coba ubah status, tanggal, ruang, atau kata kunci pencarian."
            action={
              <button type="button" className="btn btn-secondary" onClick={resetFilters}>
                <Icon name="refresh" size={16} />
                Reset filter
              </button>
            }
          />
        ) : (
          <div className="panel table-panel admin-request-panel">
            <div className="table-wrap">
              <table className="table table-stack admin-request-table">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Pemohon</th>
                    <th scope="col">Kegiatan dan ruang</th>
                    <th scope="col">Jadwal</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => {
                    const room = roomById.get(reservation.roomId)
                    const conflicts =
                      reservation.status === 'pending'
                        ? getConflicts(
                            state.reservations,
                            reservation.roomId,
                            reservation.date,
                            reservation.start,
                            reservation.end,
                            { ignoreId: reservation.id },
                          )
                        : []
                    const pendingConflicts =
                      reservation.status === 'pending'
                        ? getConflicts(
                            state.reservations,
                            reservation.roomId,
                            reservation.date,
                            reservation.start,
                            reservation.end,
                            { ignoreId: reservation.id, status: 'pending' },
                          )
                        : []
                    return (
                      <tr key={reservation.id}>
                        <td data-label="ID">
                          <span className="id-chip">{reservation.id}</span>
                        </td>
                        <td data-label="Pemohon">
                          <strong>{reservation.userName}</strong>
                          <span className="cell-sub">{reservation.org ?? 'Mahasiswa'}</span>
                        </td>
                        <td data-label="Kegiatan dan ruang">
                          <strong>{reservation.purpose}</strong>
                          <span className="cell-sub">
                            {room?.name ?? 'Ruang tidak ditemukan'}
                            {room ? ` · ${roomCode(room)}` : ''}
                          </span>
                        </td>
                        <td data-label="Jadwal">
                          {formatRelativeDay(reservation.date)}
                          <span className="cell-sub">
                            {formatTimeRange(reservation.start, reservation.end)}
                          </span>
                          {conflicts.length > 0 ? (
                            <span className="admin-conflict">
                              <Icon name="alert" size={13} />
                              Bentrok jadwal
                            </span>
                          ) : pendingConflicts.length > 0 ? (
                            <span className="admin-conflict is-pending">
                              <Icon name="clock" size={13} />
                              {pendingConflicts.length} pengajuan menunggu
                            </span>
                          ) : null}
                        </td>
                        <td data-label="Status">
                          <StatusBadge status={reservation.status} short />
                        </td>
                        <td className="cell-action">
                          <div className="row-actions admin-row-actions">
                            <Link
                              to={`/admin/permohonan/${reservation.id}`}
                              className="btn btn-ghost btn-sm"
                            >
                              Detail
                            </Link>
                            {reservation.status === 'pending' ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => openDecision(reservation, 'approve')}
                                  aria-label={`Setujui permohonan ${reservation.id}`}
                                >
                                  Setujui
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => openDecision(reservation, 'reject')}
                                  aria-label={`Tolak permohonan ${reservation.id}`}
                                >
                                  Tolak
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="campus-section" aria-labelledby="admin-rooms-title">
        <div className="section-head">
          <div>
            <h2 id="admin-rooms-title">Ruang kampus</h2>
            <p>
              {activeRooms} dari {state.rooms.length} ruang aktif. Perbarui kategori, kapasitas,
              fasilitas, atau status ruang melalui halaman pengelolaan.
            </p>
          </div>
          <Link to="/admin/ruang" className="btn btn-secondary btn-sm">
            <Icon name="edit" size={15} />
            Kelola data ruang
          </Link>
        </div>

        {state.rooms.length === 0 ? (
          <EmptyState
            icon="building"
            title="Belum ada data ruang"
            description="Tambahkan ruang pertama agar mahasiswa dapat mengajukan reservasi."
            action={
              <Link to="/admin/ruang" className="btn btn-primary">
                Tambah ruang
              </Link>
            }
          />
        ) : (
          <div className="panel table-panel">
            <div className="table-wrap">
              <table className="table table-stack admin-room-table">
                <thead>
                  <tr>
                    <th scope="col">Ruang</th>
                    <th scope="col">Kategori</th>
                    <th scope="col">Lokasi</th>
                    <th scope="col">Kapasitas</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.rooms.map((room: Room) => (
                    <tr key={room.id}>
                      <td data-label="Ruang">
                        <strong>{room.name}</strong>
                        <span className="cell-sub">{roomCode(room)}</span>
                      </td>
                      <td data-label="Kategori">
                        <span className="category-chip">{categoryMeta(categoryFor(room)).label}</span>
                      </td>
                      <td data-label="Lokasi">{roomLocation(room)}</td>
                      <td data-label="Kapasitas">{roomCapacity(room)}</td>
                      <td data-label="Status">
                        <RoomStatusBadge status={room.status} />
                      </td>
                      <td className="cell-action">
                        <Link to="/admin/ruang" className="btn btn-ghost btn-sm">
                          Kelola
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(decision)}
        onClose={closeDecision}
        title={decision?.type === 'approve' ? 'Setujui permohonan?' : 'Tolak permohonan?'}
        description={
          decision
            ? `${decision.reservation.id} · ${decisionRoom?.name ?? 'Ruang tidak ditemukan'} · ${formatRelativeDay(
                decision.reservation.date,
              )}, ${formatTimeRange(decision.reservation.start, decision.reservation.end)}`
            : undefined
        }
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeDecision}>
              Batal
            </button>
            <button
              type="button"
              className={`btn ${decision?.type === 'approve' ? 'btn-primary' : 'btn-danger'}`}
              onClick={submitDecision}
              disabled={
                decision?.type === 'approve' &&
                (decisionConflicts.length > 0 || decisionBlocked)
              }
            >
              {decision?.type === 'approve' ? 'Setujui permohonan' : 'Tolak permohonan'}
            </button>
          </>
        }
      >
        {decision ? (
          <>
            <dl className="decision-facts">
              <div>
                <dt>Pemohon</dt>
                <dd>{decision.reservation.userName}</dd>
              </div>
              <div>
                <dt>Kegiatan</dt>
                <dd>{decision.reservation.purpose}</dd>
              </div>
              <div>
                <dt>Ruang</dt>
                <dd>{decisionRoom?.name ?? 'Ruang tidak ditemukan'}</dd>
              </div>
              <div>
                <dt>Tanggal</dt>
                <dd>{formatDateLong(decision.reservation.date)}</dd>
              </div>
              <div>
                <dt>Waktu</dt>
                <dd>
                  {formatTimeRange(decision.reservation.start, decision.reservation.end)}
                </dd>
              </div>
              <div>
                <dt>Peserta</dt>
                <dd>{decision.reservation.participants} orang</dd>
              </div>
            </dl>

            {decision.type === 'approve' ? (
              <div
                className={`decision-check ${
                  decisionConflicts.length > 0 || decisionBlocked ? 'is-conflict' : 'is-clear'
                }`}
              >
                <Icon
                  name={decisionConflicts.length > 0 || decisionBlocked ? 'alert' : 'check'}
                  size={18}
                />
                <div>
                  <h3>
                    {decisionConflicts.length > 0
                      ? 'Jadwal bertabrakan'
                      : decisionBlocked
                        ? 'Permohonan belum memenuhi aturan kampus'
                        : 'Tidak ada konflik dengan reservasi yang disetujui'}
                  </h3>
                  {decisionConflicts.length > 0 ? (
                    <ul>
                      {decisionConflicts.map((conflict) => (
                        <li key={conflict.id}>
                          {conflict.id} · {formatTimeRange(conflict.start, conflict.end)} ·{' '}
                          {conflict.userName}
                        </li>
                      ))}
                    </ul>
                  ) : decisionBlocked ? (
                    <p>{decisionValidation?.error}</p>
                  ) : (
                    <p>Slot ini aman untuk disetujui. Sistem memeriksa ulang saat keputusan disimpan.</p>
                  )}
                  {decisionPendingConflicts.length > 0 ? (
                    <p className="decision-note">
                      {decisionPendingConflicts.length} permohonan lain masih menunggu di slot yang
                      sama. Keputusan ini akan memengaruhi antrean tersebut.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <Field
                label="Alasan penolakan"
                htmlFor="reject-reason"
                required
                hint="Minimal 10 karakter"
                error={reasonError ?? undefined}
              >
                <textarea
                  id="reject-reason"
                  value={reason}
                  required
                  onChange={(event) => {
                    setReason(event.target.value)
                    if (reasonError) setReasonError(null)
                  }}
                  placeholder="Tuliskan alasan yang jelas agar pemohon dapat memperbaiki pengajuannya."
                  aria-invalid={Boolean(reasonError)}
                  aria-describedby={reasonError ? 'reject-reason-error' : undefined}
                />
              </Field>
            )}

            {decisionError ? (
              <p className="decision-error" role="alert">
                <Icon name="alert" size={15} />
                {decisionError}
              </p>
            ) : null}
          </>
        ) : null}
      </Modal>
    </div>
  )
}
