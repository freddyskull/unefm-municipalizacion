import { useState } from 'react'
import api from '../services/api'
import { Search, AlertCircle, Loader2 } from 'lucide-react'

const TIPOS_PERSONAL = [
  { value: '01', label: 'Docente e Investigación' },
  { value: '02', label: 'Administrativo y Técnico' },
  { value: '03', label: 'Obrero' },
]

export default function ConsultaPersonal({ onConsulta, disabled }) {
  const [cedula, setCedula] = useState('')
  const [tipo, setTipo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [personas, setPersonas] = useState(null)

  const handleConsultar = async (e) => {
    e.preventDefault()
    setError('')
    setPersonas(null)
    if (!cedula.trim()) {
      setError('La cédula es requerida')
      return
    }
    setLoading(true)
    try {
      const res = await api.get('/oracle/empleados', {
        params: { cedula: cedula.trim() },
      })
      let empleados = res.data.empleados || []
      if (tipo) {
        empleados = empleados.filter((e) => e.TIPOPER === tipo)
      }
      if (empleados.length === 0) {
        setError(
          tipo
            ? 'Cédula no encontrada para el tipo de personal seleccionado'
            : 'Cédula no encontrada en el sistema Oracle'
        )
        return
      }
      if (empleados.length === 1) {
        const p = empleados[0]
        onConsulta(p.CEDEMP, p.TIPOPER)
      } else {
        setPersonas(empleados)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al consultar empleados')
    } finally {
      setLoading(false)
    }
  }

  const handleSeleccionarPersona = (cedulaSeleccionada, tipoSeleccionado) => {
    onConsulta(cedulaSeleccionada, tipoSeleccionado)
  }

  return (
    <div className="card">
      <div className="card-body">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger-50 border border-danger-500/20 text-danger-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleConsultar} className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Consultar por cédula
            </h3>
            <p className="text-xs text-slate-500">
              Introduzca la cédula del trabajador. El tipo de personal es opcional; si hay varias
              personas con la misma cédula, podrá seleccionar cuál consultar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Cédula *
              </label>
              <input
                type="text"
                className="input w-40"
                placeholder="Ej: 12345678"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tipo de Personal
              </label>
              <select
                className="input w-56"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                {TIPOS_PERSONAL.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || disabled}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Search size={16} />
              )}
              Consultar
            </button>
          </div>
        </form>

        {personas && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Se encontraron múltiples personas con esa cédula. Seleccione cuál consultar:
            </p>
            <div className="space-y-2">
              {personas.map((p) => {
                const tipoLabel =
                  TIPOS_PERSONAL.find((t) => t.value === p.TIPOPER)?.label ||
                  `Tipo ${p.TIPOPER}`
                return (
                  <button
                    key={`${p.CEDEMP}-${p.TIPOPER}`}
                    onClick={() => handleSeleccionarPersona(p.CEDEMP, p.TIPOPER)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-white border border-amber-300 hover:border-unefm-500 hover:bg-unefm-50 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-slate-800">
                      {p.APEEMP}, {p.NOMEMP}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-unefm-100 text-unefm-700">
                      {tipoLabel}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}