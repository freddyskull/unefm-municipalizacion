import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'
import {
  CalendarCheck,
  AlertCircle,
  User,
} from 'lucide-react'
import ConsultaPersonal from '../components/ConsultaPersonal'
import DataTable from '../components/DataTable'
import OracleStatusBanner from '../components/OracleStatusBanner'
import useOracleHealth from '../hooks/useOracleHealth'
import { usePersona } from '../context/PersonaContext'

const TIPO_LABEL = {
  '01': 'Docente e Investigación',
  '02': 'Administrativo y Técnico',
  '03': 'Obrero',
}

export default function Permisos() {
  const [permisos, setPermisos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { status: oracleStatus, error: healthError, check } = useOracleHealth()
  const { persona: personaCtx } = usePersona()
  const autoInitRef = useRef(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState(null)
  const [persona, setPersona] = useState(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortDesc, setSortDesc] = useState(false)
  const pageSize = 50

  const loadPermisos = useCallback(
    async (cedula, tipo, pageNum, q, sKey, sDesc) => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/oracle/permisos', {
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
        setPermisos(res.data.permisos || [])
        setTotal(res.data.total || 0)
      } catch (err) {
        if (err.response?.status === 503) {
          setError(
            'La base de datos Oracle no está disponible. Se requiere Oracle Instant Client para conectarse al esquema NOMINA/PERSONAL.'
          )
        } else {
          setError(err.response?.data?.error || 'Error al cargar permisos')
        }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (selected) {
      loadPermisos(selected.cedula, selected.tipo, page, search, sortKey, sortDesc)
    }
  }, [selected, page, search, sortKey, sortDesc, loadPermisos])

  const handleConsulta = (cedula, tipo) => {
    setPage(0)
    setPersona({ cedula, tipo })
    setError('')
    setSearch('')
    setSortKey('')
    setSortDesc(false)
    setSelected({ cedula, tipo })
  }

  useEffect(() => {
    if (autoInitRef.current) return
    autoInitRef.current = true
    if (!selected && personaCtx?.cedula && personaCtx?.tipo) {
      handleConsulta(personaCtx.cedula, personaCtx.tipo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (value) => {
    setSearch(value)
    setPage(0)
  }

  const handleSort = (key, desc) => {
    setSortKey(key)
    setSortDesc(desc)
    setPage(0)
  }

  const handleReconnect = async () => {
    const ok = await check()
    if (ok && selected) {
      loadPermisos(selected.cedula, selected.tipo, page, search, sortKey, sortDesc)
    }
  }

  const columns = [
    {
      id: 'TIPO_PERSONAL',
      accessorKey: 'TIPO_PERSONAL',
      header: 'Tipo Personal',
      sortable: true,
      size: 1.6,
      cell: (info) => {
        const val = info.getValue()
        return (
          <span className="px-2 py-0.5 rounded-full bg-unefm-100 text-unefm-700 text-xs font-medium">
            {TIPO_LABEL[val] || `Tipo ${val}`}
          </span>
        )
      },
    },
    { id: 'TIPO', accessorKey: 'TIPO', header: 'Tipo de Permiso', sortable: true, size: 2 },
    {
      id: 'DESDE',
      accessorKey: 'DESDE',
      header: 'Desde',
      sortable: true,
      size: 1.4,
      cell: (info) => info.getValue() || '-',
    },
    {
      id: 'HASTA',
      accessorKey: 'HASTA',
      header: 'Hasta',
      sortable: true,
      size: 1.4,
      cell: (info) => info.getValue() || '-',
    },
    {
      id: 'MOTIVO',
      accessorKey: 'MOTIVO',
      header: 'Motivo',
      sortable: true,
      size: 2.4,
      minWidth: 220,
      cell: (info) => {
        const val = info.getValue()
        if (!val) return '-'
        return (
          <span
            className="truncate max-w-[260px] block text-slate-800 font-medium cursor-help"
            title={val}
          >
            {val}
          </span>
        )
      },
    },
    {
      id: 'NUMFOLIO',
      accessorKey: 'NUMFOLIO',
      header: 'N° Folio',
      sortable: true,
      size: 1.4,
      cell: (info) => <span className="font-mono text-unefm-700">{info.getValue() || '-'}</span>,
    },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-unefm-100 text-unefm-600 flex items-center justify-center">
          <CalendarCheck size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Permisos y Reposos</h2>
          <p className="text-sm text-slate-500">
            Historial de permisos y reposos del trabajador (personal.permisos)
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
              {TIPO_LABEL[persona.tipo] || `Tipo ${persona.tipo}`}
            </span>
          </span>
        </div>
      )}

      <OracleStatusBanner status={oracleStatus} error={healthError} onRetry={handleReconnect} />

      {error && oracleStatus !== 'disconnected' && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-500/20 text-danger-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {selected && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck size={16} className="text-unefm-600" />
              <h3 className="font-semibold text-slate-800">Permisos y Reposos del Trabajador</h3>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={permisos}
            loading={loading}
            maxHeightOffset={430}
            detailTitle="Detalle del permiso/reposo"
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
            getRowId={(row, i) => `p-${i}`}
            emptyMessage="No se encontraron permisos ni reposos para esta cédula."
            emptyIcon={CalendarCheck}
          />
        </div>
      )}
    </div>
  )
}