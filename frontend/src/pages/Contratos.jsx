import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import {
  FileText,
  Calendar,
  Building2,
  AlertCircle,
  Info,
  User,
} from 'lucide-react'
import ConsultaPersonal from '../components/ConsultaPersonal'
import DataTable from '../components/DataTable'

export default function Contratos() {
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [oracleStatus, setOracleStatus] = useState(null)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState(null)
  const [persona, setPersona] = useState(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortDesc, setSortDesc] = useState(false)
  const pageSize = 50

  const loadContratos = useCallback(
    async (cedula, tipo, pageNum, q, sKey, sDesc) => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/oracle/contratos', {
          params: {
            cedula,
            tipo,
            limit: pageSize,
            offset: pageNum * pageSize,
            search: q || undefined,
            orderBy: sKey || undefined,
            order: sKey ? (sDesc ? 'desc' : 'asc') : undefined,
          },
        })
        setContratos(res.data.contratos || [])
        setTotal(res.data.total || 0)
        setOracleStatus('connected')
      } catch (err) {
        if (err.response?.status === 503) {
          setOracleStatus('disconnected')
          setError(
            'La base de datos Oracle no está disponible. Se requiere Oracle Instant Client para conectarse al esquema NOMINA/PERSONAL.'
          )
        } else {
          setError(err.response?.data?.error || 'Error al cargar contratos')
        }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (selected) {
      loadContratos(selected.cedula, selected.tipo, page, search, sortKey, sortDesc)
    }
  }, [selected, page, search, sortKey, sortDesc, loadContratos])

  const handleConsulta = (cedula, tipo) => {
    setPage(0)
    setPersona({ cedula, tipo })
    setError('')
    setOracleStatus(null)
    setSearch('')
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

  const formatDate = (date) => {
    if (!date) return '-'
    return String(date)
  }

  const columns = [
    { id: 'NOTIFICACION', accessorKey: 'NOTIFICACION', header: 'Notif. Oficial', sortable: true, size: 1.6, cell: (info) => <span className="font-mono text-unefm-700">{info.getValue() || '-'}</span> },
    { id: 'MOVIMIENTO', accessorKey: 'MOVIMIENTO', header: 'Tip. Mov. Personal', sortable: true, size: 2 },
    {
      id: 'FECHAINI',
      accessorKey: 'FECHAINI',
      header: 'Fec. Inicio',
      sortable: true,
      size: 1.5,
      cell: (info) => formatDate(info.getValue()),
    },
    {
      id: 'FECHAFIN',
      accessorKey: 'FECHAFIN',
      header: 'Fec. Fin',
      sortable: true,
      size: 1.5,
      cell: (info) => formatDate(info.getValue()),
    },
    {
      id: 'CARGO',
      accessorKey: 'CARGO',
      header: 'Cargo',
      sortable: true,
      size: 2.4,
      minWidth: 180,
      cell: (info) => {
        const val = info.getValue()
        if (!val) return '-'
        return (
          <span
            className="truncate max-w-[240px] block text-slate-800 font-medium cursor-help"
            title={val}
          >
            {val}
          </span>
        )
      },
    },
    { id: 'DEDICACION', accessorKey: 'DEDICACION', header: 'Dedicación', sortable: true, size: 1.6 },
    { id: 'HORAS', accessorKey: 'HORAS', header: 'Horas', sortable: true, size: 1, align: 'right' },
    { id: 'ESCALA', accessorKey: 'ESCALA', header: 'Escala', sortable: true, size: 1 },
    { id: 'NIVEL', accessorKey: 'NIVEL', header: 'Nivel', sortable: true, size: 1 },
    { id: 'CONDICION', accessorKey: 'CONDICION', header: 'Condición', sortable: true, size: 1.6 },
    { id: 'ESTADO', accessorKey: 'ESTADO', header: 'Estado', sortable: true, size: 1.6 },
    { id: 'DEPENDENCIA', accessorKey: 'DEPENDENCIA', header: 'Dependencia', sortable: true, size: 2 },
    { id: 'MUNICIPIO', accessorKey: 'MUNICIPIO', header: 'Municipio', sortable: true, size: 1.8 },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-unefm-100 text-unefm-600 flex items-center justify-center">
          <FileText size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Contratos</h2>
          <p className="text-sm text-slate-500">
            Historial de contratos del trabajador (personal.movimiento)
          </p>
        </div>
      </div>

      <ConsultaPersonal onConsulta={handleConsulta} />

      {/* Persona seleccionada */}
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

      {/* Oracle notice */}
      {oracleStatus === 'disconnected' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
          <Info size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Base de datos Oracle no conectada</p>
            <p className="mt-1 text-amber-700">
              Esta función requiere acceso a la base Oracle <code>NOMINA</code> /{' '}
              <code>PERSONAL</code> (host: 150.187.4.18). Se necesita instalar Oracle Instant
              Client en el servidor backend.
            </p>
          </div>
        </div>
      )}

      {error && oracleStatus !== 'disconnected' && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-500/20 text-danger-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Tabla de contratos */}
      {selected && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-unefm-600" />
              <h3 className="font-semibold text-slate-800">Contratos del Trabajador</h3>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={contratos}
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
            getRowId={(row, i) => `c-${i}`}
            emptyMessage="No se encontraron contratos para esta cédula."
            emptyIcon={Building2}
          />
        </div>
      )}
    </div>
  )
}