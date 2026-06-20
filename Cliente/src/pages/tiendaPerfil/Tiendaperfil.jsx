import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Tiendaperfil.css'

const API_BASE = import.meta.env.VITE_API_URL
const API_USUARIOS = `${API_BASE}/api/usuarios`
const API_PEDIDOS = `${API_BASE}/api/pedidos`

const ESTADOS_PEDIDO = {
  pendiente:  { label: 'Pendiente',  icon: 'bi-hourglass-split', color: 'pendiente' },
  procesando: { label: 'Procesando', icon: 'bi-gear',            color: 'procesando' },
  enviado:    { label: 'Enviado',    icon: 'bi-truck',           color: 'enviado' },
  entregado:  { label: 'Entregado',  icon: 'bi-check-circle',    color: 'entregado' },
  cancelado:  { label: 'Cancelado',  icon: 'bi-x-circle',        color: 'cancelado' },
}

const fmt = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
const fmtFecha = f => new Date(f).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

const resolverUrlImagen = url => {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

function BarraSuperior({ titulo, onVolver }) {
  return (
    <header className="tp-topbar">
      <div className="tp-topbar-inner">
        <button className="tp-topbar-back" onClick={onVolver}>
          <i className="bi bi-arrow-left"></i> Volver a la tienda
        </button>
        <span className="tp-topbar-logo">✦ MODA MÁGICA ✦</span>
        <span className="tp-topbar-spacer"></span>
      </div>
      {titulo && <div className="tp-topbar-title-row"><h1>{titulo}</h1></div>}
    </header>
  )
}

function VistaSinSesion({ onIrTienda, onAbrirLogin }) {
  return (
    <div className="tp-page">
      <BarraSuperior onVolver={onIrTienda} />
      <div className="tp-content tp-content-center">
        <div className="tp-sinsesion">
          <div className="tp-sinsesion-icon"><i className="bi bi-person-circle"></i></div>
          <h2 className="tp-sinsesion-title">Debes iniciar sesión</h2>
          <p className="tp-sinsesion-text">Inicia sesión para ver tu perfil, editar tu información y revisar el estado de tus pedidos.</p>
          <button className="tp-btn-primary tp-btn-inline" onClick={onAbrirLogin}>Iniciar sesión</button>
        </div>
      </div>
    </div>
  )
}

function VistaEditar({ sesion, onVolver, onGuardado }) {
  const [form, setForm] = useState({
    primer_nombre: sesion.nombre || '',
    segundo_nombre: sesion.segundo_nombre || '',
    primer_apellido: sesion.apellido || '',
    segundo_apellido: sesion.segundo_apellido || '',
    telefono: sesion.telefono || '',
    direccion: sesion.direccion || '',
  })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [serverError, setServerError] = useState('')

  const cambiar = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }))

  const guardar = async () => {
    setServerError('')
    setGuardando(true)
    try {
      const res = await fetch(`${API_USUARIOS}/${sesion.id}/perfil-tienda`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errores) setErrores(data.errores)
        else setServerError(data.error || 'Error al actualizar el perfil.')
        return
      }
      const sesionActualizada = {
        ...sesion,
        nombre: data.primer_nombre,
        segundo_nombre: data.segundo_nombre,
        apellido: data.primer_apellido,
        segundo_apellido: data.segundo_apellido,
        telefono: data.telefono,
        direccion: data.direccion,
      }
      sessionStorage.setItem('tiendaSesion', JSON.stringify(sesionActualizada))
      onGuardado(sesionActualizada)
    } catch {
      setServerError('No se pudo conectar con el servidor.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="tp-card tp-card-sub">
      <div className="tp-utility-bar">
        <button className="tp-utility-back" onClick={onVolver}>
          <i className="bi bi-arrow-left"></i> Volver
        </button>
        <span className="tp-utility-label">Editar perfil</span>
      </div>

      <div className="tp-identity-row">
        <div>
          <h2 className="tp-resumen-nombre">Editar información</h2>
          <div className="tp-resumen-flourish">
            <span className="tp-resumen-flourish-star">✦</span>
            <span className="tp-resumen-flourish-line"></span>
          </div>
        </div>
      </div>

      <div className="tp-form">
        <div className="tp-form-row">
          <div className="tp-form-group">
            <label>Primer nombre</label>
            <input value={form.primer_nombre} onChange={e => cambiar('primer_nombre', e.target.value)} />
            {errores.primer_nombre && <p className="tp-error">{errores.primer_nombre}</p>}
          </div>
          <div className="tp-form-group">
            <label>Segundo nombre</label>
            <input value={form.segundo_nombre} onChange={e => cambiar('segundo_nombre', e.target.value)} />
          </div>
        </div>

        <div className="tp-form-row">
          <div className="tp-form-group">
            <label>Primer apellido</label>
            <input value={form.primer_apellido} onChange={e => cambiar('primer_apellido', e.target.value)} />
            {errores.primer_apellido && <p className="tp-error">{errores.primer_apellido}</p>}
          </div>
          <div className="tp-form-group">
            <label>Segundo apellido</label>
            <input value={form.segundo_apellido} onChange={e => cambiar('segundo_apellido', e.target.value)} />
          </div>
        </div>

        <div className="tp-form-row">
          <div className="tp-form-group">
            <label>Teléfono</label>
            <input value={form.telefono} onChange={e => cambiar('telefono', e.target.value)} />
            {errores.telefono && <p className="tp-error">{errores.telefono}</p>}
          </div>
          <div className="tp-form-group">
            <label>Correo</label>
            <input value={sesion.correo || ''} disabled />
          </div>
        </div>

        <div className="tp-form-group">
          <label>Dirección</label>
          <input value={form.direccion} onChange={e => cambiar('direccion', e.target.value)} placeholder="Calle, número, barrio, ciudad" />
        </div>

        {serverError && <p className="tp-error tp-error-general">{serverError}</p>}

        <button className="tp-btn-primary" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

function VistaPedidos({ sesion, onVolver }) {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_PEDIDOS}/cliente/${sesion.id}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setPedidos(data)
      } catch {
        setError('No se pudieron cargar tus pedidos.')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [sesion.id])

  return (
    <div className="tp-card tp-card-wide tp-card-sub">
      <div className="tp-utility-bar">
        <button className="tp-utility-back" onClick={onVolver}>
          <i className="bi bi-arrow-left"></i> Volver
        </button>
        <span className="tp-utility-label">Historial de compras</span>
      </div>

      <div className="tp-identity-row">
        <div>
          <h2 className="tp-resumen-nombre">Mis pedidos</h2>
          <div className="tp-resumen-flourish">
            <span className="tp-resumen-flourish-star">✦</span>
            <span className="tp-resumen-flourish-line"></span>
          </div>
        </div>
      </div>

      <div className="tp-pedidos-list">
        {loading ? (
          <div className="tp-state"><div className="tp-state-icon-wrap"><i className="bi bi-hourglass-split tp-spin"></i></div><p>Cargando pedidos...</p></div>
        ) : error ? (
          <div className="tp-state tp-state-error"><div className="tp-state-icon-wrap"><i className="bi bi-exclamation-circle"></i></div><p>{error}</p></div>
        ) : pedidos.length === 0 ? (
          <div className="tp-state"><div className="tp-state-icon-wrap"><i className="bi bi-bag-x"></i></div><p>Aún no tienes pedidos realizados</p></div>
        ) : (
          pedidos.map(p => {
            const estado = ESTADOS_PEDIDO[p.estado_pedido] || ESTADOS_PEDIDO.pendiente
            return (
              <div key={p.id_pedido} className="tp-pedido-card">
                <div className="tp-pedido-head">
                  <div>
                    <p className="tp-pedido-id">Pedido #{p.id_pedido}</p>
                    <p className="tp-pedido-fecha">{fmtFecha(p.fecha_pedido)}</p>
                  </div>
                  <span className={`tp-pedido-estado ${estado.color}`}>
                    <i className={`bi ${estado.icon}`}></i> {estado.label}
                  </span>
                </div>

                <div className="tp-pedido-items">
                  {p.detalles.map(d => (
                    <div key={d.id_detalle} className="tp-pedido-item">
                      <div className="tp-pedido-item-img">
                        {resolverUrlImagen(d.imagen_principal)
                          ? <img src={resolverUrlImagen(d.imagen_principal)} alt={d.nombre_producto} />
                          : <i className="bi bi-bag-heart"></i>
                        }
                      </div>
                      <div className="tp-pedido-item-info">
                        <p className="tp-pedido-item-name">{d.nombre_producto}</p>
                        <p className="tp-pedido-item-meta">{d.nombre_color}{d.nombre_talla ? ` · ${d.nombre_talla}` : ''} · x{d.cantidad}</p>
                      </div>
                      <p className="tp-pedido-item-price">{fmt(d.subtotal)}</p>
                    </div>
                  ))}
                </div>

                <div className="tp-pedido-foot">
                  <span>Total</span>
                  <span className="tp-pedido-total">{fmt(p.total_final)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function VistaResumen({ sesion, onEditar, onPedidos, onLogout }) {
  const nombreCompleto = `${sesion.nombre || ''} ${sesion.segundo_nombre ? sesion.segundo_nombre + ' ' : ''}${sesion.apellido || ''} ${sesion.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim()
  const numeroCliente = String(sesion.id || 0).padStart(6, '0')

  return (
    <div className="tp-card tp-card-resumen">
      <div className="tp-utility-bar">
        <span className="tp-utility-label">Tarjeta de cliente</span>
        <span className="tp-utility-numero">N.° {numeroCliente}</span>
      </div>

      <div className="tp-identity-row">
        <div>
          <h2 className="tp-resumen-nombre">{nombreCompleto}</h2>
          <div className="tp-resumen-flourish">
            <span className="tp-resumen-flourish-star">✦</span>
            <span className="tp-resumen-flourish-line"></span>
          </div>
        </div>
        <div className="tp-identity-actions">
          <button className="tp-ghost-link" onClick={onEditar}>
            <i className="bi bi-pencil"></i> Editar información
          </button>
          <button className="tp-ghost-link" onClick={onPedidos}>
            <i className="bi bi-receipt"></i> Mis pedidos
          </button>
        </div>
      </div>

      <div className="tp-spec-sheet">
        <div className="tp-spec-row">
          <div className="tp-spec-cell">
            <span className="tp-spec-label">Primer nombre</span>
            <span className="tp-spec-value">{sesion.nombre || '—'}</span>
          </div>
          <div className="tp-spec-cell">
            <span className="tp-spec-label">Segundo nombre</span>
            <span className="tp-spec-value">{sesion.segundo_nombre || '—'}</span>
          </div>
        </div>
        <div className="tp-spec-row">
          <div className="tp-spec-cell">
            <span className="tp-spec-label">Primer apellido</span>
            <span className="tp-spec-value">{sesion.apellido || '—'}</span>
          </div>
          <div className="tp-spec-cell">
            <span className="tp-spec-label">Segundo apellido</span>
            <span className="tp-spec-value">{sesion.segundo_apellido || '—'}</span>
          </div>
        </div>
        <div className="tp-spec-row">
          <div className="tp-spec-cell">
            <span className="tp-spec-label">Correo</span>
            <span className="tp-spec-value">{sesion.correo}</span>
          </div>
          <div className="tp-spec-cell">
            <span className="tp-spec-label">Teléfono</span>
            <span className="tp-spec-value">{sesion.telefono || 'No registrado'}</span>
          </div>
        </div>
        <div className="tp-spec-row tp-spec-row-single">
          <div className="tp-spec-cell">
            <span className="tp-spec-label">Dirección</span>
            <span className="tp-spec-value">{sesion.direccion || 'No registrada'}</span>
          </div>
        </div>
      </div>

      <div className="tp-resumen-footer">
        <button className="tp-logout-btn" onClick={onLogout}>
          <i className="bi bi-box-arrow-right"></i> Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function TiendaPerfil() {
  const navigate = useNavigate()
  const [sesion, setSesion] = useState(null)
  const [cargado, setCargado] = useState(false)
  const [vista, setVista] = useState('resumen')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('tiendaSesion')
    if (raw) {
      try { setSesion(JSON.parse(raw)) } catch { setSesion(null) }
    }
    setCargado(true)
  }, [])

  const cerrarSesion = () => {
    sessionStorage.removeItem('tiendaSesion')
    navigate('/tienda')
  }

  const mostrarToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  if (!cargado) return null

  if (!sesion) {
    return (
      <VistaSinSesion
        onIrTienda={() => navigate('/tienda')}
        onAbrirLogin={() => navigate('/tienda?login=1')}
      />
    )
  }

  const titulos = { resumen: 'Mi perfil', editar: 'Editar información', pedidos: 'Mis pedidos' }

  return (
    <div className="tp-page">
      <BarraSuperior titulo={titulos[vista]} onVolver={() => navigate('/tienda')} />
      <div className="tp-content">
        {vista === 'resumen' && (
          <VistaResumen
            sesion={sesion}
            onEditar={() => setVista('editar')}
            onPedidos={() => setVista('pedidos')}
            onLogout={cerrarSesion}
          />
        )}
        {vista === 'editar' && (
          <VistaEditar
            sesion={sesion}
            onVolver={() => setVista('resumen')}
            onGuardado={(nuevaSesion) => { setSesion(nuevaSesion); setVista('resumen'); mostrarToast('✓ Información actualizada correctamente') }}
          />
        )}
        {vista === 'pedidos' && (
          <VistaPedidos sesion={sesion} onVolver={() => setVista('resumen')} />
        )}
      </div>
      {toast && <div className="tp-toast">{toast}</div>}
    </div>
  )
}