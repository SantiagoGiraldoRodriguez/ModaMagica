import { useState, useEffect } from 'react'
import './MiPerfil.css'

const ROL_LABELS = { 1: 'Superadmin', 2: 'Admin', 3: 'Cliente', 4: 'Bodega', 5: 'Soporte' }
const AVATAR_COLORS = ['#C9962A','#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899']

function avatarColor(str = '') {
  return AVATAR_COLORS[(str.charCodeAt(0) + (str.charCodeAt(1) || 0)) % AVATAR_COLORS.length]
}
function initials(nombre = '', apellido = '') {
  return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase()
}

function Campo({ label, value, full }) {
  const empty = !value || !String(value).trim()
  return (
    <div className={`perfil-field${full ? ' full' : ''}`}>
      <span className="perfil-field-label">{label}</span>
      <div className={`perfil-field-value${empty ? ' empty' : ''}`}>
        {empty ? 'No registrado' : value}
      </div>
    </div>
  )
}

const PERMISOS = {
  1: [
    { icon: 'bi-people-fill',       label: 'Gestión de Usuarios',  desc: 'Crear, editar y eliminar usuarios del sistema.' },
    { icon: 'bi-tags-fill',         label: 'Categorías',           desc: 'Crear, editar y eliminar categorías de productos.' },
    { icon: 'bi-box-seam-fill',     label: 'Productos',            desc: 'Crear, editar y eliminar productos del catálogo.' },
    { icon: 'bi-receipt-cutoff',    label: 'Pedidos',              desc: 'Ver, gestionar y actualizar el estado de pedidos.' },
    { icon: 'bi-percent',           label: 'Descuentos',           desc: 'Crear, editar y eliminar descuentos y promociones.' },
    { icon: 'bi-gear-fill',         label: 'Configuración total',  desc: 'Acceso completo a toda la configuración del sistema.' },
  ],
  2: [
    { icon: 'bi-tags-fill',         label: 'Categorías',           desc: 'Crear y gestionar categorías de productos.' },
    { icon: 'bi-box-seam-fill',     label: 'Productos',            desc: 'Crear y gestionar productos del catálogo.' },
  ],
}

export default function MiPerfil() {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const raw = sessionStorage.getItem('adminSesion')
        if (!raw) { setError('No hay sesión activa.'); setLoading(false); return }

        const sesion = JSON.parse(raw)

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${sesion.id}`, {
          headers: { Authorization: `Bearer ${sesion.token}` }
        })

        if (!res.ok) throw new Error('Error al cargar perfil')

        const data = await res.json()
        setUsuario(data)
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar el perfil.')
      } finally {
        setLoading(false)
      }
    }
    fetchPerfil()
  }, [])

  if (loading) return (
    <div className="card perfil-loading">
      <p>Cargando perfil...</p>
    </div>
  )

  if (error || !usuario) return (
    <div className="card">
      <div className="perfil-no-sesion">
        <i className="bi bi-person-lock"></i>
        <p>{error || 'No se pudo cargar el perfil.'}</p>
        <a href="/login" className="btn-primary">
          <i className="bi bi-box-arrow-in-right"></i> Ir al inicio de sesión
        </a>
      </div>
    </div>
  )

  const color       = avatarColor(usuario.primer_nombre + (usuario.primer_apellido || ''))
  const ini         = initials(usuario.primer_nombre, usuario.primer_apellido)
  const nomComp     = [usuario.primer_nombre, usuario.segundo_nombre, usuario.primer_apellido, usuario.segundo_apellido].filter(Boolean).join(' ')
  const rolLabel    = ROL_LABELS[usuario.id_rol] || `Rol ${usuario.id_rol}`
  const estadoCls   = usuario.estado === 'activo' ? 'activo' : 'inactivo'
  const estadoLabel = usuario.estado === 'activo' ? 'Activo' : 'Inactivo'
  const fechaReg    = usuario.fecha_creacion
    ? new Date(usuario.fecha_creacion).toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })
    : null
  const permisos    = PERMISOS[usuario.id_rol] || []
  const rolClass    = usuario.id_rol === 1 ? 'superadmin' : 'admin'

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h1>Mi Perfil</h1><p>Información de tu cuenta de administrador.</p></div>
      </div>

      <div className="perfil-header">
        <div className="perfil-avatar-wrap">
          <div className="perfil-avatar" style={{ background: color }}>{ini}</div>
          <span className={`perfil-avatar-badge ${estadoCls}`}></span>
        </div>
        <div className="perfil-info">
          <div className="perfil-nombre">{nomComp}</div>
          <div className="perfil-correo">{usuario.correo}</div>
          <div className="perfil-badges">
            <span className={`badge-rol ${rolClass}`}>{rolLabel}</span>
            <span className={`badge-estado-perfil ${estadoCls}`}><span className="dot"></span>{estadoLabel}</span>
          </div>
        </div>
      </div>

      <div className="perfil-card">
        <div className="perfil-card-title"><i className="bi bi-person-fill"></i> Datos personales</div>
        <div className="perfil-grid">
          <Campo label="Primer nombre"      value={usuario.primer_nombre} />
          <Campo label="Segundo nombre"     value={usuario.segundo_nombre} />
          <Campo label="Primer apellido"    value={usuario.primer_apellido} />
          <Campo label="Segundo apellido"   value={usuario.segundo_apellido} />
          <Campo label="Correo electrónico" value={usuario.correo} full />
          <Campo label="Teléfono"           value={usuario.telefono} />
          <Campo label="Dirección"          value={usuario.direccion} full />
        </div>
      </div>

      <div className="perfil-card">
        <div className="perfil-card-title"><i className="bi bi-shield-fill"></i> Datos de cuenta</div>
        <div className="perfil-grid">
          <Campo label="Rol"               value={rolLabel} />
          <Campo label="Estado"            value={estadoLabel} />
          <Campo label="Fecha de registro" value={fechaReg} />
        </div>
      </div>

      {permisos.length > 0 && (
        <div className="perfil-card">
          <div className="perfil-card-title"><i className="bi bi-key-fill"></i> Permisos del rol</div>
          <div className="perfil-permisos-desc">
            {usuario.id_rol === 1
              ? 'Como Superadmin tienes acceso total al sistema.'
              : 'Como Admin puedes gestionar categorías y productos únicamente.'}
          </div>
          <div className="perfil-permisos-grid">
            {permisos.map((p, i) => (
              <div key={i} className={`permiso-card permiso-${rolClass}`}>
                <div className="permiso-icon"><i className={`bi ${p.icon}`}></i></div>
                <div className="permiso-info">
                  <div className="permiso-label">{p.label}</div>
                  <div className="permiso-desc">{p.desc}</div>
                </div>
                <div className="permiso-check"><i className="bi bi-check-circle-fill"></i></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
