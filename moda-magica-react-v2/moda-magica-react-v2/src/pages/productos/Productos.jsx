import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ConfirmModal from '../../components/ConfirmModal'

const API            = 'http://localhost:3000'
const API_PRODUCTOS  = `${API}/api/productos`
const API_CATEGORIAS = `${API}/api/categorias`
const API_COLORES    = `${API}/api/colores`
const API_TALLAS     = `${API}/api/tallas`
const API_IMAGENES   = `${API}/api/imagenes`
const ITEMS_PER_PAGE = 4

const formInicial = { nombre:'', id_categoria:'', precio:'', descripcion:'', maneja_serial:false, estado:'activo', colores:[] }

export default function Productos() {
  const [productos, setProductos]         = useState([])
  const [categorias, setCategorias]       = useState([])
  const [coloresDB, setColoresDB]         = useState([])
  const [tallasDB, setTallasDB]           = useState([])
  const [search, setSearch]               = useState('')
  const [filtro, setFiltro]               = useState('Todos')
  const [modal, setModal]                 = useState(false)
  const [editando, setEditando]           = useState(null)
  const [toast, setToast]                 = useState(null)
  const [currentPage, setCurrentPage]     = useState(1)
  const [confirm, setConfirm]             = useState({ show:false, id:null })
  const [loading, setLoading]             = useState(true)
  const [form, setForm]                   = useState(formInicial)
  const [errors, setErrors]               = useState({})
  const [imagenes, setImagenes]           = useState([])
  const [imagenesNuevas, setImagenesNuevas] = useState([])
  const [drag, setDrag]                   = useState(false)
  const [modalColor, setModalColor]       = useState(false)
  const [nuevoColor, setNuevoColor]       = useState({ nombre:'', hex:'#000000' })
  const inputFileRef                      = useRef()

  const cargarDatos = async () => {
    try {
      const [resProd, resCat, resCol, resTal] = await Promise.all([
        axios.get(API_PRODUCTOS),
        axios.get(API_CATEGORIAS),
        axios.get(API_COLORES),
        axios.get(API_TALLAS)
      ])
      const prods = resProd.data.map(p => ({
        id:           p.id_producto,
        nombre:       p.nombre_producto,
        categoria:    p.nombre_categoria,
        id_categoria: p.id_categoria,
        precio:       Number(p.precio_unitario),
        descripcion:  p.descripcion,
        maneja_serial:p.maneja_serial,
        estado:       p.estado,
        colores:      p.colores || []
      }))
      setProductos(prods)
      setCategorias(resCat.data)
      setColoresDB(resCol.data)
      setTallasDB(resTal.data)
    } catch (err) {
      showToast('❌ Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const filtered      = productos.filter(p => {
    const ms = p.nombre.toLowerCase().includes(search.toLowerCase())
    const mf = filtro === 'Todos' || p.categoria === filtro
    return ms && mf
  })
  const totalPages    = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated     = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE)
  const CATS_FILTRO   = ['Todos', ...categorias.map(c => c.nombre_categoria)]

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const validar = () => {
    const e = {}
    if (!form.nombre.trim())  e.nombre      = 'El nombre es obligatorio.'
    if (!form.id_categoria)   e.id_categoria = 'La categoría es obligatoria.'
    if (!form.precio)         e.precio       = 'El precio es obligatorio.'
    else if (isNaN(form.precio) || Number(form.precio) < 0)
      e.precio = 'El precio debe ser mayor o igual a 0.'
    if (form.colores.length === 0) e.colores = 'Debes agregar al menos un color.'
    else {
      form.colores.forEach(c => {
        if (c.tallas.length === 0)
          e[`tallas_${c.id_color}`] = `El color ${c.nombre_color} debe tener al menos una talla.`
      })
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputStyle = campo => ({ borderColor: errors[campo] ? 'var(--gold)' : undefined })

  const errorMsg = campo => errors[campo]
    ? <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, fontSize:12, color:'var(--gold)', fontWeight:500 }}>
        <i className="bi bi-exclamation-circle"></i> {errors[campo]}
      </div>
    : null

  const openAdd = () => {
    setEditando(null)
    setForm({ ...formInicial, id_categoria: categorias[0]?.id_categoria || '' })
    setErrors({})
    setImagenes([])
    setImagenesNuevas([])
    setModalColor(false)
    setNuevoColor({ nombre:'', hex:'#000000' })
    setModal(true)
  }

  const openEdit = async p => {
    setEditando(p.id)
    setForm({
      nombre:        p.nombre,
      id_categoria:  p.id_categoria,
      precio:        p.precio,
      descripcion:   p.descripcion || '',
      maneja_serial: p.maneja_serial,
      estado:        p.estado,
      colores:       p.colores.map(c => ({
        id_producto_color: c.id_producto_color,
        id_color:          c.id_color,
        nombre_color:      c.nombre_color,
        hex_code:          c.hex_code,
        tallas:            c.tallas || []
      }))
    })
    setErrors({})
    setImagenesNuevas([])
    setModalColor(false)
    setNuevoColor({ nombre:'', hex:'#000000' })
    try {
      const res = await axios.get(`${API_IMAGENES}/${p.id}`)
      setImagenes(res.data)
    } catch { setImagenes([]) }
    setModal(true)
  }

  // ── Colores ──────────────────────────────────────────
  const agregarColor = color => {
    if (form.colores.find(c => c.id_color === color.id_color))
      return showToast('⚠️ Ese color ya fue agregado.')
    setForm(prev => ({
      ...prev,
      colores: [...prev.colores, {
        id_producto_color: null,
        id_color:     color.id_color,
        nombre_color: color.nombre_color,
        hex_code:     color.hex_code,
        tallas:       []
      }]
    }))
    setErrors(prev => { const e = {...prev}; delete e.colores; return e })
  }

  const quitarColor = id_color => {
    setForm(prev => ({ ...prev, colores: prev.colores.filter(c => c.id_color !== id_color) }))
  }

  const crearColor = async () => {
    if (!nuevoColor.nombre.trim())
      return showToast('❌ El nombre del color es obligatorio.')
    if (!/^#[0-9A-Fa-f]{6}$/.test(nuevoColor.hex))
      return showToast('❌ El código hex no es válido.')
    try {
      const res = await axios.post(API_COLORES, {
        nombre_color: nuevoColor.nombre.trim(),
        hex_code:     nuevoColor.hex
      })
      const colorCreado = res.data
      setColoresDB(prev => [...prev, colorCreado])
      agregarColor(colorCreado)
      setNuevoColor({ nombre:'', hex:'#000000' })
      setModalColor(false)
      showToast('✅ Color creado y agregado')
    } catch (err) {
      showToast(`❌ ${err.response?.data?.error || 'Error al crear color'}`)
    }
  }

  // ── Tallas ───────────────────────────────────────────
  const agregarTalla = (id_color, talla) => {
    setForm(prev => ({
      ...prev,
      colores: prev.colores.map(c => {
        if (c.id_color !== id_color) return c
        if (c.tallas.find(t => t.id_talla === talla.id_talla)) return c
        return { ...c, tallas: [...c.tallas, { id_talla: talla.id_talla, nombre_talla: talla.nombre_talla, stock_actual: 0 }] }
      })
    }))
    setErrors(prev => { const e = {...prev}; delete e[`tallas_${id_color}`]; return e })
  }

  const quitarTalla = (id_color, id_talla) => {
    setForm(prev => ({
      ...prev,
      colores: prev.colores.map(c =>
        c.id_color === id_color ? { ...c, tallas: c.tallas.filter(t => t.id_talla !== id_talla) } : c
      )
    }))
  }

  const actualizarStock = (id_color, id_talla, valor) => {
    setForm(prev => ({
      ...prev,
      colores: prev.colores.map(c =>
        c.id_color === id_color
          ? { ...c, tallas: c.tallas.map(t => t.id_talla === id_talla ? { ...t, stock_actual: Number(valor) } : t) }
          : c
      )
    }))
  }

  // ── Imágenes ─────────────────────────────────────────
  const procesarArchivos = files => {
    const validos = Array.from(files).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
    if (validos.length === 0) return showToast('⚠️ Solo se permiten imágenes jpg, png o webp.')
    setImagenesNuevas(prev => [...prev, ...validos.map(f => ({ file: f, preview: URL.createObjectURL(f) }))])
  }

  const onDrop = e => { e.preventDefault(); setDrag(false); procesarArchivos(e.dataTransfer.files) }

  const quitarImagenNueva    = idx  => setImagenes(prev => prev.filter((_,i) => i !== idx))
  const eliminarImagenExistente = async id_imagen => {
    try {
      await axios.delete(`${API_IMAGENES}/${id_imagen}`)
      setImagenes(prev => prev.filter(i => i.id_imagen !== id_imagen))
    } catch { showToast('❌ Error al eliminar imagen') }
  }
  const setPrincipal = async id_imagen => {
    try {
      await axios.put(`${API_IMAGENES}/principal/${id_imagen}`)
      setImagenes(prev => prev.map(i => ({ ...i, es_principal: i.id_imagen === id_imagen ? 1 : 0 })))
    } catch { showToast('❌ Error al actualizar imagen principal') }
  }

  // ── Guardar ──────────────────────────────────────────
  const save = async () => {
    if (!validar()) return
    try {
      const payload = {
        nombre_producto: form.nombre,
        id_categoria:    form.id_categoria,
        descripcion:     form.descripcion,
        precio_unitario: form.precio,
        maneja_serial:   form.maneja_serial,
        estado:          form.estado,
        colores:         form.colores
      }
      let id_producto = editando
      if (editando) {
        await axios.put(`${API_PRODUCTOS}/${editando}`, payload)
        showToast('✅ Producto actualizado')
      } else {
        const res = await axios.post(API_PRODUCTOS, payload)
        id_producto = res.data.id_producto
        showToast('✅ Producto creado')
      }
      if (imagenesNuevas.length > 0) {
        const fd = new FormData()
        imagenesNuevas.forEach(img => fd.append('imagenes', img.file))
        await axios.post(`${API_IMAGENES}/${id_producto}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      await cargarDatos()
      setModal(false)
    } catch (err) {
      showToast(`❌ ${err.response?.data?.error || 'Error al guardar'}`)
    }
  }

  const eliminar = async id => {
    try {
      await axios.delete(`${API_PRODUCTOS}/${id}`)
      showToast('🗑️ Producto eliminado')
      await cargarDatos()
    } catch (err) {
      showToast(`❌ ${err.response?.data?.error || 'Error al eliminar'}`)
    }
    setConfirm({ show:false, id:null })
  }

  const estadoCls = e => e==='activo'?'status-active':e==='agotado'?'status-cancelled':'status-inactivo'

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h1>Productos</h1><p>Gestiona el catálogo de productos.</p></div>
        <div className="page-actions">
          <button className="btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> Nuevo Producto</button>
        </div>
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:18, alignItems:'center' }}>
          <div className="search-input-wrap">
            <i className="bi bi-search"></i>
            <input className="search-input" placeholder="Buscar producto..." value={search}
              onChange={e=>{ setSearch(e.target.value); setCurrentPage(1) }} />
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {CATS_FILTRO.map(c=>(
              <button key={c} onClick={()=>{ setFiltro(c); setCurrentPage(1) }}
                style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)',
                  background:filtro===c?'var(--accent)':'var(--card)',
                  color:filtro===c?'white':'var(--text-secondary)', fontWeight:600, fontSize:12, cursor:'pointer' }}>
                {c}
              </button>
            ))}
          </div>
          <span style={{ marginLeft:'auto', fontSize:13, color:'var(--text-secondary)' }}>{filtered.length} resultado(s)</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Colores</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6}><div className="empty-state">Cargando...</div></td></tr>
                : paginated.length===0
                  ? <tr><td colSpan={6}><div className="empty-state"><i className="bi bi-box-seam"></i>No se encontraron productos</div></td></tr>
                  : paginated.map(p=>(
                    <tr key={p.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:44, height:44, borderRadius:10, background:'var(--hover)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>👗</div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:14 }}>{p.nombre}</div>
                            <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:2 }}>{p.descripcion || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ background:'rgba(201,150,42,0.1)', color:'#a67820', padding:'3px 9px', borderRadius:6, fontSize:12, fontWeight:600 }}>{p.categoria}</span></td>
                      <td style={{ fontWeight:700 }}>${p.precio.toLocaleString('es-CO')}</td>
                      <td>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {p.colores.length === 0
                            ? <span style={{ fontSize:12, color:'var(--text-secondary)' }}>Sin colores</span>
                            : p.colores.map(c=>(
                              <div key={c.id_color} title={c.nombre_color}
                                style={{ width:20, height:20, borderRadius:'50%', background:c.hex_code, border:'1.5px solid var(--border)' }} />
                            ))
                          }
                        </div>
                      </td>
                      <td><span className={`status-badge ${estadoCls(p.estado)}`}>{p.estado.charAt(0).toUpperCase()+p.estado.slice(1)}</span></td>
                      <td>
                        <div className="action-btns">
                          <button className="tbl-btn edit" onClick={()=>openEdit(p)}><i className="bi bi-pencil"></i></button>
                          <button className="tbl-btn delete" onClick={()=>setConfirm({ show:true, id:p.id })}><i className="bi bi-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {totalPages>1 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:6, marginTop:18 }}>
            <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} style={{ width:34,height:34,borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',cursor:currentPage===1?'not-allowed':'pointer',opacity:currentPage===1?0.4:1,display:'flex',alignItems:'center',justifyContent:'center' }}><i className="bi bi-chevron-left"></i></button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(page=>(
              <button key={page} onClick={()=>setCurrentPage(page)} style={{ width:34,height:34,borderRadius:8,border:'1px solid var(--border)',background:currentPage===page?'var(--accent)':'var(--card)',color:currentPage===page?'white':'var(--text)',fontWeight:600,fontSize:13,cursor:'pointer' }}>{page}</button>
            ))}
            <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} style={{ width:34,height:34,borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',cursor:currentPage===totalPages?'not-allowed':'pointer',opacity:currentPage===totalPages?0.4:1,display:'flex',alignItems:'center',justifyContent:'center' }}><i className="bi bi-chevron-right"></i></button>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal-box" style={{ maxWidth:600, maxHeight:'90vh', overflowY:'auto' }}>
            <button className="modal-close" onClick={()=>setModal(false)}><i className="bi bi-x-lg"></i></button>
            <div className="modal-title"><i className="bi bi-bag" style={{ color:'var(--gold)' }}></i> {editando?'Editar':'Nuevo'} Producto</div>

            {/* Info básica */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Nombre <span style={{ color:'var(--gold)' }}>*</span></label>
                <input className="form-control" style={inputStyle('nombre')} value={form.nombre}
                  onChange={e=>{ setForm({...form,nombre:e.target.value}); setErrors(p=>({...p,nombre:''})) }}
                  placeholder="Nombre del producto" />
                {errorMsg('nombre')}
              </div>

              <div className="form-group">
                <label className="form-label">Categoría <span style={{ color:'var(--gold)' }}>*</span></label>
                <select className="form-control" style={inputStyle('id_categoria')} value={form.id_categoria}
                  onChange={e=>{ setForm({...form,id_categoria:e.target.value}); setErrors(p=>({...p,id_categoria:''})) }}>
                  <option value="">Selecciona una categoría</option>
                  {categorias.map(c=><option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
                </select>
                {errorMsg('id_categoria')}
              </div>

              <div className="form-group">
                <label className="form-label">Precio (COP) <span style={{ color:'var(--gold)' }}>*</span></label>
                <input className="form-control" type="number" style={inputStyle('precio')} value={form.precio}
                  onChange={e=>{ setForm({...form,precio:e.target.value}); setErrors(p=>({...p,precio:''})) }}
                  placeholder="129900" />
                {errorMsg('precio')}
              </div>

              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Descripción</label>
                <textarea className="form-control" rows={2} value={form.descripcion}
                  onChange={e=>setForm({...form,descripcion:e.target.value})}
                  placeholder="Descripción del producto" style={{ resize:'vertical' }} />
              </div>

              {editando && (
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select className="form-control" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              )}

              <div className="form-group" style={{ display:'flex', alignItems:'center', gap:8, marginTop: editando ? 0 : 24 }}>
                <input type="checkbox" id="maneja_serial" checked={!!form.maneja_serial}
                  onChange={e=>setForm({...form,maneja_serial:e.target.checked})} />
                <label htmlFor="maneja_serial" className="form-label" style={{ margin:0, cursor:'pointer' }}>Maneja serial</label>
              </div>
            </div>

            {/* Imágenes */}
            <div style={{ marginTop:18, borderTop:'1px solid var(--border)', paddingTop:14 }}>
              <label className="form-label" style={{ marginBottom:8, display:'block' }}>Imágenes del producto</label>
              <div onDragOver={e=>{ e.preventDefault(); setDrag(true) }} onDragLeave={()=>setDrag(false)} onDrop={onDrop}
                onClick={()=>inputFileRef.current.click()}
                style={{ border:`2px dashed ${drag?'var(--accent)':'var(--border)'}`, borderRadius:10, padding:'20px',
                  textAlign:'center', cursor:'pointer', background: drag?'rgba(201,150,42,0.05)':'var(--hover)', transition:'all 0.2s', marginBottom:12 }}>
                <i className="bi bi-cloud-upload" style={{ fontSize:24, color:'var(--text-secondary)' }}></i>
                <p style={{ fontSize:13, color:'var(--text-secondary)', margin:'6px 0 0' }}>
                  Arrastra imágenes aquí o <span style={{ color:'var(--gold)', fontWeight:600 }}>haz clic para seleccionar</span>
                </p>
                <p style={{ fontSize:11, color:'var(--text-secondary)', margin:'4px 0 0' }}>JPG, PNG o WEBP</p>
                <input ref={inputFileRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp"
                  style={{ display:'none' }} onChange={e=>procesarArchivos(e.target.files)} />
              </div>

              {/* Imágenes existentes */}
              {imagenes.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                  {imagenes.map(img=>(
                    <div key={img.id_imagen} style={{ position:'relative', width:80, height:80 }}>
                      <img src={`${API}${img.url_imagen}`} alt={img.alt_text}
                        style={{ width:80, height:80, borderRadius:8, objectFit:'cover',
                          border: img.es_principal ? '2.5px solid var(--gold)' : '1.5px solid var(--border)' }} />
                      {img.es_principal && (
                        <span style={{ position:'absolute', top:2, left:2, background:'var(--gold)', color:'white',
                          fontSize:9, fontWeight:700, padding:'1px 4px', borderRadius:4 }}>PRINCIPAL</span>
                      )}
                      <div style={{ position:'absolute', top:2, right:2, display:'flex', flexDirection:'column', gap:3 }}>
                        {!img.es_principal && (
                          <button onClick={()=>setPrincipal(img.id_imagen)} title="Hacer principal"
                            style={{ width:20, height:20, borderRadius:4, border:'none', background:'var(--gold)',
                              color:'white', cursor:'pointer', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <i className="bi bi-star-fill"></i>
                          </button>
                        )}
                        <button onClick={()=>eliminarImagenExistente(img.id_imagen)}
                          style={{ width:20, height:20, borderRadius:4, border:'none', background:'#ef4444',
                            color:'white', cursor:'pointer', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Imágenes nuevas preview */}
              {imagenesNuevas.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {imagenesNuevas.map((img,idx)=>(
                    <div key={idx} style={{ position:'relative', width:80, height:80 }}>
                      <img src={img.preview} alt="preview"
                        style={{ width:80, height:80, borderRadius:8, objectFit:'cover',
                          border:'1.5px dashed var(--accent)', opacity:0.85 }} />
                      <button onClick={()=>quitarImagenNueva(idx)}
                        style={{ position:'absolute', top:2, right:2, width:20, height:20, borderRadius:4,
                          border:'none', background:'#ef4444', color:'white', cursor:'pointer', fontSize:10,
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colores */}
            <div style={{ marginTop:18, borderTop:'1px solid var(--border)', paddingTop:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <label className="form-label" style={{ margin:0 }}>
                  Colores <span style={{ color:'var(--gold)' }}>*</span>
                </label>
                <button onClick={()=>setModalColor(prev=>!prev)}
                  style={{ fontSize:12, padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)',
                    background:'var(--card)', color:'var(--gold)', fontWeight:600, cursor:'pointer' }}>
                  <i className="bi bi-plus-lg"></i> Nuevo color
                </button>
              </div>

              {/* Formulario nuevo color */}
              {modalColor && (
                <div style={{ background:'var(--hover)', border:'1px solid var(--border)', borderRadius:10,
                  padding:'12px', marginBottom:12, display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:140 }}>
                    <label className="form-label" style={{ fontSize:12 }}>Nombre del color</label>
                    <input className="form-control" value={nuevoColor.nombre}
                      onChange={e=>setNuevoColor(prev=>({...prev,nombre:e.target.value}))}
                      placeholder="Ej: Turquesa oscuro" style={{ fontSize:13 }} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize:12 }}>Color</label>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input type="color" value={nuevoColor.hex}
                        onChange={e=>setNuevoColor(prev=>({...prev,hex:e.target.value}))}
                        style={{ width:40, height:36, borderRadius:6, border:'1px solid var(--border)',
                          padding:2, cursor:'pointer', background:'none' }} />
                      <input className="form-control" value={nuevoColor.hex}
                        onChange={e=>setNuevoColor(prev=>({...prev,hex:e.target.value}))}
                        placeholder="#FF5733" style={{ width:100, fontSize:13, fontFamily:'monospace' }} />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={crearColor} className="btn-primary" style={{ fontSize:12, padding:'6px 14px' }}>
                      <i className="bi bi-check-lg"></i> Agregar
                    </button>
                    <button onClick={()=>{ setModalColor(false); setNuevoColor({ nombre:'', hex:'#000000' }) }}
                      className="btn-secondary" style={{ fontSize:12, padding:'6px 14px' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Círculos de colores */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                {coloresDB.map(c=>{
                  const agregado = form.colores.find(fc=>fc.id_color===c.id_color)
                  return (
                    <button key={c.id_color} onClick={()=>agregarColor(c)} title={c.nombre_color}
                      style={{ width:28, height:28, borderRadius:'50%', background:c.hex_code,
                        border: agregado ? '3px solid var(--accent)' : '2px solid var(--border)',
                        cursor: agregado ? 'default' : 'pointer', opacity: agregado ? 0.5 : 1 }} />
                  )
                })}
              </div>
              {errorMsg('colores')}

              {/* Colores agregados con tallas */}
              {form.colores.map(c=>(
                <div key={c.id_color} style={{ background:'var(--hover)', borderRadius:10, padding:'12px', marginTop:10,
                  border: errors[`tallas_${c.id_color}`] ? '1px solid var(--gold)' : '1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', background:c.hex_code, border:'1.5px solid var(--border)' }} />
                      <span style={{ fontWeight:600, fontSize:13 }}>{c.nombre_color}</span>
                      <span style={{ fontSize:11, color:'var(--text-secondary)' }}>
                        Stock total: {c.tallas.reduce((a,t)=>a+Number(t.stock_actual),0)} uds
                      </span>
                    </div>
                    <button onClick={()=>quitarColor(c.id_color)}
                      style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:14 }}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>

                  {/* Tallas disponibles */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
                    {tallasDB.map(t=>{
                      const agregada = c.tallas.find(ct=>ct.id_talla===t.id_talla)
                      return (
                        <button key={t.id_talla} onClick={()=>agregarTalla(c.id_color, t)}
                          style={{ padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600,
                            cursor: agregada ? 'default' : 'pointer',
                            border: agregada ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                            background: agregada ? 'rgba(201,150,42,0.15)' : 'var(--card)',
                            color: agregada ? 'var(--gold)' : 'var(--text-secondary)',
                            opacity: agregada ? 0.6 : 1 }}>
                          {t.nombre_talla}
                        </button>
                      )
                    })}
                  </div>

                  {errors[`tallas_${c.id_color}`] && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, fontSize:12, color:'var(--gold)', fontWeight:500 }}>
                      <i className="bi bi-exclamation-circle"></i> {errors[`tallas_${c.id_color}`]}
                    </div>
                  )}

                  {/* Stock por talla */}
                  {c.tallas.length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {c.tallas.map(t=>(
                        <div key={t.id_talla} style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:12, fontWeight:600, width:40, textAlign:'center',
                            background:'var(--card)', border:'1px solid var(--border)', borderRadius:6, padding:'3px 0' }}>
                            {t.nombre_talla}
                          </span>
                          <input type="number" min="0" value={t.stock_actual}
                            onChange={e=>actualizarStock(c.id_color, t.id_talla, e.target.value)}
                            style={{ width:80, padding:'4px 8px', borderRadius:6, border:'1px solid var(--border)',
                              background:'var(--card)', color:'var(--text)', fontSize:13, textAlign:'center' }} />
                          <span style={{ fontSize:11, color:'var(--text-secondary)' }}>uds</span>
                          <button onClick={()=>quitarTalla(c.id_color, t.id_talla)}
                            style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:13 }}>
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save}><i className="bi bi-check-lg"></i> {editando?'Actualizar':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={confirm.show} titulo="¿Eliminar producto?" mensaje="Esta acción no se puede deshacer. El producto será eliminado del catálogo."
        onCancel={()=>setConfirm({show:false,id:null})}
        onConfirm={()=>eliminar(confirm.id)} />

      {toast && <div className="toast"><i className="bi bi-check-circle-fill"></i> {toast}</div>}
    </>
  )
}