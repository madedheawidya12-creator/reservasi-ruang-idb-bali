import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { RoomThumb } from '../../components/RoomThumb'
import { EmptyState, Field, Modal, PageHeader, StatusBadge, useToast } from '../../components/ui'
import { getConflicts } from '../../lib/availability'
import { formatDateLong, formatDateTime, formatTimeRange } from '../../lib/format'
import { roomCapacity, roomFacilities, roomLocation } from '../../lib/room-display'
import { useStore } from '../../lib/store'

export function AdminRequestDetail() {
  const { id } = useParams()
  const { state, decideReservation, getUser } = useStore()
  const { push } = useToast()
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reservation = state.reservations.find((candidate) => candidate.id === id)
  const room = reservation
    ? state.rooms.find((candidate) => candidate.id === reservation.roomId)
    : undefined
  const requesterUser = reservation ? getUser(reservation.userId) : undefined

  const conflicts = useMemo(() => {
    if (!reservation) return []
    return getConflicts(
      state.reservations,
      reservation.roomId,
      reservation.date,
      reservation.start,
      reservation.end,
      { ignoreId: reservation.id },
    )
  }, [reservation, state.reservations])

  const pendingConflicts = useMemo(() => {
    if (!reservation) return []
    return getConflicts(
      state.reservations,
      reservation.roomId,
      reservation.date,
      reservation.start,
      reservation.end,
      { ignoreId: reservation.id, status: 'pending' },
    )
  }, [reservation, state.reservations])

  if (!reservation) {
    return (
      <EmptyState
        icon="clipboard"
        title="Permohonan tidak ditemukan"
        description="Mungkin sudah dihapus atau ID-nya tidak sesuai."
        action={
          <Link to="/admin/permohonan" className="btn btn-secondary">
            Kembali ke daftar permohonan
          </Link>
        }
      />
    )
  }

  const decide = (decision: 'approved' | 'rejected') => {
    setError(null)
    const result = decideReservation(reservation.id, decision, decision === 'rejected' ? reason : undefined)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setApproveOpen(false)
    setRejectOpen(false)
    setReason('')
    push(
      decision === 'approved'
        ? `Permohonan ${reservation.id} disetujui.`
        : `Permohonan ${reservation.id} ditolak dan alasan sudah dicatat.`,
      decision === 'approved' ? 'success' : 'info',
    )
  }

  const canDecide = reservation.status === 'pending'
  const schedule = state.reservations
    .filter(
      (candidate) =>
        candidate.roomId === reservation.roomId &&
        candidate.date === reservation.date &&
        (candidate.status === 'approved' || candidate.status === 'pending'),
    )
    .sort((a, b) => a.start.localeCompare(b.start))

  return (
    <div className="stack">
      <PageHeader
        back={{ to: '/admin/permohonan', label: 'Kelola permohonan' }}
        title={reservation.purpose}
        description={`${reservation.id} · diajukan ${formatDateTime(reservation.createdAt)}`}
        actions={<StatusBadge status={reservation.status} />}
      />

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Pemohon</h2>
                <p>Identitas yang tercatat pada pengajuan.</p>
              </div>
            </div>
            <div className="requester">
              <span className="avatar avatar-lg" aria-hidden="true">
                {reservation.userName
                  .split(' ')
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')}
              </span>
              <div>
                <h3>{reservation.userName}</h3>
                <p>{reservation.org ?? 'Mahasiswa IDB Bali'}</p>
              </div>
              <dl className="requester-meta">
                <div>
                  <dt>Email</dt>
                  <dd>{requesterUser?.email ?? '—'}</dd>
                </div>
                <div>
                  <dt>NIM</dt>
                  <dd>{requesterUser?.nim ?? '—'}</dd>
                </div>
                <div>
                  <dt>Program studi</dt>
                  <dd>{requesterUser?.program ?? '—'}</dd>
                </div>
                <div>
                  <dt>Peran</dt>
                  <dd>Mahasiswa</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Detail permohonan</h2>
                <p>Bandingkan dengan jadwal ruang sebelum memutuskan.</p>
              </div>
            </div>

            <dl className="detail-facts">
              <div>
                <dt>Ruang</dt>
                <dd>{room ? <Link to={`/admin/ruang`}>{room.name}</Link> : 'Ruang tidak ditemukan'}</dd>
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
                <dt>Peserta</dt>
                <dd>
                  {reservation.participants} orang
                  {room && room.capacity !== undefined && reservation.participants > room.capacity ? (
                    <span className="text-danger"> · melebihi kapasitas</span>
                  ) : null}
                </dd>
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

            {canDecide ? (
              <div className={`conflict-check ${conflicts.length > 0 ? 'is-conflict' : 'is-clear'}`}>
                <Icon name={conflicts.length > 0 ? 'alert' : 'check'} size={18} />
                <div>
                  <h3>
                    {conflicts.length > 0
                      ? 'Jadwal bertabrakan'
                      : 'Tidak ada konflik dengan reservasi yang disetujui'}
                  </h3>
                  {conflicts.length > 0 ? (
                    <ul>
                      {conflicts.map((conflict) => (
                        <li key={conflict.id}>
                          {conflict.id} · {formatTimeRange(conflict.start, conflict.end)} ·{' '}
                          {conflict.userName}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      Slot ini aman untuk disetujui. Sistem akan memeriksa ulang tepat sebelum
                      keputusan disimpan.
                    </p>
                  )}
                  {pendingConflicts.length > 0 ? (
                    <p className="conflict-note">
                      {pendingConflicts.length} permohonan lain masih menunggu di slot yang sama.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Jadwal {room?.name ?? 'ruang'} pada tanggal ini</h2>
                <p>Termasuk permohonan yang belum diputuskan.</p>
              </div>
            </div>
            {schedule.length === 0 ? (
              <p className="muted">Belum ada kegiatan lain pada tanggal ini.</p>
            ) : (
              <ul className="schedule-list">
                {schedule.map((entry) => (
                  <li key={entry.id}>
                    <span className="schedule-time">{formatTimeRange(entry.start, entry.end)}</span>
                    <span className="schedule-purpose">{entry.purpose}</span>
                    <StatusBadge status={entry.status} short />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="detail-side">
          <section className="panel decision-panel">
            <div className="panel-head">
              <div>
                <h2>Keputusan</h2>
                <p>{canDecide ? 'Periksa jadwal sebelum menyetujui.' : 'Permohonan ini sudah diputuskan.'}</p>
              </div>
            </div>

            {canDecide ? (
              <>
                <div className="decision-summary">
                  <span>Ruang</span>
                  <strong>{room?.name}</strong>
                  <span>Jadwal</span>
                  <strong>
                    {formatDateLong(reservation.date)}, {formatTimeRange(reservation.start, reservation.end)}
                  </strong>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  disabled={conflicts.length > 0}
                  onClick={() => setApproveOpen(true)}
                >
                  <Icon name="check" size={17} />
                  Setujui permohonan
                </button>
                {conflicts.length > 0 ? (
                  <p className="decision-warning">
                    Persetujuan diblokir karena jadwal bertabrakan. Pilih tolak dengan alasan, atau minta
                    pemohon mengganti waktu.
                  </p>
                ) : null}

                <button
                  type="button"
                  className="btn btn-danger btn-block"
                  onClick={() => {
                    setRejectOpen(true)
                    setError(null)
                  }}
                >
                  <Icon name="x" size={17} />
                  Tolak permohonan
                </button>

                {rejectOpen ? (
                  <div className="reject-box">
                    <Field
                      label="Alasan penolakan"
                      htmlFor="reject-reason"
                      hint="Wajib, minimal 10 karakter"
                      error={error ?? undefined}
                    >
                      <textarea
                        id="reject-reason"
                        rows={4}
                        value={reason}
                        placeholder="Contoh: ruang sudah dipakai kegiatan akademik pada jam tersebut."
                        onChange={(event) => {
                          setReason(event.target.value)
                          setError(null)
                        }}
                        aria-invalid={Boolean(error)}
                      />
                    </Field>
                    <p className="char-count">{reason.trim().length}/10 karakter</p>
                    <div className="reject-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRejectOpen(false)}>
                        Batal
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => decide('rejected')}
                      >
                        Simpan penolakan
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="decision-result">
                <StatusBadge status={reservation.status} />
                {reservation.decidedAt ? (
                  <p>
                    Diputuskan oleh <strong>{reservation.decidedBy}</strong> pada{' '}
                    {formatDateTime(reservation.decidedAt)}.
                  </p>
                ) : null}
                {reservation.rejectionReason ? (
                  <div className="reason-box is-rejected">
                    <h3>Alasan penolakan</h3>
                    <p>{reservation.rejectionReason}</p>
                  </div>
                ) : null}
                {reservation.cancelledAt ? (
                  <div className="reason-box is-cancelled">
                    <h3>Dibatalkan pemohon</h3>
                    <p>{reservation.cancelReason ?? 'Tanpa alasan tertulis.'}</p>
                    <span>{formatDateTime(reservation.cancelledAt)}</span>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Riwayat</h2>
                <p>Jejak audit permohonan ini.</p>
              </div>
            </div>
            <ol className="timeline">
              <li className="timeline-item is-done">
                <span className="timeline-dot" aria-hidden="true" />
                <div>
                  <strong>Pengajuan dikirim</strong>
                  <span className="timeline-time">{formatDateTime(reservation.createdAt)}</span>
                  <p>{reservation.userName} mengirim permohonan.</p>
                </div>
              </li>
              {reservation.decidedAt ? (
                <li className={`timeline-item is-${reservation.status === 'approved' ? 'done' : 'rejected'}`}>
                  <span className="timeline-dot" aria-hidden="true" />
                  <div>
                    <strong>{reservation.status === 'approved' ? 'Disetujui' : 'Ditolak'}</strong>
                    <span className="timeline-time">{formatDateTime(reservation.decidedAt)}</span>
                    <p>Oleh {reservation.decidedBy}.</p>
                  </div>
                </li>
              ) : (
                <li className="timeline-item is-current">
                  <span className="timeline-dot" aria-hidden="true" />
                  <div>
                    <strong>Menunggu keputusan</strong>
                    <span className="timeline-time">Saat ini</span>
                    <p>Admin kampus sedang meninjau permohonan.</p>
                  </div>
                </li>
              )}
              {reservation.cancelledAt ? (
                <li className="timeline-item is-cancelled">
                  <span className="timeline-dot" aria-hidden="true" />
                  <div>
                    <strong>Dibatalkan</strong>
                    <span className="timeline-time">{formatDateTime(reservation.cancelledAt)}</span>
                    <p>{reservation.cancelReason ?? 'Tanpa alasan tertulis.'}</p>
                  </div>
                </li>
              ) : null}
            </ol>
          </section>

          {room ? (
            <section className="panel">
              <RoomThumb room={room} className="summary-thumb" />
              <h3 className="side-room-name">{room.name}</h3>
              <p className="summary-location">
                {roomLocation(room)} · {roomCapacity(room)}
              </p>
              <p className="muted small">{roomFacilities(room)}</p>
            </section>
          ) : null}
        </aside>
      </div>

      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Setujui permohonan ini?"
        description={`${reservation.id} · ${room?.name}`}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setApproveOpen(false)}>
              Batal
            </button>
            <button type="button" className="btn btn-primary" onClick={() => decide('approved')}>
              Ya, setujui
            </button>
          </>
        }
      >
        <p className="modal-text">
          Ruang akan dialokasikan untuk {reservation.userName} pada{' '}
          {formatDateLong(reservation.date)}, {formatTimeRange(reservation.start, reservation.end)}.
          Sistem memeriksa ulang konflik saat keputusan disimpan.
        </p>
        <div className="modal-facts">
          <span>Peserta</span>
          <strong>{reservation.participants} orang</strong>
          <span>Organisasi</span>
          <strong>{reservation.org ?? '—'}</strong>
          <span>Konflik</span>
          <strong>{conflicts.length === 0 ? 'Tidak ditemukan' : `${conflicts.length} benturan`}</strong>
        </div>
        {error ? (
          <p className="notice notice-error" role="alert">
            <Icon name="alert" size={16} />
            {error}
          </p>
        ) : null}
      </Modal>
    </div>
  )
}
