# Moda Mágica — Cómo correrlo en tu PC

Esta guía asume que ya tienes PostgreSQL y pgAdmin instalados y funcionando.

---

## 1. Crear la base de datos en pgAdmin

1. Abre **pgAdmin** y conéctate a tu servidor local de PostgreSQL.
2. Click derecho sobre **Databases** → **Create** → **Database...**
3. En "Database", escribe exactamente: `ModaMagica`
4. Click en **Save**.

## 2. Restaurar el contenido (tablas + datos)

1. Con la base `ModaMagica` ya creada, haz click derecho sobre ella → **Query Tool**.
2. Abre el archivo `ModaMagica.sql` (está en la raíz de este proyecto) con un editor de texto, copia todo su contenido, y pégalo en el Query Tool.
3. Click en **Execute** (▶ o F5).
4. Si todo corre sin errores, ya tienes todas las tablas y los datos de productos, colores, tallas, categorías, etc.

> Si te sale algún error de permisos o de "role postgres does not exist", usa el usuario que sí tengas configurado en tu PostgreSQL y ajusta el `.env` del backend en el paso 4 con ese usuario.

## 3. Verificar tu contraseña de PostgreSQL

Abre el archivo `backend/.env` y revisa estas líneas:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_NAME=ModaMagica
```

Cambia `DB_PASSWORD` por la contraseña real que usaste al instalar PostgreSQL (la que usas para entrar en pgAdmin). Si tu usuario no es `postgres`, ajústalo también.

## 4. Instalar dependencias

Abre una terminal (Git Bash, CMD o PowerShell) en la carpeta del proyecto.

**Backend:**
```bash
cd backend
npm install
```

**Frontend (en otra terminal, sin cerrar la del backend):**
```bash
cd Cliente
npm install
```

## 5. Levantar el proyecto

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Debe mostrar algo como:
```
Servidor corriendo en el puerto 3000
Conexión a PostgreSQL exitosa
```

Si en vez de "Conexión a PostgreSQL exitosa" ves un error, revisa el `.env` (usuario/contraseña/nombre de base de datos).

**Terminal 2 — Frontend:**
```bash
cd Cliente
npm run dev
```
Debe mostrar una URL como `http://localhost:5173/`

## 6. Abrir la app

Abre tu navegador en:

- **Tienda (cliente):** http://localhost:5173/tienda
- **Panel admin:** http://localhost:5173/

## 7. Subir imágenes de productos

A diferencia de Render, aquí en tu PC las imágenes que subas desde el panel admin (`/uploads/productos`) se guardan de forma permanente en tu disco local — no se borran al reiniciar el backend. Sube las fotos de tus productos desde el panel admin y se verán correctamente tanto en el admin como en la tienda.

---

## Resumen de archivos clave que ya quedaron configurados

- `backend/.env` → conexión a tu PostgreSQL local (revisa la contraseña).
- `Cliente/.env` → `VITE_API_URL=http://localhost:3000` (el backend local).
- `backend/src/app.js` → CORS habilitado para `http://localhost:5173` y `:5174`.
- `backend/src/controllers/Productos/productos.controller.js` → ya incluye el fix para que la tienda muestre las fotos de los productos (galería con flechas y miniaturas).

## Si algo no conecta

- **"Error al conectar con la base de datos"** → revisa usuario/contraseña/puerto en `backend/.env`.
- **La tienda no carga productos** → confirma que el backend esté corriendo (terminal 1) antes de abrir el frontend.
- **Las imágenes no se ven** → confirma que subiste las fotos desde el panel admin después de levantar el proyecto en tu PC (las fotos viejas de Render no vienen incluidas porque se perdieron en su disco temporal).
