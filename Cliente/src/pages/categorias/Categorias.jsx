import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ConfirmModal from '../../components/ConfirmModal'
import './Categorias.css'

const API            = `${import.meta.env.VITE_API_URL}/api/categorias`
const CAT_COLORS     = ['#10b981','#10b981','#10b981','#ef4444','#ef4444','#10b981','#3b82f6','#f59e0b']
const ESTADOS_F      = ['Todos los estados','activo','inactivo']
const ITEMS_PER_PAGE = 4
const soloLetras     = v => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v)

const Dropdown = ({ value, options, onChange }) => {
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
    <div className="cat-dropdown" ref={ref}>
      <button type="button" className={`cat-dropdown-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>{seleccionada ? seleccionada.label : value}</span>
        <i className="bi bi-chevron-down cat-dropdown-chevron"></i>
      </button>
      {open && (
        <ul className="cat-dropdown-menu">
          {normalizadas.map(opt => (
            <li
              key={opt.value}
              className={`cat-dropdown-item${opt.value === value ? ' active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
              {opt.value === value && <i className="bi bi-check-lg cat-dropdown-check"></i>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Categorias() {

  const [categorias, setCategorias]   = useState([])
  const [search, setSearch]           = useState('')
  const [filtroEst, setFiltroEst]     = useState('Todos los estados')
  const [modal, setModal]             = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState({ nombre:'', descripcion:'', estado:'activo' })
  const [errors, setErrors]           = useState({ nombre:'', descripcion:'' })
  const [serverError, setServerError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [confirm, setConfirm]         = useState({ show:false, id:null, error:'' })
  const [loading, setLoading]         = useState(true)

  const cargarCategorias = async () => {
    try {
      const res = await axios.get(API)
      const data = res.data.map(c => ({
        id:          c.id_categoria,
        nombre:      c.nombre_categoria,
        descripcion: c.descripcion,
        estado:      c.estado,
        fecha:       new Date().toLocaleDateString('es-CO')
      }))
      setCategorias(data)
    } catch (err) {
      console.error('Error al cargar categorías', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarCategorias() }, [])

  const filtered   = categorias.filter(c => {
    const ms = c.nombre.toLowerCase().includes(search.toLowerCase())
    const me = filtroEst === 'Todos los estados' || c.estado === filtroEst
    return ms && me
  })
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE)
  const startRow   = (currentPage-1)*ITEMS_PER_PAGE

  const validateNombre = v => !v.trim() ? 'El nombre es obligatorio.' : !soloLetras(v) ? 'Solo se permiten letras.' : ''
  const validateDesc   = v => !v.trim() ? 'La descripción es obligatoria.' : ''

  const openAdd = () => {
    setEditando(null); setForm({ nombre:'', descripcion:'', estado:'activo' }); setErrors({ nombre:'', descripcion:'' }); setServerError(''); setModal(true)
  }

  const openEdit = c => {
    setEditando(c.id); setForm({ nombre:c.nombre, descripcion:c.descripcion, estado:c.estado }); setErrors({ nombre:'', descripcion:'' }); setServerError(''); setModal(true)
  }

  const save = async () => {
    const eN = validateNombre(form.nombre)
    const eD = validateDesc(form.descripcion)
    setErrors({ nombre:eN, descripcion:eD }); setServerError('')
    if (eN || eD) return
    try {
      if (editando) {
        await axios.put(`${API}/${editando}`, { nombre_categoria: form.nombre, descripcion: form.descripcion, estado: form.estado })
      } else {
        await axios.post(API, { nombre_categoria: form.nombre, descripcion: form.descripcion })
      }
      await cargarCategorias(); setModal(false)
    } catch (err) {
      const msg = err.response?.data?.error || 'Ocurrió un error al guardar.'
      setServerError(msg)
    }
  }

  const eliminar = async (id) => {
    try {
      await axios.delete(`${API}/${id}`)
      setConfirm({ show:false, id:null, error:'' })
      await cargarCategorias()
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo eliminar la categoría porque tiene un producto asociado. Solo se pueden eliminar categorías sin productos.'
      setConfirm(prev => ({ ...prev, error: msg }))
    }
  }

  const badgeStyle = e => ({
    background: e === 'activo' ? 'rgba(16,185,129,0.12)' : 'rgba(156,163,175,0.15)',
    color:      e === 'activo' ? '#10b981'                : '#6b7280',
    dot:        e === 'activo' ? '#10b981'                : '#6b7280',
  })

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h1>Categorías</h1><p>Gestiona las categorías de productos de Moda Mágica.</p></div>
        <div className="page-actions"><button className="btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> Nueva Categoría</button></div>
      </div>

      <div className="card">
        <div className="cat-tabla-header">
          <div className="cat-tabla-titulo">Categorías registradas<span className="cat-tabla-count-badge">{filtered.length}</span></div>
          <div className="cat-tabla-filtros">
            <Dropdown value={filtroEst} options={ESTADOS_F} onChange={e => { setFiltroEst(e); setCurrentPage(1) }} />
            <div className="search-input-wrap"><i className="bi bi-search"></i><input className="search-input" placeholder="Buscar..." value={search} onChange={e=>{ setSearch(e.target.value); setCurrentPage(1) }} /></div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead><tr><th>#</th><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={5}><div className="empty-state">Cargando...</div></td></tr>
                : paginated.length===0
                  ? <tr><td colSpan={5}><div className="empty-state"><i className="bi bi-tags"></i>No hay categorías</div></td></tr>
                  : paginated.map((c,idx) => {
                      const s = badgeStyle(c.estado)
                      return (
                        <tr key={c.id}>
                          <td className="cat-td-numero">{startRow+idx+1}</td>
                          <td><div className="cat-td-nombre"><div className="cat-icono" style={{ background:CAT_COLORS[(startRow+idx)%CAT_COLORS.length] }}>{c.nombre.charAt(0).toUpperCase()}</div><strong className="cat-nombre-text">{c.nombre}</strong></div></td>
                          <td className="cat-td-descripcion">{c.descripcion}</td>
                          <td><span className="cat-estado-badge" style={{ background:s.background, color:s.color }}><span className="cat-estado-dot" style={{ background:s.dot }} />{c.estado==='activo'?'Activo':'Inactivo'}</span></td>
                          <td><div className="action-btns"><button className="tbl-btn edit" onClick={()=>openEdit(c)}><i className="bi bi-pencil"></i></button><button className="tbl-btn delete" onClick={()=>setConfirm({ show:true, id:c.id, error:'' })}><i className="bi bi-trash"></i></button></div></td>
                        </tr>
                      )
                    })
              }
            </tbody>
          </table>
        </div>

        {totalPages>1 && (
          <div className="cat-paginacion">
            <button className="cat-paginacion-btn" onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}><i className="bi bi-chevron-left"></i></button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(page=>(<button key={page} className={`cat-paginacion-page${currentPage===page?' active':''}`} onClick={()=>setCurrentPage(page)}>{page}</button>))}
            <button className="cat-paginacion-btn" onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}><i className="bi bi-chevron-right"></i></button>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal-box" style={{ maxWidth:480 }}>
            <button className="modal-close" onClick={()=>setModal(false)}><i className="bi bi-x-lg"></i></button>
            <div className="modal-title"><i className="bi bi-tags" style={{ color:'var(--gold)' }}></i> {editando?'Editar':'Nueva'} Categoría</div>

            <div className="form-group">
              <label className="form-label">Nombre <span style={{ color:'var(--gold)' }}>*</span></label>
              <input className="form-control" style={{ borderColor: (errors.nombre || serverError) ? 'var(--gold)' : undefined }} value={form.nombre} onChange={e=>{ setForm({...form, nombre:e.target.value}); setErrors(er=>({...er, nombre:validateNombre(e.target.value)})); setServerError('') }} onBlur={()=>setErrors(er=>({...er, nombre:validateNombre(form.nombre)}))} />
              {errors.nombre && (<div className="cat-field-error"><i className="bi bi-exclamation-circle"></i> {errors.nombre}</div>)}
              {serverError && !errors.nombre && (<div className="cat-field-error"><i className="bi bi-exclamation-circle"></i> {serverError}</div>)}
            </div>

            <div className="form-group">
              <label className="form-label">Descripción <span style={{ color:'var(--gold)' }}>*</span></label>
              <textarea className="form-control cat-textarea" rows={3} style={{ borderColor:errors.descripcion?'var(--gold)':undefined }} value={form.descripcion} onChange={e=>{ setForm({...form, descripcion:e.target.value}); setErrors(er=>({...er, descripcion:validateDesc(e.target.value)})) }} onBlur={()=>setErrors(er=>({...er, descripcion:validateDesc(form.descripcion)}))} />
              {errors.descripcion && (<div className="cat-field-error"><i className="bi bi-exclamation-circle"></i> {errors.descripcion}</div>)}
            </div>

            {editando && (
              <div className="form-group">
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

            <div className="modal-actions">
              <button className="btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save}><i className="bi bi-check-lg"></i> {editando?'Actualizar':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={confirm.show} titulo="¿Eliminar categoría?" mensaje="Esta acción no se puede deshacer. La categoría será eliminada permanentemente." error={confirm.error} onCancel={()=>setConfirm({show:false, id:null, error:''})} onConfirm={()=>eliminar(confirm.id)} />
    </>
  )
}
