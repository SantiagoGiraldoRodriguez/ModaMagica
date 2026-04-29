import { useState, useEffect } from 'react'

const ROL_LABELS = { superadmin:'Superadmin', admin:'Admin', editor:'Editor' }
const AVATAR_COLORS = ['#C9962A','#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899']

function avatarColor(str) {
  return AVATAR_COLORS[(str.charCodeAt(0) + (str.charCodeAt(1) || 0)) % AVATAR_COLORS.length]
}
function initials(nombre, apellido) {
  return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase()
}
function nombreCompleto(a) {
  return [a.nombre, a.segundoNombre, a.apellido, a.segundoApellido].filter(Boolean).join(' ')
}

function Campo({ label, value, full }) {
  const empty = !value || !String(value).trim()
  return (
    <div className={`perfil-field${full?' full':''}`}>
      <span className="perfil-field-label">{label}</span>
      <div className={`perfil-field-value${empty?' empty':''}`}>{empty ? 'No registrado' : value}</div>
    </div>
  )
}

export default function MiPerfil() {
  const [admin, setAdmin] = useState(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('adminSesion')
      if (raw) setAdmin(JSON.parse(raw))
    } catch {}
  }, [])

  if (!admin) {
    return (
      <div className="card">
        <div className="perfil-no-sesion">
          <i className="bi bi-person-lock"></i>
          <p>No hay una sesión activa. Por favor inicia sesión para ver tu perfil.</p>
          <a href="/login" className="btn-primary" style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <i className="bi bi-box-arrow-in-right"></i> Ir al inicio de sesión
          </a>
        </div>
      </div>
    )
  }

  const color = avatarColor(admin.nombre + admin.apellido)
  const ini = initials(admin.nombre, admin.apellido)
  const nomComp = nombreCompleto(admin)
  const rolLabel = ROL_LABELS[admin.rol] || admin.rol
  const estadoCls = admin.estado === 'activo' ? 'activo' : 'inactivo'
  const estadoLabel = admin.estado === 'activo' ? 'Activo' : 'Inactivo'

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Mi Perfil</h1>
          <p>Información de tu cuenta de administrador.</p>
        </div>
      </div>

      {/* Encabezado */}
      <div className="perfil-header">
        <div className="perfil-avatar-wrap">
          <div className="perfil-avatar" style={{ background: color }}>{ini}</div>
          <span className={`perfil-avatar-badge ${estadoCls}`}></span>
        </div>
        <div className="perfil-info">
          <div className="perfil-nombre">{nomComp}</div>
          <div className="perfil-correo">{admin.correo}</div>
          <div className="perfil-badges">
            <span className={`badge-rol ${admin.rol}`}>{rolLabel}</span>
            <span className={`badge-estado-perfil ${estadoCls}`}>
              <span className="dot"></span>{estadoLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Datos personales */}
      <div className="perfil-card">
        <div className="perfil-card-title"><i className="bi bi-person-fill"></i> Datos personales</div>
        <div className="perfil-grid">
          <Campo label="Primer nombre"      value={admin.nombre} />
          <Campo label="Segundo nombre"     value={admin.segundoNombre} />
          <Campo label="Primer apellido"    value={admin.apellido} />
          <Campo label="Segundo apellido"   value={admin.segundoApellido} />
          <Campo label="Correo electrónico" value={admin.correo} full />
          <Campo label="Teléfono"           value={admin.numero} />
        </div>
      </div>

      {/* Datos de cuenta */}
      <div className="perfil-card">
        <div className="perfil-card-title"><i className="bi bi-shield-fill"></i> Datos de cuenta</div>
        <div className="perfil-grid">
          <Campo label="Rol"               value={rolLabel} />
          <Campo label="Estado"            value={estadoLabel} />
          <Campo label="Fecha de registro" value={admin.fechaRegistro} />
        </div>
      </div>
    </>
  )
}
