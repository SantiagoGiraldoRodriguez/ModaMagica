export default function ConfirmModal({ show, titulo, mensaje, error, onConfirm, onCancel }) {
  if (!show) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box"
        style={{ maxWidth: 420, textAlign: 'center' }}
        onClick={e => e.stopPropagation()}>

        {/* Ícono */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: error ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 28, color: '#ef4444'
        }}>
          <i className={error ? 'bi bi-exclamation-circle-fill' : 'bi bi-trash3-fill'}></i>
        </div>

        {/* Título */}
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
          {error ? 'No se puede eliminar' : (titulo || '¿Estás seguro?')}
        </div>

        {/* Mensaje o Error */}
        {error ? (
          <div style={{
            fontSize: 14, color: 'var(--text)', marginBottom: 28, lineHeight: 1.7,
            fontWeight: 400, textAlign: 'left',
            background: 'rgba(239,68,68,0.06)', padding: '14px 16px',
            borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'flex-start', gap: 10
          }}>
            <i className="bi bi-exclamation-triangle" style={{ color: '#ef4444', fontSize: 16, marginTop: 2, flexShrink: 0 }}></i>
            <span>{error}</span>
          </div>
        ) : (
          <div style={{
            fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6,
            fontWeight: 400
          }}>
            {mensaje || 'Esta acción no se puede deshacer.'}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={onCancel}
            style={{ minWidth: error ? 'auto' : 120, padding: '10px 24px' }}>
            {error ? 'Cerrar' : 'Cancelar'}
          </button>
          {!error && (
            <button onClick={onConfirm}
              style={{
                minWidth: 120, padding: '10px 20px', borderRadius: 10,
                background: '#ef4444', border: 'none', color: 'white',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
              onMouseOut={e => e.currentTarget.style.background = '#ef4444'}>
              <i className="bi bi-trash3"></i> Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}