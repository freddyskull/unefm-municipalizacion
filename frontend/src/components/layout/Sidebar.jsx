import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Building2,
  FileText,
  Wallet,
  UserCircle,
  ClipboardList,
} from 'lucide-react'
import { useState } from 'react'

const menuItems = [
  { divider: 'Tablas Básicas', icon: ClipboardList },
  { path: '/contratos', icon: FileText, label: 'Contratos' },
  { path: '/nominas-efectivas', icon: Wallet, label: 'Nóminas Efectivas' },
  { path: '/info-trabajador', icon: UserCircle, label: 'Info. Trabajador' },
  { divider: 'Sistema', icon: Users, adminOnly: true },
  { path: '/usuarios', icon: Users, label: 'Usuarios del Sistema', adminOnly: true },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()

  const isAdmin = user?.rol === 'admin'
  const visibleMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <aside
      className={`
        ${collapsed ? 'w-20' : 'w-64'}
        bg-gradient-to-b from-unefm-900 to-unefm-950
        text-white h-screen flex flex-col
        transition-all duration-300 ease-in-out
        border-r border-unefm-800/50
      `}
    >
      {/* Header */}
      <div className={`p-4 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
          <Building2 className="w-6 h-6 text-unefm-300" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h2 className="font-bold text-sm leading-tight">UNEFM</h2>
            <p className="text-[10px] text-unefm-400 leading-tight">Municipalización</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item, idx) => {
          if (item.divider) {
            return (
              <div key={item.divider} className="pt-4 pb-1 px-2">
                {!collapsed && (
                  <span className="text-[10px] font-bold text-unefm-400/80 uppercase tracking-widest">
                    {item.divider}
                  </span>
                )}
                {collapsed && <div className="border-t border-unefm-700/50 mx-1" />}
              </div>
            )
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200
                ${collapsed ? 'justify-center' : ''}
                ${
                  isActive
                    ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                    : 'text-unefm-300 hover:bg-white/5 hover:text-white'
                }
                `
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && <span className="animate-fade-in">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* User Info */}
      <div className={`p-4 border-t border-unefm-800/50 ${collapsed ? 'px-2' : ''}`}>
        {!collapsed && user && (
          <div className="animate-fade-in flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-unefm-600 flex items-center justify-center text-xs font-bold">
              {user.nombre?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.nombre}</p>
              <p className="text-[10px] text-unefm-400 capitalize">{user.rol}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-unefm-600 flex items-center justify-center text-xs font-bold mx-auto">
            {user?.nombre?.charAt(0) || 'A'}
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-unefm-800/50 text-unefm-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <div className="flex items-center justify-center gap-2">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-xs">Colapsar</span>}
        </div>
      </button>
    </aside>
  )
}
