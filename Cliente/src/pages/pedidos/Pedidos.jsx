import { useState, useEffect, useRef } from 'react'
import ConfirmModal from '../../components/ConfirmModal'
import './Pedidos.css'

const API       = `${import.meta.env.VITE_API_URL}/api/pedidos`
const API_BASE  = import.meta.env.VITE_API_URL

const AVATAR_COLORS = ['#6366f1','#ef4444','#8b5cf6','#3b82f6','#10b981','#f59e0b','#C9962A']
const getInitials   = n => n ? n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

const getSesion = () => {
  try { return JSON.parse(sessionStorage.getItem('adminSesion')) || {} } catch { return {} }
}

const formatFecha = f => {
  if (!f) return '—'
  const d = new Date(f)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ESTADO_STYLES = {
  pendiente:  { label: 'Pendiente',  bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', dot: '#f59e0b' },
  procesando: { label: 'Procesando', bg: 'rgba(99,102,241,0.15)', color: '#6366f1', dot: '#6366f1' },
  enviado:    { label: 'Enviado',    bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', dot: '#3b82f6' },
  entregado:  { label: 'Entregado',  bg: 'rgba(16,185,129,0.15)', color: '#10b981', dot: '#10b981' },
  cancelado:  { label: 'Cancelado',  bg: 'rgba(239,68,68,0.15)', color: '#ef4444', dot: '#ef4444' },
}

const ESTADOS_F      = ['Todos los estados','pendiente','procesando','enviado','entregado','cancelado']
const ITEMS_PER_PAGE = 4

const Badge = ({ estado }) => {
  const s = ESTADO_STYLES[estado] || ESTADO_STYLES.pendiente
  return (
    <span className="badge-estado" style={{ background: s.bg, color: s.color }}>
      <span className="badge-estado-dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

const InfoRow = ({ icon, label, value }) => (
  <div className="info-row">
    <i className={`bi ${icon} info-row-icon`}></i>
    <div className="info-row-body">
      <span className="info-row-label">{label}</span>
      <span className="info-row-value">{value}</span>
    </div>
  </div>
)

const ProductoImg = ({ src, alt, size = 44 }) => {
  const [err, setErr] = useState(false)
  return err || !src
    ? <div className="prod-img-placeholder" style={{ width: size, height: size, fontSize: size * 0.45 }}>👗</div>
    : <img src={`${API_BASE}${src}`} alt={alt} onError={() => setErr(true)} className="prod-img" style={{ width: size, height: size }} />
}

const Dropdown = ({ value, options, onChange, placeholder }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div className="ped-dropdown" ref={ref}>
      <button type="button" className={`ped-dropdown-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className={selected ? '' : 'ped-dropdown-placeholder'}>{selected ? selected.label : (placeholder || value)}</span>
        <i className="bi bi-chevron-down ped-dropdown-chevron"></i>
      </button>
      {open && (
        <ul className="ped-dropdown-menu">
          {options.map(opt => (
            <li
              key={opt.value}
              className={`ped-dropdown-item${opt.value === value ? ' active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
              {opt.value === value && <i className="bi bi-check-lg ped-dropdown-check"></i>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Pedidos() {
  const sesion = getSesion()

  const [pedidos, setPedidos]         = useState([])
  const [clientes, setClientes]       = useState([])
  const [productos, setProductos]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filtroEst, setFiltroEst]     = useState('Todos los estados')
  const [currentPage, setCurrentPage] = useState(1)
  const [modal, setModal]             = useState(false)
  const [modalVer, setModalVer]       = useState(null)
  const [confirm, setConfirm]         = useState({ show: false, id: null })
  const [serverError, setServerError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const [form, setForm] = useState({ id_cliente: '', items: [] })

  const [codigoDesc, setCodigoDesc]   = useState('')
  const [descuento, setDescuento]     = useState(null)
  const [descError, setDescError]     = useState('')
  const [descLoading, setDescLoading] = useState(false)

  const [itemForm, setItemForm] = useState({ id_producto_color: '', id_talla: '', cantidad: 1 })

  const cargar = async () => {
    try {
      const [resPed, resCli, resProd] = await Promise.all([
        fetch(API).then(r => r.json()),
        fetch(`${API}/clientes`).then(r => r.json()),
        fetch(`${API}/productos`).then(r => r.json()),
      ])
      setPedidos(Array.isArray(resPed) ? resPed : [])
      setClientes(Array.isArray(resCli) ? resCli : [])
      setProductos(Array.isArray(resProd) ? resProd : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  // ── Auto-validación del código de descuento con debounce de 500ms ──
  // Reemplaza el flujo manual (botón "Aplicar"): apenas el usuario deja de
  // escribir por medio segundo, se valida automáticamente contra el backend.
  // El código solo puede activarse si ya hay productos agregados al pedido
  // y al menos uno de ellos está en la lista de prendas permitidas (prendas_ids).
  useEffect(() => {
    if (!codigoDesc.trim()) {
      setDescError('')
      setDescuento(null)
      setDescLoading(false)
      return
    }

    if (form.items.length === 0) {
      setDescError('Agrega al menos un producto antes de aplicar un código de descuento.')
      setDescuento(null)
      setDescLoading(false)
      return
    }

    setDescLoading(true)
    setDescError('')

    const timeoutId = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/descuento/${codigoDesc.trim()}`)
        const data = await res.json()
        if (!res.ok) {
          setDescError(data.error || 'Código inválido.')
          setDescuento(null)
        } else {
          const prendasPermitidas = data.prendas_ids || []
          const idsEnPedido = form.items.map(i => {
            const prod = productos.find(p => p.id_producto_color === i.id_producto_color)
            return prod?.id_producto
          })
          const coincide = idsEnPedido.some(id => prendasPermitidas.includes(id))
          if (!coincide) {
            setDescError('Este código no aplica a ninguna de las prendas del pedido.')
            setDescuento(null)
          } else {
            setDescuento(data)
            setDescError('')
          }
        }
      } catch {
        setDescError('No se pudo validar el código.')
        setDescuento(null)
      } finally {
        setDescLoading(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [codigoDesc, form.items, productos])

  const openAdd = () => {
    setForm({ id_cliente: String(sesion.id || ''), items: [] })
    setItemForm({ id_producto_color: '', id_talla: '', cantidad: 1 })
    setCodigoDesc(''); setDescuento(null); setDescError('')
    setServerError(''); setModal(true)
  }

  const variantesUnicas = productos.reduce((acc, p) => {
    if (!acc.find(x => x.id_producto_color === p.id_producto_color)) acc.push(p)
    return acc
  }, [])

  const tallasDeVariante = id => productos.filter(p => p.id_producto_color === Number(id))

  // Identifica qué items del pedido están dentro de prendas_ids del descuento activo
  const itemsConDescuento = () => {
    if (!descuento) return []
    const prendasPermitidas = descuento.prendas_ids || []
    return form.items.filter(item => {
      const prod = productos.find(p => p.id_producto_color === Number(item.id_producto_color))
      return prod && prendasPermitidas.includes(prod.id_producto)
    })
  }

  const calcularTotales = () => {
    let subtotal = 0
    for (const item of form.items) {
      const prod = productos.find(p => p.id_producto_color === Number(item.id_producto_color))
      if (prod) subtotal += Number(prod.precio_unitario) * item.cantidad
    }

    let desc = 0
    if (descuento) {
      // El % solo se aplica sobre el subtotal de las prendas que están en prendas_ids,
      // no sobre el total completo del pedido.
      let subtotalConDescuento = 0
      for (const item of itemsConDescuento()) {
        const prod = productos.find(p => p.id_producto_color === Number(item.id_producto_color))
        if (prod) subtotalConDescuento += Number(prod.precio_unitario) * item.cantidad
      }
      desc = subtotalConDescuento * (Number(descuento.valor_descuento) / 100)
    }

    return { subtotal, desc, total: Math.max(0, subtotal - desc) }
  }

  const agregarItem = () => {
    if (!itemForm.id_producto_color || !itemForm.id_talla || itemForm.cantidad < 1) return
    const existe = form.items.find(i => i.id_producto_color === Number(itemForm.id_producto_color) && i.id_talla === Number(itemForm.id_talla))
    if (existe) {
      setForm(f => ({ ...f, items: f.items.map(i => i.id_producto_color === Number(itemForm.id_producto_color) && i.id_talla === Number(itemForm.id_talla) ? { ...i, cantidad: i.cantidad + Number(itemForm.cantidad) } : i) }))
    } else {
      const prod = productos.find(p => p.id_producto_color === Number(itemForm.id_producto_color) && p.id_talla === Number(itemForm.id_talla))
      setForm(f => ({ ...f, items: [...f.items, { id_producto_color: Number(itemForm.id_producto_color), id_talla: Number(itemForm.id_talla), cantidad: Number(itemForm.cantidad), nombre_producto: prod?.nombre_producto, nombre_color: prod?.nombre_color, hex_code: prod?.hex_code, nombre_talla: prod?.nombre_talla, precio_unitario: prod?.precio_unitario, stock_actual: prod?.stock_actual, imagen_principal: prod?.imagen_principal }] }))
    }
    setItemForm({ id_producto_color: '', id_talla: '', cantidad: 1 })
  }

  const quitarItem = idx => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))

  const save = async () => {
    setServerError('')
    if (!form.id_cliente)        return setServerError('No se detectó sesión de usuario.')
    if (form.items.length === 0) return setServerError('Agrega al menos un producto.')
    try {
      const { desc } = calcularTotales()
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_cliente: Number(form.id_cliente), id_descuento: descuento ? descuento.id_descuento : null, descuento_aplicado: desc, items: form.items.map(i => ({ id_producto_color: i.id_producto_color, id_talla: i.id_talla, cantidad: i.cantidad })) }) })
      const data = await res.json()
      if (!res.ok) return setServerError(data.error || 'Error al crear el pedido.')
      await cargar(); setModal(false)
    } catch { setServerError('No se pudo conectar con el servidor.') }
  }

  const cambiarEstado = async (id_pedido, estado_pedido) => {
    try {
      await fetch(`${API}/${id_pedido}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado_pedido, id_usuario_cambio: sesion.id || 1 }) })
      await cargar()
      setModalVer(prev => prev ? { ...prev, estado_pedido } : null)
    } catch (err) { console.error(err) }
  }

  const eliminar = async id => {
    setDeleteError('')
    try {
      const res  = await fetch(`${API}/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setDeleteError(data.error || 'No se pudo eliminar el pedido.'); return }
      setConfirm({ show: false, id: null }); await cargar()
    } catch (err) { console.error(err); setDeleteError('No se pudo conectar con el servidor.') }
  }

  const { subtotal, desc, total } = calcularTotales()

  const filtered   = pedidos.filter(p => {
    const ms = String(p.id_pedido).includes(search) || (p.nombre_cliente || '').toLowerCase().includes(search.toLowerCase())
    const me = filtroEst === 'Todos los estados' || p.estado_pedido === filtroEst
    return ms && me
  })
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const startRow   = (currentPage - 1) * ITEMS_PER_PAGE

  const stats = [
    { label: 'Total pedidos', value: pedidos.length,                                                                icon: 'bi-bag-fill',       bg: 'rgba(201,150,42,0.2)', color: '#C9962A' },
    { label: 'Pendientes',    value: pedidos.filter(p => p.estado_pedido === 'pendiente').length,                   icon: 'bi-hourglass-split', bg: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
    { label: 'En tránsito',   value: pedidos.filter(p => ['enviado','procesando'].includes(p.estado_pedido)).length,icon: 'bi-truck',           bg: 'rgba(59,130,246,0.2)', color: '#3b82f6' },
    { label: 'Entregados',    value: pedidos.filter(p => p.estado_pedido === 'entregado').length,                   icon: 'bi-box-seam',        bg: 'rgba(16,185,129,0.2)', color: '#10b981' },
  ]

  const productoSeleccionado = itemForm.id_producto_color ? variantesUnicas.find(p => p.id_producto_color === Number(itemForm.id_producto_color)) : null

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h1>Pedidos</h1><p>Gestiona y crea pedidos del catálogo de Moda Mágica.</p></div>
        <div className="page-actions"><button className="btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> Nuevo pedido</button></div>
      </div>

      <div className="stats-grid pedidos-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card pedidos-stat-card">
            <div className="pedidos-stat-icon" style={{ background: s.bg, color: s.color }}><i className={`bi ${s.icon}`}></i></div>
            <div><div className="pedidos-stat-value">{s.value}</div><div className="pedidos-stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="tabla-header">
          <div className="tabla-titulo">Lista de pedidos<span className="tabla-count-badge">{filtered.length}</span></div>
          <div className="tabla-filtros">
            <Dropdown
              value={filtroEst}
              onChange={v => { setFiltroEst(v); setCurrentPage(1) }}
              options={ESTADOS_F.map(e => ({ value: e, label: e === 'Todos los estados' ? e : ESTADO_STYLES[e]?.label || e }))}
            />
            <div className="search-input-wrap"><i className="bi bi-search"></i><input className="search-input" placeholder="Buscar pedido o cliente..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} /></div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table table-layout-auto">
            <thead>
              <tr><th>#</th><th>N° Pedido</th><th>Cliente</th><th>Dirección</th><th>Total</th><th>Descuento</th><th>Total final</th><th className="th-nowrap">Estado</th><th className="th-nowrap">Acciones</th></tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={9}><div className="empty-state">Cargando...</div></td></tr>
                : paginated.length === 0
                  ? <tr><td colSpan={9}><div className="empty-state"><i className="bi bi-cart-x"></i> No hay pedidos</div></td></tr>
                  : paginated.map((p, idx) => (
                    <tr key={p.id_pedido}>
                      <td className="td-numero">{startRow + idx + 1}</td>
                      <td><span className="td-pedido-id">#{p.id_pedido}</span></td>
                      <td><div className="td-cliente"><div className="cliente-avatar" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>{getInitials(p.nombre_cliente)}</div><div><div className="cliente-nombre">{p.nombre_cliente}</div><div className="cliente-correo">{p.correo}</div></div></div></td>
                      <td className="td-direccion">{p.ciudad}, {p.departamento}</td>
                      <td className="td-total">${Number(p.total_pedido).toLocaleString('es-CO')}</td>
                      <td>{p.codigo_descuento ? <span className="td-descuento-badge">{p.codigo_descuento} (-${Number(p.descuento_aplicado).toLocaleString('es-CO')})</span> : <span className="td-descuento-vacio">—</span>}</td>
                      <td className="td-total-final">${Number(p.total_final).toLocaleString('es-CO')}</td>
                      <td className="td-nowrap"><Badge estado={p.estado_pedido} /></td>
                      <td className="td-nowrap"><div className="action-btns"><button className="tbl-btn tbl-btn-ver" onClick={() => { setDeleteError(''); setModalVer(p) }}><i className="bi bi-eye"></i></button><button className="tbl-btn delete" onClick={() => { setDeleteError(''); setConfirm({ show: true, id: p.id_pedido }) }}><i className="bi bi-trash"></i></button></div></td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="paginacion">
            <button className="paginacion-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><i className="bi bi-chevron-left"></i></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (<button key={page} className={`paginacion-page${currentPage === page ? ' active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>))}
            <button className="paginacion-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><i className="bi bi-chevron-right"></i></button>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box modal-box-crear">
            <button className="modal-close" onClick={() => setModal(false)}><i className="bi bi-x-lg"></i></button>
            <div className="modal-title"><i className="bi bi-cart-plus modal-icon-gold"></i> Nuevo Pedido</div>

            <div className="sesion-card">
              <div className="sesion-avatar">{getInitials(`${sesion.nombre} ${sesion.apellido}`)}</div>
              <div><div className="sesion-nombre">{sesion.nombre} {sesion.apellido}</div><div className="sesion-correo">{sesion.correo}</div></div>
              <span className="sesion-rol-badge">{sesion.rol}</span>
            </div>

            <div className="desc-section">
              <label className="form-label desc-label"><i className="bi bi-ticket-perforated modal-icon-gold ver-seccion-icon"></i>Código de descuento (opcional)</label>
              <div className="desc-row">
                <input
                  className={`form-control desc-input${descError ? ' error' : ''}${descuento ? ' success' : ''}`}
                  value={codigoDesc}
                  onChange={e => setCodigoDesc(e.target.value.toUpperCase())}
                  placeholder="Escribe el código..."
                />
                {descLoading && (<i className="bi bi-arrow-repeat desc-input-spinner"></i>)}
                {descuento && !descLoading && (<button className="desc-btn-quitar" onClick={() => { setDescuento(null); setCodigoDesc('') }}><i className="bi bi-x-lg"></i></button>)}
              </div>
              {descError && (<div className="desc-error"><i className="bi bi-exclamation-circle"></i> {descError}</div>)}
              {descuento && (
                <div className="desc-ok-box">
                  <span className="desc-ok-codigo">✓ {descuento.codigo}</span>
                  <span className="desc-ok-info">{Number(descuento.valor_descuento).toFixed(0)}% de descuento — {descuento.descripcion}</span>
                  <div className="desc-prendas-aplicadas">
                    Aplica a: {itemsConDescuento().map(i => i.nombre_producto).join(', ')}
                  </div>
                </div>
              )}
            </div>

            <div className="prod-section">
              <label className="form-label prod-label"><i className="bi bi-bag modal-icon-gold ver-seccion-icon"></i>Productos <span className="modal-icon-gold">*</span></label>
              <div className="prod-selector-box">
                <div className="prod-selector-row">
                  <div className="prod-selector-col-lg">
                    <label className="form-label prod-selector-label">Producto / Color</label>
                    <Dropdown
                      value={itemForm.id_producto_color}
                      placeholder="— Selecciona —"
                      onChange={v => setItemForm(i => ({ ...i, id_producto_color: v, id_talla: '' }))}
                      options={variantesUnicas.map(p => ({ value: String(p.id_producto_color), label: `${p.nombre_producto} — ${p.nombre_color}` }))}
                    />
                  </div>
                  <div className="prod-selector-col-md">
                    <label className="form-label prod-selector-label">Talla</label>
                    <Dropdown
                      value={itemForm.id_talla}
                      placeholder="— Talla —"
                      onChange={v => setItemForm(i => ({ ...i, id_talla: v }))}
                      options={tallasDeVariante(itemForm.id_producto_color).map(t => ({ value: String(t.id_talla), label: `${t.nombre_talla} (stock: ${t.stock_actual})` }))}
                    />
                  </div>
                  <div className="prod-selector-col-sm"><label className="form-label prod-selector-label">Cantidad</label><input className="form-control" type="number" min="1" value={itemForm.cantidad} onChange={e => setItemForm(i => ({ ...i, cantidad: Number(e.target.value) }))} /></div>
                  <button onClick={agregarItem} className="btn-primary prod-btn-agregar"><i className="bi bi-plus-lg"></i> Agregar</button>
                </div>
                {productoSeleccionado && (
                  <div className="prod-preview">
                    <ProductoImg src={productoSeleccionado.imagen_principal} alt={productoSeleccionado.nombre_producto} size={52} />
                    <div><div className="prod-preview-nombre">{productoSeleccionado.nombre_producto}</div><div className="prod-preview-meta"><div className="prod-color-dot" style={{ background: productoSeleccionado.hex_code }} /><span className="prod-color-nombre">{productoSeleccionado.nombre_color}</span><span className="prod-color-nombre">·</span><span className="prod-precio">${Number(productoSeleccionado.precio_unitario).toLocaleString('es-CO')}</span></div></div>
                  </div>
                )}
              </div>
              {form.items.length === 0
                ? <div className="prod-empty">No hay productos en el pedido.</div>
                : <div className="items-lista">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <div className="item-info">
                          <ProductoImg src={item.imagen_principal} alt={item.nombre_producto} size={40} />
                          <div><div className="item-nombre">{item.nombre_producto}</div><div className="item-meta"><div className="prod-color-dot" style={{ background: item.hex_code }} /><span className="item-meta-text">{item.nombre_color} · Talla {item.nombre_talla} · ×{item.cantidad}</span></div></div>
                        </div>
                        <div className="item-acciones"><span className="item-precio-total">${(Number(item.precio_unitario) * item.cantidad).toLocaleString('es-CO')}</span><button className="item-quitar-btn" onClick={() => quitarItem(idx)}><i className="bi bi-x-lg"></i></button></div>
                      </div>
                    ))}
                  </div>
              }
              {form.items.length > 0 && (
                <div className="resumen-box">
                  <div className="resumen-fila"><span className="resumen-fila-label">Subtotal</span><span className="resumen-fila-value">${subtotal.toLocaleString('es-CO')}</span></div>
                  {desc > 0 && (<div className="resumen-fila"><span className="resumen-fila-desc-label">Descuento ({descuento?.codigo})</span><span className="resumen-fila-desc-value">-${desc.toLocaleString('es-CO')}</span></div>)}
                  <div className="resumen-total"><span className="resumen-total-label">Total</span><span className="resumen-total-value">${total.toLocaleString('es-CO')}</span></div>
                </div>
              )}
            </div>

            {serverError && (<div className="server-error"><i className="bi bi-exclamation-circle"></i> {serverError}</div>)}
            <div className="modal-actions"><button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button><button className="btn-primary" onClick={save}><i className="bi bi-check-lg"></i> Crear Pedido</button></div>
          </div>
        </div>
      )}

      {modalVer && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalVer(null)}>
          <div className="modal-box modal-box-ver">
            <button className="modal-close" onClick={() => setModalVer(null)}><i className="bi bi-x-lg"></i></button>
            <div className="ver-header">
              <div><div className="ver-pedido-eyebrow">Pedido</div><div className="ver-pedido-id">#{modalVer.id_pedido}</div></div>
              <Badge estado={modalVer.estado_pedido} />
            </div>
            <div className="ver-fecha-row">
              <i className="bi bi-calendar3 ver-fecha-icon"></i>
              <div><span className="ver-fecha-label">Fecha del pedido</span><span className="ver-fecha-value">{formatFecha(modalVer.fecha_pedido)}</span></div>
            </div>
            <div className="ver-cliente-box">
              <div className="ver-seccion-titulo"><i className="bi bi-person-fill ver-seccion-icon"></i>Información del cliente</div>
              <div className="ver-cliente-perfil">
                <div className="ver-cliente-avatar">{getInitials(modalVer.nombre_cliente)}</div>
                <div><div className="ver-cliente-nombre">{modalVer.nombre_cliente}</div><div className="ver-cliente-correo">{modalVer.correo}</div></div>
              </div>
              <InfoRow icon="bi-telephone-fill" label="Teléfono"           value={modalVer.telefono || '—'} />
              <InfoRow icon="bi-geo-alt-fill"   label="Dirección de envío" value={modalVer.direccion_envio || '—'} />
            </div>
            <div className="ver-seccion-titulo"><i className="bi bi-bag-fill ver-seccion-icon"></i>Productos del pedido</div>
            {(modalVer.detalles || []).length === 0
              ? <div className="ver-prod-empty">Sin productos.</div>
              : <div className="ver-prod-lista">
                  {(modalVer.detalles || []).map((d, i) => (
                    <div key={i} className="ver-prod-item">
                      <ProductoImg src={d.imagen_principal} alt={d.nombre_producto} size={56} />
                      <div className="ver-prod-info">
                        <div className="ver-prod-nombre">{d.nombre_producto}</div>
                        <div className="ver-prod-meta">
                          <div className="ver-prod-color-dot" style={{ background: d.hex_code }} />
                          <span className="ver-prod-meta-text">{d.nombre_color}</span>
                          <span className="ver-prod-meta-text">·</span>
                          <span className="ver-prod-meta-text">Talla {d.nombre_talla}</span>
                          <span className="ver-prod-meta-text">·</span>
                          <span className="ver-prod-meta-text ver-prod-meta-bold">×{d.cantidad}</span>
                        </div>
                        <div className="ver-prod-precio-unit">${Number(d.precio_vendido).toLocaleString('es-CO')} c/u</div>
                      </div>
                      <div className="ver-prod-subtotal">${Number(d.subtotal).toLocaleString('es-CO')}</div>
                    </div>
                  ))}
                </div>
            }
            <div className="ver-resumen-box">
              <div className="ver-resumen-fila"><span className="ver-resumen-label">Subtotal</span><span className="ver-resumen-value">${Number(modalVer.total_pedido).toLocaleString('es-CO')}</span></div>
              {Number(modalVer.descuento_aplicado) > 0 && (
                <div className="ver-resumen-fila">
                  <span className="ver-resumen-desc-label"><i className="bi bi-tag-fill ver-tag-icon"></i>Descuento {modalVer.codigo_descuento && `· ${modalVer.codigo_descuento}`}</span>
                  <span className="ver-resumen-desc-value">-${Number(modalVer.descuento_aplicado).toLocaleString('es-CO')}</span>
                </div>
              )}
              <div className="ver-resumen-total"><span className="ver-resumen-total-label">Total final</span><span className="ver-resumen-total-value">${Number(modalVer.total_final).toLocaleString('es-CO')}</span></div>
            </div>
            <div className="ver-seccion-titulo ver-seccion-titulo-mb"><i className="bi bi-arrow-repeat ver-seccion-icon"></i>Cambiar estado</div>
            <div className="ver-estados-wrap">
              {Object.entries(ESTADO_STYLES).map(([key, s]) => (
                <button key={key} className="ver-estado-btn" onClick={() => cambiarEstado(modalVer.id_pedido, key)} style={{ border: modalVer.estado_pedido === key ? `2px solid ${s.color}` : '1.5px solid var(--border)', background: modalVer.estado_pedido === key ? s.bg : 'var(--card)', color: modalVer.estado_pedido === key ? s.color : 'var(--text-secondary)' }}>
                  <span className="ver-estado-dot" style={{ background: s.dot }} />{s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={confirm.show} titulo="¿Eliminar pedido?" mensaje="Esta acción eliminará el pedido con todos sus detalles. No se puede deshacer." error={deleteError} onCancel={() => { setConfirm({ show: false, id: null }); setDeleteError('') }} onConfirm={() => eliminar(confirm.id)} />
    </>
  )
}