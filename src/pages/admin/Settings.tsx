import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { EmptyState, Field, Modal, PageHeader, useToast } from '../../components/ui'
import {
  campusClosedReason,
  operatingHoursLabel,
} from '../../lib/campus-rules'
import { WEEKDAY_OPTIONS } from '../../lib/campus-settings'
import { formatDateLong, todayISO } from '../../lib/format'
import { useStore } from '../../lib/store'
import type { Holiday } from '../../lib/types'

export function AdminSettings() {
  const { state, updateCampusSettings, addHoliday, deleteHoliday } = useStore()
  const { push } = useToast()

  const [openDays, setOpenDays] = useState<number[]>([...state.settings.openDays])
  const [openTime, setOpenTime] = useState(state.settings.openTime)
  const [closeTime, setCloseTime] = useState(state.settings.closeTime)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  const [holidayDate, setHolidayDate] = useState('')
  const [holidayName, setHolidayName] = useState('')
  const [holidayNote, setHolidayNote] = useState('')
  const [holidayError, setHolidayError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null)

  useEffect(() => {
    setOpenDays([...state.settings.openDays])
    setOpenTime(state.settings.openTime)
    setCloseTime(state.settings.closeTime)
  }, [state.settings])

  const holidays = [...state.settings.holidays].sort((a, b) => a.date.localeCompare(b.date))
  const openDayLabels = WEEKDAY_OPTIONS.filter((option) =>
    state.settings.openDays.includes(option.value),
  ).map((option) => option.label)
  const today = todayISO()
  const todayClosedReason = campusClosedReason(state.settings, today)
  const upcomingHoliday = holidays.find((holiday) => holiday.date >= today)

  const toggleDay = (day: number) => {
    setSettingsError(null)
    setOpenDays((previous) =>
      previous.includes(day)
        ? previous.filter((value) => value !== day)
        : [...previous, day].sort((a, b) => a - b),
    )
  }

  const saveSettings = (event: FormEvent) => {
    event.preventDefault()
    setSettingsError(null)
    const result = updateCampusSettings({ openDays, openTime, closeTime })
    if (!result.ok) {
      setSettingsError(result.error)
      return
    }
    push('Hari dan jam operasional kampus berhasil disimpan.', 'success')
  }

  const submitHoliday = (event: FormEvent) => {
    event.preventDefault()
    setHolidayError(null)
    const result = addHoliday({
      date: holidayDate,
      name: holidayName,
      note: holidayNote,
    })
    if (!result.ok) {
      setHolidayError(result.error)
      return
    }
    setHolidayDate('')
    setHolidayName('')
    setHolidayNote('')
    push('Hari libur kampus berhasil ditambahkan.', 'success')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const result = deleteHoliday(deleteTarget.id)
    if (!result.ok) {
      setHolidayError(result.error)
      setDeleteTarget(null)
      return
    }
    setDeleteTarget(null)
    push('Hari libur kampus dihapus.', 'info')
  }

  return (
    <div className="stack">
      <PageHeader
        title="Pengaturan kampus"
        description="Atur hari operasional, jam layanan, dan kalender libur yang dipakai seluruh alur reservasi."
      />

      <div className="settings-grid">
        <section className="panel settings-panel">
          <div className="panel-head">
            <div>
              <h2>Hari dan jam operasional</h2>
              <p>
                Perubahan berlaku untuk validasi mahasiswa dan pemeriksaan ulang saat admin
                menyetujui.
              </p>
            </div>
          </div>

          <form onSubmit={saveSettings}>
            <div className="settings-field-block">
              <span className="settings-label">Hari operasional</span>
              <div className="weekday-grid" role="group" aria-label="Hari operasional kampus">
                {WEEKDAY_OPTIONS.map((option) => {
                  const checked = openDays.includes(option.value)
                  return (
                    <label
                      key={option.value}
                      className={`weekday-toggle ${checked ? 'is-active' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDay(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  )
                })}
                <span className="weekday-closed">
                  <Icon name="x" size={14} />
                  Minggu selalu tutup
                </span>
              </div>
            </div>

            <div className="form-grid settings-time-grid">
              <Field label="Jam buka kampus" htmlFor="campus-open" required>
                <input
                  id="campus-open"
                  type="time"
                  value={openTime}
                  step={1800}
                  onChange={(event) => {
                    setOpenTime(event.target.value)
                    setSettingsError(null)
                  }}
                />
              </Field>
              <Field label="Jam tutup kampus" htmlFor="campus-close" required>
                <input
                  id="campus-close"
                  type="time"
                  value={closeTime}
                  step={1800}
                  onChange={(event) => {
                    setCloseTime(event.target.value)
                    setSettingsError(null)
                  }}
                />
              </Field>
            </div>

            <p className="notice notice-info">
              <Icon name="info" size={16} />
              Minggu selalu tutup sesuai kebijakan kampus. Admin dapat menutup hari Senin–Sabtu
              atau menyesuaikan jam layanan tanpa mengubah kode program.
            </p>

            {settingsError ? (
              <p className="notice notice-error" role="alert">
                <Icon name="alert" size={16} />
                {settingsError}
              </p>
            ) : null}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <Icon name="check" size={16} />
                Simpan pengaturan
              </button>
            </div>
          </form>
        </section>

        <aside className="panel settings-summary">
          <div className="panel-head">
            <div>
              <h2>Aturan aktif</h2>
              <p>Ringkasan yang sedang berlaku.</p>
            </div>
          </div>
          <dl className="summary-facts settings-facts">
            <div>
              <dt>Hari operasional</dt>
              <dd>{openDayLabels.length > 0 ? openDayLabels.join(', ') : 'Belum dipilih'}</dd>
            </div>
            <div>
              <dt>Jam layanan</dt>
              <dd>{operatingHoursLabel(state.settings)}</dd>
            </div>
            <div>
              <dt>Hari libur terdaftar</dt>
              <dd>{holidays.length} tanggal</dd>
            </div>
            <div>
              <dt>Status hari ini</dt>
              <dd>{todayClosedReason ? 'Kampus tutup' : 'Kampus buka'}</dd>
            </div>
          </dl>

          {todayClosedReason ? (
            <p className="notice notice-warning" role="status">
              <Icon name="alert" size={16} />
              {todayClosedReason}
            </p>
          ) : (
            <p className="notice notice-success" role="status">
              <Icon name="check" size={16} />
              Kampus buka hari ini pada {operatingHoursLabel(state.settings)}.
            </p>
          )}

          {upcomingHoliday ? (
            <p className="settings-upcoming">
              Libur terdekat: <strong>{formatDateLong(upcomingHoliday.date)}</strong> ·{' '}
              {upcomingHoliday.name}
            </p>
          ) : null}
        </aside>
      </div>

      <section className="panel settings-panel">
        <div className="panel-head">
          <div>
            <h2>Kalender hari libur kampus</h2>
            <p>
              Hanya tanggal yang ditambahkan admin yang dianggap libur. Sistem tidak mengambil
              kalender libur nasional secara otomatis.
            </p>
          </div>
        </div>

        <form className="holiday-form" onSubmit={submitHoliday}>
          <div className="form-grid">
            <Field label="Tanggal libur" htmlFor="holiday-date" required>
              <input
                id="holiday-date"
                type="date"
                value={holidayDate}
                min={today}
                onChange={(event) => {
                  setHolidayDate(event.target.value)
                  setHolidayError(null)
                }}
                aria-invalid={Boolean(holidayError)}
              />
            </Field>
            <Field
              label="Nama hari libur"
              htmlFor="holiday-name"
              hint="Contoh: Libur nasional atau cuti bersama"
              required
            >
              <input
                id="holiday-name"
                type="text"
                value={holidayName}
                maxLength={80}
                placeholder="Contoh: Hari Raya Nyepi"
                onChange={(event) => {
                  setHolidayName(event.target.value)
                  setHolidayError(null)
                }}
                aria-invalid={Boolean(holidayError)}
              />
            </Field>
            <Field
              label="Keterangan"
              htmlFor="holiday-note"
              hint="Opsional"
              className="span-2"
            >
              <input
                id="holiday-note"
                type="text"
                value={holidayNote}
                maxLength={160}
                placeholder="Contoh: Cuti bersama seluruh unit kampus"
                onChange={(event) => setHolidayNote(event.target.value)}
              />
            </Field>
          </div>

          {holidayError ? (
            <p className="notice notice-error" role="alert">
              <Icon name="alert" size={16} />
              {holidayError}
            </p>
          ) : null}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Tambah hari libur
            </button>
          </div>
        </form>

        <div className="holiday-list-head">
          <h3>Daftar hari libur</h3>
          <span>{holidays.length} tanggal terdaftar</span>
        </div>

        {holidays.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Belum ada hari libur"
            description="Tambahkan tanggal saat kampus tidak beroperasi. Tanggal tersebut akan otomatis menutup pengajuan peminjaman."
          />
        ) : (
          <div className="table-wrap">
            <table className="table table-stack holiday-table">
              <thead>
                <tr>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Nama</th>
                  <th scope="col">Keterangan</th>
                  <th scope="col">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((holiday) => (
                  <tr key={holiday.id}>
                    <td data-label="Tanggal">
                      <strong>{formatDateLong(holiday.date)}</strong>
                      <span className="cell-sub">{holiday.date}</span>
                    </td>
                    <td data-label="Nama">{holiday.name}</td>
                    <td data-label="Keterangan">{holiday.note ?? '—'}</td>
                    <td className="cell-action">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteTarget(holiday)}
                        aria-label={`Hapus hari libur ${holiday.name} pada ${holiday.date}`}
                      >
                        <Icon name="trash" size={15} />
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus hari libur?"
        description={deleteTarget ? `${formatDateLong(deleteTarget.date)} · ${deleteTarget.name}` : undefined}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
              Batal
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete}>
              Hapus hari libur
            </button>
          </>
        }
      >
        <p className="modal-text">
          Setelah dihapus, tanggal ini kembali mengikuti hari operasional biasa. Reservasi yang
          sudah ada tidak diubah otomatis.
        </p>
      </Modal>
    </div>
  )
}
