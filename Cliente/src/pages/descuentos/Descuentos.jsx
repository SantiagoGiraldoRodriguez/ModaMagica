import { useState, useEffect, useRef } from 'react'
import ConfirmModal from '../../components/ConfirmModal'
import './Descuentos.css'

const API         = `${import.meta.env.VITE_API_URL}/api/descuentos`
const API_PRENDAS = `${import.meta.env.VITE_API_URL}/api/descuentos/productos-activos`
const ESTADOS_F   = ['Todos los estados', 'activo', 'inactivo', 'vencido']
const ESTADOS_EDIT = ['activo', 'inactivo']
const ITEMS_PER_PAGE = 4

const formVacio = { codigo:'', descripcion:'', valor_descuento:'', fecha_inicio:'', fecha_cierre:'', limite_usos:'', estado:'activo', prendas_ids:[] }
const erroresVacio = { codigo:'', descripcion:'', valor_descuento:'', fecha_inicio:'', fecha_cierre:'', limite_usos:'', prendas_ids:'' }

const ErrorMsg = ({ msg }) =>
  msg ? (<div className="desc-error-msg"><i className="bi bi-exclamation-circle"></i> {msg}</div>) : null

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
    <div className="desc-dropdown" ref={ref}>
      <button type="button" className={`desc-dropdown-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>{seleccionada ? seleccionada.label : value}</span>
        <i className="bi bi-chevron-down desc-dropdown-chevron"></i>
      </button>
      {open && (
        <ul className="desc-dropdown-menu">
          {normalizadas.map(opt => (
            <li
              key={opt.value}
              className={`desc-dropdown-item${opt.value === value ? ' active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
              {opt.value === value && <i className="bi bi-check-lg desc-dropdown-check"></i>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Descuentos() {

  const [descuentos, setDescuentos]   = useState([])
  const [prendas, setPrendas]         = useState([])
  const [search, setSearch]           = useState('')
  const [filtroEst, setFiltroEst]     = useState('Todos los estados')
  const [modal, setModal]             = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(formVacio)
  const [errors, setErrors]           = useState(erroresVacio)
  const [serverError, setServerError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [confirm, setConfirm]         = useState({ show:false, id:null })
  const [loading, setLoading]         = useState(true)
  const [buscarPrenda, setBuscarPrenda] = useState('')
  const [infoDescuento, setInfoDescuento] = useState(null)

  const cargar = async () => {
    try {
      const res = await fetch(API)
      if (!res.ok) throw new Error('Error al cargar')
      setDescuentos(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const cargarPrendas = async () => {
    try {
      const res = await fetch(API_PRENDAS)
      if (!res.ok) throw new Error('Error al cargar prendas')
      setPrendas(await res.json())
    } catch (err) { console.error('Prendas:', err) }
  }

  useEffect(() => { cargar(); cargarPrendas() }, [])

  const filtered   = descuentos.filter(d => {
    const ms = d.codigo.toLowerCase().includes(search.toLowerCase()) || (d.descripcion || '').toLowerCase().includes(search.toLowerCase())
    const me = filtroEst === 'Todos los estados' || d.estado === filtroEst
    return ms && me
  })
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE)
  const startRow   = (currentPage-1)*ITEMS_PER_PAGE

  const validateCodigo      = v => !v.trim() ? 'El código es obligatorio.' : v.trim().length > 50 ? 'El código no puede superar 50 caracteres.' : ''
  const validateDescripcion = v => !v.trim() ? 'La descripción es obligatoria.' : ''
  const validateValor       = v => { if (v===''||v===null||v===undefined) return 'El valor es obligatorio.'; const n=parseFloat(v); if (isNaN(n)) return 'Número inválido.'; if (n<1) return 'Mínimo 1%.'; if (n>25) return 'Máximo 25%.'; return '' }
  const validateLimite      = v => { if (v==='') return 'Campo obligatorio.'; const n=parseInt(v); if (isNaN(n)||n<=0) return 'Debe ser positivo.'; return '' }
  const validateFechaInicio = v => !v ? 'Fecha obligatoria.' : ''
  const validateFechaCierre = (cierre,inicio) => { if (!cierre) return 'Fecha obligatoria.'; if (inicio && new Date(cierre)<new Date(inicio)) return 'No puede ser menor que inicio.'; return '' }
  const validatePrendas     = ids => !ids||ids.length===0 ? 'Debes seleccionar al menos una prenda.' : ''

  const validateAll = f => ({
    codigo:          editando ? '' : validateCodigo(f.codigo),
    descripcion:     validateDescripcion(f.descripcion),
    valor_descuento: validateValor(f.valor_descuento),
    limite_usos:     validateLimite(f.limite_usos),
    fecha_inicio:    validateFechaInicio(f.fecha_inicio),
    fecha_cierre:    validateFechaCierre(f.fecha_cierre, f.fecha_inicio),
    prendas_ids:     validatePrendas(f.prendas_ids)
  })

  const openAdd = () => { setEditando(null); setForm(formVacio); setErrors(erroresVacio); setServerError(''); setBuscarPrenda(''); setModal(true) }

  const openEdit = d => {
    setEditando(d.id_descuento)
    setForm({ codigo:d.codigo, descripcion:d.descripcion, valor_descuento:String(d.valor_descuento), fecha_inicio:d.fecha_inicio?.split('T')[0], fecha_cierre:d.fecha_cierre?.split('T')[0], limite_usos:String(d.limite_usos), estado:d.estado, prendas_ids:d.prendas_ids||[] })
    setErrors(erroresVacio); setServerError(''); setBuscarPrenda(''); setModal(true)
  }

  const save = async () => {
    const errs = validateAll(form)
    setErrors(errs); setServerError('')
    if (Object.values(errs).some(e => e)) return
    try {
      const res = await fetch(editando ? `${API}/${editando}` : API, { method: editando ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      let data = {}
      try { data = await res.json() } catch { }
      if (!res.ok) {
        if (data.errores?.prendas_ids) { setErrors(er => ({ ...er, prendas_ids: data.errores.prendas_ids })); return }
        setServerError(data.error || `Error ${res.status}: no se pudo ${editando?'actualizar':'crear'} el descuento.`)
        return
      }
      await cargar(); setModal(false)
    } catch (err) { console.error('save:', err); setServerError('No se pudo conectar con el servidor.') }
  }

  const eliminar = async id => {
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
      let data = {}
      try { data = await res.json() } catch { }
      if (!res.ok) { setServerError(data.error || `Error ${res.status}: no se pudo eliminar el descuento.`); setConfirm({ show:false, id:null }); return }
      await cargar()
    } catch (err) { console.error('eliminar:', err); setServerError('No se pudo conectar con el servidor.') }
  }

  const togglePrenda = id => {
    const ids    = form.prendas_ids || []
    const nuevos = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    setForm(f => ({ ...f, prendas_ids: nuevos }))
    setErrors(er => ({ ...er, prendas_ids: validatePrendas(nuevos) }))
  }

  const prendasFiltradas = prendas.filter(p => (p.nombre_producto || '').toLowerCase().includes(buscarPrenda.toLowerCase()))

  const badgeStyle = e => ({
    background: e==='activo' ? 'rgba(16,185,129,0.12)' : e==='vencido' ? 'rgba(239,68,68,0.12)' : 'rgba(156,163,175,0.15)',
    color:      e==='activo' ? '#10b981' : e==='vencido' ? '#ef4444' : '#6b7280',
    dot:        e==='activo' ? '#10b981' : e==='vencido' ? '#ef4444' : '#6b7280',
  })

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h1>Descuentos</h1><p>Gestiona los códigos de descuento de Moda Mágica.</p></div>
        <div className="page-actions"><button className="btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> Crear descuento</button></div>
      </div>

      {serverError && !modal && (<div className="desc-server-error-wrap"><ErrorMsg msg={serverError} /></div>)}

      <div className="card">
        <div className="desc-tabla-header">
          <div className="desc-tabla-titulo">Descuentos registrados<span className="desc-tabla-count-badge">{filtered.length}</span></div>
          <div className="desc-tabla-filtros">
            <Dropdown value={filtroEst} onChange={v => { setFiltroEst(v); setCurrentPage(1) }} options={ESTADOS_F} />
            <div className="search-input-wrap"><i className="bi bi-search"></i><input className="search-input" placeholder="Buscar código..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} /></div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table desc-table-auto">
            <thead>
              <tr><th>#</th><th>Código</th><th>Descuento</th><th>Usos actuales</th><th className="desc-th-nowrap">Acciones</th></tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={5}><div className="empty-state">Cargando...</div></td></tr>
                : paginated.length === 0
                  ? <tr><td colSpan={5}><div className="empty-state"><i className="bi bi-ticket-perforated"></i> No hay descuentos</div></td></tr>
                  : paginated.map((d, idx) => {
                      return (
                        <tr key={d.id_descuento}>
                          <td className="desc-td-numero">{startRow+idx+1}</td>
                          <td><span className="desc-codigo-badge">{d.codigo}</span></td>
                          <td className="desc-td-valor">{d.valor_descuento}%</td>
                          <td>
                            <div className="desc-usos-wrap">
                              <span className="desc-usos-num">{d.usos_actuales}</span>
                              <div className="desc-usos-bar"><div className="desc-usos-fill" style={{ width:`${Math.min((d.usos_actuales/d.limite_usos)*100,100)}%` }} /></div>
                            </div>
                          </td>
                          <td className="desc-td-nowrap"><div className="action-btns"><button className="tbl-btn info" onClick={()=>setInfoDescuento(d)}><i className="bi bi-info-circle"></i> Info</button><button className="tbl-btn edit" onClick={()=>openEdit(d)}><i className="bi bi-pencil"></i></button><button className="tbl-btn delete" onClick={()=>setConfirm({ show:true, id:d.id_descuento })}><i className="bi bi-trash"></i></button></div></td>
                        </tr>
                      )
                    })
              }
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="desc-paginacion">
            <button className="desc-paginacion-btn" onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}><i className="bi bi-chevron-left"></i></button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(page=>(<button key={page} className={`desc-paginacion-page${currentPage===page?' active':''}`} onClick={()=>setCurrentPage(page)}>{page}</button>))}
            <button className="desc-paginacion-btn" onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}><i className="bi bi-chevron-right"></i></button>
          </div>
        )}
      </div>

      {/* Modal de información del descuento */}
      {infoDescuento && (() => {
        const s = badgeStyle(infoDescuento.estado)
        const prendasInfo = (infoDescuento.prendas_ids || []).length
        return (
          <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setInfoDescuento(null)}>
            <div className="modal-box desc-modal-box">
              <button className="modal-close" onClick={()=>setInfoDescuento(null)}><i className="bi bi-x-lg"></i></button>
              <div className="modal-title"><i className="bi bi-info-circle desc-modal-icon"></i> Información del descuento</div>

              <div className="desc-info-header">
                <span className="desc-codigo-badge desc-info-codigo">{infoDescuento.codigo}</span>
                <span className="desc-estado-badge" style={{ background:s.background, color:s.color }}>
                  <span className="desc-estado-dot" style={{ background:s.dot }} />
                  {infoDescuento.estado.charAt(0).toUpperCase()+infoDescuento.estado.slice(1)}
                </span>
              </div>

              <div className="desc-info-grid">
                <div className="desc-info-item">
                  <span className="desc-info-label"><i className="bi bi-card-text"></i> Descripción</span>
                  <span className="desc-info-valor">{infoDescuento.descripcion || '—'}</span>
                </div>
                <div className="desc-info-item">
                  <span className="desc-info-label"><i className="bi bi-percent"></i> Valor del descuento</span>
                  <span className="desc-info-valor">{infoDescuento.valor_descuento}%</span>
                </div>
                <div className="desc-info-item">
                  <span className="desc-info-label"><i className="bi bi-calendar-event"></i> Fecha de inicio</span>
                  <span className="desc-info-valor">{infoDescuento.fecha_inicio?.split('T')[0] || '—'}</span>
                </div>
                <div className="desc-info-item">
                  <span className="desc-info-label"><i className="bi bi-calendar-x"></i> Fecha de cierre</span>
                  <span className="desc-info-valor">{infoDescuento.fecha_cierre?.split('T')[0] || '—'}</span>
                </div>
                <div className="desc-info-item">
                  <span className="desc-info-label"><i className="bi bi-people"></i> Límite de personas</span>
                  <span className="desc-info-valor">{infoDescuento.limite_usos}</span>
                </div>
                <div className="desc-info-item">
                  <span className="desc-info-label"><i className="bi bi-graph-up"></i> Usos actuales</span>
                  <span className="desc-info-valor">{infoDescuento.usos_actuales} / {infoDescuento.limite_usos}</span>
                </div>
                <div className="desc-info-item">
                  <span className="desc-info-label"><i className="bi bi-handbag"></i> Prendas aplicables</span>
                  <span className="desc-info-valor">{prendasInfo} prenda{prendasInfo!==1?'s':''}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={()=>setInfoDescuento(null)}>Cerrar</button>
                <button className="btn-primary" onClick={()=>{ setInfoDescuento(null); openEdit(infoDescuento) }}><i className="bi bi-pencil"></i> Editar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal-box desc-modal-box">
            <button className="modal-close" onClick={()=>setModal(false)}><i className="bi bi-x-lg"></i></button>
            <div className="modal-title"><i className="bi bi-ticket-perforated desc-modal-icon"></i>{' '}{editando?'Editar':'Crear'} Descuento</div>

            <div className="desc-form-grid">

              {!editando && (
                <div className="form-group desc-form-full">
                  <label className="form-label">Código <span className="desc-modal-icon">*</span></label>
                  <input className="form-control desc-input-mono" style={{ borderColor:(errors.codigo||serverError)?'var(--gold)':undefined }} value={form.codigo}
                    onChange={e=>{ const v=e.target.value.toUpperCase(); setForm({...form,codigo:v}); setErrors(er=>({...er,codigo:validateCodigo(v)})); setServerError('') }}
                    onBlur={()=>setErrors(er=>({...er,codigo:validateCodigo(form.codigo)}))} />
                  {errors.codigo && <ErrorMsg msg={errors.codigo} />}
                  {serverError && !errors.codigo && <ErrorMsg msg={serverError} />}
                </div>
              )}

              <div className="form-group desc-form-full">
                <label className="form-label">Descripción <span className="desc-modal-icon">*</span></label>
                <input className="form-control" style={{ borderColor:errors.descripcion?'var(--gold)':undefined }} value={form.descripcion}
                  onChange={e=>{ setForm({...form,descripcion:e.target.value}); setErrors(er=>({...er,descripcion:validateDescripcion(e.target.value)})) }}
                  onBlur={()=>setErrors(er=>({...er,descripcion:validateDescripcion(form.descripcion)}))} />
                <ErrorMsg msg={errors.descripcion} />
              </div>

              <div className="form-group">
                <label className="form-label">Valor (%) <span className="desc-modal-icon">*</span></label>
                <input className="form-control" type="number" min="1" max="25" step="0.01" style={{ borderColor:errors.valor_descuento?'var(--gold)':undefined }} value={form.valor_descuento}
                  onChange={e=>{ const v=e.target.value; if (v===''||parseFloat(v)>=0) { setForm({...form,valor_descuento:v}); setErrors(er=>({...er,valor_descuento:validateValor(v)})) } }}
                  onBlur={()=>setErrors(er=>({...er,valor_descuento:validateValor(form.valor_descuento)}))} />
                <ErrorMsg msg={errors.valor_descuento} />
              </div>

              <div className="form-group">
                <label className="form-label">Límite de personas <span className="desc-modal-icon">*</span></label>
                <input className="form-control" type="number" min="1" step="1" style={{ borderColor:errors.limite_usos?'var(--gold)':undefined }} value={form.limite_usos}
                  onChange={e=>{ const v=e.target.value; if (v===''||parseFloat(v)>=0) { setForm({...form,limite_usos:v}); setErrors(er=>({...er,limite_usos:validateLimite(v)})) } }}
                  onBlur={()=>setErrors(er=>({...er,limite_usos:validateLimite(form.limite_usos)}))} />
                <ErrorMsg msg={errors.limite_usos} />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha inicio <span className="desc-modal-icon">*</span></label>
                <input className="form-control" type="date" style={{ borderColor:errors.fecha_inicio?'var(--gold)':undefined }} value={form.fecha_inicio}
                  onChange={e=>{ const v=e.target.value; setForm(f=>({...f,fecha_inicio:v})); setErrors(er=>({...er,fecha_inicio:validateFechaInicio(v),fecha_cierre:form.fecha_cierre?validateFechaCierre(form.fecha_cierre,v):er.fecha_cierre})) }}
                  onBlur={()=>setErrors(er=>({...er,fecha_inicio:validateFechaInicio(form.fecha_inicio)}))} />
                <ErrorMsg msg={errors.fecha_inicio} />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha cierre <span className="desc-modal-icon">*</span></label>
                <input className="form-control" type="date" style={{ borderColor:errors.fecha_cierre?'var(--gold)':undefined }} value={form.fecha_cierre} min={form.fecha_inicio||undefined}
                  onChange={e=>{ const v=e.target.value; setForm(f=>({...f,fecha_cierre:v})); setErrors(er=>({...er,fecha_cierre:validateFechaCierre(v,form.fecha_inicio)})) }}
                  onBlur={()=>setErrors(er=>({...er,fecha_cierre:validateFechaCierre(form.fecha_cierre,form.fecha_inicio)}))} />
                <ErrorMsg msg={errors.fecha_cierre} />
              </div>

              {editando && (
                <div className="form-group desc-form-full">
                  <label className="form-label">Estado</label>
                  <Dropdown
                    value={form.estado}
                    onChange={v => setForm(f => ({ ...f, estado: v }))}
                    options={ESTADOS_EDIT.map(est => ({ value: est, label: est.charAt(0).toUpperCase() + est.slice(1) }))}
                  />
                  <div className="desc-estado-info"><i className="bi bi-info-circle desc-estado-icon"></i>El estado <strong>Vencido</strong> lo asigna el sistema automáticamente al llegar la fecha de cierre.</div>
                </div>
              )}

              <div className="form-group desc-form-full">
                <label className="form-label">
                  Prendas aplicables <span className="desc-modal-icon">*</span>
                  {form.prendas_ids.length > 0 && (<span className="desc-prendas-count">{form.prendas_ids.length} seleccionada{form.prendas_ids.length!==1?'s':''}</span>)}
                </label>

                <div className="desc-search-wrap">
                  <i className="bi bi-search desc-search-icon"></i>
                  <input className="form-control desc-search-input" value={buscarPrenda} onChange={e=>setBuscarPrenda(e.target.value)} />
                </div>

                <div className={`desc-prendas-grid${errors.prendas_ids?' error':' normal'}`}>
                  {prendasFiltradas.length === 0
                    ? (<div className="desc-prendas-empty">{prendas.length===0 ? <><i className="bi bi-hourglass-split" style={{marginRight:6}}></i>Cargando prendas...</> : <><i className="bi bi-search" style={{marginRight:6}}></i>No se encontraron prendas.</>}</div>)
                    : prendasFiltradas.map(p => {
                        const seleccionada = (form.prendas_ids||[]).includes(p.id_producto)
                        const imgSrc = p.url_imagen ? `http://localhost:3000${p.url_imagen}` : null
                        return (
                          <div key={p.id_producto} className={`desc-prenda-card${seleccionada?' selected':' normal'}`} onClick={()=>togglePrenda(p.id_producto)}>
                            {seleccionada && (<div className="desc-prenda-check"><i className="bi bi-check desc-prenda-check-icon"></i></div>)}
                            <div className="desc-prenda-img-wrap">
                              {imgSrc ? (<img src={imgSrc} alt={p.nombre_producto} className="desc-prenda-img" onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />) : null}
                              <div className="desc-prenda-fallback" style={{ display: imgSrc?'none':'flex' }}><i className="bi bi-bag"></i></div>
                            </div>
                            <div className="desc-prenda-info">
                              <div className="desc-prenda-nombre">{p.nombre_producto}</div>
                              <div className="desc-prenda-precio">${Number(p.precio_unitario).toLocaleString('es-CO')}</div>
                            </div>
                          </div>
                        )
                      })
                  }
                </div>

                <div className="desc-prendas-info"><i className="bi bi-info-circle desc-estado-icon"></i>El descuento solo aplica a las prendas seleccionadas. Cada cliente puede usarlo una única vez.</div>
                <ErrorMsg msg={errors.prendas_ids} />
              </div>

            </div>

            {serverError && editando && <ErrorMsg msg={serverError} />}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save}><i className="bi bi-check-lg"></i> {editando?'Actualizar':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={confirm.show} titulo="¿Eliminar descuento?" mensaje="Esta acción no se puede deshacer. El código de descuento será eliminado permanentemente." onCancel={()=>setConfirm({show:false,id:null})} onConfirm={()=>eliminar(confirm.id)} />
    </>
  )
}
