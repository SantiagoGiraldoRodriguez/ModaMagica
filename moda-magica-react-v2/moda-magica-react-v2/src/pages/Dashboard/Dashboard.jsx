import { useState } from 'react'

const stats = [
  { label: 'Total de clientes', value: '2,845', trend: '+12.5%', up: true, icon: 'users', emoji: '👥' },
  { label: 'Ingresos totales', value: '$24,580', trend: '+8.2%', up: true, icon: 'revenue', emoji: '💵' },
  { label: 'Total de pedidos', value: '1,249', trend: '-3.1%', up: false, icon: 'orders', emoji: '🛒' },
  { label: 'Tasa de conversión', value: '4.8%', trend: '+5.7%', up: true, icon: 'conversion', emoji: '📈' },
]

const orders = [
  { id: '#PED-7841', client: 'Laura Martínez', date: '15 Nov, 2025', total: '$245.99', status: 'completed', label: 'Completado' },
  { id: '#PED-7840', client: 'Carlos Gómez', date: '14 Nov, 2025', total: '$1,299.00', status: 'pending', label: 'Pendiente' },
  { id: '#PED-7839', client: 'Sofía Ramírez', date: '13 Nov, 2025', total: '$89.50', status: 'active', label: 'En proceso' },
  { id: '#PED-7838', client: 'Andrés Torres', date: '12 Nov, 2025', total: '$549.99', status: 'completed', label: 'Completado' },
  { id: '#PED-7837', client: 'Valentina Cruz', date: '11 Nov, 2025', total: '$299.00', status: 'cancelled', label: 'Cancelado' },
]

const tasks = [
  { title: 'Actualizar catálogo de temporada', due: 'Hoy', priority: 'high', priorityLabel: 'Alta', done: true },
  { title: 'Revisar devoluciones pendientes', due: '20 Nov', priority: 'medium', priorityLabel: 'Media', done: false },
  { title: 'Preparar promoción de fin de semana', due: '18 Nov', priority: 'low', priorityLabel: 'Baja', done: false },
  { title: 'Actualizar precios de colección nueva', due: '15 Nov', priority: 'medium', priorityLabel: 'Media', done: true },
  { title: 'Responder reseñas de clientes', due: '22 Nov', priority: 'high', priorityLabel: 'Alta', done: false },
]

const activities = [
  { user: 'Laura Martínez', time: 'Hoy, 10:30 AM', text: 'Realizó un nuevo pedido por $245.99' },
  { user: 'Carlos Gómez', time: 'Ayer, 3:45 PM', text: 'Solicitó devolución del pedido #PED-7831' },
  { user: 'Administrador', time: '11 Dic, 2025', text: 'Se agregaron 15 productos nuevos al catálogo' },
  { user: 'Sofía Ramírez', time: '10 Dic, 2025', text: 'Dejó una reseña de 5 estrellas en Blusa Elegante' },
]

export default function Dashboard() {
  const [taskList, setTaskList] = useState(tasks)

  const toggleTask = (i) => {
    setTaskList(prev => prev.map((t, idx) => idx === i ? { ...t, done: !t.done } : t))
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Tablero</h1>
          <p>¡Bienvenido, Administrador! Esto es lo que está pasando en tu tienda hoy.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-header">
              <div className={`stat-icon ${s.icon}`}>{s.emoji}</div>
              <span className={`stat-trend ${s.up ? 'up' : 'down'}`}>
                <i className={`bi bi-arrow-${s.up ? 'up' : 'down'}`}></i> {s.trend}
              </span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla pedidos */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header-row">
          <h3 className="card-title">Pedidos recientes</h3>
          <button className="btn-secondary">Ver todos</button>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>N° Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i}>
                  <td><strong>{o.id}</strong></td>
                  <td>{o.client}</td>
                  <td>{o.date}</td>
                  <td><strong>{o.total}</strong></td>
                  <td><span className={`status-badge status-${o.status}`}>{o.label}</span></td>
                  <td><a href="#" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Ver</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tasks + Activity */}
      <div className="bottom-grid">
        <div className="card">
          <div className="card-header-row">
            <h3 className="card-title">Mis tareas</h3>
            <button className="btn-secondary">Agregar tarea</button>
          </div>
          <ul className="task-list">
            {taskList.map((t, i) => (
              <li className="task-item" key={i} onClick={() => toggleTask(i)} style={{ cursor: 'pointer' }}>
                <div className={`task-checkbox${t.done ? ' done' : ''}`}>
                  {t.done && <i className="bi bi-check" style={{ fontSize: 12 }}></i>}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="task-title-text" style={{ textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.5 : 1 }}>{t.title}</div>
                  <div className="task-meta">
                    <span>Vence: {t.due}</span>
                    <span className={`priority-badge priority-${t.priority}`}>{t.priorityLabel}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card-header-row">
            <h3 className="card-title">Actividad reciente</h3>
            <button className="btn-secondary">Ver todo</button>
          </div>
          {activities.map((a, i) => (
            <div className="activity-item" key={i}>
              <div className="activity-dot" />
              <div className="activity-box">
                <div className="activity-meta-row">
                  <span className="activity-user">{a.user}</span>
                  <span>{a.time}</span>
                </div>
                <div className="activity-text">{a.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
