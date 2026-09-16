import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import {
  FileBarChart,
  AlertCircle,
  Info,
  DollarSign,
  RotateCcw,
} from 'lucide-react'
import DataTable from '../components/DataTable'

export default function NominasPago() {
  const [nominas, setNominas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState(null)
  const [selectedMes, setSelectedMes] = useState('')
  const [meses, setMeses] = useState([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [neto, setNeto] = useState(0)
  const [asignaciones, setAsignaciones] = useState(0)
  const [deducciones, setDeducciones] = useState(0)
  const [trabajador, setTrabajador] = useState(null)
  const [search, setSearch] = useState('')
  const [cedula, setCedula] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortDesc, setSortDesc] = useState(false)
  const pageSize = 50

  const columns = [
    {
      id: 'CODCON',
      accessorKey: 'CODCON',
      header: 'Cód. Concepto',
      sortable: true,
      size: 1.2,
      cell: (info) => <span className="font-mono text-unefm-700">{info.getValue()}</span>,
    },
    { id: 'DESCORTA', accessorKey: 'DESCORTA', header: 'Descripción', sortable: true, size: 2.6 },
    {
      id: 'CODTIPCON',
      accessorKey: 'CODTIPCON',
      header: 'Tipo',
      sortable: true,
      size: 1,
      cell: (info) =>
        info.getValue() === '1' ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success-50 text-success-700">
            Asignación
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-danger-50 text-danger-700">
            Deducción
          </span>
        ),
    },
    {
      id: 'MONTO',
      accessorKey: 'MONTO',
      header: 'Monto (Bs.)',
      sortable: true,
      align: 'right',
      size: 1.4,
      cell: (info) => {
        const row = info.row.original
        return (
          <span className={row.CODTIPCON === '1' ? 'text-success-700' : 'text-danger-700'}>
            {row.CODTIPCON === '1' ? '+' : '-'}
            {parseFloat(row.MONTO).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </span>
        )
      },
    },
    {
      id: 'CUOTA',
      accessorKey: 'CUOTA',
      header: 'Cuota',
      sortable: true,
      align: 'right',
      size: 1.2,
      cell: (info) =>
        info.getValue()
          ? parseFloat(info.getValue()).toLocaleString('es-VE', { minimumFractionDigits: 2 })
          : '-',
    },
  ]

  useEffect(() => {
    loadMeses()
  }, [])

  useEffect(() => {
    if (selectedMes && cedula) {
      loadNominas(0, '', '', false, cedula)
      setSearch('')
      setSortKey('')
      setSortDesc(false)
    } else {
      setNominas([])
      setTotal(0)
      setNeto(0)
      setAsignaciones(0)
      setDeducciones(0)
      setTrabajador(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMes, cedula])

  const loadMeses = async () => {
    try {
      const res = await api.get('/oracle/meses')
      setMeses(res.data.meses || [])
      setStatus('connected')
    } catch (err) {
      if (err.response?.status === 503) {
        setStatus('disconnected')
      }
    }
  }

  const loadNominas = useCallback(
    async (pageNum, q, sKey, sDesc, ced) => {
      if (!selectedMes || !ced) return
      const nextPage = Math.max(pageNum, 0)
      setPage(nextPage)
      setLoading(true)
      setError('')
      try {
        const params = {
          mes: selectedMes,
          limit: pageSize,
          offset: nextPage * pageSize,
          search: q || undefined,
          orderBy: sKey || undefined,
          order: sKey ? (sDesc ? 'desc' : 'asc') : undefined,
          cedula: ced,
        }
        const res = await api.get('/oracle/nominas-pago', { params })
        setNominas(res.data.nominas || [])
        setTotal(res.data.total || 0)
        setNeto(res.data.neto || 0)
        setAsignaciones(res.data.asignaciones || 0)
        setDeducciones(res.data.deducciones || 0)
        if (res.data.nominas?.length > 0 && res.data.nominas[0].NOMEMP) {
          setTrabajador(res.data.nominas[0])
        } else {
          setTrabajador(null)
        }
      } catch (err) {
        if (err.response?.status !== 503) {
          setError(err.response?.data?.error || 'Error al cargar nóminas de pago')
        }
      } finally {
        setLoading(false)
      }
    },
    [selectedMes]
  )

  const handleSearch = (q) => {
    setSearch(q)
    setPage(0)
    loadNominas(0, q, sortKey, sortDesc, cedula)
  }

  const handleSort = (key, desc) => {
    setSortKey(key)
    setSortDesc(desc)
    setPage(0)
    loadNominas(0, search, key, desc, cedula)
  }

  const handlePageChange = (p) => {
    loadNominas(p, search, sortKey, sortDesc, cedula)
  }

  const fmt = (n) =>
    Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const nombreTrabajador = trabajador
    ? `${trabajador.APEEMP || ''} ${trabajador.NOMEMP || ''}`.replace(/\s+/g, ' ').trim()
    : ''

  const showData = cedula && selectedMes
  const mesLabel = meses.find((m) => m.MES === selectedMes)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
          <FileBarChart size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Nóminas de Pago</h2>
          <p className="text-sm text-slate-500">Detalle de asignaciones y deducciones por nómina</p>
        </div>
      </div>

      {status === 'disconnected' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
          <Info size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Base de datos Oracle no conectada</p>
            <p className="mt-1 text-amber-700">
              Se requiere acceso a <code>NOMINA</code> para consultar las nóminas de pago.
            </p>
          </div>
        </div>
      )}

      {/* Selector de período y cédula */}
      {status === 'connected' && (
        <div className="card">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Seleccionar período
                </label>
                <select
                  className="input sm:w-64"
                  value={selectedMes}
                  onChange={(e) => setSelectedMes(e.target.value)}
                >
                  <option value="">Todos los períodos...</option>
                  {meses.map((m, i) => (
                    <option key={i} value={m.MES}>{m.DMES} {m.ANO}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Cédula del trabajador
                </label>
                <input
                  type="text"
                  className="input sm:w-52"
                  placeholder="Ej: 12345678"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value.trim())}
                />
              </div>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => { setSelectedMes(''); setCedula('') }}
              >
                <RotateCcw size={14} />
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-500/20 text-danger-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {/* Resumen del trabajador */}
      {showData && (
        <>
          {trabajador && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="card p-5 col-span-1 sm:col-span-2">
                <p className="text-xs text-slate-500 font-medium">Trabajador</p>
                <p className="text-lg font-bold text-slate-900">
                  {nombreTrabajador || `Cédula ${cedula}`}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Período: <strong>{mesLabel?.DMES} {mesLabel?.ANO}</strong> · Cédula <strong>{cedula}</strong>
                </p>
              </div>
              <div className="card p-5">
                <p className="text-xs text-slate-500 font-medium">Asignaciones</p>
                <p className="text-lg font-bold text-success-600">+{fmt(asignaciones)} Bs.</p>
              </div>
              <div className="card p-5">
                <p className="text-xs text-slate-500 font-medium">Deducciones</p>
                <p className="text-lg font-bold text-danger-600">-{fmt(deducciones)} Bs.</p>
              </div>
            </div>
          )}

          {/* Neto a Cobrar */}
          {!loading && neto !== 0 && (
            <div className="rounded-2xl bg-unefm-600 text-white p-5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <DollarSign size={26} />
                <div>
                  <p className="text-xs uppercase tracking-wider text-unefm-200 font-medium">
                    Neto a Cobrar
                  </p>
                  <p className="text-2xl font-bold">
                    {fmt(neto)} Bs.
                  </p>
                </div>
              </div>
              <p className="hidden sm:block text-sm text-unefm-200 pr-2">
                {total} conceptos · {nombreTrabajador}
              </p>
            </div>
          )}

          {/* Tabla de detalle */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Detalle de Nómina de Pago</h3>
            </div>
            <DataTable
              columns={columns}
              data={nominas}
              loading={loading}
              total={total}
              serverPagination
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              search={search}
              onSearch={handleSearch}
              serverSort
              onSort={handleSort}
              sortKey={sortKey}
              sortDesc={sortDesc}
              getRowId={(row, i) => `p-${i}`}
              emptyMessage="No se encontraron nóminas de pago para esta cédula en el período seleccionado."
              emptyIcon={FileBarChart}
            />
          </div>
        </>
      )}

      {/* Estado vacío — solo si no se ha consultado aún */}
      {!showData && status === 'connected' && !loading && (
        <div className="card">
          <div className="card-body py-16 flex flex-col items-center text-center text-slate-400">
            <FileBarChart size={48} strokeWidth={1.2} />
            <p className="mt-4 text-sm font-medium text-slate-500">
              Seleccione un período e introduzca la cédula del trabajador
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Los datos de nómina de pago se mostrarán aquí
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
