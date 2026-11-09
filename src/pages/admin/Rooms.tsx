import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { RoomThumb } from '../../components/RoomThumb'
import { EmptyState, Field, Modal, PageHeader, RoomStatusBadge, useToast } from '../../components/ui'
import { ROOM_CATEGORIES, categoryFor } from '../../lib/categories'
import { roomCapacity, roomCode, roomFacilityCount, roomLocation } from '../../lib/room-display'
import { useStore } from '../../lib/store'
import type { Room } from '../../lib/types'

function blankRoom(): Room {
  return {
    id: '',
    name: '',
    code: undefined,
    category: 'ruang-kelas',
    building: undefined,
    floor: undefined,
    capacity: undefined,
    facilities: [],
    description: '',
    rules: [
      'Kembalikan tata letak furnitur seperti semula setelah kegiatan.',
      'Jaga kebersihan dan buang sampah pada tempatnya.',
      'Kegiatan harus selesai sesuai waktu yang disetujui.',
    ],
    open: '08:00',
    close: '20:00',
    status: 'active',
    tone: Math.floor(Math.random() * 4),
  }
}

export function AdminRooms() {
  const { state, saveRoom, setRoomStatus } = useStore()
  const { push } = useToast()
  const [draft, setDraft] = useState<Room | null>(null)
  const [facilitiesText, setFacilitiesText] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmRoom, setConfirmRoom] = useState<Room | null>(null)

  const openNew = () => {
    setDraft(blankRoom())
    setFacilitiesText('')
    setFormError(null)
  }

  const openEdit = (room: Room) => {
    setDraft({ ...room })
    setFacilitiesText(room.facilities.join(', '))
    setFormError(null)
  }

  const update = <K extends keyof Room>(key: K, value: Room[K]) => {
    setDraft((previous) => (previous ? { ...previous, [key]: value } : previous))
  }

  const submit = () => {
    if (!draft) return
    const payload: Room = {
      ...draft,
      name: draft.name.trim(),
      code: draft.code?.trim().toUpperCase() || undefined,
      building: draft.building?.trim() || undefined,
      capacityNote: draft.capacityNote?.trim() || undefined,
      facilities: facilitiesText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      rules: draft.rules.filter((rule) => rule.trim()),
    }
    const result = saveRoom(payload)
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    push(draft.id ? 'Data ruang diperbarui.' : 'Ruang baru ditambahkan.', 'success')
    setDraft(null)
  }

  const toggle = () => {
    if (!confirmRoom) return
    const next = confirmRoom.status === 'active' ? 'inactive' : 'active'
    const result = setRoomStatus(confirmRoom.id, next)
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push(
      next === 'inactive' ? 'Ruang dinonaktifkan. Permohonan baru diblokir.' : 'Ruang diaktifkan kembali.',
      result.warning ? 'info' : 'success',
    )
    if (result.warning) push(result.warning, 'info')
    setConfirmRoom(null)
  }

  const active = state.rooms.filter((room) => room.status === 'active').length

  return (
    <div className="stack">
      <PageHeader
        title="Kelola ruang"
        description="Perbarui data ruang kampus. Ruang yang dinonaktifkan tetap menyimpan riwayatnya."
        actions={
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Icon name="plus" size={17} />
            Tambah ruang
          </button>
        }
      />

      <div className="results-head">
        <p>
          <strong>{state.rooms.length}</strong> ruang terdaftar · {active} aktif
        </p>
        <p className="results-date">
          <Icon name="info" size={15} />
          Foto fasilitas IDB dipakai otomatis. Tambahkan URL untuk foto asli ruangan.
        </p>
      </div>

      {state.rooms.length === 0 ? (
        <EmptyState
          icon="building"
          title="Belum ada data ruang"
          description="Tambahkan ruang pertama agar mahasiswa dapat mengajukan reservasi."
          action={
            <button type="button" className="btn btn-primary" onClick={openNew}>
              Tambah ruang
            </button>
          }
        />
      ) : (
        <div className="panel table-panel">
          <div className="table-wrap">
            <table className="table table-rooms table-stack">
              <thead>
                <tr>
                  <th scope="col">Ruang</th>
                  <th scope="col">Kategori</th>
                  <th scope="col">Lokasi</th>
                  <th scope="col">Kapasitas</th>
                  <th scope="col">Fasilitas</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.rooms.map((room) => (
                  <tr key={room.id}>
                    <td data-label="Ruang">
                      <div className="room-cell">
                        <RoomThumb room={room} className="room-cell-thumb" />
                        <div>
                          <strong>{room.name}</strong>
                          <span className="cell-sub">{roomCode(room)}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Kategori">
                      <span className="category-chip">
                        {ROOM_CATEGORIES.find((category) => category.value === categoryFor(room))?.label ??
                          'Ruang Kelas'}
                      </span>
                    </td>
                    <td data-label="Lokasi">{roomLocation(room)}</td>
                    <td data-label="Kapasitas">{roomCapacity(room)}</td>
                    <td className="cell-hide-mobile" data-label="Fasilitas">
                      {roomFacilityCount(room)}
                      <span className="cell-sub">
                        {room.facilities.length > 0
                          ? room.facilities.slice(0, 2).join(', ')
                          : 'Data belum tersedia'}
                      </span>
                    </td>
                    <td data-label="Status">
                      <RoomStatusBadge status={room.status} />
                    </td>
                    <td className="cell-action">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(room)}
                        >
                          <Icon name="edit" size={15} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${room.status === 'active' ? 'btn-outline-danger' : 'btn-secondary'}`}
                          onClick={() => setConfirmRoom(room)}
                        >
                          {room.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        size="wide"
        title={draft?.id ? 'Edit ruang' : 'Tambah ruang'}
        description="Perubahan akan tercatat pada log aktivitas admin."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>
              Batal
            </button>
            <button type="button" className="btn btn-primary" onClick={submit}>
              Simpan ruang
            </button>
          </>
        }
      >
        {draft ? (
          <>
            {formError ? (
              <p className="notice notice-error" role="alert">
                <Icon name="alert" size={16} />
                {formError}
              </p>
            ) : null}
            <div className="form-grid">
            <Field label="Nama ruang" htmlFor="room-name" required className="span-2">
              <input
                id="room-name"
                type="text"
                value={draft.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Contoh: Ruang Kelas A.1.2"
              />
            </Field>
            <Field
              label="Kode ruang"
              htmlFor="room-code"
              hint="Kosongkan jika belum tersedia"
            >
              <input
                id="room-code"
                type="text"
                value={draft.code ?? ''}
                onChange={(event) => update('code', event.target.value || undefined)}
                placeholder="Contoh: A.1.2"
              />
            </Field>
            <Field label="Kategori ruang" htmlFor="room-category" required>
              <select
                id="room-category"
                value={categoryFor(draft)}
                onChange={(event) => update('category', event.target.value as Room['category'])}
              >
                {ROOM_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Gedung"
              htmlFor="room-building"
              hint="Kosongkan jika belum terverifikasi"
            >
              <input
                id="room-building"
                type="text"
                value={draft.building ?? ''}
                onChange={(event) => update('building', event.target.value || undefined)}
                placeholder="Contoh: Gedung A"
              />
            </Field>
            <Field
              label="Lantai"
              htmlFor="room-floor"
              hint="Kosongkan jika belum terverifikasi"
            >
              <input
                id="room-floor"
                type="number"
                min={1}
                value={draft.floor ?? ''}
                onChange={(event) =>
                  update('floor', event.target.value ? Number(event.target.value) : undefined)
                }
              />
            </Field>
            <Field
              label="Kapasitas"
              htmlFor="room-capacity"
              hint="Kosongkan jika belum tersedia"
            >
              <input
                id="room-capacity"
                type="number"
                min={1}
                value={draft.capacity ?? ''}
                onChange={(event) =>
                  update('capacity', event.target.value ? Number(event.target.value) : undefined)
                }
              />
            </Field>
            <Field
              label="Catatan kapasitas"
              htmlFor="room-capacity-note"
              hint="Contoh: 24–36 orang"
            >
              <input
                id="room-capacity-note"
                type="text"
                value={draft.capacityNote ?? ''}
                onChange={(event) => update('capacityNote', event.target.value || undefined)}
                placeholder="Kosongkan jika tidak ada"
              />
            </Field>
            <Field label="Jam buka" htmlFor="room-open" required>
              <input
                id="room-open"
                type="time"
                value={draft.open}
                onChange={(event) => update('open', event.target.value)}
              />
            </Field>
            <Field label="Jam tutup" htmlFor="room-close" required>
              <input
                id="room-close"
                type="time"
                value={draft.close}
                onChange={(event) => update('close', event.target.value)}
              />
            </Field>
            <Field
              label="Fasilitas"
              htmlFor="room-facilities"
              hint="Pisahkan dengan koma"
              className="span-2"
            >
              <input
                id="room-facilities"
                type="text"
                value={facilitiesText}
                onChange={(event) => setFacilitiesText(event.target.value)}
                placeholder="Proyektor, AC, Whiteboard"
              />
            </Field>
            <Field label="Deskripsi" htmlFor="room-desc" className="span-2">
              <textarea
                id="room-desc"
                rows={3}
                value={draft.description}
                onChange={(event) => update('description', event.target.value)}
                placeholder="Kegunaan utama ruang dan catatan tata letak."
              />
            </Field>
            <Field
              label="URL foto"
              htmlFor="room-photo"
              hint="Kosongkan untuk memakai foto referensi kategori"
              className="span-2"
            >
              <input
                id="room-photo"
                type="url"
                value={draft.photo ?? ''}
                onChange={(event) => update('photo', event.target.value || undefined)}
                placeholder="/rooms/ruang-kelas.jpg"
              />
            </Field>
            <Field label="Status" htmlFor="room-status" className="span-2">
              <select
                id="room-status"
                value={draft.status}
                onChange={(event) => update('status', event.target.value as Room['status'])}
              >
                <option value="active">Aktif, dapat diajukan</option>
                <option value="inactive">Nonaktif, hanya riwayat</option>
              </select>
            </Field>
            </div>
          </>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(confirmRoom)}
        onClose={() => setConfirmRoom(null)}
        title={confirmRoom?.status === 'active' ? 'Nonaktifkan ruang?' : 'Aktifkan ruang?'}
        description={confirmRoom ? `${confirmRoom.name} · ${roomCode(confirmRoom)}` : undefined}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmRoom(null)}>
              Batal
            </button>
            <button
              type="button"
              className={confirmRoom?.status === 'active' ? 'btn btn-danger' : 'btn btn-primary'}
              onClick={toggle}
            >
              {confirmRoom?.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </>
        }
      >
        <p className="modal-text">
          {confirmRoom?.status === 'active'
            ? 'Ruang tidak akan muncul pada daftar pengajuan baru. Riwayat dan permohonan yang sudah ada tetap tersimpan. Selesaikan dulu permohonan yang masih menunggu.'
            : 'Ruang akan kembali muncul pada daftar dan dapat diajukan mahasiswa.'}
        </p>
      </Modal>
    </div>
  )
}
