import { SLOT_COUNT, slotLabel, toTime, type Slot } from '../lib/availability'

export function AvailabilityRibbon({
  slots,
  showAxis = false,
  compact = false,
  label,
}: {
  slots: Slot[]
  showAxis?: boolean
  compact?: boolean
  label?: string
}) {
  const free = slots.filter((slot) => slot.state === 'free').length
  const summary =
    label ??
    `${free} dari ${SLOT_COUNT} slot tersedia, pukul 08.00 sampai 20.00`
  const axis = [8, 10, 12, 14, 16, 18, 20]

  return (
    <div className={`ribbon-wrap ${compact ? 'is-compact' : ''}`}>
      <div className="ribbon" role="img" aria-label={summary}>
        {slots.map((slot) => (
          <span
            key={slot.start}
            className={`ribbon-slot is-${slot.state}`}
            title={`${toTime(slot.start)}–${toTime(slot.end)} · ${slotLabel(slot.state)}`}
          />
        ))}
      </div>
      {showAxis ? (
        <div className="ribbon-axis" aria-hidden="true">
          {axis.map((hour) => (
            <span key={hour}>{String(hour).padStart(2, '0')}</span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function RibbonLegend({ pending = true }: { pending?: boolean }) {
  return (
    <div className="ribbon-legend">
      <span>
        <i className="dot is-free" /> Tersedia
      </span>
      {pending ? (
        <span>
          <i className="dot is-pending" /> Menunggu
        </span>
      ) : null}
      <span>
        <i className="dot is-approved" /> Terpakai
      </span>
    </div>
  )
}
