import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function PagoResultado() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const estado   = params.get('estado') // success | failure | pending

  const config = {
    success: {
      icon:   'bi-check-circle-fill',
      color:  '#22c55e',
      titulo: '¡Pago exitoso!',
      texto:  'Tu pedido fue confirmado. Te contactaremos pronto.',
    },
    pending: {
      icon:   'bi-clock-fill',
      color:  '#f59e0b',
      titulo: 'Pago en proceso',
      texto:  'Tu pago está siendo verificado. Te avisaremos cuando se confirme.',
    },
    failure: {
      icon:   'bi-x-circle-fill',
      color:  '#ef4444',
      titulo: 'Pago rechazado',
      texto:  'No se pudo procesar tu pago. Intenta de nuevo.',
    },
  }

  const c = config[estado] || config.failure

  useEffect(() => {
    if (estado === 'success') {
      localStorage.removeItem('mm_carrito')
    }
  }, [estado])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7' }}>
      <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 400 }}>
        <i className={`bi ${c.icon}`} style={{ fontSize: '4rem', color: c.color }}></i>
        <h2 style={{ marginTop: '1rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem' }}>{c.titulo}</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>{c.texto}</p>
        <button
          onClick={() => navigate('/tienda')}
          style={{ background: '#b8960c', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}
        >
          Volver a la tienda
        </button>
      </div>
    </div>
  )
}