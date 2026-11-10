import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Icon } from '../components/Icon'
import { Field, Logo } from '../components/ui'
import { DEMO_PASSWORD } from '../lib/store'

export function Login() {
  const store = useStore()
  const { currentUser } = store
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (currentUser) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/app'} replace />
  }

  const redirectNote = (location.state as { from?: string } | null)?.from
    ? 'Masuk untuk melanjutkan ke halaman yang kamu tuju.'
    : null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Isi email dan kata sandi terlebih dahulu.')
      return
    }
    setBusy(true)
    const result = store.login(email, password)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(result.user.role === 'admin' ? '/admin' : '/app', { replace: true })
  }

  const fillDemo = (kind: 'student' | 'admin') => {
    setEmail(kind === 'student' ? 'dhea@idb.ac.id' : 'admin@idb.ac.id')
    setPassword(DEMO_PASSWORD)
    setError(null)
  }

  return (
    <main className="login">
      <section className="login-brand" aria-label="Tentang RuangIDB">
        <div className="login-brand-inner">
          <Logo plate />
          <div className="login-copy">
            <h1>
              Ruang untuk
              <br />
              setiap gagasan.
            </h1>
            <p className="login-tagline">Cari Ruang. Atur Kegiatan. Semua Lebih Mudah.</p>
            <p className="login-desc">
              Platform reservasi ruangan kampus IDB Bali yang membantu mahasiswa dan organisasi
              kampus mengajukan peminjaman ruangan secara lebih mudah, teratur, dan transparan.
            </p>
          </div>
        </div>
      </section>

      <section className="login-form-wrap">
        <div className="login-form">
          <div className="login-form-head">
            <span className="login-form-mark">
              <Icon name="door" size={20} />
            </span>
            <div>
              <h2>Masuk ke RuangIDB</h2>
              <p>Gunakan akun kampus untuk mengajukan dan memantau reservasi.</p>
            </div>
          </div>

          {redirectNote ? (
            <p className="notice notice-info">
              <Icon name="info" size={16} />
              {redirectNote}
            </p>
          ) : null}

          <form onSubmit={submit} noValidate>
            <Field label="Email kampus" htmlFor="email" required>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="nama@idb.ac.id"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </Field>

            <Field label="Kata sandi" htmlFor="password" required>
              <div className="input-affix">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Kata sandi akun"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                />
                <button
                  type="button"
                  className="affix-btn"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
            </Field>

            {error ? (
              <p className="notice notice-error" id="login-error" role="alert">
                <Icon name="alert" size={16} />
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Memeriksa akun…' : 'Masuk'}
            </button>
          </form>

          <div className="demo-box">
            <div className="demo-head">
              <h3>Akun demo</h3>
              <span>Prototipe, data sintetis</span>
            </div>
            <div className="demo-actions">
              <button type="button" className="demo-account" onClick={() => fillDemo('student')}>
                <span className="demo-role">Mahasiswa</span>
                <strong>dhea@idb.ac.id</strong>
                <span>HMJ Desain Komunikasi Visual</span>
              </button>
              <button type="button" className="demo-account" onClick={() => fillDemo('admin')}>
                <span className="demo-role">Admin kampus</span>
                <strong>admin@idb.ac.id</strong>
                <span>Bagian Umum dan Fasilitas</span>
              </button>
            </div>
            <p className="demo-hint">
              Kata sandi demo: <code>{DEMO_PASSWORD}</code>. Klik salah satu akun untuk mengisi formulir.
            </p>
          </div>

          <p className="login-help">
            Belum bisa masuk? Gunakan akun demo di atas atau hubungi pengelola fasilitas
            kampus melalui kanal resmi IDB Bali.
          </p>
        </div>
      </section>
    </main>
  )
}