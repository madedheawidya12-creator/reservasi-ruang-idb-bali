import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { EmptyState, PageHeader, StatusBadge, Tabs } from '../../components/ui'
import { formatDateTime, formatRelativeDay, formatTimeRange } from '../../lib/format'
import { useStore } from '../../lib/store'
import type { ReservationStatus } from '../../lib/types'

type Filter = 'all' | ReservationStatus

export function AdminRequests() {
  const { state } = useStore()
  const [filter, setFilter] = useState<Filter>('pending')
  const [query, setQuery] = useState('')
  const [date, setDate] = useState('')

  const counts = useMemo(
    () => ({
      all: state.reservations.length,
      pending: state.reservations.filter((reservation) => reservation.status === 'pending').length,
      approved: state.reservations.filter((reservation) => reservation.status === 'approved').length,
      rejected: state.reservations.filter((reservation) => reservation.status === 'rejected').length,
      cancelled: state.reservations.filter((reservation) => reservation.status === 'cancelled').length,
    }),
    [state.reservations],
  )

  const rows = state.reservations
    .filter((reservation) => {
      if (filter !== 'all' && reservation.status !== filter) return false
      if (date && reservation.date !== date) return false
      if (!query.trim()) return true
      const room = state.rooms.find((candidate) => candidate.id === reservation.roomId)
      const haystack = `${reservation.id} ${reservation.userName} ${reservation.org ?? ''} ${
        reservation.purpose
      } ${room?.name ?? ''}`.toLowerCase()
      return haystack.includes(query.trim().toLowerCase())
    })
    .sort((a, b) =>
      filter === 'pending'
        ? `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)
        : `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`),
    )

  return (
    <div className="stack">
      <PageHeader
        title="Kelola permohonan"
        description="Tinjau pengajuan, periksa konflik jadwal, lalu setujui atau tolak dengan alasan yang jelas."
      />

      <div className="list-toolbar">
        <Tabs
          label="Filter status permohonan"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'pending', label: 'Menunggu', count: counts.pending },
            { value: 'approved', label: 'Disetujui', count: counts.approved },
            { value: 'rejected', label: 'Ditolak', count: counts.rejected },
            { value: 'cancelled', label: 'Dibatalkan', count: counts.cancelled },
            { value: 'all', label: 'Semua', count: counts.all },
          ]}
        />
      </div>

      <div className="admin-filters">
        <label className="inline-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Cari ID, pemohon, atau ruang"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Cari permohonan"
          />
        </label>
        <label className="inline-date">
          <span>Tanggal kegiatan</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        {date ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDate('')}>
            Hapus tanggal
          </button>
        ) : null}
        <span className="results-count">{rows.length} permohonan</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="clipboard"
          title="Tidak ada permohonan di kategori ini"
          description="Ubah filter status atau hapus pencarian untuk melihat permohonan lain."
          action={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFilter('all')
                setQuery('')
                setDate('')
              }}
            >
              Tampilkan semua
            </button>
          }
        />
      ) : (
        <div className="panel table-panel">
          <div className="table-wrap">
            <table className="table table-requests table-stack">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Pemohon</th>
                  <th scope="col">Kegiatan</th>
                  <th scope="col">Jadwal</th>
                  <th scope="col">Diajukan</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((reservation) => {
                  const room = state.rooms.find((candidate) => candidate.id === reservation.roomId)
                  return (
                    <tr key={reservation.id}>
                      <td className="cell-hide-mobile" data-label="ID">
                        <span className="id-chip">{reservation.id}</span>
                      </td>
                      <td data-label="Pemohon">
                        <strong>{reservation.userName}</strong>
                        <span className="cell-sub">{reservation.org ?? 'Mahasiswa'}</span>
                      </td>
                      <td data-label="Kegiatan">
                        <strong>{reservation.purpose}</strong>
                        <span className="cell-sub">{room?.name ?? 'Ruang tidak ditemukan'}</span>
                      </td>
                      <td data-label="Jadwal">
                        {formatRelativeDay(reservation.date)}
                        <span className="cell-sub">
                          {formatTimeRange(reservation.start, reservation.end)}
                        </span>
                      </td>
                      <td className="cell-nowrap cell-hide-mobile" data-label="Diajukan">
                        {formatDateTime(reservation.createdAt)}
                        <span className="cell-sub">oleh pemohon</span>
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={reservation.status} short />
                      </td>
                      <td className="cell-action">
                        <Link
                          to={`/admin/permohonan/${reservation.id}`}
                          className={`btn btn-sm ${
                            reservation.status === 'pending' ? 'btn-primary' : 'btn-secondary'
                          }`}
                        >
                          {reservation.status === 'pending' ? 'Tinjau' : 'Lihat'}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
