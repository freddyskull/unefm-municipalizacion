import { useEffect, useState } from 'react'
import api from '../services/api'
import {
  FileBarChart,
  Loader2,
  AlertCircle,
  TrendingUp,
  Database,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function Reportes() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [columns, setColumns] = useState([])
  const [selectedColumn, setSelectedColumn] = useState('')
  const [chartData, setChartData] = useState(null)
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get('/reportes/stats')
        setStats(response.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Error al obtener estadísticas')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  useEffect(() => {
    if (selectedTable && stats) {
      const table = stats.tables.find(t => t.name === selectedTable)
      if (table) {
        setSelectedColumn('')
        setColumns([])
        loadColumns(selectedTable)
      }
    }
  }, [selectedTable])

  const loadColumns = async (table) => {
    try {
      const response = await api.get(`/municipalizacion/tabla/${table}`, {
        params: { limit: 1 },
      })
      if (response.data.data.length > 0) {
        setColumns(Object.keys(response.data.data[0]))
      }
    } catch (err) {
      console.error('Error cargando columnas:', err)
    }
  }

  const loadChart = async () => {
    if (!selectedTable || !selectedColumn) return
    setChartLoading(true)
    setChartData(null)
    try {
      const response = await api.get(`/reportes/chart/${selectedTable}/${selectedColumn}`)
      const raw = response.data
      setChartData(
        raw.labels.map((label, i) => ({
          name: String(label ?? 'NULL'),
          total: raw.values[i],
        }))
      )
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar el gráfico')
      setTimeout(() => setError(''), 4000)
    } finally {
      setChartLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <Loader2 className="animate-spin mr-2" size={20} />
        Cargando reportes...
      </div>
    )
  }

  const totalRows = stats ? stats.tables.reduce((sum, t) => sum + t.rows, 0) : 0
  const topTables = stats
    ? [...stats.tables]
        .sort((a, b) => b.rows - a.rows)
        .slice(0, 5)
        .map((t) => ({ name: t.name, total: t.rows }))
    : []

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <FileBarChart size={22} className="text-unefm-600" />
        <h2 className="text-lg font-semibold text-slate-800">Reportes y Estadísticas</h2>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-500/20 text-danger-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-unefm-100 text-unefm-600 flex items-center justify-center">
            <Database size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tablas</p>
            <p className="text-lg font-bold text-slate-900">{stats.tables.length}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-50 text-success-500 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Registros Totales</p>
            <p className="text-lg font-bold text-slate-900">{totalRows.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-500 font-medium mb-3">Tablas más pobladas</p>
          <div className="space-y-2">
            {topTables.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 font-medium truncate">{t.name}</span>
                <span className="text-slate-500">{t.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tablas con más registros */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-base font-semibold text-slate-800">Registros por Tabla</h3>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topTables}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                }}
              />
              <Bar dataKey="total" fill="#3868f5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Generador de gráficos */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-base font-semibold text-slate-800">Análisis por Columna</h3>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Tabla</label>
              <select
                className="input"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                <option value="">Seleccione tabla...</option>
                {stats.tables.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Columna</label>
              <select
                className="input"
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
              >
                <option value="">Seleccione columna...</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                className="btn-primary w-full"
                onClick={loadChart}
                disabled={!selectedTable || !selectedColumn || chartLoading}
              >
                {chartLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <TrendingUp size={18} />
                )}
                Generar Gráfico
              </button>
            </div>
          </div>

          {chartData && (
            <div className="animate-fade-in">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    }}
                  />
                  <Bar dataKey="total" fill="#fa8214" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
