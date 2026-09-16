import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import {
  Wallet,
  AlertCircle,
  Info,
  TrendingUp,
  FileText,
  User,
  CalendarRange,
  RotateCcw,
} from 'lucide-react'
import ConsultaPersonal from '../components/ConsultaPersonal'
import DataTable from '../components/DataTable'

export default function NominasEfectivas() {
  const [nominas, setNominas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [oracleStatus, setOracleStatus] = useState(null)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState(null)
  const [persona, setPersona] = useState(null)
  const [search, setSearch] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortDesc, setSortDesc] = useState(false)
  const pageSize = 50

  const loadNominas = useCallback(
    async (cedula, tipo, pageNum, q, fd, fh, sKey, sDesc) => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/oracle/nominas-efectivas', {
          params: {
            cedula,
            tipo,
            limit: pageSize,
            offset: pageNum * pageSize,
            search: q || undefined,
            fechaDesde: fd || undefined,
            fechaHasta: fh || undefined,
            orderBy: sKey || undefined,
            order: sKey ? (sDesc ? 'desc' : 'asc') : undefined,
          },
        })
        setNominas(res.data.nominas || [])
        setTotal(res.data.total || 0)
        setOracleStatus('connected')
      } catch (err) {
        if (err.response?.status === 503) {
          setOracleStatus('disconnected')
        } else {
          setError(err.response?.data?.error || 'Error al cargar nóminas')
        }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (selected) {
      loadNominas(selected.cedula, selected.tipo, page, search, fechaDesde, fechaHasta, sortKey, sortDesc)
    }
  }, [selected, page, search, fechaDesde, fechaHasta, sortKey, sortDesc, loadNominas])

  const handleConsulta = (cedula, tipo) => {
    setPage(0)
    setPersona({ cedula, tipo })
    setError('')
    setOracleStatus(null)
    setSearch('')
    setFechaDesde('')
    setFechaHasta('')
    setSortKey('')
    setSortDesc(false)
    setSelected({ cedula, tipo })
  }

  const handleSearch = (value) => {
    setSearch(value)
    setPage(0)
  }

  const handleSort = (key, desc) => {
    setSortKey(key)
    setSortDesc(desc)
    setPage(0)
  }

  const tipoLabel = {
    '01': 'Docente e Investigación',
    '02': 'Administrativo y Técnico',
    '03': 'Obrero',
  }

  const columns = [
    {
      id: 'CODNOM',
      accessorKey: 'CODNOM',
      header: 'Cod. Nómina',
      sortable: true,
      size: 1.5,
      minWidth: 110,
      cell: (info) => <span className="font-mono text-unefm-700">{info.getValue()}</span>,
    },
    {
      id: 'CUENTA',
      accessorKey: 'CUENTA',
      header: 'Cta Banco',
      sortable: true,
      size: 2,
      minWidth: 230,
      cell: (info) => (
        <span className="font-mono font-medium text-slate-800">
          {info.getValue()?.trim() || '-'}
        </span>
      ),
    },
    {
      id: 'BANCO',
      accessorKey: 'BANCO',
      header: 'Banco',
      sortable: true,
      size: 2,
      minWidth: 200,
    },
    {
      id: 'FECHANOMINA',
      accessorKey: 'FECHANOMINA',
      header: 'Fecha Nómina',
      sortable: true,
      size: 1.5,
      cell: (info) => info.getValue() || '-',
    },
    { id: 'DESNOM', accessorKey: 'DESNOM', header: 'Des. Nómina', sortable: true, size: 3, minWidth: 220 },
    { id: 'DESTIPNOM', accessorKey: 'DESTIPNOM', header: 'Tipo Nómina', sortable: true, size: 2, minWidth: 160 },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success-50 text-success-500 flex items-center justify-center">
          <Wallet size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Nóminas Efectivas</h2>
          <p className="text-sm text-slate-500">
            Nóminas procesadas y confirmadas (nomina.nomina)
          </p>
        </div>
      </div>

      <ConsultaPersonal onConsulta={handleConsulta} />

      {persona && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-unefm-50 border border-unefm-200 text-sm text-unefm-800">
          <User size={16} />
          <span>
            Consultando a: <strong>Cédula {persona.cedula}</strong>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-unefm-100 text-unefm-700 text-xs font-medium">
              {tipoLabel[persona.tipo] || `Tipo ${persona.tipo}`}
            </span>
          </span>
        </div>
      )}

      {persona && (
        <div className="card">
          <div className="card-body">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <CalendarRange size={18} className="text-unefm-600" />
                Rango de fechas
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Desde</label>
                <input
                  type="date"
                  className="input"
                  value={fechaDesde}
                  max={fechaHasta || undefined}
                  onChange={(e) => {
                    setFechaDesde(e.target.value)
                    setPage(0)
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hasta</label>
                <input
                  type="date"
                  className="input"
                  value={fechaHasta}
                  min={fechaDesde || undefined}
                  onChange={(e) => {
                    setFechaHasta(e.target.value)
                    setPage(0)
                  }}
                />
              </div>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => {
                  setFechaDesde('')
                  setFechaHasta('')
                  setPage(0)
                }}
              >
                <RotateCcw size={14} />
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {oracleStatus === 'disconnected' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
          <Info size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Base de datos Oracle no conectada</p>
            <p className="mt-1 text-amber-700">
              Se requiere acceso a <code>NOMINA</code> / <code>PERSONAL</code> para consultar las
              nóminas efectivas.
            </p>
          </div>
        </div>
      )}

      {error && oracleStatus !== 'disconnected' && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-500/20 text-danger-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-unefm-100 text-unefm-600 flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tipo Nómina</p>
            <p className="text-lg font-bold text-slate-900">
              {selected && !loading ? `${total.toLocaleString()} tipos` : '—'}
            </p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-50 text-success-500 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Estado</p>
            <p className="text-lg font-bold text-success-500">Efectiva</p>
          </div>
        </div>
      </div>

      {/* Table */}
      {selected && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              Nóminas Confirmadas del Trabajador
            </h3>
          </div>
          <DataTable
            columns={columns}
            data={nominas}
            loading={loading}
            total={total}
            serverPagination
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            search={search}
            onSearch={handleSearch}
            serverSort
            onSort={handleSort}
            sortKey={sortKey}
            sortDesc={sortDesc}
            getRowId={(row, i) => `n-${i}`}
            emptyMessage="No se encontraron nóminas efectivas para esta cédula."
            emptyIcon={Wallet}
          />
        </div>
      )}
    </div>
  )
}