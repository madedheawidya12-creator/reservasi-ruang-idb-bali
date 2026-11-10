import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { initials } from '../lib/format'
import { useStore } from '../lib/store'
import { Icon, type IconName } from './Icon'
import { Avatar, Logo } from './ui'

interface NavItem {
  to: string
  label: string
  icon: IconName
  end?: boolean
  badge?: number
}

const OFFICIAL_SITE = 'https://www.idbbali.ac.id/'

export function AppShell({
  variant,
  title,
  children,
}: {
  variant: 'student' | 'admin'
  title: string
  children: ReactNode
}) {
  const { currentUser, state, logout } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const drawerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const userMenuRef = useRef<HTMLDetailsElement>(null)

  const closeMenu = (restoreFocus = true) => {
    setMenuOpen(false)
    if (restoreFocus) menuButtonRef.current?.focus()
  }

  useEffect(() => {
    setMenuOpen(false)
    if (userMenuRef.current) userMenuRef.current.open = false
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const drawer = drawerRef.current
    const focusables = drawer
      ? Array.from(
          drawer.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), summary, input, select, textarea',
          ),
        )
      : []
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    closeButtonRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenuOpen(false)
        menuButtonRef.current?.focus()
        return
      }
      if (event.key !== 'Tab' || focusables.length === 0) return
      if (!drawer?.contains(document.activeElement)) {
        event.preventDefault()
        first?.focus()
        return
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  if (!currentUser) return null

  const pendingForMe = state.reservations.filter(
    (reservation) =>
      reservation.status === 'pending' &&
      (variant === 'admin' || reservation.userId === currentUser.id),
  ).length

  const nav: NavItem[] =
    variant === 'student'
      ? [
          { to: '/app', label: 'Beranda', icon: 'home', end: true },
          { to: '/app/ruang', label: 'Daftar Ruangan', icon: 'door' },
          { to: '/app/reservasi', label: 'Reservasi Saya', icon: 'calendar', badge: pendingForMe },
          { to: '/app/profil', label: 'Profil', icon: 'user' },
        ]
      : [
          { to: '/admin', label: 'Dashboard', icon: 'home', end: true },
          { to: '/admin/permohonan', label: 'Permohonan', icon: 'clipboard', badge: pendingForMe },
          { to: '/admin/ruang', label: 'Ruang', icon: 'building' },
          { to: '/admin/pengaturan', label: 'Pengaturan', icon: 'settings' },
          { to: '/admin/aktivitas', label: 'Aktivitas', icon: 'activity' },
        ]

  const home = variant === 'student' ? '/app' : '/admin'
  const navLabel = variant === 'student' ? 'Navigasi mahasiswa' : 'Navigasi admin'
  const roleLabel = variant === 'student' ? 'Mahasiswa' : 'Admin kampus'

  return (
    <div className={`app app-${variant} site-shell`}>
      <a className="skip-link" href="#main">
        Lewati ke konten utama
      </a>

      <header className="site-header">
        <div className="site-utility">
          <div className="site-utility-inner">
            <a
              href={OFFICIAL_SITE}
              target="_blank"
              rel="noreferrer"
              className="site-utility-link"
            >
              <Icon name="building" size={14} />
              Website resmi IDB Bali
            </a>
            <span className="site-utility-note">RuangIDB · Prototipe akademik</span>
          </div>
        </div>

        <div className="site-header-main">
          <div className="site-header-inner">
            <Link
              to={home}
              className="site-brand"
              aria-label="Institut Desain dan Bisnis Bali, RuangIDB · Reservasi ruangan kampus, ke beranda"
            >
              <Logo />
              <span className="site-brand-text">
                <strong>Institut Desain dan Bisnis Bali</strong>
                <span>RuangIDB · Reservasi ruangan kampus</span>
              </span>
            </Link>

            <nav className="site-nav" aria-label={navLabel}>
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `site-nav-link ${isActive ? 'is-active' : ''}`}
                >
                  {item.label}
                  {item.badge ? <span className="site-nav-badge">{item.badge}</span> : null}
                </NavLink>
              ))}
            </nav>

            <div className="site-actions">
              <span className={`role-chip role-${variant}`}>
                <Icon name={variant === 'admin' ? 'shield' : 'user'} size={14} />
                {roleLabel}
              </span>

              <Link
                to={variant === 'admin' ? '/admin/permohonan' : '/app/reservasi'}
                className="icon-btn site-bell"
                aria-label={
                  pendingForMe > 0
                    ? `${pendingForMe} permohonan menunggu persetujuan`
                    : 'Tidak ada permohonan menunggu'
                }
              >
                <Icon name="bell" size={19} />
                {pendingForMe > 0 ? <span className="bell-dot" aria-hidden="true" /> : null}
              </Link>

              <details className="user-menu site-user-menu" ref={userMenuRef}>
                <summary
                  aria-label={`${initials(currentUser.name)}, ${currentUser.name}, ${
                    currentUser.email
                  }, menu akun`}
                >
                  <Avatar name={currentUser.name} size={32} />
                  <span className="user-menu-text">
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.email}</span>
                  </span>
                  <Icon name="chevron-down" size={15} />
                </summary>
                <div className="user-menu-panel">
                  <Link
                    to={variant === 'student' ? '/app/profil' : '/admin'}
                    onClick={() => {
                      if (userMenuRef.current) userMenuRef.current.open = false
                    }}
                  >
                    <Icon name="user" size={16} />
                    {variant === 'student' ? 'Profil pengguna' : 'Dashboard admin'}
                  </Link>
                  <button type="button" onClick={logout}>
                    <Icon name="logout" size={16} />
                    Keluar
                  </button>
                </div>
              </details>

              <button
                type="button"
                className="icon-btn site-menu-btn"
                aria-label="Buka menu"
                aria-expanded={menuOpen}
                aria-controls="site-drawer"
                onClick={() => setMenuOpen(true)}
                ref={menuButtonRef}
              >
                <Icon name="menu" size={21} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="site-drawer-scrim"
            aria-label="Tutup menu"
            onClick={() => closeMenu()}
          />
          <div
            id="site-drawer"
            ref={drawerRef}
            className="site-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
          >
            <div className="site-drawer-head">
              <Link
                to={home}
                className="site-drawer-brand"
                onClick={() => setMenuOpen(false)}
                aria-label="RuangIDB, ke beranda"
              >
                <Logo />
                <span>RuangIDB</span>
              </Link>
              <button
                type="button"
                className="icon-btn"
                aria-label="Tutup menu"
                onClick={() => closeMenu()}
                ref={closeButtonRef}
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <nav className="site-drawer-nav" aria-label={navLabel}>
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `site-drawer-link ${isActive ? 'is-active' : ''}`
                  }
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.label}</span>
                  {item.badge ? <span className="site-nav-badge">{item.badge}</span> : null}
                </NavLink>
              ))}
            </nav>

            <div className="site-drawer-account">
              <div className="site-drawer-user">
                <Avatar name={currentUser.name} size={38} />
                <div>
                  <strong>{currentUser.name}</strong>
                  <span>{currentUser.email}</span>
                  <span>{roleLabel}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setMenuOpen(false)
                  logout()
                }}
              >
                <Icon name="logout" size={17} />
                Keluar
              </button>
            </div>

            <a
              href={OFFICIAL_SITE}
              target="_blank"
              rel="noreferrer"
              className="site-drawer-site"
            >
              Website resmi IDB Bali
              <Icon name="arrow-right" size={15} />
            </a>
            <p className="site-drawer-note">Prototipe akademik. Data demo bersifat sintetis.</p>
          </div>
        </>
      ) : null}

      <main className="page site-main" id="main" tabIndex={-1} aria-label={title}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <Logo plate />
            <h2>RuangIDB</h2>
            <p>
              Ruang untuk mencari, mengajukan, dan memantau reservasi ruangan kampus Institut
              Desain dan Bisnis Bali.
            </p>
            <p className="site-footer-note">
              Prototipe akademik. Data pada demo ini bersifat sintetis.
            </p>
          </div>

          <nav className="site-footer-nav" aria-label="Navigasi footer">
            <h3>Navigasi</h3>
            {nav.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="site-footer-institution">
            <h3>Institut Desain dan Bisnis Bali</h3>
            <p>Kampus desain dan bisnis di Bali.</p>
            <a href={OFFICIAL_SITE} target="_blank" rel="noreferrer">
              Kunjungi website resmi
              <Icon name="arrow-right" size={15} />
            </a>
          </div>
        </div>
        <div className="site-footer-bottom">
          <span>© 2026 RuangIDB · Prototipe akademik</span>
          <span>Institut Desain dan Bisnis Bali</span>
        </div>
      </footer>
    </div>
  )
}
