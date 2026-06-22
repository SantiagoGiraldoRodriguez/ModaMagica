const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

// ─── Middlewares ───────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5180',
    'https://modamagica-frontend.onrender.com'
  ]
}));
app.use(express.json());

// Sirve las imágenes como archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Rutas del Sistema ────────────────────────────────────
app.use('/api/categorias',  require('./routes/categorias/categorias.routes.js'));
app.use('/api/descuentos',  require('./routes/Descuentos/descuentos.routes.js'));
app.use('/api/usuarios',    require('./routes/Usuarios/usuarios.routes.js'));

// ─── Rutas del Módulo de Productos ────────────────────────
app.use('/api/productos',   require('./routes/Productos/productos.routes'));
app.use('/api/colores',     require('./routes/Productos/colores.routes'));
app.use('/api/tallas',      require('./routes/Productos/tallas.routes'));
app.use('/api/imagenes',    require('./routes/Productos/imagenes.routes'));

// ─── Rutas de Autenticación ───────────────────────────────
app.use('/api/auth',        require('./routes/Auth/authRoutes'));
app.use('/api/recovery',    require('./routes/Auth/recoveryRoutes'));

// ─── Rutas de Pedidos ─────────────────────────────────────
app.use('/api/pedidos',     require('./routes/Pedidos/pedidos.routes'));

// ─── Rutas de Reservas de Stock (carrito temporal) ────────
app.use('/api/reservas',    require('./routes/Reservas/reservasRoutes'));

// ─── Puerto y Arranque ────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));

// ─── Limpieza periódica de reservas de stock vencidas ─────
// Corre cada minuto para liberar stock de carritos abandonados,
// además de la limpieza que ya ocurre en cada operación relevante.
const pool = require('./config/db');
setInterval(async () => {
  try {
    await pool.query(`DELETE FROM reserva_stock WHERE expira_en < now()`);
  } catch (err) {
    console.error('Error limpiando reservas vencidas:', err.message);
  }
}, 60 * 1000);