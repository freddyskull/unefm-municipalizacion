import { useEffect } from 'react'
import { flexRender } from '@tanstack/react-table'
import { X, FileText } from 'lucide-react'

function headerLabel(column) {
  const h = column.columnDef.header
  if (typeof h === 'string') return h
  return column.id
}

export default function DetailDialog({ title = 'Detalle del registro', row, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (!row) return null
  const cells = row.getVisibleCells()

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-unefm-50 text-unefm-600 flex items-center justify-center">
              <FileText size={17} />
            </div>
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto dt-scroll flex-1 min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {cells.map((cell) => (
              <div key={cell.id} className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {headerLabel(cell.column)}
                </p>
                <div className="mt-1 text-sm text-slate-800 font-medium break-words leading-relaxed">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl flex justify-end flex-shrink-0">
          <button className="btn-secondary text-sm" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}