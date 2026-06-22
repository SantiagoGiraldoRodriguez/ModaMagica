import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard/Dashboard'
import Productos from './pages/productos/Productos'
import Categorias from './pages/categorias/Categorias'
import Usuarios from './pages/usuarios/Usuarios'
import Pedidos from './pages/pedidos/Pedidos'
import Descuentos from './pages/descuentos/Descuentos'
import Login from './pages/login/Login'
import RecuperarContrasena from './pages/recuperarContrasena/RecuperarContrasena'
import MiPerfil from './pages/miPerfil/MiPerfil'
import Tienda from './pages/tienda/Tienda'
import TiendaPerfil from './pages/tiendaPerfil/Tiendaperfil'
import Checkout from './pages/checkout/Checkout'
import ProductoDetalle from './pages/productoDetalle/Productodetalle'

function RutaProtegida({ children }) {
  const sesion = sessionStorage.getItem('adminSesion')
  if (!sesion) return <Navigate to="/login" replace />
  return children
}

function SoloSuperadmin({ children }) {
  const raw = sessionStorage.getItem('adminSesion')
  if (!raw) return <Navigate to="/login" replace />
  const sesion = JSON.parse(raw)
  if (sesion.rol !== 'superadmin') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const [dark, setDark]           = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const wrap = (Component) => (
    <RutaProtegida>
      <Layout dark={dark} setDark={setDark} collapsed={collapsed} setCollapsed={setCollapsed}>
        <Component />
      </Layout>
    </RutaProtegida>
  )

  const wrapSuperadmin = (Component) => (
    <SoloSuperadmin>
      <Layout dark={dark} setDark={setDark} collapsed={collapsed} setCollapsed={setCollapsed}>
        <Component />
      </Layout>
    </SoloSuperadmin>
  )

  return (
    <div className={dark ? 'dark-mode' : ''}>
      <BrowserRouter>
        <Routes>
          <Route index          element={<Login dark={dark} setDark={setDark} />} />
          <Route path="login"      element={<Login dark={dark} setDark={setDark} />} />
          <Route path="recuperar"  element={<RecuperarContrasena dark={dark} setDark={setDark} />} />
          <Route path="dashboard"  element={wrap(Dashboard)} />
          <Route path="productos"  element={wrap(Productos)} />
          <Route path="categorias" element={wrap(Categorias)} />
          <Route path="usuarios"   element={wrapSuperadmin(Usuarios)} />
          <Route path="pedidos"    element={wrapSuperadmin(Pedidos)} />
          <Route path="descuentos" element={wrapSuperadmin(Descuentos)} />
          <Route path="mi-perfil"  element={wrap(MiPerfil)} />
          <Route path="tienda"     element={<Tienda />} />
          <Route path="tienda/perfil" element={<TiendaPerfil />} />
          <Route path="tienda/checkout" element={<Checkout />} />
          <Route path="tienda/producto/:id" element={<ProductoDetalle />} />
          <Route path="*"          element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}