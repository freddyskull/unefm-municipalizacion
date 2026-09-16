import { useEffect, useState, useMemo } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react'
import DataTable from '../components/DataTable'

export default function Usuarios() {
  const { user: currentUser } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', nombre: '', email: '', rol: 'usuario' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    setLoading(true)
    try {
      const response = await api.get('/usuarios')
      setUsuarios(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = currentUser?.rol === 'admin'

  const columns = useMemo(() => {
    const cols = [
      {
        id: 'nombre',
        accessorKey: 'nombre',
        header: 'Nombre',
        sortable: true,
        cell: (info) => (
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-unefm-100 text-unefm-600 flex items-center justify-center text-xs font-bold">
              {String(info.getValue()).charAt(0)}
            </span>
            <span className="font-medium text-slate-800">{info.getValue()}</span>
          </div>
        ),
      },
      { id: 'username', accessorKey: 'username', header: 'Usuario', sortable: true },
      { id: 'email', accessorKey: 'email', header: 'Correo', sortable: true, cell: (info) => info.getValue() || '-' },
      {
        id: 'rol',
        accessorKey: 'rol',
        header: 'Rol',
        sortable: true,
        cell: (info) => (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${info.getValue() === 'admin' ? 'bg-unefm-100 text-unefm-700' : 'bg-slate-100 text-slate-600'}`}>
            {info.getValue() === 'admin' ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
            {info.getValue()}
          </span>
        ),
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        header: 'Creado',
        sortable: true,
        cell: (info) => formatDate(info.getValue()),
      },
      {
        id: 'estado',
        accessorKey: 'estado',
        header: 'Estado',
        sortable: true,
        cell: (info) => (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${info.getValue() === 1 ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'}`}>
            {info.getValue() === 1 ? 'Activo' : 'Inactivo'}
          </span>
        ),
      },
    ]
    if (isAdmin) {
      cols.push({
        id: 'acciones',
        header: '',
        align: 'right',
        cell: (info) => {
          const u = info.row.original
          return (
            <div className="flex justify-end gap-2">
              <button
                className="p-2 rounded-lg text-unefm-600 hover:bg-unefm-50 transition-colors"
                onClick={() => openEdit(u)}
                aria-label="Editar"
              >
                <Pencil size={16} />
              </button>
              {u.id !== currentUser?.id && (
                <button
                  className="p-2 rounded-lg text-danger-500 hover:bg-danger-50 transition-colors"
                  onClick={() => handleDelete(u.id)}
                  aria-label="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )
        },
      })
    }
    return cols
  }, [isAdmin, currentUser?.id])

  const openCreate = () => {
    setEditing(null)
    setForm({ username: '', password: '', nombre: '', email: '', rol: 'usuario' })
    setModalOpen(true)
    setError('')
  }

  const openEdit = (usuario) => {
    setEditing(usuario)
    setForm({
      username: usuario.username,
      password: '',
      nombre: usuario.nombre,
      email: usuario.email || '',
      rol: usuario.rol,
      estado: usuario.estado ?? 1,
    })
    setModalOpen(true)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (editing) {
        await api.put(`/usuarios/${editing.id}`, form)
        setSuccess('Usuario actualizado correctamente')
      } else {
        await api.post('/usuarios', form)
        setSuccess('Usuario creado correctamente')
      }
      setModalOpen(false)
      loadUsuarios()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar usuario')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario?')) return
    try {
      await api.delete(`/usuarios/${id}`)
      setSuccess('Usuario eliminado correctamente')
      loadUsuarios()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar usuario')
      setTimeout(() => setError(''), 3000)
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date + 'Z').toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Mensajes */}
      {success && (
        <div className="p-3 rounded-lg bg-success-50 border border-success-100 text-success-700 text-sm animate-fade-in">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-500/20 text-danger-700 text-sm animate-fade-in">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={22} className="text-unefm-600" />
          <h2 className="text-lg font-semibold text-slate-800">Usuarios del Sistema</h2>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={18} />
            Nuevo Usuario
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Listado de Usuarios</h3>
          <span className="text-sm text-slate-500">{usuarios.length} usuarios</span>
        </div>
        {loading ? (
          <div className="p-8 flex items-center justify-center text-slate-500">
            <Loader2 className="animate-spin mr-2" size={20} />
            Cargando usuarios...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={usuarios}
            pageSize={10}
            getRowId={(row) => String(row.id)}
            emptyMessage="No hay usuarios registrados."
            emptyIcon={Users}
          />
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {editing ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Nombre completo</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Nombre y apellido"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Usuario</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Nombre de usuario"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={!!editing}
                  required
                />
              </div>
              <div>
                <label className="label">
                  {editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editing}
                  minLength={6}
                />
              </div>
              <div>
                <label className="label">Correo electrónico</label>
                <input
                  type="email"
                  className="input"
                  placeholder="usuario@unefm.edu.ve"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Rol</label>
                <select
                  className="input"
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {editing && (
                <div>
                  <label className="label">Estado</label>
                  <select
                    className="input"
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: Number(e.target.value) })}
                  >
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editing ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
