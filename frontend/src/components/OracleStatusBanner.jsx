import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react'

export default function OracleStatusBanner({ status, error, onRetry }) {
  if (!status || status === 'connected') return null

  if (status === 'checking') {
    return (
      <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-sm flex items-center gap-3">
        <Loader2 size={18} className="animate-spin flex-shrink-0" />
        Comprobando conexión con Oracle...
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
      <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold">Base de datos Oracle no disponible</p>
        <p className="mt-1 text-amber-700 text-xs break-words">
          {error || 'No se pudo establecer conexión con la base de datos Oracle.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary text-xs flex items-center gap-1.5 flex-shrink-0"
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      )}
    </div>
  )
}