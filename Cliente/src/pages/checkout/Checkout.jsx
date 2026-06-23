import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Checkout.css'

const CAT_BG_DEFAULT = 'linear-gradient(135deg,#f0ede8 0%,#e0dbd2 100%)'
const API_BASE = import.meta.env.VITE_API_URL

export default function Checkout() {
  const navigate = useNavigate()
  const [carrito, setCarrito]             = useState([])
  const [cargado, setCargado]             = useState(false)
  const [sesion, setSesion]               = useState(null)
  const [modalDatos, setModalDatos]       = useState(false)
  const [loadingConfirm, setLoadingConfirm] = useState(false)
  const [errorConfirm, setErrorConfirm]   = useState('')

  // ── Descuento ──────────────────────────────────────────────────────────────
  const [codigoInput, setCodigoInput]     = useState('')
  const [descuento, setDescuento]         = useState(null)   // { valor_descuento, mensaje, id_descuento }
  const [descuentoError, setDescuentoError] = useState('')
  const [descuentoLoading, setDescuentoLoading] = useState(false)

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const guardado = localStorage.getItem('mm_carrito')
      setCarrito(guardado ? JSON.parse(guardado) : [])
    } catch {
      setCarrito([])
    } finally {
      setCargado(true)
    }

    try {
      const raw = sessionStorage.getItem('tiendaSesion')
      if (raw) setSesion(JSON.parse(raw))
    } catch {
      setSesion(null)
    }
  }, [])

  useEffect(() => {
    if (!cargado) return
    if (!sessionStorage.getItem('tiendaSesion')) {
      navigate('/tienda?login=1', { replace: true })
    }
  }, [cargado, navigate])

  useEffect(() => {
    if (!cargado) return
    localStorage.setItem('mm_carrito', JSON.stringify(carrito))
  }, [carrito, cargado])

  const fmt = n =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(n)

  const cambiarCantidad = (key, delta) =>
    setCarrito(prev => prev.map(i => {
      if (i.key !== key) return i
      const max = i.stockMax ?? Infinity
      return { ...i, cantidad: Math.min(max, Math.max(1, i.cantidad + delta)) }
    }))

  const quitarItem = key => setCarrito(prev => prev.filter(i => i.key !== key))

  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0)
  const subtotal   = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)

  // Descuento en pesos según porcentaje aplicado
  const montoDescuento = descuento ? Math.round(subtotal * (descuento.valor_descuento / 100)) : 0
  const total          = subtotal - montoDescuento

  const tieneDireccion = Boolean(sesion?.direccion && sesion.direccion.trim())

  // ── Aplicar código de descuento ────────────────────────────────────────────
  const aplicarDescuento = async () => {
    if (!codigoInput.trim()) return
    setDescuentoLoading(true)
    setDescuentoError('')
    setDescuento(null)

    // Intentar con cada producto del carrito hasta encontrar uno válido
    let aplicado = null
    let ultimoError = 'Este código no aplica a ninguno de los productos en tu carrito.'

    for (const item of carrito) {
      try {
        const res = await fetch(`${API_BASE}/api/descuentos/aplicar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo:      codigoInput.trim(),
            id_usuario:  sesion?.id,
            id_producto: item.id_producto,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          aplicado = data
          break
        } else {
          ultimoError = data.error || ultimoError
        }
      } catch {
        ultimoError = 'No se pudo conectar con el servidor.'
      }
    }

    if (aplicado) {
      setDescuento(aplicado)
      setDescuentoError('')
    } else {
      setDescuentoError(ultimoError)
    }
    setDescuentoLoading(false)
  }

  const quitarDescuento = () => {
    setDescuento(null)
    setCodigoInput('')
    setDescuentoError('')
  }

  // ── Confirmar compra + redirigir a Mercado Pago ───────────────────────────
  const handleConfirmarCompra = async () => {
    if (!tieneDireccion) {
      setErrorConfirm('Registra una dirección en tu perfil antes de continuar.')
      return
    }
    setLoadingConfirm(true)
    setErrorConfirm('')
    try {
      const items = carrito.map(i => ({
        id_producto_color: i.id_producto_color,
        id_talla:          i.id_talla,
        cantidad:          i.cantidad,
      }))

      // 1. Crear el pedido
      const res = await fetch(`${API_BASE}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente:      sesion.id,
          items,
          codigo_descuento: descuento ? codigoInput.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorConfirm(data.error || 'Ocurrió un error al crear el pedido.')
        return
      }

      // 2. Liberar reservas temporales
      try {
        const sessionId = localStorage.getItem('mm_session_id')
        if (sessionId) {
          await fetch(`${API_BASE}/api/reservas/sesion`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
          })
        }
      } catch { /* no crítico */ }

      // 3. Crear preferencia de Mercado Pago
      const mpRes = await fetch(`${API_BASE}/api/pagos/crear-preferencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pedido: data.id_pedido }),
      })
      const mpData = await mpRes.json()
      if (!mpRes.ok) {
        setErrorConfirm(mpData.error || 'Error al iniciar el pago.')
        return
      }

      // 4. Limpiar carrito y redirigir a Mercado Pago
      localStorage.removeItem('mm_carrito')
      window.location.href = mpData.init_point

    } catch {
      setErrorConfirm('No se pudo conectar con el servidor.')
    } finally {
      setLoadingConfirm(false)
    }
  }

  // ── Estados de carga / vacío ───────────────────────────────────────────────
  if (!cargado) return (
    <div className="ck-root">
      <div className="ck-state">
        <i className="bi bi-hourglass-split ck-spin"></i>
        <p>Cargando tu pedido...</p>
      </div>
    </div>
  )

  if (carrito.length === 0) return (
    <div className="ck-root">
      <div className="ck-state">
        <i className="bi bi-bag-x"></i>
        <p>No tienes productos en tu carrito</p>
        <button className="ck-btn-primary" onClick={() => navigate('/tienda')}>
          Ir a la tienda
        </button>
      </div>
    </div>
  )

  return (
    <div className="ck-root">
      <header className="ck-header">
        <a className="ck-logo" href="/tienda">✦ MODA MÁGICA ✦</a>
        <button className="ck-back" onClick={() => navigate('/tienda')}>
          <i className="bi bi-arrow-left"></i> Seguir comprando
        </button>
      </header>

      <div className="ck-inner">
        <h1 className="ck-title">Resumen de tu compra</h1>

        <div className="ck-grid">
          {/* ── Columna izquierda: productos ── */}
          <div className="ck-products-card">
            <div className="ck-products-head">
              <i className="bi bi-bag-check"></i>
              <span>Productos ({totalItems})</span>
            </div>

            <div className="ck-products-list">
              {carrito.map(item => (
                <div key={item.key} className="ck-product-row">
                  <div className="ck-product-img"
                    style={!item.imagen ? { background: item.catBg || CAT_BG_DEFAULT } : undefined}>
                    {item.imagen
                      ? <img src={item.imagen} alt={item.nombre} />
                      : <i className="bi bi-bag-heart"></i>}
                  </div>

                  <div className="ck-product-info">
                    <p className="ck-product-name">{item.nombre}</p>
                    <p className="ck-product-meta">{item.color} · {item.talla}</p>
                    <p className="ck-product-unit">{fmt(item.precio)} c/u</p>

                    <div className="ck-qty-row">
                      <div className="ck-qty-control">
                        <button onClick={() => cambiarCantidad(item.key, -1)}>−</button>
                        <span>{item.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(item.key, 1)}
                          disabled={item.stockMax != null && item.cantidad >= item.stockMax}
                        >+</button>
                      </div>
                      {item.stockMax != null && (
                        <span className="ck-stock-tag">
                          {item.cantidad >= item.stockMax ? 'Máximo disponible' : `${item.stockMax} disponibles`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ck-product-right">
                    <p className="ck-product-price">{fmt(item.precio * item.cantidad)}</p>
                    <button className="ck-product-del" onClick={() => quitarItem(item.key)}>
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Columna derecha: resumen ── */}
          <div className="ck-summary-card">
            <p className="ck-summary-title">Resumen de compra</p>

            <div className="ck-summary-row">
              <span>Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="ck-summary-row">
              <span>Envío</span>
              <span className="ck-free">Envío gratis según tu ubicación</span>
            </div>

            {/* Descuento aplicado */}
            {descuento && (
              <div className="ck-summary-row ck-descuento-row">
                <span>Descuento ({descuento.valor_descuento}%)</span>
                <span className="ck-descuento-valor">− {fmt(montoDescuento)}</span>
              </div>
            )}

            <div className="ck-summary-divider" />

            <div className="ck-summary-total">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>

            {/* ── Campo código de descuento ── */}
            <div className="ck-descuento-box">
              {descuento ? (
                <div className="ck-descuento-aplicado">
                  <div className="ck-descuento-aplicado-info">
                    <i className="bi bi-tag-fill"></i>
                    <span><strong>{codigoInput.toUpperCase()}</strong> — {descuento.valor_descuento}% off</span>
                  </div>
                  <button className="ck-descuento-quitar" onClick={quitarDescuento}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              ) : (
                <>
                  <div className="ck-descuento-input-row">
                    <input
                      className="ck-descuento-input"
                      placeholder="Código de descuento"
                      value={codigoInput}
                      onChange={e => { setCodigoInput(e.target.value); setDescuentoError('') }}
                      onKeyDown={e => e.key === 'Enter' && aplicarDescuento()}
                    />
                    <button
                      className="ck-descuento-btn"
                      onClick={aplicarDescuento}
                      disabled={descuentoLoading || !codigoInput.trim()}
                    >
                      {descuentoLoading ? <i className="bi bi-hourglass-split"></i> : 'Aplicar'}
                    </button>
                  </div>
                  {descuentoError && (
                    <p className="ck-descuento-error">
                      <i className="bi bi-exclamation-circle"></i> {descuentoError}
                    </p>
                  )}
                </>
              )}
            </div>

            <button className="ck-btn-primary ck-confirm-btn" onClick={() => setModalDatos(true)}>
              Confirmar compra
            </button>

            <p className="ck-summary-note">
              <i className="bi bi-shield-check"></i>
              Pago seguro con Mercado Pago
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal de verificación de datos del cliente ── */}
      {modalDatos && sesion && (
        <div className="ck-modal-overlay" onClick={e => e.target === e.currentTarget && setModalDatos(false)}>
          <div className="ck-modal-box">
            <button className="ck-modal-close" onClick={() => setModalDatos(false)}>
              <i className="bi bi-x-lg"></i>
            </button>

            <div className="ck-modal-header">
              <div className="ck-modal-icon"><i className="bi bi-person-check"></i></div>
              <h2 className="ck-modal-title">Verifica tus datos</h2>
              <p className="ck-modal-sub">Confirma que todo está correcto antes de finalizar</p>
            </div>

            {/* Datos personales */}
            <div className="ck-modal-section">
              <p className="ck-modal-section-title"><i className="bi bi-person"></i> Datos personales</p>
              <div className="ck-modal-grid">
                <div className="ck-modal-dato">
                  <span className="ck-modal-label">Nombre</span>
                  <span className="ck-modal-valor">{sesion.nombre} {sesion.apellido}</span>
                </div>
                <div className="ck-modal-dato">
                  <span className="ck-modal-label">Correo</span>
                  <span className="ck-modal-valor">{sesion.correo}</span>
                </div>
                <div className="ck-modal-dato">
                  <span className="ck-modal-label">Teléfono</span>
                  <span className="ck-modal-valor">{sesion.telefono || 'No registrado'}</span>
                </div>
              </div>
            </div>

            {/* Dirección de envío */}
            <div className="ck-modal-section">
              <p className="ck-modal-section-title"><i className="bi bi-geo-alt"></i> Dirección de envío</p>
              {tieneDireccion ? (
                <div className="ck-dir-option selected ck-dir-readonly">
                  <div className="ck-dir-info">
                    <span className="ck-dir-detalle">{sesion.direccion}</span>
                  </div>
                  <i className="bi bi-check-circle-fill ck-dir-check"></i>
                </div>
              ) : (
                <div className="ck-modal-no-dir">
                  <i className="bi bi-exclamation-circle"></i>
                  <p>No tienes una dirección registrada.</p>
                  <a href="/tienda/perfil" className="ck-modal-link">Agregar dirección en mi perfil →</a>
                </div>
              )}
            </div>

            {/* Resumen del pedido */}
            <div className="ck-modal-section">
              <p className="ck-modal-section-title"><i className="bi bi-bag"></i> Resumen del pedido</p>
              <div className="ck-modal-items">
                {carrito.map(item => (
                  <div key={item.key} className="ck-modal-item">
                    <span className="ck-modal-item-nombre">{item.nombre}</span>
                    <span className="ck-modal-item-det">{item.color} · {item.talla} · ×{item.cantidad}</span>
                    <span className="ck-modal-item-precio">{fmt(item.precio * item.cantidad)}</span>
                  </div>
                ))}
              </div>
              <div className="ck-modal-totales">
                <div className="ck-modal-total-row">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {descuento && (
                  <div className="ck-modal-total-row" style={{ color: '#10b981' }}>
                    <span>Descuento ({descuento.valor_descuento}%)</span>
                    <span>− {fmt(montoDescuento)}</span>
                  </div>
                )}
                <div className="ck-modal-total-row final">
                  <span>Total a pagar</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
            </div>

            {errorConfirm && (
              <div className="ck-modal-error">
                <i className="bi bi-exclamation-triangle"></i> {errorConfirm}
              </div>
            )}

            <div className="ck-modal-actions">
              <button className="ck-btn-secondary" onClick={() => setModalDatos(false)}>
                Volver
              </button>
              <button
                className="ck-btn-primary"
                onClick={handleConfirmarCompra}
                disabled={loadingConfirm || !tieneDireccion}
              >
                {loadingConfirm
                  ? <><i className="bi bi-hourglass-split"></i> Procesando...</>
                  : <><i className="bi bi-credit-card"></i> Pagar con Mercado Pago</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
