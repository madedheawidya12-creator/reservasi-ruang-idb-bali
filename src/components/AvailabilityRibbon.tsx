import { slotLabel, toTime, type Slot } from '../lib/availability'

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
  const first = slots[0]
  const last = slots[slots.length - 1]
  const startLabel = first ? toTime(first.start).replace(':', '.') : '08.00'
  const endLabel = last ? toTime(last.end).replace(':', '.') : '20.00'
  const summary =
    label ?? `${free} dari ${slots.length} slot tersedia, pukul ${startLabel} sampai ${endLabel}`
  const axis: number[] = []
  if (first && last) {
    const firstHour = Math.ceil(first.start / 60)
    const lastHour = Math.floor(last.end / 60)
    for (let hour = firstHour; hour <= lastHour; hour += 2) axis.push(hour)
  }

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
