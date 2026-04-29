import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const notifications = [
  { initials:'NP', text:'Nuevo pedido #1084 recibido',              time:'Hoy - 08:15 AM' },
  { initials:'ST', text:'Stock bajo: Vestido Floral Talla S',        time:'Hoy - 09:45 AM' },
  { initials:'✓',  text:'Pago confirmado - Pedido #1083',            time:'Hoy - 10:20 AM' },
  { initials:'DV', text:'Devolución solicitada - Pedido #1079',      time:'Hoy - 11:00 AM' },
  { initials:'AL', text:'Alerta: Producto agotado - Blusa Elegante', time:'Hoy - 11:30 AM' },
]

const menuItems = [
  {
    label:'Tablero', path:'/dashboard',
    icon:<svg viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8V3h-8zM3 21h8v-6H3v6z" stroke="currentColor" strokeWidth="1.6"/></svg>
  },
  {
    label:'Gestión de Usuarios',
    icon:<svg viewBox="0 0 24 24" fill="none"><path d="M16 11c1.66 0 3-1.79 3-4s-1.34-4-3-4-3 1.79-3 4 1.34 4 3 4zM8 11c1.66 0 3-1.79 3-4S9.66 3 8 3 5 4.79 5 7s1.34 4 3 4zM2 21v-2c0-2.21 3.58-4 8-4s8 1.79 8 4v2" stroke="currentColor" strokeWidth="1.6"/></svg>,
    submenu:[{ label:'Usuarios', path:'/usuarios' }]
  },
  {
    label:'Inventario',
    icon:<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="6" rx="2" stroke="currentColor" strokeWidth="1.6"/><rect x="3" y="14" width="18" height="6" rx="2" stroke="currentColor" strokeWidth="1.6"/></svg>,
    submenu:[{ label:'Categorías', path:'/categorias' }, { label:'Productos', path:'/productos' }]
  },
  {
    label:'Pedidos', path:'/pedidos',
    icon:<svg viewBox="0 0 24 24" fill="none"><path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.6"/></svg>
  },
  {
    label:'Descuentos', path:'/descuentos',
    icon:<svg viewBox="0 0 24 24" fill="none"><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="1.6"/><path d="M5 19L19 5" stroke="currentColor" strokeWidth="1.6"/></svg>
  },
]

export default function Layout({ children, dark, setDark, collapsed, setCollapsed }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotify,  setShowNotify]  = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState(null)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  const isActive        = path    => location.pathname === path
  const isSubmenuActive = submenu => submenu?.some(s => location.pathname === s.path)

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <button className="icon-btn" onClick={() => { setCollapsed(v => !v); setMobileOpen(v => !v) }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" d="M4 7h16M4 12h16M4 17h16"/>
            </svg>
          </button>
          <Link to="/dashboard" className="navbar-brand">✦ Moda Mágica ✦</Link>
        </div>

        <div className="nav-right">
          <button className="icon-btn" onClick={() => setDark(v => !v)}>
            {dark
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="1.6" d="M12 17a5 5 0 100-10 5 5 0 000 10zM12 3v2M12 19v2M5 12H3M21 12h-2M6.34 6.34l-1.41 1.41M19.07 19.07l-1.41 1.41"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="1.6" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>

          <div className="dropdown">
            <button className="icon-btn" onClick={() => { setShowNotify(v => !v); setShowProfile(false) }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" strokeWidth="1.6" d="M15 17h5l-1.4-1.7A7 7 0 0012 6a7 7 0 00-6.6 9.3L4 17h5"/>
              </svg>
            </button>
            {showNotify && (
              <div className="dropdown-menu-custom notify-menu">
                <div className="notify-list">
                  {notifications.map((n, i) => (
                    <div key={i} className="notify-item">
                      <div className="notify-avatar">{n.initials}</div>
                      <div>
                        <div className="notify-title">{n.text}</div>
                        <div className="notify-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <span className="notify-footer" onClick={() => setShowNotify(false)}>Ver todas →</span>
              </div>
            )}
          </div>

          <div className="dropdown">
            <div className="profile-btn" onClick={() => { setShowProfile(v => !v); setShowNotify(false) }}>
              <div className="avatar">A</div>
              <span className="avatar-name">Admin</span>
            </div>
            {showProfile && (
              <div className="dropdown-menu-custom" style={{ minWidth:180 }}>
                <div className="dropdown-header-custom">Configuración</div>
                <Link to="/mi-perfil" className="dropdown-item-custom" onClick={() => setShowProfile(false)}>
                  <i className="bi bi-person"></i> Mi Perfil
                </Link>
                <div style={{ borderTop:'1px solid var(--border)', margin:'4px 0' }}></div>
                <Link to="/login" className="dropdown-item-custom danger" onClick={() => setShowProfile(false)}>
                  <i className="bi bi-box-arrow-right"></i> Cerrar sesión
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <ul className="sidebar-menu">
          {menuItems.map((item, i) => {
            const hasSubmenu = item.submenu?.length > 0
            const isOpen     = openSubmenu === i
            const active     = item.path ? isActive(item.path) : isSubmenuActive(item.submenu)

            return (
              <li key={i}>
                {item.path && !hasSubmenu ? (
                  <Link to={item.path}
                    className={`menu-link${active ? ' active' : ''}`}
                    style={collapsed ? { justifyContent:'center' } : {}}
                    onClick={() => setMobileOpen(false)}>
                    {item.icon}
                    {!collapsed && <span className="menu-label">{item.label}</span>}
                  </Link>
                ) : (
                  <>
                    <button
                      className={`menu-link${active ? ' active' : ''}`}
                      style={collapsed ? { justifyContent:'center' } : {}}
                      onClick={() => setOpenSubmenu(isOpen ? null : i)}>
                      {item.icon}
                      {!collapsed && (
                        <>
                          <span className="menu-label">{item.label}</span>
                          <span className={`menu-arrow${isOpen ? ' open' : ''}`}>›</span>
                        </>
                      )}
                    </button>
                    {!collapsed && isOpen && (
                      <ul className="submenu">
                        {item.submenu.map((sub, j) => (
                          <li key={j}>
                            <Link to={sub.path}
                              className={`submenu-link${isActive(sub.path) ? ' active' : ''}`}
                              onClick={() => setMobileOpen(false)}>
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </aside>

      <main className={`main-content${collapsed ? ' collapsed' : ''}`}>
        {children}
      </main>

      <footer className={`footer${collapsed ? ' collapsed' : ''}`}>
        © 2025 Moda Mágica — Todos los derechos reservados
      </footer>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:850 }} />
      )}

      {(showNotify || showProfile) && (
        <div style={{ position:'fixed', inset:0, zIndex:1999 }}
          onClick={() => { setShowNotify(false); setShowProfile(false) }} />
      )}
    </>
  )
}