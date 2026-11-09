import type { ReactNode } from 'react'

export type IconName =
  | 'home'
  | 'door'
  | 'calendar'
  | 'clipboard'
  | 'user'
  | 'users'
  | 'search'
  | 'filter'
  | 'plus'
  | 'check'
  | 'x'
  | 'clock'
  | 'pin'
  | 'monitor'
  | 'wind'
  | 'speaker'
  | 'board'
  | 'building'
  | 'logout'
  | 'shield'
  | 'activity'
  | 'edit'
  | 'trash'
  | 'alert'
  | 'info'
  | 'arrow-left'
  | 'arrow-right'
  | 'chevron-right'
  | 'chevron-down'
  | 'menu'
  | 'bell'
  | 'eye'
  | 'eye-off'
  | 'camera'
  | 'spark'
  | 'scissors'
  | 'ruler'
  | 'refresh'
  | 'download'

const PATHS: Record<IconName, ReactNode> = {
  home: <path d="M3 10.6 12 3l9 7.6V21a1 1 0 0 1-1 1h-5.2v-7H9.2v7H4a1 1 0 0 1-1-1Z" />,
  door: (
    <>
      <path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17" />
      <path d="M3 21h18" />
      <path d="M15 12h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  clipboard: (
    <>
      <path d="M9 4h6v3H9z" />
      <path d="M9 5.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5a2 2 0 0 0-2-2h-2" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.2 8-6.2S20 17 20 21" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.5 20c0-3.6 3-5.6 6.5-5.6s6.5 2 6.5 5.6" />
      <path d="M16.5 5.2a3 3 0 0 1 0 5.6M21.5 20c0-2.6-1.4-4.3-3.6-5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m4.5 12.5 5 5L20 6.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  wind: <path d="M4 8h9a3 3 0 1 0-3-3M4 12h13a3 3 0 1 1-3 3M4 16h7" />,
  speaker: (
    <>
      <path d="M4 9h4l5-4v14l-5-4H4z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    </>
  ),
  board: (
    <>
      <rect x="4" y="4" width="16" height="12" rx="2" />
      <path d="M12 16v4M8 20h8" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h2a2 2 0 0 1 2 2v10M2 21h20" />
      <path d="M8 7h4M8 11h4M8 15h4" />
    </>
  ),
  logout: (
    <>
      <path d="M15 17l5-5-5-5M20 12H9" />
      <path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
    </>
  ),
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  activity: <path d="M3 12h4l2.5-7 4 14L16 12h5" />,
  edit: (
    <>
      <path d="M4 20h4L18.5 9.5l-4-4L4 16z" />
      <path d="M14 6l4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 21 20H3z" />
      <path d="M12 9.5v4.5M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  'arrow-left': <path d="M19 12H5M11 18l-6-6 6-6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  'chevron-down': <path d="m5 9 7 7 7-7" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  bell: (
    <>
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M4 4l16 16" />
      <path d="M9.6 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.3 4.1M6.4 7.6A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5c1.2 0 2.3-.2 3.3-.7" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  scissors: (
    <>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <path d="M8.1 7.4 20 18M8.1 16.6 20 6M8.2 8.2 12 12" />
    </>
  ),
  ruler: (
    <>
      <path d="m4 16 12-12 4 4L8 20z" />
      <path d="m7 13 2 2M10 10l2 2M13 7l2 2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.4 6.4" />
      <path d="M20 5v6h-6" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </>
  ),
}

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.6,
}: {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
