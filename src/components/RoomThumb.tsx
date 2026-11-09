import { useState } from 'react'
import { categoryMeta } from '../lib/categories'
import type { Room } from '../lib/types'

export function RoomThumb({ room, className = '' }: { room: Room; className?: string }) {
  const category = categoryMeta(room.category)
  const customPhoto = room.photo?.trim()
  const photo = customPhoto || category.photo
  const isReference = !customPhoto
  const sourceLabel = category.photoOfficial ? 'Foto fasilitas IDB' : 'Foto referensi'
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null)
  const imageFailed = photo !== undefined && failedPhoto === photo

  if (photo && !imageFailed) {
    return (
      <div className={`room-thumb has-photo ${className}`.trim()}>
        <img
          src={photo}
          alt={
            isReference
              ? `${sourceLabel} kategori ${category.label} untuk ${room.name}`
              : `Foto ${room.name}`
          }
          width={360}
          height={220}
          loading="eager"
          decoding="async"
          onError={() => setFailedPhoto(photo)}
        />
        {isReference ? <span className="room-thumb-reference">{sourceLabel}</span> : null}
      </div>
    )
  }

  return (
    <div className={`room-thumb tone-${room.tone % 4} ${className}`.trim()}>
      <svg viewBox="0 0 360 220" className="room-plan" aria-hidden="true">
        <g stroke="currentColor" fill="none" strokeWidth="1.4">
          <path d="M40 192V28h280v164H112" />
          <path d="M40 192h42" />
          <path d="M112 192v-30" />
          <path d="M112 162a30 30 0 0 0-30 30" strokeDasharray="3 4" />
          <path d="M40 14h280M40 8v12M320 8v12" opacity="0.5" />
          <rect x="152" y="84" width="96" height="52" rx="6" />
          <circle cx="176" cy="72" r="7" />
          <circle cx="200" cy="72" r="7" />
          <circle cx="224" cy="72" r="7" />
          <circle cx="176" cy="148" r="7" />
          <circle cx="200" cy="148" r="7" />
          <circle cx="224" cy="148" r="7" />
          <path d="M64 42h22v22H64z" opacity="0.55" />
          <path d="M298 42h-22v22h22z" opacity="0.55" />
        </g>
      </svg>
      {room.code ? <span className="room-thumb-code">{room.code}</span> : null}
      <span className="room-thumb-note">
        <span className="room-thumb-dot" aria-hidden="true" />
        Foto ruangan belum tersedia
      </span>
    </div>
  )
}
