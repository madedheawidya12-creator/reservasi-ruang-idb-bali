import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Avatar, Modal, PageHeader, useToast } from '../../components/ui'
import { formatDateLong, formatDateTime, formatTimeRange, todayISO } from '../../lib/format'
import { useCurrentUser, useStore } from '../../lib/store'

export function Profile() {
  const { state, resetDemo, logout } = useStore()
  const user = useCurrentUser()
  const { push } = useToast()
  const [resetOpen, setResetOpen] = useState(false)

  const mine = useMemo(
    () => state.reservations.filter((reservation) => reservation.userId === user.id),
    [state.reservations, user.id],
  )

  const approved = mine.filter((reservation) => reservation.status === 'approved')
  const totalMinutes = approved.reduce((total, reservation) => {
    const [startHour, startMinute] = reservation.start.split(':').map(Number)
    const [endHour, endMinute] = reservation.end.split(':').map(Number)
    return total + ((endHour ?? 0) * 60 + (endMinute ?? 0)) - ((startHour ?? 0) * 60 + (startMinute ?? 0))
  }, 0)
  const hours = Math.round((totalMinutes / 60) * 10) / 10

  const joined = mine.length > 0 ? mine[mine.length - 1]!.createdAt : null

  return (
    <div className="stack">
      <PageHeader
        title="Profil pengguna"
        description="Data akun yang dipakai untuk mengajukan reservasi ruangan."
      />

      <div className="profile-grid">
        <section className="panel profile-card">
          <div className="profile-head">
            <Avatar name={user.name} size={64} />
            <div>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
              <span className="role-chip role-student">
                <Icon name="user" size={14} />
                Mahasiswa
              </span>
            </div>
          </div>

          <dl className="profile-facts">
            <div>
              <dt>NIM</dt>
              <dd>{user.nim ?? '—'}</dd>
            </div>
            <div>
              <dt>Program studi</dt>
              <dd>{user.program ?? '—'}</dd>
            </div>
            <div>
              <dt>Organisasi</dt>
              <dd>{user.org ?? '—'}</dd>
            </div>
            <div>
              <dt>Status akun</dt>
              <dd>
                <span className="badge badge-approved">
                  <span className="badge-dot" aria-hidden="true" />
                  Aktif
                </span>
              </dd>
            </div>
          </dl>

          <p className="notice notice-info">
            <Icon name="info" size={16} />
            Data identitas mengikuti akun kampus. Hubungi admin fasilitas bila ada yang perlu diperbarui.
          </p>
        </section>

        <div className="profile-side">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Aktivitas reservasi</h2>
                <p>Ringkasan pemakaian ruangmu sampai hari ini.</p>
              </div>
            </div>
            <div className="profile-stats">
              <div>
                <span>Total pengajuan</span>
                <strong>{mine.length}</strong>
              </div>
              <div>
                <span>Disetujui</span>
                <strong>{approved.length}</strong>
              </div>
              <div>
                <span>Jam ruang terpakai</span>
                <strong>{hours}</strong>
              </div>
            </div>
            <p className="muted small">
              Dihitung dari reservasi berstatus disetujui, termasuk yang akan datang.
            </p>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Akun dan data</h2>
                <p>Pengaturan untuk prototipe ini.</p>
              </div>
            </div>

            <dl className="meta-list">
              <div>
                <dt>Terakhir mengajukan</dt>
                <dd>{joined ? formatDateTime(joined) : 'Belum ada'}</dd>
              </div>
              <div>
                <dt>Tanggal hari ini</dt>
                <dd>{formatDateLong(todayISO())}</dd>
              </div>
              <div>
                <dt>Penyimpanan</dt>
                <dd>Peramban ini (localStorage)</dd>
              </div>
            </dl>

            <div className="profile-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setResetOpen(true)}>
                <Icon name="refresh" size={16} />
                Reset data demo
              </button>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                <Icon name="logout" size={16} />
                Keluar
              </button>
            </div>
          </section>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Reservasi terakhir</h2>
            <p>Tiga kegiatan terakhir yang kamu ajukan.</p>
          </div>
        </div>
        {mine.length === 0 ? (
          <p className="muted">Belum ada reservasi.</p>
        ) : (
          <ul className="simple-rows">
            {mine.slice(0, 3).map((reservation) => (
              <li key={reservation.id}>
                <div>
                  <strong>{reservation.purpose}</strong>
                  <span>
                    {formatDateLong(reservation.date)}, {formatTimeRange(reservation.start, reservation.end)}
                  </span>
                </div>
                <span className={`badge badge-${reservation.status}`}>
                  <span className="badge-dot" aria-hidden="true" />
                  {reservation.status === 'pending'
                    ? 'Menunggu'
                    : reservation.status === 'approved'
                      ? 'Disetujui'
                      : reservation.status === 'rejected'
                        ? 'Ditolak'
                        : 'Dibatalkan'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset data demo?"
        description="Seluruh reservasi, perubahan ruang, dan log akan kembali ke data awal."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setResetOpen(false)}>
              Batal
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                resetDemo()
                setResetOpen(false)
                push('Data demo dikembalikan ke kondisi awal.', 'success')
              }}
            >
              Reset sekarang
            </button>
          </>
        }
      >
        <p className="modal-text">
          Tindakan ini tidak menghapus akun. Kamu tetap masuk dengan akun yang sama, tetapi semua
          pengajuan dan perubahan yang kamu buat akan hilang.
        </p>
      </Modal>
    </div>
  )
}
