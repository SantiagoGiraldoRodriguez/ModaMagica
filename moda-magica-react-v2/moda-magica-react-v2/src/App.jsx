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

export default function App() {
  const [dark, setDark]           = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const wrap = (Component) => (
    <Layout dark={dark} setDark={setDark} collapsed={collapsed} setCollapsed={setCollapsed}>
      <Component />
    </Layout>
  )

  return (
    <div className={dark ? 'dark-mode' : ''}>
      <BrowserRouter>
        <Routes>
          {/* Por defecto va al login */}
          <Route index element={<Login dark={dark} setDark={setDark} />} />
          <Route path="login"      element={<Login dark={dark} setDark={setDark} />} />
          <Route path="recuperar"  element={<RecuperarContrasena dark={dark} setDark={setDark} />} />
          <Route path="dashboard"  element={wrap(Dashboard)} />
          <Route path="productos"  element={wrap(Productos)} />
          <Route path="categorias" element={wrap(Categorias)} />
          <Route path="usuarios"   element={wrap(Usuarios)} />
          <Route path="pedidos"    element={wrap(Pedidos)} />
          <Route path="descuentos" element={wrap(Descuentos)} />
          <Route path="mi-perfil"  element={wrap(MiPerfil)} />
          <Route path="*"          element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}