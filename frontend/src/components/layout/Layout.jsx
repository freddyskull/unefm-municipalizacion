import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const pageTitles = {
  '/': 'Dashboard',
  '/contratos': 'Contratos',
  '/nominas-efectivas': 'Nóminas Efectivas',
  '/info-trabajador': 'Info. Trabajador',
  '/nominas-pago': 'Nóminas de Pago',
  '/datos': 'Datos PostgreSQL',
  '/usuarios': 'Usuarios del Sistema',
  '/reportes': 'Reportes',
  '/configuracion': 'Configuración',
}

export default function Layout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'UNEFM'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
