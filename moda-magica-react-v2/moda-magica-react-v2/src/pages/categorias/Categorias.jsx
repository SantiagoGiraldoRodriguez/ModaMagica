import { useState, useEffect } from 'react'
import axios from 'axios'
import ConfirmModal from '../../components/ConfirmModal'

// ─── CONSTANTES ───────────────────────────────────────
const API            = 'http://localhost:3000/api/categorias' // URL base del backend
const CAT_COLORS     = ['#10b981','#10b981','#10b981','#ef4444','#ef4444','#10b981','#3b82f6','#f59e0b'] // Colores del avatar de cada categoría
const ESTADOS_F      = ['Todos los estados','activo','inactivo'] // Opciones del filtro de estado
const ITEMS_PER_PAGE = 4 // Cantidad de filas visibles por página
const soloLetras     = v => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v) // Valida que solo tenga letras y espacios

export default function Categorias() {

  // ─── ESTADOS ──────────────────────────────────────────
  const [categorias, setCategorias]   = useState([])                        // Lista de categorías cargadas desde la DB
  const [search, setSearch]           = useState('')                         // Busca por el nombre
  const [filtroEst, setFiltroEst]     = useState('Todos los estados')        // Estado seleccionado en el filtro
  const [modal, setModal]             = useState(false)                      // Controla si el modal está abierto
  const [editando, setEditando]       = useState(null)                       // ID de la categoría en edición (null = creando)
  const [form, setForm]               = useState({ nombre:'', descripcion:'', estado:'activo' }) // Datos del formulario
  const [errors, setErrors]           = useState({ nombre:'', descripcion:'' }) // Errores de validación del formulario
  const [currentPage, setCurrentPage] = useState(1)                          // Página actual de la tabla
  const [confirm, setConfirm]         = useState({ show:false, id:null })    // Controla el modal de confirmación al eliminar
  const [loading, setLoading]         = useState(true)                       // Muestra "Cargando..." mientras trae datos

  // ─── CARGA DE DATOS ───────────────────────────────────
  const cargarCategorias = async () => {
    try {
      const res = await axios.get(API) // Llama al backend para traer todas las categorías
      const data = res.data.map(c => ({
        id:          c.id_categoria,                          // Mapea el id de la DB
        nombre:      c.nombre_categoria,                      // Mapea el nombre de la DB
        descripcion: c.descripcion,                           // Mapea la descripción
        estado:      c.estado,                                // Mapea el estado (activo/inactivo)
        fecha:       new Date().toLocaleDateString('es-CO')   // Fecha actual
      }))
      setCategorias(data) // Guarda las categorías en el estado
    } catch (err) {
      console.error('Error al cargar categorías', err) // Muestra el error en consola si falla
    } finally {
      setLoading(false) // Quita el estado de carga sin importar si hubo error o no
    }
  }

  // Ejecuta cargarCategorias solo una vez al montar el componente
  useEffect(() => { cargarCategorias() }, [])

  // ─── FILTRADO Y PAGINACIÓN ────────────────────────────
  const filtered   = categorias.filter(c => {
    const ms = c.nombre.toLowerCase().includes(search.toLowerCase()) // Filtra por texto del buscador
    const me = filtroEst === 'Todos los estados' || c.estado === filtroEst // Filtra por estado
    return ms && me // Solo muestra los que cumplan ambos filtros
  })
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) // Total de páginas según los resultados filtrados
  const paginated  = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE) // Categorías de la página actual
  const startRow   = (currentPage-1)*ITEMS_PER_PAGE // Índice inicial para numerar las filas correctamente

  // ─── VALIDACIONES ─────────────────────────────────────
  const validateNombre = v => !v.trim() ? 'El nombre es obligatorio.' : !soloLetras(v) ? 'Solo se permiten letras.' : ''
  const validateDesc   = v => !v.trim() ? 'La descripción es obligatoria.' : '' // Retorna el mensaje de error o vacío si es válido

  // ─── ABRIR MODAL ──────────────────────────────────────
  const openAdd  = () => {
    setEditando(null)                                      // Sin ID = modo creación
    setForm({ nombre:'', descripcion:'', estado:'activo' }) // Limpia el formulario
    setErrors({ nombre:'', descripcion:'' })               // Limpia los errores
    setModal(true)                                         // Abre el modal
  }

  const openEdit = c => {
    setEditando(c.id)                                                        // Guarda el ID de la categoría a editar
    setForm({ nombre:c.nombre, descripcion:c.descripcion, estado:c.estado }) // Precarga los datos en el formulario
    setErrors({ nombre:'', descripcion:'' })                                  // Limpia errores anteriores
    setModal(true)                                                            // Abre el modal
  }

  // ─── GUARDAR (CREAR O EDITAR) ─────────────────────────
  const save = async () => {
    const eN = validateNombre(form.nombre)   // Valida el nombre
    const eD = validateDesc(form.descripcion) // Valida la descripción
    setErrors({ nombre:eN, descripcion:eD }) // Muestra los errores en el formulario
    if (eN || eD) return                     // Si hay errores, no continúa

    try {
      if (editando) {
        // Si hay un ID en edición, hace PUT para actualizar
        await axios.put(`${API}/${editando}`, {
          nombre_categoria: form.nombre,
          descripcion:      form.descripcion,
          estado:           form.estado
        })
      } else {
        // Si no hay ID, hace POST para crear una nueva categoría
        await axios.post(API, {
          nombre_categoria: form.nombre,
          descripcion:      form.descripcion
        })
      }
      await cargarCategorias() // Recarga la lista para reflejar los cambios
      setModal(false)          // Cierra el modal al guardar exitosamente
    } catch (err) {
      console.error('Error al guardar', err) // Muestra el error en consola si falla
    }
  }

  // ─── ELIMINAR ─────────────────────────────────────────
  const eliminar = async (id) => {
    try {
      await axios.delete(`${API}/${id}`) // Llama al backend para eliminar por ID
      await cargarCategorias()           // Recarga la lista para reflejar la eliminación
    } catch (err) {
      console.error('Error al eliminar', err) // Muestra el error en consola si falla
    }
    setConfirm({ show:false, id:null }) // Cierra el modal de confirmación
  }

  // ─── RENDER ───────────────────────────────────────────
  return (
    <>
      {/* Encabezado de la página con título y botón de nueva categoría */}
      <div className="page-header">
        <div className="page-title"><h1>Categorías</h1><p>Gestiona las categorías de productos de Moda Mágica.</p></div>
        <div className="page-actions"><button className="btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> Nueva Categoría</button></div>
      </div>

      <div className="card">
        {/* Barra superior: contador, filtro de estado y buscador */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Categorías registradas</span>
            {/* Badge que muestra el total de categorías filtradas */}
            <span style={{ background:'rgba(201,150,42,0.2)', color:'var(--gold)', padding:'2px 9px', borderRadius:20, fontSize:12, fontWeight:700 }}>{filtered.length}</span>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            {/* Select para filtrar por estado */}
            <select style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, cursor:'pointer' }}
              value={filtroEst} onChange={e=>{ setFiltroEst(e.target.value); setCurrentPage(1) }}>
              {ESTADOS_F.map(e=><option key={e}>{e}</option>)}
            </select>
            {/* Input de búsqueda por nombre */}
            <div className="search-input-wrap">
              <i className="bi bi-search"></i>
              <input className="search-input" placeholder="Buscar..." value={search} onChange={e=>{ setSearch(e.target.value); setCurrentPage(1) }} />
            </div>
          </div>
        </div>

        {/* Tabla de categorías */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead><tr><th>#</th><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={5}><div className="empty-state">Cargando...</div></td></tr> // Mientras carga muestra texto
                : paginated.length===0
                  ? <tr><td colSpan={5}><div className="empty-state"><i className="bi bi-tags"></i>No hay categorías</div></td></tr> // Si no hay resultados
                  : paginated.map((c,idx)=>(
                    <tr key={c.id}>
                      {/* Número de fila continuo entre páginas */}
                      <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{startRow+idx+1}</td>
                      <td>
                        {/* Avatar con la primera letra del nombre y color según índice */}
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:36, height:36, borderRadius:8, background:CAT_COLORS[(startRow+idx)%CAT_COLORS.length], color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, flexShrink:0 }}>
                            {c.nombre.charAt(0).toUpperCase()}
                          </div>
                          <strong style={{ fontSize:14 }}>{c.nombre}</strong>
                        </div>
                      </td>
                      <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{c.descripcion}</td>
                      <td>
                        {/* Badge de estado con punto de color verde o gris */}
                        <span className={`status-badge ${c.estado==='activo'?'status-active':'status-inactivo'}`} style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background:c.estado==='activo'?'#10b981':'#9ca3af', display:'inline-block' }}></span>
                          {c.estado==='activo'?'Activo':'Inactivo'}
                        </span>
                      </td>
                      <td>
                        {/* Botones de editar y eliminar por fila */}
                        <div className="action-btns">
                          <button className="tbl-btn edit" onClick={()=>openEdit(c)}><i className="bi bi-pencil"></i></button>
                          <button className="tbl-btn delete" onClick={()=>setConfirm({ show:true, id:c.id })}><i className="bi bi-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Paginación: solo se muestra si hay más de una página */}
        {totalPages>1 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:6, marginTop:18 }}>
            {/* Botón anterior */}
            <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} style={{ width:34,height:34,borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',cursor:currentPage===1?'not-allowed':'pointer',opacity:currentPage===1?0.4:1,display:'flex',alignItems:'center',justifyContent:'center' }}><i className="bi bi-chevron-left"></i></button>
            {/* Botones numerados de páginas */}
            {Array.from({length:totalPages},(_,i)=>i+1).map(page=>(
              <button key={page} onClick={()=>setCurrentPage(page)} style={{ width:34,height:34,borderRadius:8,border:'1px solid var(--border)',background:currentPage===page?'var(--accent)':'var(--card)',color:currentPage===page?'white':'var(--text)',fontWeight:600,fontSize:13,cursor:'pointer' }}>{page}</button>
            ))}
            {/* Botón siguiente */}
            <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} style={{ width:34,height:34,borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',cursor:currentPage===totalPages?'not-allowed':'pointer',opacity:currentPage===totalPages?0.4:1,display:'flex',alignItems:'center',justifyContent:'center' }}><i className="bi bi-chevron-right"></i></button>
          </div>
        )}
      </div>

      {/* Modal de crear / editar categoría */}
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}> {/* Cierra al hacer clic fuera */}
          <div className="modal-box" style={{ maxWidth:480 }}>
            <button className="modal-close" onClick={()=>setModal(false)}><i className="bi bi-x-lg"></i></button>
            <div className="modal-title"><i className="bi bi-tags" style={{ color:'var(--gold)' }}></i> {editando?'Editar':'Nueva'} Categoría</div>

            {/* Campo nombre */}
            <div className="form-group">
              <label className="form-label">Nombre <span style={{ color:'var(--gold)' }}>*</span></label>
              <input className="form-control" style={{ borderColor:errors.nombre?'var(--gold)':undefined }} value={form.nombre}
                onChange={e=>{ setForm({...form,nombre:e.target.value}); setErrors(er=>({...er,nombre:validateNombre(e.target.value)})) }}
                onBlur={()=>setErrors(er=>({...er,nombre:validateNombre(form.nombre)}))} // Valida al perder el foco
                placeholder="Nombre de la categoría" />
              {errors.nombre && <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, fontSize:12, color:'var(--gold)', fontWeight:500 }}><i className="bi bi-exclamation-circle"></i> {errors.nombre}</div>}
            </div>

            {/* Campo descripción */}
            <div className="form-group">
              <label className="form-label">Descripción <span style={{ color:'var(--gold)' }}>*</span></label>
              <textarea className="form-control" rows={3} style={{ resize:'vertical', borderColor:errors.descripcion?'var(--gold)':undefined }} value={form.descripcion}
                onChange={e=>{ setForm({...form,descripcion:e.target.value}); setErrors(er=>({...er,descripcion:validateDesc(e.target.value)})) }}
                onBlur={()=>setErrors(er=>({...er,descripcion:validateDesc(form.descripcion)}))} // Valida al perder el foco
                placeholder="Descripción de la categoría" />
              {errors.descripcion && <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, fontSize:12, color:'var(--gold)', fontWeight:500 }}><i className="bi bi-exclamation-circle"></i> {errors.descripcion}</div>}
            </div>

            {/* Campo estado: solo visible al editar, no al crear */}
            {editando && (
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-control" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            )}

            {/* Botones del modal */}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save}><i className="bi bi-check-lg"></i> {editando?'Actualizar':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación antes de eliminar */}
      <ConfirmModal show={confirm.show} titulo="¿Eliminar categoría?" mensaje="Esta acción no se puede deshacer. La categoría será eliminada permanentemente."
        onCancel={()=>setConfirm({show:false,id:null})}  // Cancela y cierra el modal
        onConfirm={()=>eliminar(confirm.id)} />           
    </>
  )
}