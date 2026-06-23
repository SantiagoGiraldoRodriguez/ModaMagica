import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ConfirmModal from '../../components/ConfirmModal'
import './Productos.css'

const API = import.meta.env.VITE_API_URL
const API_PRODUCTOS  = `${API}/api/productos`
const API_CATEGORIAS = `${API}/api/categorias`
const API_COLORES    = `${API}/api/colores`
const API_TALLAS     = `${API}/api/tallas`
const API_IMAGENES   = `${API}/api/imagenes`

const ITEMS_PER_PAGE = 4

const GRUPOS_TALLAS = [
  { id:'ropa',           label:'Ropa adulto',      tallas:['XS','S','M','L','XL','XXL','XXXL','XXXXL','XXXXXL'] },
  { id:'bebes',          label:'Bebés',             tallas:['0-3','3-6','6-9','9-12','12-18','18-24'] },
  { id:'ninos',          label:'Niños',             tallas:['2','4','6','8','10','12','14','16','18'] },
  { id:'zapatos_ninos',  label:'Zapatos niños',     tallas:['21','22','23','24','25','26','27','28','29','30','31','32','33'] },
  { id:'zapatos_adulto', label:'Zapatos adulto',    tallas:['34','35','36','37','38','39','40','41','42','43','44','45'] },
  { id:'pantalones',     label:'Pantalones adulto', tallas:['6','8','10','12','14','16','18','20','22','24','28','30','32','34','36','38','40','42','44','46','48','50','52','54'] },
  { id:'conjuntos',      label:'Conjuntos',         tallas:['SM','ML','LXL'] },
  { id:'tendidos',       label:'Tendidos',          tallas:['100x190','120x190','140x190','160x190','200x200'] },
  { id:'toallas',        label:'Toallas',           tallas:['40x70','70x130','90x160'] },
]

const formInicial = { nombre:'', categorias:[], precio:'', descripcion:'', estado:'activo', colores:[] }

const Dropdown = ({ value, options, onChange, placeholder }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handleClickOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="prod-dropdown" ref={ref}>
      <button type="button" className={`prod-dropdown-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className={selected ? '' : 'prod-dropdown-placeholder'}>{selected ? selected.label : placeholder}</span>
        <i className="bi bi-chevron-down prod-dropdown-chevron"></i>
      </button>
      {open && (
        <ul className="prod-dropdown-menu">
          {options.map(opt => (
            <li
              key={opt.value}
              className={`prod-dropdown-item${opt.value === value ? ' active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
              {opt.value === value && <i className="bi bi-check-lg prod-dropdown-check"></i>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Productos() {
  const [productos, setProductos]       = useState([])
  const [categorias, setCategorias]     = useState([])
  const [coloresDB, setColoresDB]       = useState([])
  const [tallasDB, setTallasDB]         = useState([])
  const [search, setSearch]             = useState('')
  const [modal, setModal]               = useState(false)
  const [editando, setEditando]         = useState(null)
  const [currentPage, setCurrentPage]   = useState(1)
  const [confirm, setConfirm]           = useState({ show:false, id:null })
  const [loading, setLoading]           = useState(true)
  const [form, setForm]                 = useState(formInicial)
  const [errors, setErrors]             = useState({})
  const [imagenes, setImagenes]         = useState([])
  const [imagenesNuevas, setImagenesNuevas] = useState([])
  const [drag, setDrag]                 = useState(false)
  const [modalColor, setModalColor]     = useState(false)
  const [nuevoColor, setNuevoColor]     = useState({ nombre:'', hex:'#000000' })
  const [grupoActivoColor, setGrupoActivoColor] = useState({})
  const [nuevaTalla, setNuevaTalla]     = useState('')
  const [nuevaTallaGrupo, setNuevaTallaGrupo] = useState('')
  const [gruposExtra, setGruposExtra]   = useState([])
  const [serverError, setServerError]   = useState('')
  const inputFileRef = useRef()

  const getImageUrl = imagen => {
    if (!imagen) return null
    if (imagen.startsWith('http')) return imagen
    return `${API}${imagen.startsWith('/')?'':'/'}${imagen}`
  }

  const cargarDatos = async () => {
    try {
      const [resProd, resCat, resCol, resTal] = await Promise.all([
        axios.get(API_PRODUCTOS), axios.get(API_CATEGORIAS), axios.get(API_COLORES), axios.get(API_TALLAS)
      ])
      const listado = resProd.data.productos ?? resProd.data
      const productosConImagenes = await Promise.all(listado.map(async p => {
        let imagenPrincipal = p.imagen_principal || null
        if (!imagenPrincipal) {
          try {
            const resImg = await axios.get(`${API_IMAGENES}/${p.id_producto}`)
            const imgs = resImg.data
            const principal = imgs.find(i => i.es_principal===1||i.es_principal===true)
            imagenPrincipal = principal?.url_imagen || imgs[0]?.url_imagen || null
          } catch { imagenPrincipal = null }
        }
        return { id:p.id_producto, nombre:p.nombre_producto, categorias:p.categorias||[], precio:Number(p.precio_unitario), descripcion:p.descripcion, estado:p.estado, colores:p.colores||[], stock_total:Number(p.stock_total||0), imagen:imagenPrincipal, variantes:p.variantes||[] }
      }))
      setProductos(productosConImagenes)
      setCategorias(resCat.data.filter(c => c.estado==='activo'))
      setColoresDB(resCol.data)
      setTallasDB(resTal.data)
    } catch (err) { console.error('Error cargarDatos:', err.response?.data||err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargarDatos() }, [])

  const filtrado   = productos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.ceil(filtrado.length / ITEMS_PER_PAGE)
  const paginado   = filtrado.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE)

  const tallasPersonalizadasPorGrupo = () => {
    const mapa = {}
    tallasDB.forEach(t => {
      if (!t.grupo) return
      if (!mapa[t.grupo]) mapa[t.grupo] = []
      if (!mapa[t.grupo].includes(t.nombre_talla)) mapa[t.grupo].push(t.nombre_talla)
    })
    return mapa
  }

  const todosLosGrupos = () => {
    const personalizadas = tallasPersonalizadasPorGrupo()
    const gruposBase = GRUPOS_TALLAS.map(g => ({
      ...g,
      tallas: [...g.tallas, ...(personalizadas[g.id]||[]).filter(t=>!g.tallas.includes(t))]
    }))
    const idsBase = new Set(GRUPOS_TALLAS.map(g=>g.id))
    const gruposNuevos = Object.keys(personalizadas)
      .filter(id => !idsBase.has(id))
      .map(id => ({ id, label:id, tallas:personalizadas[id] }))
    return gruposBase.concat(gruposNuevos)
  }

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio.'
    if (form.categorias.length===0) e.categorias = 'Selecciona al menos una categoría.'
    if (!form.precio) e.precio = 'El precio es obligatorio.'
    else if (isNaN(form.precio)||Number(form.precio)<0) e.precio = 'El precio debe ser mayor o igual a 0.'
    if (form.colores.length===0) e.colores = 'Agrega al menos un color.'
    else { form.colores.forEach(c => { if (c.tallas.length===0) e[`tallas_${c.id_color}`]=`El color "${c.nombre_color}" debe tener al menos una talla.` }) }
    setErrors(e)
    if (Object.keys(e).length>0) {
      setServerError('Hay campos sin completar. Revisa los mensajes marcados en rojo en el formulario (nombre, precio, categorías o tallas de cada color).')
      return false
    }
    setServerError('')
    return true
  }

  const inputStyle = campo => ({ borderColor: errors[campo] ? 'var(--gold)' : undefined })
  const errorMsg   = campo => errors[campo] ? <div className="prod-error-msg"><i className="bi bi-exclamation-circle"></i> {errors[campo]}</div> : null

  const openAdd = () => {
    setEditando(null); setForm({...formInicial}); setErrors({}); setImagenes([]); setImagenesNuevas([])
    setModalColor(false); setNuevoColor({nombre:'',hex:'#000000'}); setGrupoActivoColor({})
    setNuevaTalla(''); setNuevaTallaGrupo(''); setServerError(''); setModal(true)
  }

  const openEdit = async p => {
    setEditando(p.id)
    const coloresForm = p.colores.map(c => ({
      id_color:     c.id_color,
      nombre_color: c.nombre_color,
      hex_code:     c.hex_code,
      tallas: (c.tallas||[]).map(t => ({
        id_talla:     t.id_talla,
        nombre_talla: t.nombre_talla,
        stock_actual: Number(t.stock_actual ?? 0),
        id_variante:  t.id_variante ?? null
      }))
    }))
    setForm({ nombre:p.nombre, categorias:p.categorias.map(c=>c.id_categoria), precio:p.precio, descripcion:p.descripcion||'', estado:p.estado, colores:coloresForm })
    setErrors({}); setImagenesNuevas([]); setModalColor(false); setNuevoColor({nombre:'',hex:'#000000'}); setGrupoActivoColor({}); setNuevaTalla(''); setNuevaTallaGrupo(''); setServerError('')
    try { const res = await axios.get(`${API_IMAGENES}/${p.id}`); setImagenes(res.data) } catch { setImagenes([]) }
    setModal(true)
  }

  const toggleCategoria = id_categoria => {
    setForm(prev => ({ ...prev, categorias: prev.categorias.includes(id_categoria) ? prev.categorias.filter(id=>id!==id_categoria) : [...prev.categorias,id_categoria] }))
    setErrors(prev => { const e={...prev}; delete e.categorias; return e })
  }

  const agregarColor = color => {
    if (form.colores.find(c=>c.id_color===color.id_color)) return
    setForm(prev => ({ ...prev, colores:[...prev.colores,{id_color:color.id_color,nombre_color:color.nombre_color,hex_code:color.hex_code,tallas:[]}] }))
    setErrors(prev => { const e={...prev}; delete e.colores; return e })
  }

  const quitarColor = id_color => setForm(prev => ({ ...prev, colores:prev.colores.filter(c=>c.id_color!==id_color) }))

  const crearColor = async () => {
    if (!nuevoColor.nombre.trim()) return
    if (!/^#[0-9A-Fa-f]{6}$/.test(nuevoColor.hex)) return
    try {
      const res = await axios.post(API_COLORES,{nombre_color:nuevoColor.nombre.trim(),hex_code:nuevoColor.hex})
      setColoresDB(prev=>[...prev,res.data]); agregarColor(res.data); setNuevoColor({nombre:'',hex:'#000000'}); setModalColor(false)
    } catch (err) { console.error('Error crearColor:', err.response?.data||err.message) }
  }

  const agregarTalla = (id_color, talla) => {
    setForm(prev => ({ ...prev, colores:prev.colores.map(c => { if (c.id_color!==id_color) return c; if (c.tallas.find(t=>t.id_talla===talla.id_talla)) return c; return {...c,tallas:[...c.tallas,{id_talla:talla.id_talla,nombre_talla:talla.nombre_talla,stock_actual:0,id_variante:null}]} }) }))
    setErrors(prev => { const e={...prev}; delete e[`tallas_${id_color}`]; return e })
  }

  const quitarTalla   = (id_color,id_talla) => setForm(prev => ({ ...prev, colores:prev.colores.map(c=>c.id_color===id_color?{...c,tallas:c.tallas.filter(t=>t.id_talla!==id_talla)}:c) }))
  const actualizarStock=(id_color,id_talla,valor)=>setForm(prev=>({...prev,colores:prev.colores.map(c=>c.id_color===id_color?{...c,tallas:c.tallas.map(t=>t.id_talla===id_talla?{...t,stock_actual:Number(valor)}:t)}:c)}))

  const crearTallaPersonalizada = async () => {
    if (!nuevaTalla.trim()) return
    try {
      const res = await axios.post(API_TALLAS,{nombre_talla:nuevaTalla.trim(), grupo:nuevaTallaGrupo||null})
      const tallaNueva = res.data
      setTallasDB(prev=>[...prev,tallaNueva])
      setNuevaTalla(''); setNuevaTallaGrupo('')
    } catch (err) { alert(err.response?.data?.error||'Error al crear la talla') }
  }

  const procesarArchivos = files => {
    const validos = Array.from(files).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f.name))
    if (!validos.length) return
    setImagenesNuevas(prev=>[...prev,...validos.map(f=>({file:f,preview:URL.createObjectURL(f)}))])
  }

  const onDrop = e => { e.preventDefault(); setDrag(false); procesarArchivos(e.dataTransfer.files) }
  const quitarImagenNueva = idx => setImagenesNuevas(prev=>prev.filter((_,i)=>i!==idx))

  const eliminarImagenExistente = async id_imagen => {
    try { await axios.delete(`${API_IMAGENES}/${id_imagen}`); setImagenes(prev=>prev.filter(i=>i.id_imagen!==id_imagen)) }
    catch (err) { console.error('Error eliminarImagen:', err.response?.data||err.message) }
  }

  const setPrincipal = async id_imagen => {
    try { await axios.put(`${API_IMAGENES}/principal/${id_imagen}`); setImagenes(prev=>prev.map(i=>({...i,es_principal:i.id_imagen===id_imagen?1:0}))) }
    catch (err) { console.error('Error setPrincipal:', err.response?.data||err.message) }
  }

  // ─── FIX PRINCIPAL: se incluye id_variante en cada variante para que el
  // backend pueda hacer UPDATE en lugar de INSERT cuando ya existe ───────────
  const save = async () => {
    if (!validar()) return
    try {
      const variantes = []
      form.colores.forEach(c => {
        c.tallas.forEach(t => {
          variantes.push({
            ...(t.id_variante ? { id_variante: t.id_variante } : {}),
            id_color:     c.id_color,
            id_talla:     t.id_talla,
            stock_actual: t.stock_actual,
            precio_extra: 0
          })
        })
      })
      const payload = {
        nombre_producto:  form.nombre,
        categorias:       form.categorias,
        descripcion:      form.descripcion,
        precio_unitario:  form.precio,
        estado:           form.estado,
        variantes
      }
      let id_producto = editando
      if (editando) {
        await axios.put(`${API_PRODUCTOS}/${editando}`, payload)
      } else {
        const res = await axios.post(API_PRODUCTOS, payload)
        id_producto = res.data.id_producto
      }
      if (imagenesNuevas.length > 0) {
        const fd = new FormData()
        imagenesNuevas.forEach(img => fd.append('imagenes', img.file))
        await axios.post(`${API_IMAGENES}/${id_producto}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      await cargarDatos()
      setModal(false)
    } catch (err) {
      console.error('Error save:', err.response?.data || err.message)
      const status = err.response?.status
      const msg = err.response?.data?.error || err.response?.data?.message
        || (status === 404
          ? `No se encontró el producto (404). Puede que ya haya sido eliminado o el ID no sea válido.`
          : status
            ? `Error ${status} al ${editando ? 'actualizar' : 'crear'} el producto.`
            : 'No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté activo.')
      setServerError(msg)
    }
  }

  const eliminar = async id => {
    try { await axios.delete(`${API_PRODUCTOS}/${id}`); await cargarDatos() }
    catch (err) { console.error('Error eliminar:', err.response?.data||err.message) }
    setConfirm({show:false,id:null})
  }

  const badgeStyle = e => ({
    background: e==='activo'?'rgba(16,185,129,0.12)':e==='agotado'?'rgba(239,68,68,0.12)':'rgba(156,163,175,0.15)',
    color:      e==='activo'?'#10b981':e==='agotado'?'#ef4444':'#6b7280',
    dot:        e==='activo'?'#10b981':e==='agotado'?'#ef4444':'#6b7280',
  })

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h1>Productos</h1><p>Gestiona el catálogo de Moda Mágica.</p></div>
        <div className="page-actions"><button className="btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> Nuevo Producto</button></div>
      </div>

      <div className="card">
        <div className="prod-tabla-header">
          <div className="prod-tabla-titulo">Productos registrados<span className="prod-tabla-count">{filtrado.length}</span></div>
          <div className="prod-tabla-filtros">
            <div className="search-input-wrap"><i className="bi bi-search"></i><input className="search-input" placeholder="Buscar producto..." value={search} onChange={e=>{setSearch(e.target.value);setCurrentPage(1)}} /></div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead><tr><th>Producto</th><th>Categorías</th><th>Precio</th><th>Colores</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7}><div className="empty-state">Cargando...</div></td></tr>
                : paginado.length===0
                  ? <tr><td colSpan={7}><div className="empty-state"><i className="bi bi-box-seam"></i> No se encontraron productos</div></td></tr>
                  : paginado.map(p => {
                      const s = badgeStyle(p.estado)
                      const imgUrl = getImageUrl(p.imagen)
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="prod-td-producto">
                              {imgUrl ? (<img src={imgUrl} alt={p.nombre} className="prod-img" onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}} />) : null}
                              <div className="prod-img-fallback" style={{display:imgUrl?'none':'flex'}}>👗</div>
                              <div><div className="prod-nombre">{p.nombre}</div><div className="prod-descripcion">{p.descripcion||'—'}</div></div>
                            </div>
                          </td>
                          <td>
                            <div className="prod-cats-wrap">
                              {p.categorias.length===0
                                ? <span className="prod-cat-empty">—</span>
                                : p.categorias.map(c=>(<span key={c.id_categoria} className="prod-cat-badge">{c.nombre_categoria}</span>))}
                            </div>
                          </td>
                          <td className="prod-td-precio">${p.precio.toLocaleString('es-CO')}</td>
                          <td>
                            <div className="prod-colores-wrap">
                              {p.colores.length===0
                                ? <span className="prod-color-empty">—</span>
                                : p.colores.map(c=>(<div key={c.id_color} className="prod-color-dot" title={c.nombre_color} style={{background:c.hex_code}} />))}
                            </div>
                          </td>
                          <td><span style={{fontWeight:700,fontSize:13,color:p.stock_total===0?'#ef4444':p.stock_total<5?'#f59e0b':'var(--text)'}}>{p.stock_total} uds</span></td>
                          <td><span className="prod-estado-badge" style={{background:s.background,color:s.color}}><span className="prod-estado-dot" style={{background:s.dot}}/>{p.estado.charAt(0).toUpperCase()+p.estado.slice(1)}</span></td>
                          <td><div className="action-btns"><button className="tbl-btn edit" onClick={()=>openEdit(p)}><i className="bi bi-pencil"></i></button></div></td>
                        </tr>
                      )
                    })
              }
            </tbody>
          </table>
        </div>

        {totalPages>1 && (
          <div className="prod-paginacion">
            <button className="prod-paginacion-btn" onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}><i className="bi bi-chevron-left"></i></button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(page=>(<button key={page} className={`prod-paginacion-page${currentPage===page?' active':''}`} onClick={()=>setCurrentPage(page)}>{page}</button>))}
            <button className="prod-paginacion-btn" onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}><i className="bi bi-chevron-right"></i></button>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal-box prod-modal-box">
            <button className="modal-close" onClick={()=>setModal(false)}><i className="bi bi-x-lg"></i></button>
            <div className="modal-title"><i className="bi bi-bag prod-modal-icon"></i> {editando?'Editar':'Nuevo'} Producto</div>

            <div className="prod-form-grid">
              <div className="form-group prod-form-full"><label className="form-label">Nombre <span className="prod-modal-icon">*</span></label><input className="form-control" style={inputStyle('nombre')} value={form.nombre} onChange={e=>{setForm({...form,nombre:e.target.value});setErrors(p=>({...p,nombre:''}))}} />{errorMsg('nombre')}</div>
              <div className="form-group"><label className="form-label">Precio (COP) <span className="prod-modal-icon">*</span></label><input className="form-control" type="number" style={inputStyle('precio')} value={form.precio} onChange={e=>{setForm({...form,precio:e.target.value});setErrors(p=>({...p,precio:''}))}} />{errorMsg('precio')}</div>
              {editando && (
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <Dropdown
                    value={form.estado}
                    onChange={v => setForm({...form, estado: v})}
                    options={[
                      { value: 'activo', label: 'Activo' },
                      { value: 'inactivo', label: 'Inactivo' },
                      { value: 'agotado', label: 'Agotado' },
                    ]}
                  />
                </div>
              )}
              <div className="form-group prod-form-full"><label className="form-label">Descripción</label><textarea className="form-control prod-textarea" rows={2} value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} /></div>
            </div>

            <div className="prod-cats-section">
              <label className="form-label prod-label-cats">Categorías <span className="prod-modal-icon">*</span><span className="prod-cats-hint">(puedes seleccionar varias)</span></label>
              <div className="prod-cats-btns">
                {categorias.map(c => {
                  const activa = form.categorias.includes(c.id_categoria)
                  return (<button key={c.id_categoria} type="button" onClick={()=>toggleCategoria(c.id_categoria)} className={`prod-cat-btn${activa?' activa':' inactiva'}`}>{activa&&<i className="bi bi-check-lg prod-check-icon"></i>}{c.nombre_categoria}</button>)
                })}
              </div>
              {errorMsg('categorias')}
            </div>

            <div className="prod-imgs-section">
              <label className="form-label prod-label-imgs">Imágenes del producto</label>
              <div className={`prod-dropzone${drag?' drag':' idle'}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={onDrop} onClick={()=>inputFileRef.current.click()}>
                <i className="bi bi-cloud-upload prod-dropzone-icon"></i>
                <p className="prod-dropzone-text">Arrastra imágenes o <span className="prod-dropzone-link">haz clic para seleccionar</span></p>
                <p className="prod-dropzone-hint">JPG, PNG o WEBP — máx. 5MB</p>
                <input ref={inputFileRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="prod-input-hidden" onChange={e=>procesarArchivos(e.target.files)} />
              </div>
              {imagenes.length>0 && (
                <div className="prod-imgs-wrap">
                  {imagenes.map(img=>(
                    <div key={img.id_imagen} className="prod-img-item">
                      <img src={getImageUrl(img.url_imagen)} alt={img.alt_text} className={`prod-img-thumb${img.es_principal===1?' principal':' normal'}`} />
                      {img.es_principal===1&&<span className="prod-img-principal-tag">PRINCIPAL</span>}
                      <div className="prod-img-btns">
                        {img.es_principal!==1&&(<button onClick={()=>setPrincipal(img.id_imagen)} title="Hacer principal" className="prod-img-btn star"><i className="bi bi-star-fill"></i></button>)}
                        <button onClick={()=>eliminarImagenExistente(img.id_imagen)} className="prod-img-btn del"><i className="bi bi-x-lg"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {imagenesNuevas.length>0 && (
                <div className="prod-imgs-nuevas">
                  {imagenesNuevas.map((img,idx)=>(
                    <div key={idx} className="prod-img-nueva">
                      <img src={img.preview} alt="preview" className="prod-img-preview" />
                      <button onClick={()=>quitarImagenNueva(idx)} className="prod-img-btn del prod-img-btn-abs"><i className="bi bi-x-lg"></i></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="prod-colores-section">
              <div className="prod-colores-header">
                <label className="form-label prod-label-colores">Colores <span className="prod-modal-icon">*</span></label>
                <button onClick={()=>setModalColor(prev=>!prev)} className="prod-nuevo-color-btn"><i className="bi bi-plus-lg"></i> Nuevo color</button>
              </div>

              {modalColor && (
                <div className="prod-nuevo-color-form">
                  <div className="prod-nuevo-color-nombre">
                    <label className="form-label prod-nuevo-color-label">Nombre del color</label>
                    <input className="form-control prod-nuevo-color-input" value={nuevoColor.nombre} onChange={e=>setNuevoColor(p=>({...p,nombre:e.target.value}))} />
                  </div>
                  <div>
                    <label className="form-label prod-nuevo-color-label">Color</label>
                    <div className="prod-color-picker-wrap">
                      <input type="color" value={nuevoColor.hex} onChange={e=>setNuevoColor(p=>({...p,hex:e.target.value}))} className="prod-color-picker" />
                      <input className="form-control prod-color-hex-input" value={nuevoColor.hex} onChange={e=>setNuevoColor(p=>({...p,hex:e.target.value}))} />
                    </div>
                  </div>
                  <div className="prod-nuevo-color-btns">
                    <button onClick={crearColor} className="btn-primary prod-nuevo-color-btn-sm"><i className="bi bi-check-lg"></i> Agregar</button>
                    <button onClick={()=>{setModalColor(false);setNuevoColor({nombre:'',hex:'#000000'})}} className="btn-secondary prod-nuevo-color-btn-sm">Cancelar</button>
                  </div>
                </div>
              )}

              <div className="prod-colores-dots">
                {coloresDB.map(c => {
                  const agregado = form.colores.find(fc=>fc.id_color===c.id_color)
                  return (<button key={c.id_color} onClick={()=>agregarColor(c)} title={c.nombre_color} className={`prod-color-circle${agregado?' agregado':' libre'}`} style={{background:c.hex_code}} />)
                })}
              </div>
              {errorMsg('colores')}

              {form.colores.map(c => {
                const grupos = todosLosGrupos()
                const grupoActivo  = grupoActivoColor[c.id_color] || grupos[0]?.id
                const grupoActual  = grupos.find(g=>g.id===grupoActivo)
                return (
                  <div key={c.id_color} className={`prod-color-card${errors[`tallas_${c.id_color}`]?' error':' normal'}`}>
                    <div className="prod-color-card-header">
                      <div className="prod-color-info">
                        <div className="prod-color-circle-sm" style={{background:c.hex_code}} />
                        <span className="prod-color-nombre">{c.nombre_color}</span>
                        <span className="prod-color-stock">Stock: {c.tallas.reduce((a,t)=>a+Number(t.stock_actual),0)} uds</span>
                      </div>
                      <button onClick={()=>quitarColor(c.id_color)} className="prod-color-del-btn"><i className="bi bi-trash"></i></button>
                    </div>

                    <div className="prod-grupos-tabs">
                      {grupos.map(g=>(<button key={g.id} onClick={()=>setGrupoActivoColor(prev=>({...prev,[c.id_color]:g.id}))} className={`prod-grupo-tab${grupoActivo===g.id?' activo':' inactivo'}`}>{g.label}</button>))}
                    </div>

                    <div className="prod-tallas-btns">
                      {(grupoActual?.tallas||[]).length===0
                        ? <span className="prod-talla-empty">Sin tallas en este grupo</span>
                        : (grupoActual?.tallas||[]).map(nombre => {
                            const talla = tallasDB.find(t=>t.nombre_talla===nombre)
                            if (!talla) return null
                            const agregada = c.tallas.find(ct=>ct.id_talla===talla.id_talla)
                            return (<button key={talla.id_talla} onClick={()=>agregarTalla(c.id_color,talla)} className={`prod-talla-btn${agregada?' agregada':' libre'}`}>{talla.nombre_talla}</button>)
                          })
                      }
                    </div>

                    {errors[`tallas_${c.id_color}`] && (<div className="prod-tallas-error"><i className="bi bi-exclamation-circle"></i> {errors[`tallas_${c.id_color}`]}</div>)}

                    {c.tallas.length>0 && (
                      <div className="prod-stocks-list">
                        {c.tallas.map(t=>(
                          <div key={t.id_talla} className="prod-stock-row">
                            <span className="prod-stock-talla-label">{t.nombre_talla}</span>
                            <input type="number" min="0" value={t.stock_actual} onChange={e=>actualizarStock(c.id_color,t.id_talla,e.target.value)} className="prod-stock-input" />
                            <span className="prod-stock-uds">uds</span>
                            <button onClick={()=>quitarTalla(c.id_color,t.id_talla)} className="prod-stock-del-btn"><i className="bi bi-x-lg"></i></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="prod-nueva-talla-box">
                <div className="prod-nueva-talla-title"><i className="bi bi-plus-circle prod-nueva-talla-icon"></i>Agregar talla nueva al sistema</div>
                <div className="prod-nueva-talla-row">
                  <div className="prod-nueva-talla-col">
                    <label className="prod-nueva-talla-label">Nombre de la talla</label>
                    <input className="form-control prod-nueva-talla-input" value={nuevaTalla} onChange={e=>setNuevaTalla(e.target.value)} onKeyDown={e=>e.key==='Enter'&&crearTallaPersonalizada()} />
                  </div>
                  <div className="prod-nueva-talla-col2">
                    <label className="prod-nueva-talla-label">Ubicar en grupo</label>
                    <Dropdown
                      value={nuevaTallaGrupo}
                      placeholder="Sin grupo específico"
                      onChange={setNuevaTallaGrupo}
                      options={[
                        { value: '', label: 'Sin grupo específico' },
                        ...GRUPOS_TALLAS.map(g => ({ value: g.id, label: g.label }))
                      ]}
                    />
                  </div>
                  <button onClick={crearTallaPersonalizada} className="btn-primary prod-nueva-talla-btn"><i className="bi bi-check-lg"></i> Crear</button>
                </div>
                <div className="prod-nueva-talla-hint">La talla se guarda en la base de datos y aparece de inmediato en el grupo elegido.</div>
              </div>
            </div>

            {serverError && (
              <div className="prod-error-msg" style={{ marginTop: 14, fontSize: 13 }}>
                <i className="bi bi-exclamation-circle"></i> {serverError}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save}><i className="bi bi-check-lg"></i> {editando?'Actualizar':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* El botón de eliminar producto fue removido intencionalmente */}
    </>
  )
}
