import { useMemo, useState, useEffect, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Inbox,
} from 'lucide-react'

function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export default function DataTable({
  columns: columnDefs,
  data = [],
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
  emptyIcon: EmptyIcon = Inbox,

  search = '',
  onSearch,

  serverSort = false,
  onSort,
  sortKey = '',
  sortDesc = false,

  page = 0,
  total = 0,
  pageSize = 50,
  onPageChange,
  serverPagination = false,

  virtualize = true,
  rowHeight = 44,
  maxHeight = 560,

  getRowId,
  footer = null,
  className = '',
}) {
  const columns = useMemo(() => {
    const defs = columnDefs?.length
      ? columnDefs
      : data.length > 0
        ? Object.keys(data[0]).map((k) => ({ id: k, header: k, accessorKey: k, sortable: true }))
        : []
    return defs.map((c) => ({ size: 1, enableSorting: Boolean(c.sortable), ...c }))
  }, [columnDefs, data])

  const isServer = serverPagination
  const isServerSort = serverSort
  const isServerSearch = Boolean(onSearch)

  const [localSearch, setLocalSearch] = useState(search)
  const debouncedSearch = useDebounced(localSearch, 300)
  const skipFirst = useRef(true)
  useEffect(() => {
    if (skipFirst.current) { skipFirst.current = false; return }
    if (isServerSearch && onSearch) onSearch(debouncedSearch)
  }, [debouncedSearch, isServerSearch])

  useEffect(() => {
    if (!isServerSearch) setLocalFilter(localSearch)
  }, [localSearch, isServerSearch])

  const [localSorting, setLocalSorting] = useState([])
  const [localPagination, setLocalPagination] = useState({ pageIndex: 0, pageSize })
  const [localFilter, setLocalFilter] = useState('')

  useEffect(() => {
    if (isServer) setLocalPagination((p) => ({ ...p, pageIndex: page }))
  }, [page, isServer])

  const effectivePageIndex = isServer ? page : localPagination.pageIndex
  const effectiveSorting = isServer
    ? (sortKey ? [{ id: sortKey, desc: sortDesc }] : [])
    : localSorting

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(isServer
      ? { manualPagination: true, pageCount: Math.max(1, Math.ceil(total / pageSize)) }
      : { getPaginationRowModel: getPaginationRowModel() }),
    ...(isServerSort
      ? { manualSorting: true }
      : { getSortedRowModel: getSortedRowModel() }),
    ...(isServerSearch
      ? { manualFiltering: true }
      : { getFilteredRowModel: getFilteredRowModel() }),
    state: {
      pagination: { pageIndex: effectivePageIndex, pageSize },
      sorting: effectiveSorting,
      globalFilter: isServerSearch ? search : localFilter,
    },
    onSortingChange: isServerSort ? undefined : setLocalSorting,
    onPaginationChange: isServer ? undefined : (u) => {
      setLocalPagination((prev) => (typeof u === 'function' ? u(prev) : u))
    },
    onGlobalFilterChange: isServerSearch ? undefined : setLocalFilter,
    getRowId,
    defaultColumn: { size: 1 },
  })

  const rows = table.getRowModel().rows
  const cols = table.getVisibleLeafColumns()

  const colPx = (c) => {
    if (typeof c.columnDef.minWidth === 'number' && c.columnDef.minWidth > 0) {
      return c.columnDef.minWidth
    }
    const w = Number(c.getSize())
    const weight = Number.isFinite(w) && w > 0 ? w : 1
    return Math.min(300, Math.max(80, Math.round(weight * 90)))
  }
  const totalWidth = cols.reduce((s, c) => s + colPx(c), 0)
  const gridTemplate = cols.map((c) => `minmax(${colPx(c)}px, 1fr)`).join(' ')

  const useVirt = virtualize && rows.length > 30
  const scrollRef = useRef(null)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  })

  const resetSearch = (val) => {
    setLocalSearch(val)
    if (isServer && onPageChange) onPageChange(0)
  }

  const headerGroups = table.getHeaderGroups()
  const displayTotal = isServer ? total : table.getFilteredRowModel().rows.length
  const pageStart = effectivePageIndex * pageSize
  const pageEnd = Math.min(pageStart + rows.length, displayTotal || rows.length)
  const pageCount = isServer ? Math.max(1, Math.ceil(total / pageSize)) : table.getPageCount()

  const cellAlign = (col) =>
    col.align === 'right'
      ? 'justify-end text-right'
      : col.align === 'center'
        ? 'justify-center text-center'
        : ''

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50/60">
        <span className="text-sm text-slate-500">
          {displayTotal > 0
            ? `${pageStart + 1}–${pageEnd} de ${displayTotal.toLocaleString()}`
            : 'Sin registros'}
        </span>
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar..."
            value={localSearch}
            onChange={(e) => resetSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table (single scroll container: horizontal + vertical) */}
      <div
        ref={scrollRef}
        style={{
          height: useVirt ? Math.min(maxHeight, rows.length * rowHeight + rowHeight) : 'auto',
          overflow: 'auto',
        }}
        className="relative"
      >
        <div style={{ minWidth: totalWidth }}>
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
              <Loader2 className="animate-spin text-unefm-600" size={24} />
            </div>
          )}

          {!loading && rows.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <EmptyIcon size={40} className="mb-3 text-slate-300" />
              <p className="text-sm">{emptyMessage}</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div
                className="grid bg-slate-50 border-b border-slate-200 sticky z-10"
                style={{ gridTemplateColumns: gridTemplate, top: 0 }}
              >
                {headerGroups[0]?.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <div
                      key={header.id}
                      className={`px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider select-none ${cellAlign(header.column.columnDef)} ${canSort ? 'cursor-pointer hover:text-slate-900' : ''}`}
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => {
                        if (!canSort) return
                        if (isServerSort) {
                          const nextDesc = header.column.id === sortKey ? !sortDesc : true
                          onSort?.(header.column.id, nextDesc)
                        } else {
                          header.column.toggleSorting()
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-slate-400">
                            {sorted === 'asc' ? <ArrowUp size={14} /> : sorted === 'desc' ? <ArrowDown size={14} /> : <ArrowUpDown size={14} />}
                          </span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Body */}
              {useVirt ? (
                <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                  {virtualizer.getVirtualItems().map((vr) => {
                    const row = rows[vr.index]
                    return (
                      <div
                        key={row.id}
                        className="grid border-b border-slate-100 hover:bg-slate-50/60 transition-colors text-sm"
                        style={{
                          gridTemplateColumns: gridTemplate,
                          position: 'absolute',
                          top: vr.start,
                          height: vr.size,
                          left: 0,
                          width: '100%',
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <div key={cell.id} className={`px-4 flex items-center whitespace-nowrap text-slate-700 min-w-0 ${cellAlign(cell.column.columnDef)}`}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ) : (
                rows.map((row) => (
                  <div
                    key={row.id}
                    className="grid border-b border-slate-100 hover:bg-slate-50/60 transition-colors text-sm"
                    style={{ gridTemplateColumns: gridTemplate }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div key={cell.id} className={`px-4 py-2.5 flex items-center whitespace-nowrap text-slate-700 min-w-0 ${cellAlign(cell.column.columnDef)}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                ))
              )}

              {/* Footer slot */}
              {footer && <div className="border-t border-slate-200">{footer}</div>}
            </>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-slate-50/60 text-sm">
          <button
            className="btn-secondary text-xs"
            disabled={effectivePageIndex === 0}
            onClick={() => {
              const p = effectivePageIndex - 1
              if (isServer) onPageChange?.(p)
              else table.previousPage()
            }}
          >
            <ChevronLeft size={14} />
            Anterior
          </button>
          <span className="text-slate-600">
            Página {effectivePageIndex + 1} de {pageCount}
          </span>
          <button
            className="btn-secondary text-xs"
            disabled={effectivePageIndex >= pageCount - 1}
            onClick={() => {
              const p = effectivePageIndex + 1
              if (isServer) onPageChange?.(p)
              else table.nextPage()
            }}
          >
            Siguiente
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
