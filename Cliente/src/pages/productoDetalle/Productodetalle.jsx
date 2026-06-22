import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../tienda/Tienda.css'
import './Productodetalle.css'
import TiendaAuth from '../tiendaAuht/TiendaAuth'

const TALLAS_ORDEN = ['XS','S','M','L','XL','XXL','35','36','37','38','39','40','41','42','43','One Size']

const API_BASE = import.meta.env.VITE_API_URL
const API = `${API_BASE}/api`

const CAT_BG = {
  MUJER:      'linear-gradient(135deg,#f9e0d5 0%,#e8c9bb 100%)',
  HOMBRE:     'linear-gradient(135deg,#d5e0f9 0%,#b8c9e8 100%)',
  NIÑOS:      'linear-gradient(135deg,#d5f9e0 0%,#b8e8c9 100%)',
  DEPORTE:    'linear-gradient(135deg,#e8d5f9 0%,#d0b8e8 100%)',
  TECNOLOGÍA: 'linear-gradient(135deg,#0d1b2a 0%,#1a2f4a 50%,#0a1628 100%)',
  BELLEZA:    'linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%)',
  DEFAULT:    'linear-gradient(135deg,#f0ede8 0%,#e0dbd2 100%)',
}

// session_id persistente por navegador (igual que en Tienda.jsx), usado
// para identificar las reservas temporales de stock de este carrito.
const getSessionId = () => {
  let id = localStorage.getItem('mm_session_id')
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    localStorage.setItem('mm_session_id', id)
  }
  return id
}

const resolverUrlImagen = url => {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

const normalizarProducto = p => {
  const colores = (p.colores || []).map(c => ({
    id_color:          c.id_color,
    id_producto_color: c.id_producto_color,
    nombre_color:      c.nombre_color,
    hex:                c.hex_code || '#C8920A',
    tallas:       (c.tallas || []).map(t => ({
      id_talla:     t.id_talla,
      nombre_talla: t.nombre_talla,
      stock_actual: t.stock_actual || 0,
    }))
  }))

  const variantes = colores.flatMap(c =>
    c.tallas.map(t => ({
      nombre_color: c.nombre_color,
      nombre_talla: t.nombre_talla,
      stock_actual: t.stock_actual,
    }))
  )

  const stock_total = Number(p.stock_total) ||
    variantes.reduce((s, v) => s + (v.stock_actual || 0), 0)

  const imagenesArr = (p.imagenes || [])
    .map(img => ({
      id:       img.id_imagen,
      url:      resolverUrlImagen(img.url_imagen),
      alt:      img.alt_text || p.nombre_producto,
      principal: img.es_principal === 1 || img.es_principal === true,
    }))
    .filter(img => !!img.url)

  const imagenPrincipalSuelta = resolverUrlImagen(p.imagen_principal || p.imagen || null)
  const imagenes = imagenesArr.length > 0
    ? imagenesArr
    : (imagenPrincipalSuelta ? [{ id:'principal', url:imagenPrincipalSuelta, alt:p.nombre_producto, principal:true }] : [])

  return {
    id:          p.id_producto,
    nombre:      p.nombre_producto,
    precio:      Number(p.precio_unitario),
    estado:      p.estado,
    stock_total,
    descripcion: p.descripcion || '',
    imagen:      imagenes[0]?.url || null,
    imagenes,
    categorias:  (p.categorias || []).map(c => ({
      nombre_categoria: (c.nombre_categoria || '').toUpperCase()
    })),
    colores,
    variantes,
  }
}

export default function ProductoDetalle() {
  const { id }     = useParams()
  const navigate   = useNavigate()

  const [productos, setProductos] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [errorApi,  setErrorApi]  = useState(null)

  const [imgIndex,    setImgIndex]    = useState(0)
  const [colorSelec,  setColorSelec]  = useState(null)
  const [tallaSelec,  setTallaSelec]  = useState(null)
  const [toast,       setToast]       = useState('')
  const [carritoOpen, setCarritoOpen] = useState(false)
  const [authOpen,    setAuthOpen]    = useState(false)
  const relatedRef = useRef(null)

  const [carrito, setCarrito] = useState(() => {
    try {
      const guardado = localStorage.getItem('mm_carrito')
      return guardado ? JSON.parse(guardado) : []
    } catch {
      return []
    }
  })

  const fmt = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n).replace(/\s/g,'')
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(''),2800) }
  const totalItems = carrito.reduce((s,i)=>s+i.cantidad,0)
  const totalPrice = carrito.reduce((s,i)=>s+i.precio*i.cantidad,0)

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true)
        setErrorApi(null)
        const res = await fetch(`${API}/productos/tienda?session_id=${getSessionId()}`)
        if (!res.ok) throw new Error(`Error ${res.status}`)
        const data = await res.json()
        setProductos(data.map(normalizarProducto))
      } catch (err) {
        console.error('Error cargando producto:', err)
        setErrorApi('No se pudo cargar el producto. Verifica que el servidor esté corriendo.')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  useEffect(() => {
    localStorage.setItem('mm_carrito', JSON.stringify(carrito))
  }, [carrito])

  const detalle = productos.find(p => p.id === Number(id)) || null

  // Reinicia selección cuando cambia de producto (navegando entre relacionados)
  useEffect(() => {
    setImgIndex(0); setColorSelec(null); setTallaSelec(null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])

  const getCardBg = p => CAT_BG[(p.categorias[0]?.nombre_categoria||'').toUpperCase()]||CAT_BG.DEFAULT

  const tallasDisponibles = () => {
    if (!detalle) return []
    if (colorSelec) {
      const colorObj = detalle.colores.find(c => c.nombre_color === colorSelec)
      if (colorObj) {
        const nombres = colorObj.tallas.map(t => t.nombre_talla)
        return TALLAS_ORDEN.filter(t => nombres.includes(t))
      }
    }
    const vars = detalle.variantes.filter(v => v.nombre_talla)
    const set = new Set(vars.map(v => v.nombre_talla))
    return TALLAS_ORDEN.filter(t => set.has(t))
  }

  const stockSeleccion = (() => {
    if (!detalle || !colorSelec || !tallaSelec) return null
    const colorObj = detalle.colores.find(c => c.nombre_color === colorSelec)
    const tallaObj = colorObj?.tallas.find(t => t.nombre_talla === tallaSelec)
    return tallaObj ? tallaObj.stock_actual : null
  })()

  const agregarAlCarrito = async () => {
    if (!detalle) return false
    if (!tallaSelec || !colorSelec) { showToast('Selecciona talla y color.'); return false }
    const key = `${detalle.id}-${colorSelec}-${tallaSelec}`
    const imagenItem = detalle.imagen || detalle.imagenes?.[0]?.url || null
    const colorObj = detalle.colores.find(c => c.nombre_color === colorSelec)
    const tallaObj = colorObj?.tallas.find(t => t.nombre_talla === tallaSelec)
    const stockMax = tallaObj ? tallaObj.stock_actual : 0
    const id_producto_color = colorObj?.id_producto_color
    const id_talla = tallaObj?.id_talla

    if (stockMax <= 0) { showToast('Sin stock disponible para esa combinación.'); return false }

    const existente = carrito.find(i => i.key === key)
    const cantidadNueva = (existente?.cantidad || 0) + 1

    try {
      const res = await fetch(`${API}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: getSessionId(),
          id_producto_color, id_talla,
          cantidad: cantidadNueva
        })
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'No se pudo reservar el producto.'); return false }
    } catch {
      showToast('No se pudo conectar con el servidor.')
      return false
    }

    let ok = true
    setCarrito(prev => {
      const existe = prev.find(i=>i.key===key)
      if (existe) {
        if (existe.cantidad >= stockMax) { showToast(`Solo hay ${stockMax} unidades disponibles.`); ok = false; return prev }
        return prev.map(i=>i.key===key?{...i,cantidad:i.cantidad+1}:i)
      }
      return [...prev,{key,id:detalle.id,nombre:detalle.nombre,precio:detalle.precio,
        color:colorSelec,talla:tallaSelec,cantidad:1,stockMax,
        id_producto_color, id_talla,
        imagen:imagenItem,
        catBg:CAT_BG[(detalle.categorias[0]?.nombre_categoria||'').toUpperCase()]||CAT_BG.DEFAULT}]
    })
    if (!ok) return false
    showToast(`✓ ${detalle.nombre} agregado`)
    return true
  }

  const comprarAhora = async () => {
    const ok = await agregarAlCarrito()
    if (!ok) return
    const sesion = sessionStorage.getItem('tiendaSesion')
    if (!sesion) { setAuthOpen(true); return }
    navigate('/tienda/checkout')
  }

  const cambiarCantidad = async (key, delta) => {
    const item = carrito.find(i => i.key === key)
    if (!item) return
    const max = item.stockMax ?? Infinity
    const nueva = Math.min(max, Math.max(1, item.cantidad + delta))
    if (delta > 0 && item.cantidad >= max) { showToast(`Solo hay ${max} unidades disponibles.`); return }
    if (nueva === item.cantidad) return
    try {
      const res = await fetch(`${API}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: getSessionId(),
          id_producto_color: item.id_producto_color,
          id_talla: item.id_talla,
          cantidad: nueva
        })
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'No se pudo actualizar la reserva.'); return }
    } catch {
      showToast('No se pudo conectar con el servidor.')
      return
    }
    setCarrito(prev => prev.map(i => i.key === key ? { ...i, cantidad: nueva } : i))
  }

  const quitarItem = async key => {
    const item = carrito.find(i => i.key === key)
    setCarrito(prev=>prev.filter(i=>i.key!==key))
    if (!item) return
    try {
      await fetch(`${API}/reservas`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: getSessionId(),
          id_producto_color: item.id_producto_color,
          id_talla: item.id_talla
        })
      })
    } catch {
      // Si falla, la reserva igual expira sola a los 15 minutos
    }
  }

  const productosRelacionados = (() => {
    if (!detalle) return []
    const catsDetalle = new Set(detalle.categorias.map(c => c.nombre_categoria))
    return productos
      .filter(p => p.id !== detalle.id)
      .filter(p => p.estado === 'activo' && p.stock_total > 0)
      .filter(p => p.categorias.some(c => catsDetalle.has(c.nombre_categoria)))
      .slice(0, 6)
  })()

  const scrollRelated = dir => {
    const el = relatedRef.current
    if (!el) return
    const cardWidth = el.firstChild ? el.firstChild.offsetWidth + 20 : 200
    el.scrollBy({ left: dir * cardWidth * 2, behavior: 'smooth' })
  }

  // ── Estados de carga / error / no encontrado ──
  if (loading) return (
    <div className="t-root">
      <div className="t-state" style={{minHeight:'70vh',justifyContent:'center'}}>
        <i className="bi bi-hourglass-split t-spin"></i><p>Cargando producto...</p>
      </div>
    </div>
  )
  if (errorApi) return (
    <div className="t-root">
      <div className="t-state t-state-error" style={{minHeight:'70vh',justifyContent:'center'}}>
        <i className="bi bi-exclamation-circle"></i><p>{errorApi}</p>
      </div>
    </div>
  )
  if (!detalle) return (
    <div className="t-root">
      <div className="t-state" style={{minHeight:'70vh',justifyContent:'center'}}>
        <i className="bi bi-bag-x"></i><p>No encontramos este producto.</p>
        <button className="t-hero-btn" style={{marginTop:16}} onClick={()=>navigate('/tienda')}>Volver a la tienda</button>
      </div>
    </div>
  )

  const imagenes  = detalle.imagenes && detalle.imagenes.length > 0 ? detalle.imagenes : null
  const totalImgs = imagenes ? imagenes.length : 0
  const imgActual = imagenes ? imagenes[imgIndex] : null
  const irAnterior  = () => setImgIndex(i => (i - 1 + totalImgs) % totalImgs)
  const irSiguiente = () => setImgIndex(i => (i + 1) % totalImgs)
  const catIcon = (detalle.categorias[0]?.nombre_categoria||'').toUpperCase()==='TECNOLOGÍA'
    ? 'bi bi-cpu'
    : (detalle.categorias[0]?.nombre_categoria||'').toUpperCase()==='BELLEZA'
      ? 'bi bi-stars'
      : 'bi bi-bag-heart'

  return (
    <div className="t-root">
      {/* ── Header simple ── */}
      <header className="pd-header">
        <a className="t-logo" href="/tienda">✦ MODA MÁGICA ✦</a>
        <div className="pd-header-actions">
          <button className="pd-back" onClick={()=>navigate('/tienda')}>
            <i className="bi bi-arrow-left"></i> Volver a la tienda
          </button>
          <button className="t-icon-btn" title="Mi cuenta" onClick={()=>navigate('/tienda/perfil')}>
            <i className="bi bi-person"></i>
          </button>
          <button className="t-icon-btn cart-btn" title="Carrito" onClick={()=>setCarritoOpen(true)}>
            <i className="bi bi-bag"></i>
            {totalItems>0 && <span className="t-cart-badge">{totalItems}</span>}
          </button>
        </div>
      </header>

      <div className="t-inner pd-inner">
        <p className="t-breadcrumb">
          {detalle.categorias[0]?.nombre_categoria} <span>/</span> {detalle.nombre}
        </p>

        <div className="t-modal-grid pd-grid">
          {/* ── GALERÍA ── */}
          <div className="t-gallery">
            {totalImgs > 1 && (
              <div className="t-gallery-thumbs">
                {imagenes.map((img, i) => (
                  <button
                    key={img.id || i}
                    className={`t-gallery-thumb ${i===imgIndex?'active':''}`}
                    onClick={()=>setImgIndex(i)}
                  >
                    <img src={img.url} alt={img.alt} />
                  </button>
                ))}
              </div>
            )}

            <div className="t-gallery-main" style={!imgActual ? {background:getCardBg(detalle)} : undefined}>
              {imgActual ? (
                <img src={imgActual.url} alt={imgActual.alt} className="t-gallery-main-img" />
              ) : (
                <div className="t-gallery-ph"><i className={catIcon}></i></div>
              )}

              {totalImgs > 1 && (
                <>
                  <button className="t-gallery-arrow left" onClick={irAnterior} aria-label="Foto anterior">
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button className="t-gallery-arrow right" onClick={irSiguiente} aria-label="Foto siguiente">
                    <i className="bi bi-chevron-right"></i>
                  </button>
                  <span className="t-gallery-counter">{imgIndex+1} / {totalImgs}</span>
                </>
              )}
            </div>
          </div>

          {/* ── INFO ── */}
          <div className="t-modal-info">
            <h1 className="t-modal-name pd-name">{detalle.nombre}</h1>
            <p className="t-modal-price">{fmt(detalle.precio)}</p>
            {detalle.descripcion&&<p className="t-modal-desc">{detalle.descripcion}</p>}

            {detalle.colores.length>0&&(
              <div className="t-opt-group">
                <p className="t-opt-label-strong">Colores</p>
                <div className="t-opt-colors">
                  {detalle.colores.map(c=>(
                    <button key={c.nombre_color} className={`t-color-btn ${colorSelec===c.nombre_color?'active':''}`}
                      style={{background:c.hex}} title={c.nombre_color}
                      onClick={()=>{
                        if (colorSelec === c.nombre_color) { setColorSelec(null); setTallaSelec(null) }
                        else { setColorSelec(c.nombre_color); setTallaSelec(null) }
                      }}/>
                  ))}
                </div>
              </div>
            )}

            <div className="t-opt-group">
              <p className="t-opt-label-strong">Tallas{tallaSelec?`: ${tallaSelec}`:''}</p>
              <div className="t-opt-tallas">
                {(tallasDisponibles().length>0?tallasDisponibles():TALLAS_ORDEN.slice(0,6)).map(t=>(
                  <button key={t} className={`t-talla-btn ${tallaSelec===t?'active':''}`} onClick={()=>setTallaSelec(prev => prev===t ? null : t)}>{t}</button>
                ))}
              </div>
            </div>

            <p className="t-ref">Ref. {String(detalle.id).padStart(6,'0')}</p>

            {stockSeleccion !== null && (
              stockSeleccion > 0 ? (
                <p className={`t-stock-info ${stockSeleccion<=5?'low':''}`}>
                  <i className="bi bi-box-seam"></i>
                  {stockSeleccion<=5
                    ? `Quedan ${stockSeleccion} unidades en ${colorSelec} · ${tallaSelec}`
                    : `${stockSeleccion} unidades disponibles en ${colorSelec} · ${tallaSelec}`}
                </p>
              ) : (
                <p className="t-stock-info out">
                  <i className="bi bi-x-circle"></i> Sin stock en {colorSelec} · {tallaSelec}
                </p>
              )
            )}

            <div className="t-modal-actions-row">
              <button className="t-buy-now-btn" onClick={comprarAhora}>Comprar ahora</button>
              <button className="t-add-btn" onClick={agregarAlCarrito}><i className="bi bi-bag-plus"></i> Agregar al carrito</button>
            </div>

            {detalle.stock_total > 0 && detalle.stock_total <= 5 && (
              <p className="t-modal-stock-warning"><i className="bi bi-exclamation-triangle"></i> Solo quedan {detalle.stock_total} unidades en total</p>
            )}
          </div>
        </div>

        {/* ── RELACIONADOS ── */}
        {productosRelacionados.length > 0 && (
          <div className="t-related pd-related">
            <p className="t-related-title">También te puede interesar</p>
            <div className="t-related-carousel">
              {productosRelacionados.length > 4 && (
                <button className="t-related-arrow left" onClick={()=>scrollRelated(-1)} aria-label="Anteriores">
                  <i className="bi bi-chevron-left"></i>
                </button>
              )}
              <div className="t-related-track" ref={relatedRef}>
                {productosRelacionados.map(rp => (
                  <button key={rp.id} className="t-related-card t-related-card-lg" onClick={()=>navigate(`/tienda/producto/${rp.id}`)}>
                    <div className="t-related-img t-related-img-lg" style={{background:getCardBg(rp)}}>
                      {rp.imagen
                        ? <img src={rp.imagen} alt={rp.nombre} />
                        : <i className={
                            (rp.categorias[0]?.nombre_categoria||'').toUpperCase()==='TECNOLOGÍA'?'bi bi-cpu'
                            :(rp.categorias[0]?.nombre_categoria||'').toUpperCase()==='BELLEZA'?'bi bi-stars'
                            :'bi bi-bag-heart'
                          }></i>
                      }
                    </div>
                    <p className="t-related-name">{rp.nombre}</p>
                    <p className="t-related-price">{fmt(rp.precio)}</p>
                  </button>
                ))}
              </div>
              {productosRelacionados.length > 4 && (
                <button className="t-related-arrow right" onClick={()=>scrollRelated(1)} aria-label="Siguientes">
                  <i className="bi bi-chevron-right"></i>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══ CARRITO ══ */}
      <div className={`t-cart-drawer ${carritoOpen?'open':''}`}>
        <div className="t-cart-bg" onClick={()=>setCarritoOpen(false)}></div>
        <div className="t-cart-panel">
          <div className="t-cart-head">
            <h3>Carrito <span>({totalItems})</span></h3>
            <button className="t-modal-close static" onClick={()=>setCarritoOpen(false)}><i className="bi bi-x-lg"></i></button>
          </div>
          <div className="t-cart-body">
            {carrito.length===0?(
              <div className="t-cart-empty"><i className="bi bi-bag"></i><p>Tu carrito está vacío</p></div>
            ):carrito.map(item=>(
              <div key={item.key} className="t-cart-item">
                <div className="t-ci-img" style={!item.imagen ? {background:item.catBg||CAT_BG.DEFAULT} : undefined}>
                  {item.imagen
                    ? <img src={item.imagen} alt={item.nombre} />
                    : <div className="t-ci-ph"><i className="bi bi-bag-heart"></i></div>
                  }
                </div>
                <div className="t-ci-info">
                  <p className="t-ci-name">{item.nombre}</p>
                  <p className="t-ci-meta">{item.color} · {item.talla}</p>
                  <p className="t-ci-unit-price">{fmt(item.precio)} c/u</p>
                  <div className="t-ci-qty">
                    <button onClick={()=>cambiarCantidad(item.key,-1)}>−</button>
                    <span>{item.cantidad}</span>
                    <button
                      onClick={()=>cambiarCantidad(item.key,1)}
                      disabled={item.stockMax!=null && item.cantidad>=item.stockMax}
                    >+</button>
                  </div>
                  {item.stockMax!=null && item.cantidad>=item.stockMax && (
                    <p className="t-ci-stock-max">Máximo disponible</p>
                  )}
                </div>
                <div className="t-ci-right">
                  <p className="t-ci-price">{fmt(item.precio*item.cantidad)}</p>
                  <button className="t-ci-del" onClick={()=>quitarItem(item.key)}><i className="bi bi-trash3"></i></button>
                </div>
              </div>
            ))}
          </div>
          {carrito.length>0&&(
            <div className="t-cart-foot">
              <div className="t-cart-subtotal">
                <div className="t-cart-subtotal-row"><span>Subtotal</span><span>{fmt(totalPrice)}</span></div>
                <div className="t-cart-subtotal-row"><span>Envío</span><span className="t-cart-gratis">Gratis</span></div>
                <div className="t-cart-subtotal-row t-cart-iva"><span>IVA (19%)</span><span>{fmt(totalPrice * 0.19)}</span></div>
              </div>
              <div className="t-cart-total"><span>Total</span><span>{fmt(totalPrice * 1.19)}</span></div>
              <button className="t-checkout-btn" onClick={() => {
                const sesion = sessionStorage.getItem('tiendaSesion')
                if (!sesion) {
                  setCarritoOpen(false)
                  setAuthOpen(true)
                  return
                }
                setCarritoOpen(false)
                navigate('/tienda/checkout')
              }}>
                Finalizar compra
              </button>
              <button className="t-keep-btn" onClick={()=>setCarritoOpen(false)}>Seguir comprando</button>
            </div>
          )}
        </div>
      </div>

      {authOpen && (
        <TiendaAuth
          onClose={() => setAuthOpen(false)}
          onLoginSuccess={() => { setAuthOpen(false); navigate('/tienda/checkout') }}
        />
      )}

      {toast&&<div className="t-toast">{toast}</div>}
    </div>
  )
}