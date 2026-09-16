import { useAuth } from '../context/AuthContext'
import {
  ShieldCheck,
  User as UserIcon,
  Globe,
  Database,
  Mail,
  CalendarClock,
} from 'lucide-react'

export default function Configuracion() {
  const { user } = useAuth()

  const infoItems = [
    {
      icon: Database,
      label: 'Base de Datos',
      value: 'municipalizacion (PostgreSQL)',
      desc: 'Conexión en modo solo lectura',
    },
    {
      icon: Globe,
      label: 'Servidor',
      value: import.meta.env.VITE_DB_HOST_DISPLAY || '150.187.4.112',
      desc: 'Host de la base de datos',
    },
    {
      icon: ShieldCheck,
      label: 'Autenticación',
      value: 'JWT',
      desc: 'Tokens con expiración de 8 horas',
    },
    {
      icon: CalendarClock,
      label: 'Fecha Formato',
      value: 'YYYY-MM-DD',
      desc: 'Formato de fecha del sistema',
    },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-slate-800">Configuración del Sistema</h2>

      {/* Perfil */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-unefm-500 to-unefm-700 text-white flex items-center justify-center text-xl font-bold">
            {user?.nombre?.charAt(0) || 'A'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{user?.nombre}</h3>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <UserIcon size={14} />
              {user?.username}
            </p>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <Mail size={14} />
              {user?.email || 'Sin correo registrado'}
            </p>
          </div>
        </div>
      </div>

      {/* Info del sistema */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {infoItems.map((item) => (
          <div key={item.label} className="card p-5 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-unefm-50 text-unefm-600 flex items-center justify-center flex-shrink-0">
                <item.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{item.label}</p>
                <p className="font-semibold text-slate-800">{item.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Constraint solo lectura */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Accesos y Permisos</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-success-50 border border-success-100">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-success-700" />
              <span className="text-sm font-medium text-success-800">Consulta de datos municipales</span>
            </div>
            <span className="text-xs px-2 py-1 bg-white rounded-full text-success-700 font-medium">
              Autorizado
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Gestión de usuarios del sistema</span>
            </div>
            <span className="text-xs px-2 py-1 bg-white rounded-full text-slate-600 font-medium">
              {user?.rol === 'admin' ? 'Admin' : 'Solo lectura'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Modificación de datos en BD municipalizacion</span>
            </div>
            <span className="text-xs px-2 py-1 bg-white rounded-full text-slate-600 font-medium">
              No permitido
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
