import { useState, useEffect, useRef } from 'react'
import ConfirmModal from '../../components/ConfirmModal'
import './Usuarios.css'

const API            = `${import.meta.env.VITE_API_URL}/api/usuarios`

const AVATAR_COLORS  = ['#6366f1','#ef4444','#3b82f6','#8b5cf6','#10b981','#f59e0b','#C9962A','#06b6d4']
const ROLES_FILTER   = ['Todos los roles','Superadmin','Admin','Cliente']
const ESTADOS_F      = ['Todos los estados','activo','inactivo']
const ITEMS_PER_PAGE = 4

const getInitials = n => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

const rolLabel = id => id === 1 ? 'Superadmin' : id === 2 ? 'Admin' : 'Cliente'
const rolStyle = id => id === 1 ? { bg:'rgba(201,150,42,0.15)', color:'#C9962A' }
                     : id === 2 ? { bg:'rgba(59,130,246,0.15)', color:'#3b82f6' }
                     :            { bg:'rgba(16,185,129,0.15)', color:'#10b981' }
const rolIcon  = id => id === 1 ? 'bi-shield-fill' : id === 2 ? 'bi-shield-half' : 'bi-person-fill'

const getNombreCompleto = u => [u.primer_nombre, u.segundo_nombre, u.primer_apellido, u.segundo_apellido].filter(Boolean).join(' ')

const formVacio = {
  primer_nombre:'', segundo_nombre:'', primer_apellido:'', segundo_apellido:'',
  correo:'', telefono:'', contrasena:'', id_rol:'',
  direccion:'', fecha_nacimiento:'', estado:'activo'
}

const erroresVacio = {
  primer_nombre:'', segundo_nombre:'', primer_apellido:'', segundo_apellido:'',
  correo:'', telefono:'', contrasena:'', id_rol:'',
  direccion:'', fecha_nacimiento:''
}

const soloLetras   = v => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v.trim())
const soloNumeros  = v => /^[0-9]+$/.test(v.trim())

const validarNombre = (v, campo = 'El campo') => {
  if (!v.trim())        return `${campo} es obligatorio.`
  if (!soloLetras(v))   return `${campo} solo permite letras.`
  if (v.trim().length < 2) return `${campo} debe tener al menos 2 caracteres.`
  return ''
}

const validarNombreOpcional = (v, campo = 'El campo') => {
  if (!v.trim()) return ''
  if (!soloLetras(v)) return `${campo} solo permite letras.`
  if (v.trim().length < 2) return `${campo} debe tener al menos 2 caracteres.`
  return ''
}

const validarCorreo = v => {
  if (!v.trim()) return 'El correo es obligatorio.'
  if ((v.match(/@/g) || []).length > 1) return 'El correo no puede contener más de un @.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ingresa un correo electrónico válido.'
  return ''
}

const validarTelefono = v => {
  if (!v.trim())       return 'El teléfono es obligatorio.'
  if (!soloNumeros(v)) return 'El teléfono solo permite números.'
  if (v.trim().length < 7 || v.trim().length > 15) return 'El teléfono debe tener entre 7 y 15 dígitos.'
  return ''
}

const validarContrasena = (v, editando) => {
  if (!editando && !v) return 'La contraseña es obligatoria.'
  if (v) {
    if (v.length < 6)                return 'La contraseña debe tener mínimo 6 caracteres.'
    if (!/[a-z]/.test(v))            return 'La contraseña debe tener al menos una minúscula.'
    if (!/[A-Z]/.test(v))            return 'La contraseña debe tener al menos una mayúscula.'
    if (!/[0-9]/.test(v))            return 'La contraseña debe tener al menos un número.'
  }
  return ''
}

const validarRol = v => {
  if (!v) return 'Debes seleccionar un rol.'
  return ''
}

const validarFechaNacimiento = v => {
  if (!v) return 'La fecha de nacimiento es obligatoria.'
  const nacimiento = new Date(v)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const m = hoy.getMonth() - nacimiento.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--
  if (edad < 18) return 'El usuario debe ser mayor de 18 años.'
  return ''
}

const FieldError = ({ msg }) =>
  msg ? (
    <div className="u-field-error">
      <i className="bi bi-exclamation-circle"></i> {msg}
    </div>
  ) : null

const Dropdown = ({ value, options, onChange, placeholder, error }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const normalizadas = options.map(opt => typeof opt === 'object' ? opt : { value: opt, label: opt })
  const seleccionada  = normalizadas.find(o => o.value === value)

  return (
    <div className="u-dropdown" ref={ref}>
      <button type="button" className={`u-dropdown-btn${open ? ' open' : ''}${error ? ' has-error' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className={seleccionada ? '' : 'u-dropdown-placeholder'}>{seleccionada ? seleccionada.label : (placeholder || value)}</span>
        <i className="bi bi-chevron-down u-dropdown-chevron"></i>
      </button>
      {open && (
        <ul className="u-dropdown-menu">
          {normalizadas.map(opt => (
            <li
              key={opt.value}
              className={`u-dropdown-item${opt.value === value ? ' active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
              {opt.value === value && <i className="bi bi-check-lg u-dropdown-check"></i>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Usuarios() {
  const [usuarios, setUsuarios]       = useState([])
  const [search, setSearch]           = useState('')
  const [filtroRol, setFiltroRol]     = useState('Todos los roles')
  const [filtroEst, setFiltroEst]     = useState('Todos los estados')
  const [modal, setModal]             = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(formVacio)
  const [errors, setErrors]           = useState(erroresVacio)
  const [serverError, setServerError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [confirm, setConfirm]         = useState({ show:false, id:null, error:'' })
  const [infoUsuario, setInfoUsuario] = useState(null)

  const cargar = async () => {
    try {
      const res = await fetch(API)
      setUsuarios(await res.json())
    } catch (err) { console.log(err) }
  }

  const yaTieneSuperadmin = usuarios.some(u => u.id_rol === 1)

  useEffect(() => { cargar() }, [])

  const filtered = usuarios.filter(u => {
    const n  = getNombreCompleto(u).toLowerCase()
    const ms = n.includes(search.toLowerCase()) || u.correo.toLowerCase().includes(search.toLowerCase())
    const mr = filtroRol === 'Todos los roles'   || rolLabel(u.id_rol) === filtroRol
    const me = filtroEst === 'Todos los estados' || u.estado === filtroEst
    return ms && mr && me
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE)
  const startRow   = (currentPage-1)*ITEMS_PER_PAGE

  const openAdd  = () => {
    setEditando(null); setForm(formVacio); setErrors(erroresVacio); setServerError(''); setModal(true)
  }

  const openEdit = u => {
    if (u.estado === 'inactivo') {
      setServerError('No se puede editar un usuario inactivo. Cambia su estado a Activo primero.')
      setModal(true)
      setEditando(null)
      setForm({ ...formVacio, estado: 'inactivo' })
      return
    }
    setEditando(u.id_usuario)
    setForm({ primer_nombre: u.primer_nombre, segundo_nombre: u.segundo_nombre || '', primer_apellido: u.primer_apellido, segundo_apellido: u.segundo_apellido || '', correo: u.correo, telefono: u.telefono, contrasena: '', id_rol: u.id_rol, direccion: u.direccion || '', fecha_nacimiento: u.fecha_nacimiento ? u.fecha_nacimiento.split('T')[0] : '', estado: u.estado })
    setErrors(erroresVacio); setServerError(''); setModal(true)
  }

  const openInfo = u => setInfoUsuario(u)
  const closeInfo = () => setInfoUsuario(null)

  const validarTodo = () => {
    const e = {
      primer_nombre:    validarNombre(form.primer_nombre, 'El primer nombre'),
      segundo_nombre:   validarNombreOpcional(form.segundo_nombre, 'El segundo nombre'),
      primer_apellido:  validarNombre(form.primer_apellido, 'El primer apellido'),
      segundo_apellido: validarNombreOpcional(form.segundo_apellido, 'El segundo apellido'),
      correo:           validarCorreo(form.correo),
      telefono:         validarTelefono(form.telefono),
      contrasena:       validarContrasena(form.contrasena, editando),
      id_rol:           validarRol(form.id_rol),
      direccion:        !form.direccion.trim() ? 'La dirección es obligatoria.' : '',
      fecha_nacimiento: validarFechaNacimiento(form.fecha_nacimiento),
    }
    setErrors(e)
    return Object.values(e).every(v => v === '')
  }

  // ── FIX: cerrar modal primero, luego recargar ──
  const save = async () => {
    setServerError('')
    if (!validarTodo()) return
    try {
      const url    = editando ? `${API}/${editando}` : API
      const method = editando ? 'PUT' : 'POST'
      const payload = { ...form, id_rol: parseInt(form.id_rol, 10) }
      if (editando && !payload.contrasena) delete payload.contrasena
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setServerError(data?.error || 'Ocurrió un error al guardar.')
        return
      }
      setModal(false)   // primero cerrar
      await cargar()    // luego recargar
    } catch (err) { setServerError('Ocurrió un error al guardar.'); console.log(err) }
  }

  const eliminar = async id => {
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setConfirm(prev => ({ ...prev, error: data.error || `Error ${res.status}: no se pudo eliminar el usuario.` }))
        return
      }
      setConfirm({ show: false, id: null, error: '' }); await cargar()
    } catch (err) { console.log(err); setConfirm(prev => ({ ...prev, error: 'No se pudo conectar con el servidor.' })) }
  }

  const borderError = field => errors[field] ? { borderColor:'var(--gold)' } : {}

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h1>Usuarios</h1><p>Gestiona los usuarios registrados.</p></div>
        <div className="page-actions"><button className="btn-primary" onClick={openAdd}><i className="bi bi-person-plus"></i> Nuevo Usuario</button></div>
      </div>

      <div className="card">
        <div className="u-tabla-header">
          <div className="u-tabla-titulo">Usuarios registrados<span className="u-tabla-count-badge">{filtered.length}</span></div>
          <div className="u-tabla-filtros">
            <Dropdown value={filtroRol} options={ROLES_FILTER} onChange={r => { setFiltroRol(r); setCurrentPage(1) }} />
            <Dropdown value={filtroEst} options={ESTADOS_F} onChange={e => { setFiltroEst(e); setCurrentPage(1) }} />
            <div className="search-input-wrap"><i className="bi bi-search"></i><input className="search-input" placeholder="Buscar..." value={search} onChange={e=>{ setSearch(e.target.value); setCurrentPage(1) }} /></div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr><th>#</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={5}><div className="empty-state"><i className="bi bi-people"></i>No hay usuarios</div></td></tr>
                : paginated.map((u, idx) => {
                    const rc     = rolStyle(u.id_rol)
                    const nombre = getNombreCompleto(u)
                    return (
                      <tr key={u.id_usuario}>
                        <td className="u-td-numero">{startRow+idx+1}</td>
                        <td><div className="u-td-usuario"><div className="u-avatar" style={{ background:AVATAR_COLORS[idx%AVATAR_COLORS.length] }}>{getInitials(nombre)}</div><strong className="u-nombre">{nombre}</strong></div></td>
                        <td><span className="u-rol-badge" style={{ background:rc.bg, color:rc.color }}><i className={`bi ${rolIcon(u.id_rol)} u-rol-icon`}></i> {rolLabel(u.id_rol)}</span></td>
                        <td><span className={`status-badge ${u.estado==='activo'?'status-active':'status-inactivo'}`} style={{ display:'inline-flex', alignItems:'center', gap:5 }}><span className="u-estado-dot" style={{ background:u.estado==='activo'?'#10b981':'#9ca3af' }}></span>{u.estado==='activo'?'Activo':'Inactivo'}</span></td>
                        <td><div className="action-btns"><button className="tbl-btn info" onClick={()=>openInfo(u)}><i className="bi bi-info-circle"></i> Info</button><button className={`tbl-btn edit${u.estado==='inactivo'?' disabled':''}`} onClick={()=>openEdit(u)} title={u.estado==='inactivo'?'Usuario inactivo: no se puede editar':'Editar'}><i className="bi bi-pencil"></i></button><button className="tbl-btn delete" onClick={()=>setConfirm({ show:true, id:u.id_usuario, error:'' })}><i className="bi bi-trash"></i></button></div></td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>

        {totalPages>1 && (
          <div className="u-paginacion">
            <button className="u-paginacion-btn" onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}><i className="bi bi-chevron-left"></i></button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(page=>(<button key={page} className={`u-paginacion-page${currentPage===page?' active':''}`} onClick={()=>setCurrentPage(page)}>{page}</button>))}
            <button className="u-paginacion-btn" onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}><i className="bi bi-chevron-right"></i></button>
          </div>
        )}
      </div>

      {/* Modal de información del usuario */}
      {infoUsuario && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&closeInfo()}>
          <div className="modal-box" style={{ maxWidth:480 }}>
            <button className="modal-close" onClick={closeInfo}><i className="bi bi-x-lg"></i></button>
            <div className="modal-title"><i className="bi bi-info-circle" style={{ color:'var(--gold)' }}></i> Información del usuario</div>

            <div className="u-info-header">
              <div className="u-avatar u-avatar-lg" style={{ background:AVATAR_COLORS[(infoUsuario.id_usuario||0)%AVATAR_COLORS.length] }}>
                {getInitials(getNombreCompleto(infoUsuario))}
              </div>
              <div>
                <div className="u-info-nombre">{getNombreCompleto(infoUsuario)}</div>
                <span className="u-rol-badge" style={{ background:rolStyle(infoUsuario.id_rol).bg, color:rolStyle(infoUsuario.id_rol).color }}>
                  <i className={`bi ${rolIcon(infoUsuario.id_rol)} u-rol-icon`}></i> {rolLabel(infoUsuario.id_rol)}
                </span>
              </div>
            </div>

            <div className="u-info-grid">
              <div className="u-info-item">
                <span className="u-info-label"><i className="bi bi-envelope"></i> Correo electrónico</span>
                <span className="u-info-valor">{infoUsuario.correo}</span>
              </div>
              <div className="u-info-item">
                <span className="u-info-label"><i className="bi bi-telephone"></i> Teléfono</span>
                <span className="u-info-valor">{infoUsuario.telefono || '-'}</span>
              </div>
              <div className="u-info-item">
                <span className="u-info-label"><i className="bi bi-geo-alt"></i> Dirección</span>
                <span className="u-info-valor">{infoUsuario.direccion || '-'}</span>
              </div>
              <div className="u-info-item">
                <span className="u-info-label"><i className="bi bi-cake2"></i> Fecha de nacimiento</span>
                <span className="u-info-valor">{infoUsuario.fecha_nacimiento ? new Date(infoUsuario.fecha_nacimiento).toLocaleDateString('es-CO') : '-'}</span>
              </div>
              <div className="u-info-item">
                <span className="u-info-label"><i className="bi bi-calendar-event"></i> Fecha de registro</span>
                <span className="u-info-valor">{infoUsuario.fecha_creacion ? new Date(infoUsuario.fecha_creacion).toLocaleDateString('es-CO') : '-'}</span>
              </div>
              <div className="u-info-item">
                <span className="u-info-label"><i className="bi bi-toggle-on"></i> Estado</span>
                <span className={`status-badge ${infoUsuario.estado==='activo'?'status-active':'status-inactivo'}`} style={{ display:'inline-flex', alignItems:'center', gap:5, width:'fit-content' }}>
                  <span className="u-estado-dot" style={{ background:infoUsuario.estado==='activo'?'#10b981':'#9ca3af' }}></span>
                  {infoUsuario.estado==='activo'?'Activo':'Inactivo'}
                </span>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeInfo}>Cerrar</button>
              <button
                className="btn-primary"
                onClick={()=>{ closeInfo(); openEdit(infoUsuario) }}
                disabled={infoUsuario.estado === 'inactivo'}
                title={infoUsuario.estado === 'inactivo' ? 'No se puede editar un usuario inactivo' : 'Editar'}
              >
                <i className="bi bi-pencil"></i> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal-box" style={{ maxWidth:600 }}>
            <button className="modal-close" onClick={()=>setModal(false)}><i className="bi bi-x-lg"></i></button>
            <div className="modal-title"><i className="bi bi-person-plus" style={{ color:'var(--gold)' }}></i> {editando?'Editar usuario':'Nuevo usuario'}</div>

            {serverError && (<div className="u-server-error"><i className="bi bi-exclamation-triangle"></i> {serverError}</div>)}

            <div className="u-form-grid">
              <div className="form-group"><label className="form-label">Primer nombre <span style={{ color:'var(--gold)' }}>*</span></label><input className="form-control" style={borderError('primer_nombre')} value={form.primer_nombre} onChange={e=>{ setForm({...form,primer_nombre:e.target.value}); setErrors(er=>({...er,primer_nombre:validarNombre(e.target.value,'El primer nombre')})) }} onBlur={()=>setErrors(er=>({...er,primer_nombre:validarNombre(form.primer_nombre,'El primer nombre')}))} /><FieldError msg={errors.primer_nombre} /></div>
              <div className="form-group"><label className="form-label">Segundo nombre</label><input className="form-control" style={borderError('segundo_nombre')} value={form.segundo_nombre} onChange={e=>{ setForm({...form,segundo_nombre:e.target.value}); setErrors(er=>({...er,segundo_nombre:validarNombreOpcional(e.target.value,'El segundo nombre')})) }} onBlur={()=>setErrors(er=>({...er,segundo_nombre:validarNombreOpcional(form.segundo_nombre,'El segundo nombre')}))} /><FieldError msg={errors.segundo_nombre} /></div>
              <div className="form-group"><label className="form-label">Primer apellido <span style={{ color:'var(--gold)' }}>*</span></label><input className="form-control" style={borderError('primer_apellido')} value={form.primer_apellido} onChange={e=>{ setForm({...form,primer_apellido:e.target.value}); setErrors(er=>({...er,primer_apellido:validarNombre(e.target.value,'El primer apellido')})) }} onBlur={()=>setErrors(er=>({...er,primer_apellido:validarNombre(form.primer_apellido,'El primer apellido')}))} /><FieldError msg={errors.primer_apellido} /></div>
              <div className="form-group"><label className="form-label">Segundo apellido</label><input className="form-control" style={borderError('segundo_apellido')} value={form.segundo_apellido} onChange={e=>{ setForm({...form,segundo_apellido:e.target.value}); setErrors(er=>({...er,segundo_apellido:validarNombreOpcional(e.target.value,'El segundo apellido')})) }} onBlur={()=>setErrors(er=>({...er,segundo_apellido:validarNombreOpcional(form.segundo_apellido,'El segundo apellido')}))} /><FieldError msg={errors.segundo_apellido} /></div>
              <div className="form-group"><label className="form-label">Correo electrónico <span style={{ color:'var(--gold)' }}>*</span></label><input className="form-control" type="text" style={borderError('correo')} value={form.correo} onChange={e=>{ setForm({...form,correo:e.target.value}); setErrors(er=>({...er,correo:validarCorreo(e.target.value)})) }} onBlur={()=>setErrors(er=>({...er,correo:validarCorreo(form.correo)}))} /><FieldError msg={errors.correo} /></div>
              <div className="form-group"><label className="form-label">Teléfono <span style={{ color:'var(--gold)' }}>*</span></label><input className="form-control" style={borderError('telefono')} value={form.telefono} onChange={e=>{ setForm({...form,telefono:e.target.value}); setErrors(er=>({...er,telefono:validarTelefono(e.target.value)})) }} onBlur={()=>setErrors(er=>({...er,telefono:validarTelefono(form.telefono)}))} /><FieldError msg={errors.telefono} /></div>
              <div className="form-group u-form-full"><label className="form-label">Dirección <span style={{ color:'var(--gold)' }}>*</span></label><input className="form-control" style={borderError('direccion')} value={form.direccion} onChange={e=>{ setForm({...form,direccion:e.target.value}); setErrors(er=>({...er,direccion:e.target.value.trim()?'':'La dirección es obligatoria.'})) }} onBlur={()=>setErrors(er=>({...er,direccion:form.direccion.trim()?'':'La dirección es obligatoria.'}))} /><FieldError msg={errors.direccion} /></div>
              <div className="form-group"><label className="form-label">Fecha de nacimiento <span style={{ color:'var(--gold)' }}>*</span></label><input className="form-control" type="date" style={borderError('fecha_nacimiento')} value={form.fecha_nacimiento} onChange={e=>{ setForm({...form,fecha_nacimiento:e.target.value}); setErrors(er=>({...er,fecha_nacimiento:validarFechaNacimiento(e.target.value)})) }} onBlur={()=>setErrors(er=>({...er,fecha_nacimiento:validarFechaNacimiento(form.fecha_nacimiento)}))} /><FieldError msg={errors.fecha_nacimiento} /></div>
              <div className="form-group"><label className="form-label">Contraseña {!editando && <span style={{ color:'var(--gold)' }}>*</span>}</label><input className="form-control" type="password" style={borderError('contrasena')} value={form.contrasena} onChange={e=>{ setForm({...form,contrasena:e.target.value}); setErrors(er=>({...er,contrasena:validarContrasena(e.target.value, editando)})) }} onBlur={()=>setErrors(er=>({...er,contrasena:validarContrasena(form.contrasena, editando)}))} /><FieldError msg={errors.contrasena} /></div>
              <div className="form-group u-form-full">
                <label className="form-label">Rol <span style={{ color:'var(--gold)' }}>*</span></label>
                <Dropdown
                  value={form.id_rol}
                  placeholder="Seleccionar..."
                  error={!!errors.id_rol}
                  onChange={v => { setForm({...form, id_rol: v}); setErrors(er=>({...er, id_rol: validarRol(v)})) }}
                  options={[
                    { value: '', label: 'Seleccionar...' },
                    ...((!yaTieneSuperadmin || form.id_rol === 1 || form.id_rol === '1')
                      ? [{ value: '1', label: 'Superadmin' }]
                      : []
                    ),
                    { value: '2', label: 'Admin' },
                    { value: '3', label: 'Cliente' },
                  ]}
                />
                <FieldError msg={errors.id_rol} />
              </div>
              {editando && (
                <div className="form-group u-form-full">
                  <label className="form-label">Estado</label>
                  <Dropdown
                    value={form.estado}
                    onChange={v => setForm({...form, estado: v})}
                    options={[
                      { value: 'activo', label: 'Activo' },
                      { value: 'inactivo', label: 'Inactivo' },
                    ]}
                  />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save}><i className="bi bi-check-lg"></i> {editando?'Actualizar':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={confirm.show} titulo="¿Eliminar usuario?" mensaje="Esta acción no se puede deshacer. El usuario será eliminado del sistema." error={confirm.error} onCancel={()=>setConfirm({show:false,id:null,error:''})} onConfirm={()=>eliminar(confirm.id)} />
    </>
  )
}