# ✦ Moda Mágica — Panel de Administración en React

Panel de administración convertido de HTML/CSS/JS a React con Vite.

## 📦 Tecnologías

- **React 18** — UI
- **React Router v6** — Navegación entre páginas
- **Vite** — Bundler (rápido y moderno)
- **Bootstrap Icons** — Íconos (via CDN)
- **Google Fonts** — Playfair Display + DM Sans

## 🚀 Instalación y uso

### 1. Requisitos previos

Debes tener instalado:
- **Node.js** versión 18 o superior → https://nodejs.org
- **npm** (viene con Node.js)

Verifica con:
```bash
node -v   # debe mostrar v18.x.x o superior
npm -v    # debe mostrar 9.x.x o superior
```

### 2. Instalar dependencias

```bash
cd moda-magica-admin
npm install
```

### 3. Iniciar en modo desarrollo

```bash
npm run dev
```

Abre tu navegador en: **http://localhost:5173**

### 4. Construir para producción

```bash
npm run build
```

Los archivos listos estarán en la carpeta `/dist`.

---

## 📁 Estructura del proyecto

```
moda-magica-admin/
├── index.html              ← Entrada principal
├── vite.config.js          ← Configuración de Vite
├── package.json            ← Dependencias
└── src/
    ├── main.jsx            ← Punto de entrada React
    ├── App.jsx             ← Rutas principales
    ├── styles/
    │   └── global.css      ← Estilos globales + variables CSS
    ├── components/
    │   └── Layout.jsx      ← Navbar + Sidebar + Footer
    └── pages/
        ├── Dashboard.jsx   ← Tablero principal
        ├── Productos.jsx   ← Gestión de productos
        ├── Categorias.jsx  ← Gestión de categorías
        ├── Usuarios.jsx    ← Gestión de usuarios
        ├── Pedidos.jsx     ← Gestión de pedidos
        ├── Descuentos.jsx  ← Códigos de descuento
        └── Login.jsx       ← Página de login
```

## 🎨 Características

- ✅ Modo oscuro / claro con toggle
- ✅ Sidebar colapsable
- ✅ Navegación con React Router
- ✅ CRUD completo en todas las secciones (datos en memoria)
- ✅ Modales para crear/editar registros
- ✅ Búsqueda y filtros en cada página
- ✅ Notificaciones toast
- ✅ Diseño responsive

## 🔌 Conectar con un backend

Actualmente los datos son estáticos (en memoria). Para conectarlos a una API real, reemplaza los arrays iniciales de cada página por llamadas `fetch` o `axios`:

```js
// Ejemplo en Productos.jsx
useEffect(() => {
  fetch('https://tu-api.com/productos')
    .then(res => res.json())
    .then(data => setProductos(data))
}, [])
```

---

© 2025 Moda Mágica
