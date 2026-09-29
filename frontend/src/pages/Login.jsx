import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, Eye, EyeOff, ShieldCheck, FileText } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/contratos')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="exp-shell min-h-screen flex items-center justify-center px-4 py-10">
      {/* Fondo institucional: gradiente profundo con retícula sutil */}
      <div className="exp-backdrop" aria-hidden="true">
        <div className="exp-orb exp-orb-a" />
        <div className="exp-orb exp-orb-b" />
        <div className="exp-grid" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-0 exp-card">
        {/* ---- Panel de marca ---- */}
        <div className="hidden lg:flex flex-col justify-between p-10 exp-brand-panel">
          <div className="exp-logo-wrap">
            <img
              src="/logo-unefm-horizontal.png"
              alt="UNEFM"
              className="exp-logo h-16 w-auto"
            />
          </div>

          <div>
            <span className="exp-chip">
              <FileText size={14} /> Sistema de Expedientes
            </span>
            <h1 className="text-white text-3xl font-bold leading-tight mt-5">
              Expedientes
            </h1>
            <p className="text-unefm-200/90 text-sm mt-3 leading-relaxed">
              Plataforma institucional de gestión documental
            </p>
          </div>

          <p className="text-unefm-300/50 text-xs">
            Universidad Nacional Experimental «Francisco de Miranda»
          </p>
        </div>

        {/* ---- Formulario ---- */}
        <div className="p-8 sm:p-10 bg-white exp-form-panel">
          {/* Logo compacto en movil: pastilla oscura para que el logo
              blanco se lea sobre el panel blanco del formulario. */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <div className="exp-logo-pill mb-4">
              <img
                src="/logo-unefm-horizontal.png"
                alt="UNEFM"
                className="exp-logo h-9 w-auto"
              />
            </div>
            <p className="text-slate-500 text-sm">Sistema de Expedientes</p>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-danger-50 border border-danger-500/25 text-danger-700 text-sm flex items-start gap-2.5"
            >
              <ShieldCheck size={17} className="shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="usuario">
                Usuario
              </label>
              <input
                id="usuario"
                type="text"
                className="input"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label" htmlFor="contra">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="contra"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="exp-eye"
                  tabIndex={-1}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="exp-submit w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <span className="exp-spinner" />
                  Iniciando sesión...
                </span>
              ) : (
                <span className="flex items-center gap-2.5">
                  <LogIn size={18} />
                  Iniciar Sesión
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-8">
            Acceso restringido a personal autorizado
          </p>
        </div>
      </div>
    </div>
  )
}
