import { useEffect, useState } from 'react'
import api from '../services/api'
import {
  Database,
  Table2,
  Server,
  Activity,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/reportes/stats')
        setStats(response.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Error al obtener estadísticas de la base de datos')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <Loader2 className="animate-spin mr-2" size={20} />
        Cargando estadísticas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No se pudo conectar</h3>
          <p className="text-slate-500 text-sm">{error}</p>
          <button
            className="btn-primary mt-6"
            onClick={() => window.location.reload()}
          >
            Reintentar conexión
          </button>
        </div>
      </div>
    )
  }

  const totalRows = stats.tables.reduce((sum, t) => sum + t.rows, 0)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-unefm-100 text-unefm-600 flex items-center justify-center">
            <Database size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Base de Datos</p>
            <p className="text-lg font-bold text-slate-900">Municipalización</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-50 text-success-500 flex items-center justify-center">
            <Table2 size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tablas</p>
            <p className="text-lg font-bold text-slate-900">{stats.tables.length}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
            <Server size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Registros Totales</p>
            <p className="text-lg font-bold text-slate-900">
              {totalRows.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-unefm-50 text-unefm-600 flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Estado</p>
            <p className="text-lg font-bold text-success-500">Conectado</p>
          </div>
        </div>
      </div>

      {/* Tablas de la BD */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Tablas de la Base de Datos</h2>
          <button
            onClick={() => navigate('/datos')}
            className="flex items-center gap-1 text-sm text-unefm-600 hover:text-unefm-700 font-medium"
          >
            Ver todas
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left font-semibold text-slate-700 px-6 py-3">Tabla</th>
                  <th className="text-right font-semibold text-slate-700 px-6 py-3">Registros</th>
                  <th className="text-right font-semibold text-slate-700 px-6 py-3">% del total</th>
                </tr>
              </thead>
              <tbody>
                {stats.tables.map((table) => {
                  const pct = totalRows > 0 ? ((table.rows / totalRows) * 100).toFixed(1) : 0
                  return (
                    <tr
                      key={table.name}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/datos?tabla=${table.name}`)}
                    >
                      <td className="px-6 py-3 font-medium text-unefm-700">{table.name}</td>
                      <td className="px-6 py-3 text-right text-slate-700">
                        {table.rows.toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-unefm-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Nota modo lectura */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-unefm-50 border border-unefm-200 text-sm text-unefm-800">
        <Database size={18} className="flex-shrink-0" />
        <p>
          <strong>Modo solo lectura:</strong> este sistema se conecta a la base de datos de
          municipalización únicamente para consultar información. No se realizan modificaciones
          sobre la base de datos existente.
        </p>
      </div>
    </div>
  )
}