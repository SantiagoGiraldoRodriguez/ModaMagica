import { useState, useEffect } from 'react'
import ConfirmModal from '../../components/ConfirmModal'

const API = 'http://localhost:3000/api/usuarios'

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

export default function Usuarios() {
  const [usuarios, setUsuarios]       = useState([])
  const [search, setSearch]           = useState('')
  const [filtroRol, setFiltroRol]     = useState('Todos los roles')
  const [filtroEst, setFiltroEst]     = useState('Todos los estados')
  const [modal, setModal]             = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(formVacio)
  const [currentPage, setCurrentPage] = useState(1)
  const [confirm, setConfirm]         = useState({ show:false, id:null })

  const cargar = async () => {
    try {
      const res = await fetch(API)
      setUsuarios(await res.json())
    } catch (err) {
      console.log(err)
    }
  }

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

  const openAdd  = () => { setEditando(null); setForm(formVacio); setModal(true) }
  const openEdit = u  => {
    setEditando(u.id_usuario)
    setForm({
      primer_nombre:    u.primer_nombre,
      segundo_nombre:   u.segundo_nombre   || '',
      primer_apellido:  u.primer_apellido,
      segundo_apellido: u.segundo_apellido || '',
      correo:           u.correo,
      telefono:         u.telefono,
      contrasena:       u.contrasena,
      id_rol:           u.id_rol,
      direccion:        u.direccion        || '',
      fecha_nacimiento: u.fecha_nacimiento ? u.fecha_nacimiento.split('T')[0] : '',
      estado:           u.estado
    })
    setModal(true)
  }

  const save = async () => {
    try {
      const url    = editando ? `${API}/${editando}` : API
      const method = editando ? 'PUT' : 'POST'
      const payload = { ...form, id_rol: parseInt(form.id_rol, 10) }
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      await cargar()
      setModal(false)
    } catch (err) {
      console.log(err)
    }
  }

  const eliminar = async id => {
    try {
      await fetch(`${API}/${id}`, { method:'DELETE' })
      await cargar()
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h1>Usuarios</h1><p>Gestiona los usuarios registrados.</p></div>
        <div className="page-actions"><button className="btn-primary" onClick={openAdd}><i className="bi bi-person-plus"></i> Nuevo Usuario</button></div>
      </div>

      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Usuarios registrados</span>
            <span style={{ background:'rgba(201,150,42,0.2)', color:'var(--gold)', padding:'2px 9px', borderRadius:20, fontSize:12, fontWeight:700 }}>{filtered.length}</span>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <select style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, cursor:'pointer' }} value={filtroRol} onChange={e=>{ setFiltroRol(e.target.value); setCurrentPage(1) }}>{ROLES_FILTER.map(r=><option key={r}>{r}</option>)}</select>
            <select style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, cursor:'pointer' }} value={filtroEst} onChange={e=>{ setFiltroEst(e.target.value); setCurrentPage(1) }}>{ESTADOS_F.map(e=><option key={e}>{e}</option>)}</select>
            <div className="search-input-wrap"><i className="bi bi-search"></i><input className="search-input" placeholder="Buscar..." value={search} onChange={e=>{ setSearch(e.target.value); setCurrentPage(1) }} /></div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr><th>#</th><th>Usuario</th><th>Correo electrónico</th><th>Teléfono</th><th>Dirección</th><th>Nacimiento</th><th>Registro</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={10}><div className="empty-state"><i className="bi bi-people"></i>No hay usuarios</div></td></tr>
                : paginated.map((u, idx) => {
                    const rc     = rolStyle(u.id_rol)
                    const nombre = getNombreCompleto(u)
                    return (
                      <tr key={u.id_usuario}>
                        <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{startRow+idx+1}</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:38, height:38, borderRadius:'50%', background:AVATAR_COLORS[idx%AVATAR_COLORS.length], color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>{getInitials(nombre)}</div>
                            <strong style={{ fontSize:14 }}>{nombre}</strong>
                          </div>
                        </td>
                        <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{u.correo}</td>
                        <td style={{ fontSize:13 }}>{u.telefono}</td>
                        <td style={{ fontSize:12, color:'var(--text-secondary)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.direccion || '-'}</td>
                        <td style={{ fontSize:13 }}>{u.fecha_nacimiento ? new Date(u.fecha_nacimiento).toLocaleDateString('es-CO') : '-'}</td>
                        <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{u.fecha_creacion ? new Date(u.fecha_creacion).toLocaleDateString('es-CO') : '-'}</td>
                        <td>
                          <span style={{ background:rc.bg, color:rc.color, padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
                            <i className={`bi ${rolIcon(u.id_rol)}`} style={{ fontSize:11 }}></i> {rolLabel(u.id_rol)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${u.estado==='activo'?'status-active':'status-inactivo'}`} style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:u.estado==='activo'?'#10b981':'#9ca3af', display:'inline-block' }}></span>
                            {u.estado==='activo'?'Activo':'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="tbl-btn edit"   onClick={()=>openEdit(u)}><i className="bi bi-pencil"></i></button>
                            <button className="tbl-btn delete" onClick={()=>setConfirm({ show:true, id:u.id_usuario })}><i className="bi bi-trash"></i></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>

        {totalPages>1 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:6, marginTop:18 }}>
            <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} style={{ width:34,height:34,borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',cursor:currentPage===1?'not-allowed':'pointer',opacity:currentPage===1?0.4:1,display:'flex',alignItems:'center',justifyContent:'center' }}><i className="bi bi-chevron-left"></i></button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(page=>(<button key={page} onClick={()=>setCurrentPage(page)} style={{ width:34,height:34,borderRadius:8,border:'1px solid var(--border)',background:currentPage===page?'var(--accent)':'var(--card)',color:currentPage===page?'white':'var(--text)',fontWeight:600,fontSize:13,cursor:'pointer' }}>{page}</button>))}
            <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} style={{ width:34,height:34,borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',cursor:currentPage===totalPages?'not-allowed':'pointer',opacity:currentPage===totalPages?0.4:1,display:'flex',alignItems:'center',justifyContent:'center' }}><i className="bi bi-chevron-right"></i></button>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal-box" style={{ maxWidth:600 }}>
            <button className="modal-close" onClick={()=>setModal(false)}><i className="bi bi-x-lg"></i></button>
            <div className="modal-title"><i className="bi bi-person-plus" style={{ color:'var(--gold)' }}></i> {editando?'Editar usuario':'Nuevo usuario'}</div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div className="form-group"><label className="form-label">Primer nombre</label><input className="form-control" value={form.primer_nombre} onChange={e=>setForm({...form,primer_nombre:e.target.value})} placeholder="Ej: Laura" /></div>
              <div className="form-group"><label className="form-label">Segundo nombre</label><input className="form-control" value={form.segundo_nombre} onChange={e=>setForm({...form,segundo_nombre:e.target.value})} placeholder="Ej: María" /></div>
              <div className="form-group"><label className="form-label">Primer apellido</label><input className="form-control" value={form.primer_apellido} onChange={e=>setForm({...form,primer_apellido:e.target.value})} placeholder="Ej: Martínez" /></div>
              <div className="form-group"><label className="form-label">Segundo apellido</label><input className="form-control" value={form.segundo_apellido} onChange={e=>setForm({...form,segundo_apellido:e.target.value})} placeholder="Ej: García" /></div>
              <div className="form-group"><label className="form-label">Correo electrónico</label><input className="form-control" type="email" value={form.correo} onChange={e=>setForm({...form,correo:e.target.value})} placeholder="Ej: laura@correo.com" /></div>
              <div className="form-group"><label className="form-label">Teléfono</label><input className="form-control" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} placeholder="Ej: 3001234567" /></div>
              <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">Dirección</label><input className="form-control" value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})} placeholder="Ej: Calle 123 #45-67, Medellín" /></div>
              <div className="form-group"><label className="form-label">Fecha de nacimiento</label><input className="form-control" type="date" value={form.fecha_nacimiento} onChange={e=>setForm({...form,fecha_nacimiento:e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Contraseña</label><input className="form-control" type="password" value={form.contrasena} onChange={e=>setForm({...form,contrasena:e.target.value})} placeholder="Mínimo 6 caracteres" /></div>
              <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">Rol</label>
                <select className="form-control" value={form.id_rol} onChange={e=>setForm({...form,id_rol:e.target.value})}>
                  <option value="">Seleccionar...</option>
                  <option value="1">Superadmin</option>
                  <option value="2">Admin</option>
                  <option value="3">Cliente</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save}><i className="bi bi-check-lg"></i> {editando?'Actualizar':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={confirm.show} titulo="¿Eliminar usuario?" mensaje="Esta acción no se puede deshacer. El usuario será eliminado del sistema."
        onCancel={()=>setConfirm({show:false,id:null})}
        onConfirm={()=>{ eliminar(confirm.id); setConfirm({show:false,id:null}) }} />
    </>
  )
}