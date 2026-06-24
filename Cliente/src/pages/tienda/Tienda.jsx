import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './Tienda.css'
import TiendaAuth from '../tiendaAuht/TiendaAuth'

const MEGA_MENU = {
  MUJER: {
    columns: [
      { title:'Ropa', links:['Camisetas','Blusas','Vestidos','Faldas','Pantalones','Jeans','Shorts','Chaquetas','Sudaderas','Pijamas'] },
      { title:'Calzado', links:['Tenis','Tacones','Botas','Sandalias','Mocasines','Baletas','Pantuflas'] },
      { title:'Accesorios', links:['Bolsos','Carteras','Relojes','Perfumes','Gafas de Sol','Bisutería','Gorras','Cinturones'] },
      { title:'Destacado', links:['Más vendidos','Nuevos ingresos','Ofertas','Colección Premium'], featured:true }
    ]
  },
  HOMBRE: {
    columns: [
      { title:'Ropa', links:['Camisetas','Camisas','Pantalones','Jeans','Shorts','Chaquetas','Sudaderas','Ropa Interior','Trajes'] },
      { title:'Calzado', links:['Tenis','Zapatos Formales','Botas','Sandalias','Chanclas','Mocasines'] },
      { title:'Accesorios', links:['Relojes','Perfumes','Billeteras','Cinturones','Gafas de Sol','Gorras','Maletines'] },
      { title:'Destacado', links:['Más vendidos','Nuevos ingresos','Ofertas','Colección Premium'], featured:true }
    ]
  },
  NIÑOS: {
    columns: [
      { title:'Ropa Niñas', links:['Vestidos','Camisetas','Faldas','Pantalones','Chaquetas','Pijamas','Ropa Bebé'] },
      { title:'Ropa Niños', links:['Camisetas','Pantalones','Shorts','Chaquetas','Uniformes','Pijamas','Ropa Bebé'] },
      { title:'Calzado y Accesorios', links:['Tenis','Sandalias','Botas','Gorras','Maletines Escolares','Medias'] },
      { title:'Por Edad', links:['0–2 años','2–5 años','5–8 años','8–12 años','12–16 años'], featured:true }
    ]
  },
  DEPORTE: {
    columns: [
      { title:'Por Disciplina', links:['Fútbol','Running','Gimnasio','Natación','Ciclismo','Tennis','Yoga','Basketball'] },
      { title:'Ropa Deportiva', links:['Camisetas Técnicas','Licras','Shorts','Chaquetas','Tops','Medias Deportivas'] },
      { title:'Calzado Deportivo', links:['Running','Fútbol','Gimnasio','Multideporte','Ciclismo'] },
      { title:'Equipamiento', links:['Balones','Guantes','Maletines Deportivos','Hidratación','Protecciones'], featured:true }
    ]
  },
  TECNOLOGÍA: {
    columns: [
      { title:'Gadgets', links:['Drones','Cámaras','GoPro y Acción','Telescopios','Proyectores','Relojes Inteligentes'] },
      { title:'Audio y Video', links:['Audífonos','Parlantes','Auriculares','Bocinas Bluetooth','Consolas','Accesorios Gaming'] },
      { title:'Hogar Inteligente', links:['Aspiradoras Robot','Alarmas','Cámaras de Seguridad','Bombillos Smart'] },
      { title:'Bestsellers Tech', links:['Más vendidos','Ofertas Flash','Nuevos Arrivals'], featured:true }
    ]
  },
  BELLEZA: {
    columns: [
      { title:'Perfumería', links:['Perfumes Mujer','Perfumes Hombre','Sets de Regalo','Desodorantes','Splash Corporal'] },
      { title:'Skincare', links:['Cremas','Sérum','Protectores Solares','Limpiadores','Mascarillas'] },
      { title:'Maquillaje', links:['Labiales','Base','Sombras','Máscaras','Brochas','Fijadores'] },
      { title:'Cabello', links:['Shampoo','Acondicionador','Tintes','Herramientas','Tratamientos'], featured:true }
    ]
  },
}

const API_BASE = import.meta.env.VITE_API_URL
const API = `${API_BASE}/api`

// session_id persistente por navegador, usado para identificar las
// reservas temporales de stock de este carrito frente a otros clientes.
const getSessionId = () => {
  let id = localStorage.getItem('mm_session_id')
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    localStorage.setItem('mm_session_id', id)
  }
  return id
}

// Convierte una ruta de imagen (relativa o absoluta) en una URL completa y usable
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

  // Normaliza el array de imágenes (puede venir vacío si el producto no tiene fotos cargadas)
  const imagenesArr = (p.imagenes || [])
    .map(img => ({
      id:       img.id_imagen,
      url:      resolverUrlImagen(img.url_imagen),
      alt:      img.alt_text || p.nombre_producto,
      principal: img.es_principal === 1 || img.es_principal === true,
    }))
    .filter(img => !!img.url)

  // Si no vino el array pero sí imagen_principal (compatibilidad hacia atrás), úsala
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

const CAT_BG = {
  MUJER:      'linear-gradient(135deg,#f9e0d5 0%,#e8c9bb 100%)',
  HOMBRE:     'linear-gradient(135deg,#d5e0f9 0%,#b8c9e8 100%)',
  NIÑOS:      'linear-gradient(135deg,#d5f9e0 0%,#b8e8c9 100%)',
  DEPORTE:    'linear-gradient(135deg,#e8d5f9 0%,#d0b8e8 100%)',
  TECNOLOGÍA: 'linear-gradient(135deg,#0d1b2a 0%,#1a2f4a 50%,#0a1628 100%)',
  BELLEZA:    'linear-gradient(135deg,#fce4ec 0%,#f8bbd0 100%)',
  DEFAULT:    'linear-gradient(135deg,#f0ede8 0%,#e0dbd2 100%)',
}

const NAV_CATS = ['TODAS','MUJER','HOMBRE','NIÑOS','DEPORTE','TECNOLOGÍA','BELLEZA']

const CAT_EMOJI = {
  MUJER:      '👜',
  HOMBRE:     '👔',
  NIÑOS:      '🧸',
  DEPORTE:    '🏆',
  TECNOLOGÍA: '💻',
  BELLEZA:    '💄',
}

// ─── Gold Liquid Canvas ────────────────────────
function GoldCanvas() {
  return (
    <div className="t-hero-canvas" aria-hidden="true">
      <div className="t-gold-base" />
      <div className="t-gold-wave1" />
      <div className="t-gold-wave2" />
      <div className="t-gold-wave3" />
      <div className="t-gold-shine" />
      <div className="t-gold-crease" />
    </div>
  )
}

// ─── Waterfall Section ────────────────────────────────
function WaterfallSection() {
  const features = [
    { icon: 'bi bi-shield-check',  title: 'Compra segura',      desc: 'Pagos cifrados y datos protegidos.' },
    { icon: 'bi bi-headset',       title: 'Soporte 7/7',        desc: 'Te atendemos por WhatsApp e Instagram.' },
    { icon: 'bi bi-x-circle',      title: 'Sin devoluciones',   desc: 'No realizamos devoluciones. Todos los cambios y ventas son definitivos.' },
  ]

  return (
    <section className="t-waterfall">
      <div className="t-waterfall-bg">
        <svg className="t-wf-svg" viewBox="0 0 1440 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wfBase" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#8a5c02"/>
              <stop offset="100%" stopColor="#6a3e01"/>
            </linearGradient>
            <linearGradient id="wfMid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#C8920A"/>
              <stop offset="100%" stopColor="#8a5c02"/>
            </linearGradient>
            <linearGradient id="wfTop" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#E2A820"/>
              <stop offset="100%" stopColor="#B07808"/>
            </linearGradient>
            <linearGradient id="wfShine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#F0BC3A"/>
              <stop offset="100%" stopColor="#C8920A"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1440" height="300" fill="#f6f5f3"/>
          <path d="M0,80 C200,20 400,160 600,80 C800,0 1000,140 1200,70 C1320,30 1400,110 1440,75 L1440,300 L0,300 Z" fill="url(#wfMid)"/>
          <path d="M0,140 C160,200 360,60 580,145 C800,225 1020,60 1220,140 C1340,185 1420,105 1440,135 L1440,300 L0,300 Z" fill="url(#wfTop)"/>
          <path d="M0,185 C220,120 460,240 700,170 C940,100 1160,215 1380,155 C1410,145 1430,150 1440,148 L1440,300 L0,300 Z" fill="url(#wfMid)" fillOpacity="0.7"/>
          <path d="M0,220 C280,150 560,270 840,195 C1080,130 1280,240 1440,185 L1440,300 L0,300 Z" fill="url(#wfShine)" fillOpacity="0.5"/>
        </svg>
      </div>

      <div className="t-inner t-wf-inner">
        <div className="t-wf-header">
          <p className="t-wf-eyebrow">Nuestra historia</p>
          <h2 className="t-wf-title">Todo con <span>propósito</span></h2>
          <p className="t-wf-sub">En Moda Mágica creemos que cada compra es una expresión de ti.<br/>Moda, tecnología, belleza y más — todo en un solo lugar.</p>
        </div>

        <div className="t-wf-divider">
          <span className="t-wf-divider-line"/>
          <span className="t-wf-divider-gem">✦</span>
          <span className="t-wf-divider-line"/>
        </div>

        <div className="t-wf-features">
          {features.map((f, i) => (
            <div key={i} className="t-wf-feature">
              <div className="t-wf-feat-icon-wrap">
                <i className={f.icon}></i>
              </div>
              <div>
                <p className="t-wf-feat-title">{f.title}</p>
                <p className="t-wf-feat-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Product Detail Modal (galería + relacionados) ────────
// ─── Main Component ────────────────────────────────────────
export default function Tienda() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [productos,   setProductos]  = useState([])
  const [loading,     setLoading]    = useState(true)
  const [errorApi,    setErrorApi]   = useState(null)
  const [search,      setSearch]     = useState('')
  const [catActiva,   setCatActiva]  = useState('TODAS')
  const [orden,       setOrden]      = useState('precio-asc')
  const [ordenOpen,   setOrdenOpen]  = useState(false)

  // Carrito: se inicializa leyendo de localStorage para que sobreviva
  // a recargas de página y para que /tienda/checkout pueda leer lo mismo.
  const [carrito, setCarrito] = useState(() => {
    try {
      const guardado = localStorage.getItem('mm_carrito')
      return guardado ? JSON.parse(guardado) : []
    } catch {
      return []
    }
  })

  const [carritoOpen, setCarritoOpen]= useState(false)
  const [toast,       setToast]      = useState('')
  const [authOpen,    setAuthOpen]   = useState(false)
  const [menuOpen,    setMenuOpen]   = useState(false)
  const [activeMenu,  setActiveMenu] = useState(null)
  const menuTimeout  = useRef(null)
  const searchRef    = useRef()
  const searchBoxRef = useRef()
  const [searchOpen, setSearchOpen] = useState(false)

  // El catálogo se muestra como carrusel horizontal por categoría, partido
  // en dos bloques con el banner "¿Para quién estás comprando?" en medio.
  const catalogTrackRef  = useRef(null)
  const catalogTrackRef2 = useRef(null)
  const scrollCatalog = (ref, dir) => {
    const el = ref.current
    if (!el) return
    const cardWidth = el.firstChild ? el.firstChild.offsetWidth + 20 : 230
    el.scrollBy({ left: dir * cardWidth * 2, behavior: 'smooth' })
  }

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
        console.error('Error cargando productos:', err)
        setErrorApi('No se pudieron cargar los productos. Verifica que el servidor esté corriendo.')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  // Guarda el carrito en localStorage cada vez que cambie, así
  // /tienda/checkout siempre lee la versión más reciente.
  useEffect(() => {
    localStorage.setItem('mm_carrito', JSON.stringify(carrito))
  }, [carrito])

  // Si llegamos desde /tienda/perfil sin sesión, abre el login automáticamente
  useEffect(() => {
    if (searchParams.get('login') === '1') {
      setAuthOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  const filtrados = productos
    .filter(p => p.estado === 'activo' && p.stock_total > 0)
    .filter(p => catActiva === 'TODAS' || p.categorias.some(c =>
      (c.nombre_categoria||'').toUpperCase() === catActiva
    ))
    .filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if (orden==='precio-asc')  return a.precio - b.precio
      if (orden==='precio-desc') return b.precio - a.precio
      if (orden==='nombre')      return a.nombre.localeCompare(b.nombre)
      return 0
    })

  // El catálogo se divide en dos tandas: las primeras 3 columnas de
  // productos, luego el banner de categorías, y el resto abajo.
  const primerosProductos = filtrados.slice(0, 3)
  const masProductos      = filtrados.slice(3)

  const totalItems = carrito.reduce((s,i) => s+i.cantidad, 0)
  const totalPrice = carrito.reduce((s,i) => s+i.precio*i.cantidad, 0)
  const fmt = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n).replace(/\s/g,'')

  const cambiarCantidad = async (key, delta) => {
    const item = carrito.find(i => i.key === key)
    if (!item) return
    const max = item.stockMax ?? Infinity
    const nueva = Math.min(max, Math.max(1, item.cantidad + delta))
    if (delta > 0 && item.cantidad >= max) { showToast(`Solo hay ${max} unidades disponibles.`); return }
    if (nueva === item.cantidad) return

    // Renueva/ajusta la reserva en el backend (esto también reinicia
    // el contador de 15 minutos de la reserva)
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
    // Libera la reserva de inmediato, sin esperar los 15 minutos
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

  const showToast   = msg => { setToast(msg); setTimeout(()=>setToast(''),2800) }

  // El detalle de producto ahora es una página propia, no un modal.
  const abrirDetalle = p => navigate(`/tienda/producto/${p.id}`)

  const getCardBg = p => CAT_BG[(p.categorias[0]?.nombre_categoria||'').toUpperCase()]||CAT_BG.DEFAULT

  const setCategoria = cat => setCatActiva(cat)

  const handleNavEnter = cat => { clearTimeout(menuTimeout.current); if (MEGA_MENU[cat]) setActiveMenu(cat) }
  const handleNavLeave = ()  => { menuTimeout.current = setTimeout(()=>setActiveMenu(null), 120) }
  const handleMenuEnter= ()  => clearTimeout(menuTimeout.current)
  const handleMenuLeave= ()  => { menuTimeout.current = setTimeout(()=>setActiveMenu(null), 120) }

  // Tarjeta de producto reutilizada tanto en el carrusel como en la cuadrícula
  const renderCard = p => (
    <article key={p.id} className="t-card" onClick={()=>abrirDetalle(p)}>
      <div className="t-card-img" style={!p.imagen ? {background:getCardBg(p)} : undefined}>
        {p.imagen
          ?<img src={p.imagen} alt={p.nombre}/>
          :<div className="t-card-placeholder">
            <i className={
              (p.categorias[0]?.nombre_categoria||'').toUpperCase()==='TECNOLOGÍA'?'bi bi-cpu'
              :(p.categorias[0]?.nombre_categoria||'').toUpperCase()==='BELLEZA'?'bi bi-stars'
              :'bi bi-bag-heart'
            }></i>
          </div>
        }
      </div>
      <div className="t-card-body">
        <p className="t-card-price">{fmt(p.precio)}</p>
        <p className="t-card-name">{p.nombre}</p>
        {p.categorias[0]&&<p className="t-card-cat">{p.categorias[0].nombre_categoria}</p>}
      </div>
    </article>
  )

  return (
    <div className="t-root">

      {/* ══ NAVBAR ══ */}
      <header className="t-nav">
        <div className="t-nav-main">
          <div className="t-nav-inner">
            <a className="t-logo" href="/tienda">✦ MODA MÁGICA ✦</a>

            <nav className={`t-nav-cats ${menuOpen?'open':''}`}>
              {NAV_CATS.filter(c=>c!=='TODAS').map(cat=>(
                <div key={cat} className="t-nav-item"
                  onMouseEnter={()=>handleNavEnter(cat)}
                  onMouseLeave={handleNavLeave}
                >
                  <button
                    className={`t-nav-cat ${catActiva===cat?'active':''}`}
                    onClick={()=>{setCategoria(cat);setMenuOpen(false);setActiveMenu(null)}}
                  >
                    {cat}
                    {MEGA_MENU[cat] && <span className="t-nav-chevron">›</span>}
                  </button>
                </div>
              ))}
              <button
                className={`t-nav-cat todas ${catActiva==='TODAS'?'active':''}`}
                onClick={()=>{setCategoria('TODAS');setMenuOpen(false)}}
              >TODO</button>
            </nav>

            <div className="t-nav-actions">
              <div className="t-search-box" ref={searchBoxRef}>
                <input
                  ref={searchRef}
                  className="t-search-input"
                  placeholder="Buscar productos o categoría..."
                  value={search}
                  onChange={e=>{ setSearch(e.target.value); setSearchOpen(true) }}
                  onFocus={()=>setSearchOpen(true)}
                  onBlur={()=>setTimeout(()=>setSearchOpen(false), 180)}
                />
                <button className="t-search-icon" onClick={()=>{ if(search) { setSearch(''); searchRef.current?.focus() } }}><i className={`bi bi-${search?'x':'search'}`}></i></button>

                {searchOpen && (
                  <div className="t-search-dropdown">
                    {NAV_CATS.filter(c => c !== 'TODAS' && c.toLowerCase().includes(search.toLowerCase())).length > 0 && (
                      <div className="t-sd-section">
                        <p className="t-sd-label">Categorías</p>
                        {NAV_CATS.filter(c => c !== 'TODAS' && c.toLowerCase().includes(search.toLowerCase())).map(cat => (
                          <button key={cat} className="t-sd-item t-sd-cat"
                            onMouseDown={()=>{ setCategoria(cat); setSearch(''); setSearchOpen(false); document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth'}) }}>
                            <i className="bi bi-tag"></i> {cat}
                          </button>
                        ))}
                      </div>
                    )}
                    {search.length >= 2 && productos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase())).slice(0,5).length > 0 && (
                      <div className="t-sd-section">
                        <p className="t-sd-label">Productos</p>
                        {productos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase())).slice(0,5).map(p => (
                          <button key={p.id} className="t-sd-item"
                            onMouseDown={()=>{ setSearch(p.nombre); setSearchOpen(false); document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth'}) }}>
                            <i className="bi bi-bag"></i> {p.nombre}
                            <span className="t-sd-price">{fmt(p.precio)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {search.length >= 2 &&
                      NAV_CATS.filter(c => c !== 'TODAS' && c.toLowerCase().includes(search.toLowerCase())).length === 0 &&
                      productos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                      <div className="t-sd-empty"><i className="bi bi-search"></i> Sin resultados para "{search}"</div>
                    )}
                    {!search && (
                      <div className="t-sd-section">
                        <p className="t-sd-label">Categorías</p>
                        <div className="t-sd-cats-grid">
                          {NAV_CATS.filter(c=>c!=='TODAS').map(cat=>(
                            <button key={cat} className="t-sd-cat-pill"
                              onMouseDown={()=>{ setCategoria(cat); setSearchOpen(false); document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth'}) }}>
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button className="t-icon-btn" title="Mi cuenta" onClick={() => navigate('/tienda/perfil')}><i className="bi bi-person"></i></button>
              <button className="t-icon-btn cart-btn" onClick={()=>setCarritoOpen(true)} title="Carrito">
                <i className="bi bi-bag"></i>
                {totalItems>0 && <span className="t-cart-badge">{totalItems}</span>}
              </button>
              <button className="t-hamburger" onClick={()=>setMenuOpen(v=>!v)}>
                <i className={`bi bi-${menuOpen?'x-lg':'list'}`}></i>
              </button>
            </div>
          </div>
        </div>

        {activeMenu && MEGA_MENU[activeMenu] && (
          <div className="t-mega" onMouseEnter={handleMenuEnter} onMouseLeave={handleMenuLeave}>
            <div className="t-mega-inner">
              {MEGA_MENU[activeMenu].columns.map((col,i)=>(
                <div key={i} className={`t-mega-col ${col.featured?'featured':''}`}>
                  <p className="t-mega-title">{col.title}</p>
                  <ul className="t-mega-list">
                    {col.links.map(link=>(
                      <li key={link}>
                        <a href="#catalogo" className="t-mega-link"
                          onClick={()=>{setCategoria(activeMenu);setActiveMenu(null)}}
                        >{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="t-mega-promo">
                <div className="t-mega-promo-inner" style={{background:CAT_BG[activeMenu]||CAT_BG.DEFAULT}}>
                  <p className="t-mega-promo-tag">Destacado</p>
                  <h3 className="t-mega-promo-title">Nueva<br/>Colección</h3>
                  <p className="t-mega-promo-sub">Hasta 40% OFF</p>
                  <a href="#catalogo" className="t-mega-promo-btn"
                    onClick={()=>{setCategoria(activeMenu);setActiveMenu(null)}}
                  >Ver todo {activeMenu}</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO ══ */}
      <section className="t-hero">
        <GoldCanvas />
        <div className="t-hero-overlay" />
        <div className="t-hero-content">
          <p className="t-hero-eyebrow">Nueva colección</p>
          <h1 className="t-hero-title">Todo lo<br/>que <em>necesitas</em></h1>
          <p className="t-hero-sub">Moda, tecnología, belleza y más: todo en un solo lugar, diseñado para ti.</p>
          <a href="#catalogo" className="t-hero-btn">Explorar colección</a>
        </div>
      </section>

      {/* ══ CATÁLOGO ══ */}
      <section id="catalogo" className="t-catalogo">
        <div className="t-inner">

          <div className="t-toolbar">
            <div className="t-toolbar-left">
              <h2 className="t-section-title">
                {catActiva==='TODAS'?'Todos los productos':catActiva}
              </h2>
              <span className="t-count">{filtrados.length} productos</span>
            </div>
            <div className="t-toolbar-right">
              <div className="t-sort-wrap">
                <button className={`t-sort-btn ${ordenOpen?'open':''}`} onClick={()=>setOrdenOpen(v=>!v)}>
                  <i className="bi bi-sliders"></i>
                  <span>{orden==='precio-asc'?'Menor precio':'Mayor precio'}</span>
                  <i className={`bi bi-chevron-${ordenOpen?'up':'down'} t-sort-chevron`}></i>
                </button>
                {ordenOpen && (
                  <div className="t-sort-dropdown">
                    {[
                      {val:'precio-asc', label:'Menor precio', icon:'bi-arrow-up'},
                      {val:'precio-desc',label:'Mayor precio', icon:'bi-arrow-down'},
                    ].map(opt=>(
                      <button key={opt.val}
                        className={`t-sort-option ${orden===opt.val?'active':''}`}
                        onClick={()=>{setOrden(opt.val);setOrdenOpen(false)}}>
                        <i className={`bi ${opt.icon}`}></i>
                        <span>{opt.label}</span>
                        {orden===opt.val && <i className="bi bi-check2 t-sort-check"></i>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="t-pills">
            {NAV_CATS.map(cat=>(
              <button key={cat} className={`t-pill ${catActiva===cat?'active':''}`} onClick={()=>setCategoria(cat)}>
                {cat==='TODAS'?'TODO':cat}
              </button>
            ))}
          </div>

          {loading?(
            <div className="t-state"><i className="bi bi-hourglass-split t-spin"></i><p>Cargando productos...</p></div>
          ):errorApi?(
            <div className="t-state t-state-error"><i className="bi bi-exclamation-circle"></i><p>{errorApi}</p></div>
          ):filtrados.length===0?(
            <div className="t-state"><i className="bi bi-bag-x"></i><p>No se encontraron productos</p></div>
          ):(
            <>
              {/* ── Primeros productos (hasta 3 columnas) ── */}
              <div className="t-catalog-carousel">
                {primerosProductos.length > 4 && (
                  <button className="t-related-arrow left" onClick={()=>scrollCatalog(catalogTrackRef,-1)} aria-label="Anteriores">
                    <i className="bi bi-chevron-left"></i>
                  </button>
                )}
                <div className="t-catalog-track" ref={catalogTrackRef}>
                  {primerosProductos.map(p=>renderCard(p))}
                </div>
                {primerosProductos.length > 4 && (
                  <button className="t-related-arrow right" onClick={()=>scrollCatalog(catalogTrackRef,1)} aria-label="Siguientes">
                    <i className="bi bi-chevron-right"></i>
                  </button>
                )}
              </div>

              {/* ── ¿Para quién estás comprando? ── */}
              <div className="t-shopby">
                <h2 className="t-shopby-title">¿Para quién estás comprando?</h2>
                <div className="t-shopby-row">
                  {NAV_CATS.filter(c=>c!=='TODAS').map(cat=>(
                    <button key={cat} className="t-shopby-item" onClick={()=>setCategoria(cat)}>
                      <span className="t-shopby-circle" style={{background:CAT_BG[cat]}}>
                        <span className="t-shopby-emoji">{CAT_EMOJI[cat]}</span>
                      </span>
                      <span className="t-shopby-label">{cat}</span>
                    </button>
                  ))}
                  <button className="t-shopby-item" onClick={()=>setCategoria('TODAS')}>
                    <span className="t-shopby-circle t-shopby-circle-all">
                      <i className="bi bi-grid"></i>
                    </span>
                    <span className="t-shopby-label">Ver todo</span>
                  </button>
                </div>
              </div>

              {/* ── Más productos ── */}
              {masProductos.length > 0 && (
                <>
                  <h3 className="t-section-title t-mas-productos-title">Más productos</h3>
                  <div className="t-catalog-carousel">
                    {masProductos.length > 4 && (
                      <button className="t-related-arrow left" onClick={()=>scrollCatalog(catalogTrackRef2,-1)} aria-label="Anteriores">
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    )}
                    <div className="t-catalog-track" ref={catalogTrackRef2}>
                      {masProductos.map(p=>renderCard(p))}
                    </div>
                    {masProductos.length > 4 && (
                      <button className="t-related-arrow right" onClick={()=>scrollCatalog(catalogTrackRef2,1)} aria-label="Siguientes">
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <WaterfallSection />

      {/* ══ FOOTER ══ */}
      <footer className="t-footer">
        <div className="t-footer-top">
          <div className="t-footer-brand">
            <span className="t-logo small">✦ MODA MÁGICA ✦</span>
            <p>Todo lo que necesitas en un solo lugar. Moda, tecnología y belleza con amor.</p>
            <div className="t-social-row">
              <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer" className="t-social-btn whatsapp"><i className="bi bi-whatsapp"></i></a>
              <a href="https://www.instagram.com/moda.magica2027?igsh=YXNqYTBwbGFlbWx5" className="t-social-btn instagram"><i className="bi bi-instagram"></i></a>
              <a href="https://www.tiktok.com/@modamagica.store?is_from_webapp=1&sender_device=pc" className="t-social-btn"><i className="bi bi-tiktok"></i></a>
            </div>
          </div>
          <div className="t-footer-col">
            <p className="t-footer-col-title">Tienda</p>
            <ul><li><a href="#">Mujer</a></li><li><a href="#">Hombre</a></li><li><a href="#">Niños</a></li><li><a href="#">Deporte</a></li><li><a href="#">Tecnología</a></li><li><a href="#">Belleza</a></li></ul>
          </div>
          <div className="t-footer-col">
            <p className="t-footer-col-title">Empresa</p>
            <ul><li><a href="#">Términos</a></li><li><a href="#">Privacidad</a></li></ul>
          </div>
        </div>
        <div className="t-footer-inner">
          <p className="t-copy">© {new Date().getFullYear()} Moda Mágica · Todos los derechos reservados.</p>
          <div className="t-footer-links"><a href="#">Términos</a><a href="#">Privacidad</a><a href="#">Contacto</a></div>
        </div>
      </footer>

      <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer" className="t-whatsapp-float" title="WhatsApp">
        <i className="bi bi-whatsapp"></i>
      </a>

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
          onLoginSuccess={() => navigate('/tienda/perfil')}
        />
      )}

      {toast&&<div className="t-toast">{toast}</div>}
    </div>
  )
}