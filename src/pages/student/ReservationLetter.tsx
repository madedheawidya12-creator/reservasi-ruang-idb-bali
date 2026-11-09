import { Link, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { EmptyState, Logo } from '../../components/ui'
import { formatDateLong, formatDateTime, formatTimeRange, todayISO } from '../../lib/format'
import { roomCode, roomLocation } from '../../lib/room-display'
import { useCurrentUser, useStore } from '../../lib/store'

export function ReservationLetter() {
  const { id } = useParams()
  const { state } = useStore()
  const user = useCurrentUser()
  const reservation = state.reservations.find((candidate) => candidate.id === id)

  if (!reservation || reservation.userId !== user.id) {
    return (
      <EmptyState
        icon="shield"
        title="Surat tidak dapat dibuka"
        description="Surat peminjaman hanya dapat dibuka oleh pemohon yang bersangkutan."
        action={
          <Link to="/app/reservasi" className="btn btn-secondary">
            Kembali ke reservasi saya
          </Link>
        }
      />
    )
  }

  if (reservation.status !== 'approved') {
    return (
      <EmptyState
        icon="calendar"
        title="Surat belum tersedia"
        description="Surat peminjaman dapat dicetak setelah pengajuan disetujui oleh admin kampus."
        action={
          <Link to={`/app/reservasi/${reservation.id}`} className="btn btn-secondary">
            Kembali ke detail pengajuan
          </Link>
        }
      />
    )
  }

  const room = state.rooms.find((candidate) => candidate.id === reservation.roomId)
  const issued = formatDateLong(todayISO())
  const organization = reservation.org ?? user.org ?? 'Belum tersedia'

  return (
    <div className="letter-screen">
      <div className="letter-toolbar">
        <div>
          <Link to={`/app/reservasi/${reservation.id}`} className="text-link">
            <Icon name="arrow-left" size={15} />
            Kembali ke detail pengajuan
          </Link>
          <p>Periksa data surat, lalu cetak atau simpan sebagai PDF.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          <Icon name="download" size={17} />
          Cetak / Simpan PDF
        </button>
      </div>

      <article className="letter-sheet">
        <header className="letter-head">
          <Logo />
          <div className="letter-institution">
            <strong>Institut Desain dan Bisnis Bali</strong>
            <span>RuangIDB · Sistem Reservasi Ruangan</span>
            <span>www.idbbali.ac.id</span>
          </div>
        </header>

        <div className="letter-title">
          <h1>Surat Pengajuan Peminjaman Ruangan</h1>
          <p>
            Nomor pengajuan: <strong>{reservation.id}</strong>
          </p>
        </div>

        <div className="letter-address">
          <p>
            Kepada Yth.
            <br />
            <strong>Bagian Akademik</strong>
            <br />
            Institut Desain dan Bisnis Bali
          </p>
          <p>
            Tanggal cetak
            <br />
            <strong>{issued}</strong>
          </p>
        </div>

        <p>Dengan hormat,</p>
        <p>
          Melalui surat ini, kami mengajukan peminjaman ruangan kampus untuk kegiatan berikut.
          Pengajuan ini telah disetujui melalui sistem RuangIDB.
        </p>

        <dl className="letter-facts">
          <div>
            <dt>Nama pemohon</dt>
            <dd>{reservation.userName}</dd>
          </div>
          <div>
            <dt>NIM</dt>
            <dd>{user.nim ?? 'Belum tersedia'}</dd>
          </div>
          <div>
            <dt>Program studi</dt>
            <dd>{user.program ?? 'Belum tersedia'}</dd>
          </div>
          <div>
            <dt>Organisasi / penanggung jawab</dt>
            <dd>{organization}</dd>
          </div>
          <div>
            <dt>Ruang</dt>
            <dd>{room?.name ?? 'Ruang tidak ditemukan'}</dd>
          </div>
          <div>
            <dt>Lokasi</dt>
            <dd>{room ? roomLocation(room) : 'Belum tersedia'}</dd>
          </div>
          <div>
            <dt>Kode ruang</dt>
            <dd>{room ? roomCode(room) : 'Belum tersedia'}</dd>
          </div>
          <div>
            <dt>Jumlah peserta</dt>
            <dd>{reservation.participants} orang</dd>
          </div>
          <div>
            <dt>Tanggal kegiatan</dt>
            <dd>{formatDateLong(reservation.date)}</dd>
          </div>
          <div>
            <dt>Waktu</dt>
            <dd>{formatTimeRange(reservation.start, reservation.end)}</dd>
          </div>
        </dl>

        <section className="letter-section">
          <h2>Nama / jenis kegiatan</h2>
          <p>{reservation.purpose}</p>
        </section>

        {reservation.notes ? (
          <section className="letter-section">
            <h2>Catatan tambahan</h2>
            <p>{reservation.notes}</p>
          </section>
        ) : null}

        <section className="letter-section">
          <h2>Status persetujuan</h2>
          <p>
            <strong>Disetujui</strong> oleh {reservation.decidedBy ?? 'Admin Kampus'} pada{' '}
            {reservation.decidedAt ? formatDateTime(reservation.decidedAt) : 'waktu yang tercatat'}.
          </p>
        </section>

        <p>
          Demikian surat pengajuan ini dibuat. Salinan fisik surat mohon diserahkan ke Bagian
          Akademik sebagai kelengkapan proses peminjaman ruangan.
        </p>

        <div className="letter-signatures">
          <div>
            <span>Pemohon</span>
            <div className="signature-space" aria-hidden="true" />
            <strong>{reservation.userName}</strong>
            <small>{user.nim ?? ''}</small>
          </div>
          <div>
            <span>Admin Kampus</span>
            <div className="signature-space" aria-hidden="true" />
            <strong>{reservation.decidedBy ?? 'Admin Kampus'}</strong>
            <small>
              {reservation.decidedAt ? formatDateLong(reservation.decidedAt.slice(0, 10)) : ''}
            </small>
          </div>
        </div>

        <footer className="letter-footer">
          <span>Dokumen dibuat melalui RuangIDB pada {issued}.</span>
          <span>ID pengajuan: {reservation.id}</span>
        </footer>
      </article>

      <p className="letter-screen-note">
        <Icon name="info" size={16} />
        Cetak atau simpan halaman ini sebagai PDF, tanda tangani, lalu serahkan salinan fisiknya ke
        Bagian Akademik.
      </p>
    </div>
  )
}
