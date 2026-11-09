import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { RoomThumb } from '../../components/RoomThumb'
import { EmptyState, Field, Modal, PageHeader, StatusBadge, Tabs, useToast } from '../../components/ui'
import { isPast } from '../../lib/availability'
import { formatDateLong, formatRelativeDay, formatTimeRange } from '../../lib/format'
import { roomLocation } from '../../lib/room-display'
import { useCurrentUser, useStore } from '../../lib/store'
import type { ReservationStatus } from '../../lib/types'

type Filter = 'all' | ReservationStatus

export function MyReservations() {
  const { state, cancelReservation } = useStore()
  const user = useCurrentUser()
  const { push } = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [cancelError, setCancelError] = useState<string | null>(null)

  const mine = useMemo(
    () =>
      state.reservations
        .filter((reservation) => reservation.userId === user.id)
        .sort((a, b) => `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`)),
    [state.reservations, user.id],
  )

  const counts = {
    all: mine.length,
    pending: mine.filter((reservation) => reservation.status === 'pending').length,
    approved: mine.filter((reservation) => reservation.status === 'approved').length,
    rejected: mine.filter((reservation) => reservation.status === 'rejected').length,
    cancelled: mine.filter((reservation) => reservation.status === 'cancelled').length,
  }

  const filtered = mine.filter((reservation) => {
    if (filter !== 'all' && reservation.status !== filter) return false
    if (!query.trim()) return true
    const room = state.rooms.find((candidate) => candidate.id === reservation.roomId)
    const haystack = `${reservation.id} ${reservation.purpose} ${room?.name ?? ''}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  const target = mine.find((reservation) => reservation.id === cancelId)

  const confirmCancel = () => {
    if (!cancelId) return
    const result = cancelReservation(cancelId, reason)
    if (!result.ok) {
      setCancelError(result.error)
      return
    }
    push('Permohonan dibatalkan. Slot dilepas untuk pengajuan lain.', 'success')
    setCancelId(null)
    setReason('')
    setCancelError(null)
  }

  return (
    <div className="stack">
      <PageHeader
        title="Reservasi saya"
        description="Pantau status setiap pengajuan dan batalkan yang masih memungkinkan."
        actions={
          <Link to="/app/reservasi/baru" className="btn btn-primary">
            <Icon name="plus" size={17} />
            Ajukan reservasi
          </Link>
        }
      />

      <div className="list-toolbar">
        <Tabs
          label="Filter status reservasi"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Semua', count: counts.all },
            { value: 'pending', label: 'Menunggu', count: counts.pending },
            { value: 'approved', label: 'Disetujui', count: counts.approved },
            { value: 'rejected', label: 'Ditolak', count: counts.rejected },
            { value: 'cancelled', label: 'Dibatalkan', count: counts.cancelled },
          ]}
        />
        <label className="inline-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Cari ID atau kegiatan"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Cari reservasi"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={query ? 'Tidak ada hasil untuk pencarian ini' : 'Belum ada reservasi di kategori ini'}
          description={
            query
              ? 'Coba kata kunci lain atau ubah filter status.'
              : 'Pengajuan yang kamu kirim akan muncul di sini beserta status terbarunya.'
          }
          action={
            <Link to="/app/ruang" className="btn btn-secondary">
              Cari ruang
            </Link>
          }
        />
      ) : (
        <div className="reservation-list">
          {filtered.map((reservation) => {
            const room = state.rooms.find((candidate) => candidate.id === reservation.roomId)
            const cancellable =
              (reservation.status === 'pending' || reservation.status === 'approved') &&
              !isPast(reservation.date, reservation.end)
            return (
              <article className="reservation-card" key={reservation.id}>
                {room ? <RoomThumb room={room} className="reservation-thumb" /> : null}
                <div className="reservation-main">
                  <div className="reservation-top">
                    <div>
                      <h2>
                        <Link to={`/app/reservasi/${reservation.id}`}>{reservation.purpose}</Link>
                      </h2>
                      <p className="reservation-meta">
                        {room?.name ?? 'Ruang tidak ditemukan'} ·{' '}
                        {room ? roomLocation(room) : 'Belum tersedia'}
                      </p>
                    </div>
                    <StatusBadge status={reservation.status} />
                  </div>

                  <dl className="reservation-facts">
                    <div>
                      <dt>Jadwal</dt>
                      <dd>
                        {formatRelativeDay(reservation.date)},{' '}
                        {formatTimeRange(reservation.start, reservation.end)}
                      </dd>
                    </div>
                    <div>
                      <dt>Peserta</dt>
                      <dd>{reservation.participants} orang</dd>
                    </div>
                    <div>
                      <dt>ID</dt>
                      <dd className="id-chip">{reservation.id}</dd>
                    </div>
                  </dl>

                  {reservation.status === 'rejected' && reservation.rejectionReason ? (
                    <p className="inline-reason">
                      <Icon name="alert" size={15} />
                      {reservation.rejectionReason}
                    </p>
                  ) : null}

                  <div className="reservation-actions">
                    <Link to={`/app/reservasi/${reservation.id}`} className="btn btn-secondary btn-sm">
                      Lihat detail
                    </Link>
                    {reservation.status === 'approved' ? (
                      <Link
                        to={`/app/reservasi/${reservation.id}/surat`}
                        className="btn btn-primary btn-sm"
                      >
                        <Icon name="download" size={15} />
                        Surat PDF
                      </Link>
                    ) : null}
                    {cancellable ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setCancelId(reservation.id)
                          setReason('')
                          setCancelError(null)
                        }}
                      >
                        Batalkan
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={Boolean(target)}
        onClose={() => setCancelId(null)}
        title="Batalkan permohonan?"
        description={
          target
            ? `${target.id} · ${formatDateLong(target.date)}, ${formatTimeRange(target.start, target.end)}`
            : undefined
        }
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setCancelId(null)}>
              Kembali
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmCancel}>
              Ya, batalkan
            </button>
          </>
        }
      >
        <p className="modal-text">
          Slot akan dilepas dan pengajuan tidak dapat dikembalikan ke status menunggu. Kamu perlu
          membuat pengajuan baru jika ingin memakai ruang ini lagi.
        </p>
        <Field label="Alasan pembatalan" htmlFor="cancel-reason" hint="Opsional, membantu admin">
          <textarea
            id="cancel-reason"
            rows={3}
            value={reason}
            placeholder="Contoh: kegiatan dipindahkan ke tanggal lain"
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        {cancelError ? (
          <p className="notice notice-error" role="alert">
            <Icon name="alert" size={16} />
            {cancelError}
          </p>
        ) : null}
      </Modal>
    </div>
  )
}
