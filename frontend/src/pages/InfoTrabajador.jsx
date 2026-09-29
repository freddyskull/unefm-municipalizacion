import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'
import {
  UserCircle,
  Loader2,
  AlertCircle,
  Briefcase,
  Calendar,
  Users,
  User,
  Info,
} from 'lucide-react'
import ConsultaPersonal from '../components/ConsultaPersonal'
import DataTable from '../components/DataTable'
import OracleStatusBanner from '../components/OracleStatusBanner'
import useOracleHealth from '../hooks/useOracleHealth'
import { usePersona } from '../context/PersonaContext'

export default function InfoTrabajador() {
  const [perfil, setPerfil] = useState(null)
  const [familiares, setFamiliares] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { status: oracleStatus, error: healthError, check } = useOracleHealth()
  const { persona: personaCtx } = usePersona()
  const autoInitRef = useRef(false)
  const [selected, setSelected] = useState(null)
  const [persona, setPersona] = useState(null)

  const familiaresColumns = [
    {
      id: 'NOMFAM',
      accessorKey: 'nombreCompleto',
      header: 'Nombre',
      sortable: true,
    },
    { id: 'PAREN', accessorKey: 'PAREN', header: 'Parentesco', sortable: true },
    { id: 'FECNAC', accessorKey: 'FECNAC', header: 'Fecha Nac.', sortable: true },
  ]

  const familiaresData = familiares.map((f) => ({
    ...f,
    nombreCompleto: `${f.NOMFAM} ${f.APEFAM}`,
  }))

  const loadData = useCallback(async (cedula, tipo) => {
    setLoading(true)
    setError('')
    try {
      const [perfilRes, famRes] = await Promise.all([
        api.get('/oracle/info-trabajador', { params: { cedula, tipo } }),
        api.get('/oracle/carga-familiar', { params: { cedula, tipo } }),
      ])
      setPerfil(perfilRes.data.trabajador || null)
      setFamiliares(famRes.data.familiares || [])
    } catch (err) {
      if (err.response?.status === 503) {
        setError(
          'La base de datos Oracle no está disponible. Se requiere Oracle Instant Client para conectarse al esquema NOMINA/PERSONAL.'
        )
      } else {
        setError(
          err.response?.data?.error || 'Error al cargar información del trabajador'
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selected) {
      loadData(selected.cedula, selected.tipo)
    }
  }, [selected, loadData])

  const handleConsulta = (cedula, tipo) => {
    setPerfil(null)
    setFamiliares([])
    setError('')
    setPersona({ cedula, tipo })
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

  const handleReconnect = async () => {
    const ok = await check()
    if (ok && selected) {
      loadData(selected.cedula, selected.tipo)
    }
  }

  const tipoLabel = {
    '01': 'Docente e Investigación',
    '02': 'Administrativo y Técnico',
    '03': 'Obrero',
  }

  const formatDate = (d) => {
    if (!d) return '-'
    try {
      return new Date(d).toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return d
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
          <UserCircle size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Información del Trabajador</h2>
          <p className="text-sm text-slate-500">
            Datos personales y carga familiar (personal.empleados)
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
              {tipoLabel[persona.tipo] || `Tipo ${persona.tipo}`}
            </span>
          </span>
        </div>
      )}

      <OracleStatusBanner status={oracleStatus} error={healthError} onRetry={handleReconnect} />

      {error && oracleStatus !== 'disconnected' && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-500/20 text-danger-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {selected && (
        <>
          {/* Datos personales */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <UserCircle size={18} className="text-unefm-600" />
              <h3 className="font-semibold text-slate-800">Datos Personales</h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="p-8 flex items-center justify-center text-slate-500">
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Cargando información del trabajador...
                </div>
              ) : perfil ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoField icon={<User size={16} />} label="Cédula" value={perfil.CEDEMP} />
                  <InfoField
                    icon={<Info size={16} />}
                    label="Estatus del Personal"
                  >
                    <EstatusBadge estatus={perfil.ESTATUS} />
                  </InfoField>
                  <InfoField
                    icon={<UserCircle size={16} />}
                    label="Nombre"
                    value={`${perfil.NOMEMP} ${perfil.APEEMP}`}
                  />
                  <InfoField icon={<Briefcase size={16} />} label="Cargo" value={perfil.DES_CAR} truncate />
                  <InfoField icon={<Briefcase size={16} />} label="Dependencia" value={perfil.DESDEP} truncate />
                  <InfoField
                    icon={<Calendar size={16} />}
                    label="Fecha de Ingreso"
                    value={formatDate(perfil.FECING)}
                  />
                  <InfoField
                    icon={<Info size={16} />}
                    label="Sexo"
                    value={perfil.SEXOEMP === 'M' ? 'Masculino' : 'Femenino'}
                  />
                  <InfoField
                    icon={<Calendar size={16} />}
                    label="Fecha de Nacimiento"
                    value={formatDate(perfil.FECNACEMP)}
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <UserCircle size={40} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm">
                    {oracleStatus === 'disconnected'
                      ? 'Sin datos — la base de datos Oracle no está disponible.'
                      : 'No se encontró información para esta cédula.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Carga familiar */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Users size={18} className="text-unefm-600" />
              <h3 className="font-semibold text-slate-800">Carga Familiar</h3>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="p-8 flex items-center justify-center text-slate-500">
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Cargando carga familiar...
                </div>
              ) : (
                <DataTable
                  columns={familiaresColumns}
                  data={familiaresData}
                  getRowId={(row, i) => `f-${i}`}
                  detailTitle="Detalle del familiar"
                  emptyMessage="Sin carga familiar registrada."
                  emptyIcon={Users}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const ESTATUS_STYLES = {
  ACTIVO: 'bg-success-50 text-success-700 border-success-200',
  INACTIVO: 'bg-danger-50 text-danger-700 border-danger-200',
  FIN_DE_CONTRATO: 'bg-danger-50 text-danger-700 border-danger-200',
  DEFAULT: 'bg-amber-50 text-amber-700 border-amber-200',
}

function EstatusBadge({ estatus }) {
  const key = estatus?.toUpperCase()
  const style =
    ESTATUS_STYLES[key] ||
    (String(key).startsWith('PENSIONADO') ? ESTATUS_STYLES.DEFAULT : ESTATUS_STYLES.DEFAULT)
  return estatus ? (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${style}`}>
      {estatus}
    </span>
  ) : (
    <span className="text-slate-400">-</span>
  )
}

function InfoField({ icon, label, value, truncate = false, children }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className="text-slate-400 mt-1 flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        {children || (
          <p
            className={`text-slate-800 font-medium ${truncate ? 'truncate max-w-full block cursor-help' : ''}`}
            title={truncate && typeof value === 'string' ? value : undefined}
          >
            {value || '-'}
          </p>
        )}
      </div>
    </div>
  )
}