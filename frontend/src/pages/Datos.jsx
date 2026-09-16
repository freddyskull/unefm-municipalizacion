import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { Table2, AlertCircle, Lock } from 'lucide-react'
import DataTable from '../components/DataTable'

export default function Datos() {
  const [searchParams] = useSearchParams()
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(searchParams.get('tabla') || '')
  const [tableData, setTableData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortDesc, setSortDesc] = useState(false)

  const pageSize = 50

  useEffect(() => {
    const fetchTables = async () => {
      const response = await api.get('/municipalizacion')
      setTables(response.data.tables)
    }
    fetchTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      setLoading(true)
      setError('')
      api
        .get(`/municipalizacion/tabla/${selectedTable}`, {
          params: {
            limit: pageSize,
            offset: page * pageSize,
            search: search || undefined,
            orderBy: sortKey || undefined,
            order: sortKey ? (sortDesc ? 'desc' : 'asc') : undefined,
          },
        })
        .then((response) => setTableData(response.data))
        .catch((err) => setError(err.response?.data?.error || 'Error al cargar datos'))
        .finally(() => setLoading(false))
    }
  }, [selectedTable, page, search, sortKey, sortDesc])

  const columns = useMemo(() => {
    const firstRow = tableData?.data?.[0]
    if (!firstRow) return []
    return Object.keys(firstRow).map((k) => ({
      id: k,
      accessorKey: k,
      header: k,
      sortable: true,
      size: 1,
      cell: (info) => {
        const v = info.getValue()
        return v === null || v === undefined ? (
          <span className="text-slate-300 italic">NULL</span>
        ) : (
          String(v)
        )
      },
    }))
  }, [tableData])

  const handleSearch = (value) => {
    setSearch(value)
    setPage(0)
  }

  const handleSort = (key, desc) => {
    setSortKey(key)
    setSortDesc(desc)
    setPage(0)
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Header con info de solo lectura */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-success-50 border border-success-100 text-sm text-success-700">
        <Lock size={18} className="flex-shrink-0" />
        <p>
          <strong>Base de datos en modo consulta.</strong> Puede explorar las tablas de la base de
          datos "municipalizacion" sin riesgo de modificar información.
        </p>
      </div>

      {/* Selector de tabla */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Seleccionar tabla
          </label>
          <select
            className="input sm:w-64"
            value={selectedTable}
            onChange={(e) => {
              setSelectedTable(e.target.value)
              setPage(0)
              setSearch('')
              setSortKey('')
              setSortDesc(false)
            }}
          >
            <option value="">Seleccione una tabla...</option>
            {tables.map((t) => (
              <option key={t.table_name} value={t.table_name}>
                {t.table_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-danger-50 border border-danger-500/20 text-danger-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card p-8 flex items-center justify-center text-slate-500">
          <span>Cargando datos...</span>
        </div>
      )}

      {/* Data */}
      {!loading && tableData && (
        <div className="card">
          <div className="card-header flex items-center">
            <Table2 size={16} className="text-unefm-600 mr-2" />
            <h2 className="text-base font-semibold text-slate-800">
              Tabla: <span className="text-unefm-700">{selectedTable}</span>
            </h2>
          </div>
          <DataTable
            columns={columns}
            data={tableData.data}
            loading={loading}
            total={tableData.total}
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
            getRowId={(row, i) => `datos-${i}`}
            emptyMessage="No se encontraron resultados para la búsqueda."
            emptyIcon={Table2}
          />
        </div>
      )}
    </div>
  )
}