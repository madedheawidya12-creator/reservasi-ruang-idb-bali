import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { RoomThumb } from '../../components/RoomThumb'
import { EmptyState, Field, Modal, PageHeader, StatusBadge, useToast } from '../../components/ui'
import { isPast } from '../../lib/availability'
import { formatDateLong, formatDateTime, formatTimeRange } from '../../lib/format'
import { roomCapacity, roomLocation } from '../../lib/room-display'
import { useCurrentUser, useStore } from '../../lib/store'

const STATUS_COPY = {
  pending: {
    title: 'Menunggu persetujuan admin',
    text: 'Permohonan sudah tercatat. Admin kampus akan memeriksa jadwal dan detail kegiatan sebelum mengambil keputusan.',
  },
  approved: {
    title: 'Reservasi disetujui',
    text: 'Ruang sudah dialokasikan untuk kegiatan ini. Tunjukkan ID permohonan saat mengambil kunci atau mengakses ruang.',
  },
  rejected: {
    title: 'Permohonan ditolak',
    text: 'Baca alasan penolakan di bawah, lalu ajukan jadwal atau ruang lain bila diperlukan.',
  },
  cancelled: {
    title: 'Permohonan dibatalkan',
    text: 'Slot sudah dilepas. Kamu dapat membuat pengajuan baru untuk kegiatan yang sama.',
  },
} as const

export function ReservationDetail() {
  const { id } = useParams()
  const { state, cancelReservation } = useStore()
  const user = useCurrentUser()
  const { push } = useToast()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [cancelError, setCancelError] = useState<string | null>(null)

  const reservation = state.reservations.find((candidate) => candidate.id === id)

  if (!reservation) {
    return (
      <EmptyState
        icon="calendar"
        title="Pengajuan tidak ditemukan"
        description="Periksa kembali ID permohonan atau buka daftar reservasi milikmu."
        action={
          <Link to="/app/reservasi" className="btn btn-secondary">
            Ke reservasi saya
          </Link>
        }
      />
    )
  }

  if (reservation.userId !== user.id) {
    return (
      <EmptyState
        icon="shield"
        title="Kamu tidak dapat membuka pengajuan ini"
        description="Detail permohonan hanya dapat dilihat oleh pemohon dan admin kampus."
        action={
          <Link to="/app/reservasi" className="btn btn-secondary">
            Kembali ke reservasi saya
          </Link>
        }
      />
    )
  }

  const room = state.rooms.find((candidate) => candidate.id === reservation.roomId)
  const copy = STATUS_COPY[reservation.status]
  const cancellable =
    (reservation.status === 'pending' || reservation.status === 'approved') &&
    !isPast(reservation.date, reservation.end)

  const timeline = [
    {
      title: 'Pengajuan dikirim',
      at: formatDateTime(reservation.createdAt),
      text: `${reservation.userName} mengajukan ${room?.name ?? 'ruang'}.`,
      state: 'done',
    },
    ...(reservation.decidedAt
      ? [
          {
            title: reservation.status === 'approved' ? 'Disetujui admin' : 'Ditolak admin',
            at: formatDateTime(reservation.decidedAt),
            text:
              reservation.status === 'approved'
                ? `Keputusan oleh ${reservation.decidedBy}. Konflik jadwal diperiksa ulang.`
                : `Keputusan oleh ${reservation.decidedBy}.`,
            state: reservation.status === 'approved' ? 'done' : 'rejected',
          },
        ]
      : []),
    ...(reservation.cancelledAt
      ? [
          {
            title: 'Dibatalkan',
            at: formatDateTime(reservation.cancelledAt),
            text: reservation.cancelReason ?? 'Permohonan dibatalkan oleh pemohon.',
            state: 'cancelled',
          },
        ]
      : []),
    ...(reservation.status === 'pending'
      ? [
          {
            title: 'Menunggu keputusan',
            at: 'Sedang berjalan',
            text: 'Admin kampus meninjau permohonan ini.',
            state: 'current',
          },
        ]
      : []),
  ]

  const confirmCancel = () => {
    const result = cancelReservation(reservation.id, reason)
    if (!result.ok) {
      setCancelError(result.error)
      return
    }
    push('Permohonan dibatalkan.', 'success')
    setCancelOpen(false)
    setReason('')
    setCancelError(null)
  }

  return (
    <div className="stack">
      <PageHeader
        back={{ to: '/app/reservasi', label: 'Reservasi saya' }}
        title="Detail pengajuan"
        description={reservation.purpose}
        actions={<StatusBadge status={reservation.status} />}
      />

      <div className="detail-grid">
        <div className="detail-main">
          <section className={`status-banner is-${reservation.status}`}>
            <div>
              <h2>{copy.title}</h2>
              <p>{copy.text}</p>
              {reservation.status === 'approved' ? (
                <p className="status-letter-note">
                  <Icon name="download" size={15} />
                  Surat peminjaman tersedia. Unduh PDF, tanda tangani, lalu serahkan salinan fisik
                  ke Bagian Akademik.
                </p>
              ) : null}
            </div>
            <StatusBadge status={reservation.status} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Informasi kegiatan</h2>
                <p>Data yang dikirim saat pengajuan.</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  void navigator.clipboard?.writeText(reservation.id)
                  push('ID permohonan disalin.', 'success')
                }}
              >
                Salin ID
              </button>
            </div>

            <dl className="detail-facts">
              <div>
                <dt>ID permohonan</dt>
                <dd className="id-chip">{reservation.id}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={reservation.status} />
                </dd>
              </div>
              <div>
                <dt>Ruang</dt>
                <dd>{room ? <Link to={`/app/ruang/${room.id}`}>{room.name}</Link> : '—'}</dd>
              </div>
              <div>
                <dt>Lokasi</dt>
                <dd>{room ? roomLocation(room) : '-'}</dd>
              </div>
              <div>
                <dt>Tanggal</dt>
                <dd>{formatDateLong(reservation.date)}</dd>
              </div>
              <div>
                <dt>Waktu</dt>
                <dd>{formatTimeRange(reservation.start, reservation.end)}</dd>
              </div>
              <div>
                <dt>Jumlah peserta</dt>
                <dd>{reservation.participants} orang</dd>
              </div>
              <div>
                <dt>Organisasi</dt>
                <dd>{reservation.org ?? '—'}</dd>
              </div>
            </dl>

            <div className="detail-block">
              <h3>Tujuan kegiatan</h3>
              <p>{reservation.purpose}</p>
            </div>
            {reservation.notes ? (
              <div className="detail-block">
                <h3>Detail tambahan</h3>
                <p>{reservation.notes}</p>
              </div>
            ) : null}

            {reservation.status === 'rejected' && reservation.rejectionReason ? (
              <div className="reason-box is-rejected">
                <h3>
                  <Icon name="alert" size={16} />
                  Alasan penolakan
                </h3>
                <p>{reservation.rejectionReason}</p>
              </div>
            ) : null}

            {reservation.status === 'cancelled' && reservation.cancelReason ? (
              <div className="reason-box is-cancelled">
                <h3>
                  <Icon name="info" size={16} />
                  Alasan pembatalan
                </h3>
                <p>{reservation.cancelReason}</p>
              </div>
            ) : null}

            <div className="form-actions">
              {reservation.status === 'approved' ? (
                <Link
                  to={`/app/reservasi/${reservation.id}/surat`}
                  className="btn btn-primary"
                >
                  <Icon name="download" size={16} />
                  Buka Surat PDF
                </Link>
              ) : null}
              {cancellable ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setCancelOpen(true)
                    setCancelError(null)
                  }}
                >
                  Batalkan permohonan
                </button>
              ) : null}
              {room ? (
                <Link
                  to={`/app/reservasi/baru?roomId=${room.id}&date=${reservation.date}&start=${reservation.start}&end=${reservation.end}`}
                  className="btn btn-secondary"
                >
                  Ajukan jadwal serupa
                </Link>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="detail-side">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Riwayat status</h2>
                <p>Jejak waktu dan pelaku keputusan.</p>
              </div>
            </div>
            <ol className="timeline">
              {timeline.map((step) => (
                <li key={step.title} className={`timeline-item is-${step.state}`}>
                  <span className="timeline-dot" aria-hidden="true" />
                  <div>
                    <strong>{step.title}</strong>
                    <span className="timeline-time">{step.at}</span>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {room ? (
            <section className="panel">
              <RoomThumb room={room} className="summary-thumb" />
              <h3 className="side-room-name">{room.name}</h3>
              <p className="summary-location">
                {roomLocation(room)} · {roomCapacity(room)}
              </p>
              <Link to={`/app/ruang/${room.id}`} className="btn btn-secondary btn-block">
                Lihat ruang
              </Link>
            </section>
          ) : null}
        </aside>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Batalkan permohonan?"
        description={`${reservation.id} · ${formatDateLong(reservation.date)}, ${formatTimeRange(reservation.start, reservation.end)}`}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setCancelOpen(false)}>
              Kembali
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmCancel}>
              Ya, batalkan
            </button>
          </>
        }
      >
        <p className="modal-text">
          Slot akan dilepas untuk pengajuan lain. Tindakan ini tidak dapat dibatalkan.
        </p>
        <Field label="Alasan pembatalan" htmlFor="detail-cancel-reason" hint="Opsional">
          <textarea
            id="detail-cancel-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Contoh: kegiatan dipindahkan ke tanggal lain"
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
