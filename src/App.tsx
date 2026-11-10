import { useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Icon } from './components/Icon'
import { Logo, ToastProvider } from './components/ui'
import { StoreProvider, useStore } from './lib/store'
import { Login } from './pages/Login'
import { StudentDashboard } from './pages/student/Dashboard'
import { RoomList } from './pages/student/RoomList'
import { RoomDetail } from './pages/student/RoomDetail'
import { Reserve } from './pages/student/Reserve'
import { MyReservations } from './pages/student/MyReservations'
import { ReservationDetail } from './pages/student/ReservationDetail'
import { ReservationLetter } from './pages/student/ReservationLetter'
import { Profile } from './pages/student/Profile'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminRequests } from './pages/admin/Requests'
import { AdminRequestDetail } from './pages/admin/RequestDetail'
import { AdminRooms } from './pages/admin/Rooms'
import { AdminActivity } from './pages/admin/Activity'
import { AdminSettings } from './pages/admin/Settings'

function titleFor(pathname: string, variant: 'student' | 'admin'): string {
  if (variant === 'student') {
    if (pathname === '/app') return 'Beranda'
    if (pathname.startsWith('/app/ruang/')) return 'Detail ruang'
    if (pathname === '/app/ruang') return 'Daftar ruang'
    if (pathname === '/app/reservasi/baru') return 'Ajukan reservasi'
    if (pathname.endsWith('/surat')) return 'Surat peminjaman'
    if (pathname.startsWith('/app/reservasi/')) return 'Detail pengajuan'
    if (pathname === '/app/reservasi') return 'Reservasi saya'
    if (pathname === '/app/profil') return 'Profil'
    return 'RuangIDB'
  }
  if (pathname === '/admin') return 'Dashboard admin'
  if (pathname.startsWith('/admin/permohonan/')) return 'Detail permohonan'
  if (pathname === '/admin/permohonan') return 'Kelola permohonan'
  if (pathname === '/admin/ruang') return 'Kelola ruang'
  if (pathname === '/admin/pengaturan') return 'Pengaturan kampus'
  if (pathname === '/admin/aktivitas') return 'Log aktivitas'
  return 'RuangIDB'
}

function Forbidden({ role }: { role: 'student' | 'admin' }) {
  const { currentUser } = useStore()
  const home = currentUser?.role === 'admin' ? '/admin' : '/app'
  return (
    <div className="standalone">
      <Logo />
      <div className="standalone-card">
        <span className="standalone-icon">
          <Icon name="shield" size={24} />
        </span>
        <h1>Halaman ini bukan untuk peranmu</h1>
        <p>
          {role === 'admin'
            ? 'Area admin hanya dapat diakses admin kampus. Kamu masuk sebagai mahasiswa.'
            : 'Area mahasiswa dipakai untuk mengajukan reservasi. Akun admin memakai panel admin.'}
        </p>
        <a href={home} className="btn btn-primary">
          Ke halaman utama
        </a>
      </div>
    </div>
  )
}

function RequireRole({ role }: { role: 'student' | 'admin' }) {
  const { currentUser } = useStore()
  const location = useLocation()

  if (!currentUser) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
  if (currentUser.role !== role) {
    return <Forbidden role={role} />
  }
  return <Outlet />
}

function StudentLayout() {
  const location = useLocation()
  return (
    <AppShell variant="student" title={titleFor(location.pathname, 'student')}>
      <Outlet />
    </AppShell>
  )
}

function AdminLayout() {
  const location = useLocation()
  return (
    <AppShell variant="admin" title={titleFor(location.pathname, 'admin')}>
      <Outlet />
    </AppShell>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

function NotFound() {
  const { currentUser } = useStore()
  return (
    <div className="standalone">
      <Logo />
      <div className="standalone-card">
        <span className="standalone-icon">
          <Icon name="door" size={24} />
        </span>
        <h1>Halaman tidak ditemukan</h1>
        <p>Tautan mungkin sudah berubah. Kembali ke halaman utama untuk melanjutkan.</p>
        <a href={currentUser?.role === 'admin' ? '/admin' : '/app'} className="btn btn-primary">
          Kembali ke beranda
        </a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<RequireRole role="student" />}>
          <Route path="/app" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="ruang" element={<RoomList />} />
            <Route path="ruang/:id" element={<RoomDetail />} />
            <Route path="reservasi" element={<MyReservations />} />
            <Route path="reservasi/baru" element={<Reserve />} />
            <Route path="reservasi/:id" element={<ReservationDetail />} />
            <Route path="reservasi/:id/surat" element={<ReservationLetter />} />
            <Route path="profil" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<RequireRole role="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="permohonan" element={<AdminRequests />} />
            <Route path="permohonan/:id" element={<AdminRequestDetail />} />
            <Route path="ruang" element={<AdminRooms />} />
            <Route path="pengaturan" element={<AdminSettings />} />
            <Route path="aktivitas" element={<AdminActivity />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export function Root() {
  return (
    <StoreProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StoreProvider>
  )
}
