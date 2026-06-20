import { useState, useEffect } from 'react'
import axios from 'axios'
import './Dashboard.css'

const API = import.meta.env.VITE_API_URL
const API_PRODUCTOS  = `${API}/api/productos`
const API_IMAGENES   = `${API}/api/imagenes`
const API_PEDIDOS    = `${API}/api/pedidos`
const API_DESCUENTOS = `${API}/api/descuentos`

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  procesando: 'Procesando',
  enviado:    'Enviado',
  entregado:  'Entregado',
  cancelado:  'Cancelado',
}

/* Paleta decorativa: gradientes de dos tonos con buena armonía cromática,
   inspirados en combinaciones cálidas/frías que se distinguen bien entre sí. */
const PALETTE = [
  ['#E8A33D', '#C9962A'], // dorado cálido
  ['#A78BFA', '#7C5CE0'], // violeta
  ['#5EC8E8', '#3B9FE0'], // celeste
  ['#4FD1A5', '#2BAF85'], // esmeralda
  ['#F2A65A', '#E8708A'], // atardecer
  ['#8FA9F2', '#5B7FE8'], // azul lavanda
  ['#45C2C2', '#2D9E9E'], // turquesa
  ['#F0918C', '#E0586B'], // coral
]

function ChartCard({ title, icon, loading, empty, children }) {
  return (
    <div className="card chart-card">
      <div className="chart-card-header">
        <i className={`bi ${icon} chart-card-icon`}></i>
        <h3 className="card-title">{title}</h3>
      </div>
      {loading
        ? <div className="empty-state">Cargando...</div>
        : empty
          ? <div className="empty-state"><i className="bi bi-bar-chart"></i> Sin datos para mostrar</div>
          : <div className="chart-card-body">{children}</div>
      }
    </div>
  )
}

/* ── Gráfica de barras única para todo el Dashboard (SVG, sin librerías) ──
   Altura fija en píxeles reales para que las barras siempre se vean
   proporcionadas sin importar cuántos datos haya. Cuando solo hay un dato,
   se usa un techo de referencia en vez del propio valor como máximo, para
   que la barra no se vea siempre al 100%. */
function BarChart({ data, labelKey, valueKey }) {
  const [hover, setHover] = useState(null)

  const CHART_H = 180
  const BAR_AREA_TOP = 16
  const maxArea = CHART_H - BAR_AREA_TOP

  const valores = data.map(d => d[valueKey])
  const max = data.length > 1 ? Math.max(1, ...valores) : Math.max(valores[0] || 0, 5) * 1.4

  return (
    <div className="bar-chart">
      <div className="bar-chart-track">
        {data.map((d, i) => {
          const h = Math.max(4, Math.round((d[valueKey] / max) * maxArea))
          const [colorClaro, colorOscuro] = PALETTE[i % PALETTE.length]
          return (
            <div
              key={i}
              className="bar-chart-col"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {hover === i && <span className="bar-chart-value">{d[valueKey]}</span>}
              <div
                className="bar-chart-bar"
                style={{
                  height: `${h}px`,
                  background: `linear-gradient(145deg, ${colorClaro} 0%, ${colorOscuro} 100%)`,
                  opacity: hover === null || hover === i ? 1 : 0.55,
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="bar-chart-labels">
        {data.map((d, i) => (
          <div
            key={i}
            className={`bar-chart-label${hover === i ? ' active' : ''}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            title={`${d[labelKey]}: ${d[valueKey]}`}
          >
            {d[labelKey]}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [productos, setProductos] = useState([])
  const [pedidos, setPedidos]     = useState([])
  const [descuentos, setDescuentos] = useState([])

  const [loadingProductos, setLoadingProductos]   = useState(true)
  const [loadingPedidos, setLoadingPedidos]       = useState(true)
  const [loadingDescuentos, setLoadingDescuentos] = useState(true)

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const res = await axios.get(API_PRODUCTOS)
        const listado = res.data.productos ?? res.data
        const productosConImagenes = await Promise.all(listado.map(async p => ({
          id: p.id_producto,
          nombre: p.nombre_producto,
          categorias: p.categorias || [],
          stock_total: Number(p.stock_total || 0),
        })))
        setProductos(productosConImagenes)
      } catch (err) {
        console.error('Error cargarProductos:', err.response?.data || err.message)
      } finally {
        setLoadingProductos(false)
      }
    }

    const cargarPedidos = async () => {
      try {
        const res = await fetch(API_PEDIDOS)
        const data = await res.json()
        setPedidos(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error cargarPedidos:', err)
      } finally {
        setLoadingPedidos(false)
      }
    }

    const cargarDescuentos = async () => {
      try {
        const res = await fetch(API_DESCUENTOS)
        const data = await res.json()
        setDescuentos(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error cargarDescuentos:', err)
      } finally {
        setLoadingDescuentos(false)
      }
    }

    cargarProductos()
    cargarPedidos()
    cargarDescuentos()
  }, [])

  // ── Datos: productos por categoría ──
  const productosPorCategoria = (() => {
    const conteo = {}
    productos.forEach(p => {
      const cats = p.categorias.length ? p.categorias.map(c => c.nombre_categoria) : ['Sin categoría']
      cats.forEach(nombre => { conteo[nombre] = (conteo[nombre] || 0) + 1 })
    })
    return Object.entries(conteo).map(([nombre, cantidad]) => ({ nombre, cantidad }))
  })()

  // ── Datos: stock por categoría ──
  const stockPorCategoria = (() => {
    const conteo = {}
    productos.forEach(p => {
      const cats = p.categorias.length ? p.categorias.map(c => c.nombre_categoria) : ['Sin categoría']
      cats.forEach(nombre => { conteo[nombre] = (conteo[nombre] || 0) + p.stock_total })
    })
    return Object.entries(conteo).map(([nombre, stock]) => ({ nombre, stock }))
  })()

  // ── Datos: pedidos por estado ──
  const pedidosPorEstado = (() => {
    const conteo = {}
    pedidos.forEach(p => { conteo[p.estado_pedido] = (conteo[p.estado_pedido] || 0) + 1 })
    return Object.entries(conteo).map(([estado, cantidad]) => ({
      estado,
      cantidad,
      label: ESTADO_LABELS[estado] || estado,
    }))
  })()

  // ── Datos: descuentos más usados ──
  const descuentosMasUsados = [...descuentos]
    .sort((a, b) => Number(b.usos_actuales || 0) - Number(a.usos_actuales || 0))
    .slice(0, 6)
    .map(d => ({ codigo: d.codigo, usos: Number(d.usos_actuales || 0) }))

  return (
    <>
      <div className="brand-header">
        <h1 className="brand-title">
          <span className="brand-star">✦</span> MODA MÁGICA <span className="brand-star">✦</span>
        </h1>
      </div>

      <div className="charts-grid">
        <ChartCard title="Productos por categoría" icon="bi-tags" loading={loadingProductos} empty={productosPorCategoria.length === 0}>
          <BarChart data={productosPorCategoria} labelKey="nombre" valueKey="cantidad" />
        </ChartCard>

        <ChartCard title="Stock por categoría" icon="bi-box-seam" loading={loadingProductos} empty={stockPorCategoria.length === 0}>
          <BarChart data={stockPorCategoria} labelKey="nombre" valueKey="stock" />
        </ChartCard>

        <ChartCard title="Pedidos por estado" icon="bi-bag-check" loading={loadingPedidos} empty={pedidosPorEstado.length === 0}>
          <BarChart data={pedidosPorEstado} labelKey="label" valueKey="cantidad" />
        </ChartCard>

        <ChartCard title="Descuentos más usados" icon="bi-ticket-perforated" loading={loadingDescuentos} empty={descuentosMasUsados.length === 0}>
          <BarChart data={descuentosMasUsados} labelKey="codigo" valueKey="usos" />
        </ChartCard>
      </div>
    </>
  )
}
