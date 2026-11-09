import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { initials } from '../lib/format'
import type { ReservationStatus, RoomStatus } from '../lib/types'

export function Logo({ plate = false, className = '' }: { plate?: boolean; className?: string }) {
  return (
    <span className={`brand-logo ${plate ? 'is-plate' : ''} ${className}`.trim()}>
      <img
        src="/brand/idb-bali-logo.png"
        alt="IDB Bali, Institut Desain dan Bisnis Bali"
        width={1200}
        height={787}
      />
    </span>
  )
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: 'Menunggu persetujuan',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
}

export function StatusBadge({ status, short = false }: { status: ReservationStatus; short?: boolean }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" aria-hidden="true" />
      {short ? STATUS_LABEL[status].split(' ')[0] : STATUS_LABEL[status]}
    </span>
  )
}

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  return (
    <span className={`badge ${status === 'active' ? 'badge-approved' : 'badge-cancelled'}`}>
      <span className="badge-dot" aria-hidden="true" />
      {status === 'active' ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className = '',
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`field ${className}`.trim()}>
      <div className="field-head">
        <label htmlFor={htmlFor}>
          {label}
          {required ? <span className="field-required"> wajib</span> : null}
        </label>
        {hint ? <span className="field-hint">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="field-error" id={`${htmlFor}-error`} role="alert">
          <Icon name="alert" size={14} />
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string
  description?: string
  back?: { to: string; label: string }
  actions?: ReactNode
}) {
  return (
    <header className="page-head">
      <div className="page-head-text">
        {back ? (
          <Link to={back.to} className="back-link">
            <Icon name="arrow-left" size={16} />
            {back.label}
          </Link>
        ) : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-head-actions">{actions}</div> : null}
    </header>
  )
}

export function EmptyState({
  icon = 'info',
  title,
  description,
  action,
}: {
  icon?: IconName
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  )
}

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          className={`tab ${option.value === value ? 'is-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {typeof option.count === 'number' ? <span className="tab-count">{option.count}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'default',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'default' | 'wide'
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const getFocusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) {
        event.preventDefault()
        panel?.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const firstField = panel?.querySelector<HTMLElement>(
      '.modal-body input, .modal-body select, .modal-body textarea, .modal-body button, .modal-body [href]',
    )
    ;(firstField ?? getFocusable()[0] ?? panel)?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <div
        className={`modal ${size === 'wide' ? 'modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

const ToastContext = createContext<{ push: (message: string, tone?: ToastTone) => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random()
    setItems((previous) => [...previous, { id, message, tone }])
    window.setTimeout(() => {
      setItems((previous) => previous.filter((item) => item.id !== id))
    }, 4500)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {items.map((item) => (
          <div key={item.id} className={`toast toast-${item.tone}`}>
            <Icon
              name={item.tone === 'success' ? 'check' : item.tone === 'error' ? 'alert' : 'info'}
              size={16}
            />
            <span>{item.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Tutup notifikasi"
              onClick={() => setItems((previous) => previous.filter((entry) => entry.id !== item.id))}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast harus dipakai di dalam ToastProvider')
  return context
}
