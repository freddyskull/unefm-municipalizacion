import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Datos from './pages/Datos'
import Usuarios from './pages/Usuarios'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'
import Contratos from './pages/Contratos'
import NominasEfectivas from './pages/NominasEfectivas'
import InfoTrabajador from './pages/InfoTrabajador'
import NominasPago from './pages/NominasPago'

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Cargando...</div>
      </div>
    )
  }
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/contratos" replace />} />
        <Route path="contratos" element={<Contratos />} />
        <Route path="nominas-efectivas" element={<NominasEfectivas />} />
        <Route path="info-trabajador" element={<InfoTrabajador />} />
        <Route path="nominas-pago" element={<NominasPago />} />
        <Route path="datos" element={<Datos />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/contratos" replace />} />
    </Routes>
  )
}

export default App