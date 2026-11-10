import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { EmptyState, PageHeader } from '../../components/ui'
import { formatDateTime } from '../../lib/format'
import { useStore } from '../../lib/store'
import type { ActivityAction } from '../../lib/types'

const ACTION_LABEL: Record<ActivityAction, string> = {
  create: 'Pengajuan dibuat',
  approve: 'Permohonan disetujui',
  reject: 'Permohonan ditolak',
  cancel: 'Permohonan dibatalkan',
  room_create: 'Ruang ditambahkan',
  room_update: 'Data ruang diperbarui',
  room_status: 'Status ruang diubah',
  settings_update: 'Pengaturan kampus diubah',
  holiday_create: 'Hari libur ditambahkan',
  holiday_delete: 'Hari libur dihapus',
}

export function AdminActivity() {
  const { state } = useStore()
  const [action, setAction] = useState<'all' | ActivityAction>('all')
  const [query, setQuery] = useState('')

  const rows = [...state.logs]
    .sort((a, b) => b.at.localeCompare(a.at))
    .filter((log) => {
      if (action !== 'all' && log.action !== action) return false
      if (!query.trim()) return true
      return `${log.actor} ${log.target} ${log.detail}`.toLowerCase().includes(query.trim().toLowerCase())
    })

  return (
    <div className="stack">
      <PageHeader
        title="Log aktivitas"
        description="Riwayat perubahan penting: keputusan admin, pembatalan, perubahan data ruang, serta pengaturan operasional dan hari libur."
      />

      <div className="admin-filters">
        <label className="inline-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Cari pelaku, ID, atau detail"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Cari log aktivitas"
          />
        </label>
        <label className="inline-date">
          <span>Jenis aktivitas</span>
          <select value={action} onChange={(event) => setAction(event.target.value as 'all' | ActivityAction)}>
            <option value="all">Semua aktivitas</option>
            <option value="create">Pengajuan dibuat</option>
            <option value="approve">Disetujui</option>
            <option value="reject">Ditolak</option>
            <option value="cancel">Dibatalkan</option>
            <option value="room_create">Ruang ditambahkan</option>
            <option value="room_update">Data ruang diperbarui</option>
            <option value="room_status">Status ruang diubah</option>
            <option value="settings_update">Pengaturan kampus diubah</option>
            <option value="holiday_create">Hari libur ditambahkan</option>
            <option value="holiday_delete">Hari libur dihapus</option>
          </select>
        </label>
        <span className="results-count">{rows.length} catatan</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="activity"
          title="Belum ada catatan yang cocok"
          description="Coba kata kunci lain atau pilih jenis aktivitas yang berbeda."
          action={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setAction('all')
                setQuery('')
              }}
            >
              Tampilkan semua
            </button>
          }
        />
      ) : (
        <div className="panel table-panel">
          <div className="table-wrap">
            <table className="table table-activity table-stack">
              <thead>
                <tr>
                  <th scope="col">Waktu</th>
                  <th scope="col">Pelaku</th>
                  <th scope="col">Aktivitas</th>
                  <th scope="col">Objek</th>
                  <th scope="col">Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((log) => (
                  <tr key={log.id}>
                    <td className="cell-nowrap" data-label="Waktu">{formatDateTime(log.at)}</td>
                    <td data-label="Pelaku">
                      <strong>{log.actor}</strong>
                      <span className="cell-sub">
                        {log.actorRole === 'admin' ? 'Admin kampus' : log.actorRole === 'student' ? 'Mahasiswa' : 'Sistem'}
                      </span>
                    </td>
                    <td data-label="Aktivitas">
                      <span className={`action-tag action-${log.action}`}>
                        {ACTION_LABEL[log.action]}
                      </span>
                    </td>
                    <td className="cell-nowrap cell-hide-mobile" data-label="Objek">{log.target}</td>
                    <td className="cell-detail" data-label="Detail">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="muted small">
        Log menyimpan pelaku, waktu, tindakan, dan objek. Data pribadi pemohon tidak ditampilkan
        melebihi kebutuhan audit.
      </p>
    </div>
  )
}
