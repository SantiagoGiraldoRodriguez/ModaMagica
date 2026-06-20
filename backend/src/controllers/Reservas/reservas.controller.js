const pool = require('../../config/db');

const DURACION_MINUTOS = 15;

// ═══════════════════════════════════════════════════════════════
// LIMPIAR RESERVAS VENCIDAS
// Se llama antes de cada operación relevante para mantener la tabla
// al día sin depender de un cron externo.
// ═══════════════════════════════════════════════════════════════
const limpiarVencidas = async client => {
  await client.query(`DELETE FROM reserva_stock WHERE expira_en < now()`);
};

// ═══════════════════════════════════════════════════════════════
// CREAR O RENOVAR UNA RESERVA
// Se llama cada vez que el cliente agrega/actualiza una cantidad en
// su carrito. Si ya existe una reserva de esa sesión para esa misma
// variante (color+talla), se actualiza cantidad y se reinicia el
// tiempo de expiración a 15 minutos desde ahora.
// ═══════════════════════════════════════════════════════════════
const reservar = async (req, res) => {
  const { session_id, id_producto_color, id_talla, cantidad } = req.body;

  if (!session_id || !id_producto_color || !id_talla || !cantidad)
    return res.status(400).json({ error: 'session_id, id_producto_color, id_talla y cantidad son obligatorios.' });

  if (cantidad <= 0)
    return res.status(400).json({ error: 'La cantidad debe ser mayor a 0.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await limpiarVencidas(client);

    // Stock real de esa variante
    const stockRes = await client.query(
      `SELECT stock_actual FROM inventario_color_talla
       WHERE id_producto_color = $1 AND id_talla = $2`,
      [id_producto_color, id_talla]
    );
    if (stockRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Variante de producto no encontrada.' });
    }
    const stockReal = stockRes.rows[0].stock_actual;

    // Reservas activas de OTRAS sesiones sobre esa misma variante
    const otrasRes = await client.query(
      `SELECT COALESCE(SUM(cantidad), 0) AS total FROM reserva_stock
       WHERE id_producto_color = $1 AND id_talla = $2 AND session_id != $3`,
      [id_producto_color, id_talla, session_id]
    );
    const reservadoPorOtros = Number(otrasRes.rows[0].total);
    const disponible = stockReal - reservadoPorOtros;

    if (cantidad > disponible) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: disponible > 0
          ? `Solo quedan ${disponible} unidades disponibles (otras personas tienen el resto reservado).`
          : 'No quedan unidades disponibles, otras personas las tienen reservadas en este momento.',
        disponible
      });
    }

    const expiraEn = new Date(Date.now() + DURACION_MINUTOS * 60 * 1000);

    await client.query(
      `INSERT INTO reserva_stock (session_id, id_producto_color, id_talla, cantidad, expira_en)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (session_id, id_producto_color, id_talla)
       DO UPDATE SET cantidad = $4, expira_en = $5`,
      [session_id, id_producto_color, id_talla, cantidad, expiraEn]
    );

    await client.query('COMMIT');
    res.json({ message: 'Reserva confirmada.', expira_en: expiraEn });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('reservar:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ═══════════════════════════════════════════════════════════════
// LIBERAR UNA RESERVA PUNTUAL
// Se llama cuando el cliente quita un producto del carrito antes de
// que expire el tiempo, para liberar el stock de inmediato.
// ═══════════════════════════════════════════════════════════════
const liberar = async (req, res) => {
  const { session_id, id_producto_color, id_talla } = req.body;

  if (!session_id || !id_producto_color || !id_talla)
    return res.status(400).json({ error: 'session_id, id_producto_color y id_talla son obligatorios.' });

  try {
    await pool.query(
      `DELETE FROM reserva_stock
       WHERE session_id = $1 AND id_producto_color = $2 AND id_talla = $3`,
      [session_id, id_producto_color, id_talla]
    );
    res.json({ message: 'Reserva liberada.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// LIBERAR TODAS LAS RESERVAS DE UNA SESIÓN
// Se llama al confirmar la compra (ya se descontó el stock real,
// así que la reserva temporal ya no hace falta) o si el cliente
// vacía el carrito por completo.
// ═══════════════════════════════════════════════════════════════
const liberarSesion = async (req, res) => {
  const { session_id } = req.body;

  if (!session_id)
    return res.status(400).json({ error: 'session_id es obligatorio.' });

  try {
    await pool.query(`DELETE FROM reserva_stock WHERE session_id = $1`, [session_id]);
    res.json({ message: 'Reservas de la sesión liberadas.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// CONSULTAR STOCK DISPONIBLE (real - reservado por otros)
// Útil para refrescar disponibilidad de una variante puntual sin
// recargar todo el catálogo.
// ═══════════════════════════════════════════════════════════════
const disponibilidad = async (req, res) => {
  const { id_producto_color, id_talla, session_id } = req.query;

  if (!id_producto_color || !id_talla)
    return res.status(400).json({ error: 'id_producto_color e id_talla son obligatorios.' });

  const client = await pool.connect();
  try {
    await limpiarVencidas(client);

    const stockRes = await client.query(
      `SELECT stock_actual FROM inventario_color_talla
       WHERE id_producto_color = $1 AND id_talla = $2`,
      [id_producto_color, id_talla]
    );
    if (stockRes.rows.length === 0)
      return res.status(404).json({ error: 'Variante no encontrada.' });

    const stockReal = stockRes.rows[0].stock_actual;

    const otrasRes = await client.query(
      `SELECT COALESCE(SUM(cantidad), 0) AS total FROM reserva_stock
       WHERE id_producto_color = $1 AND id_talla = $2 AND session_id != $3`,
      [id_producto_color, id_talla, session_id || '']
    );
    const reservadoPorOtros = Number(otrasRes.rows[0].total);

    res.json({
      stock_real: stockReal,
      reservado_por_otros: reservadoPorOtros,
      disponible: Math.max(0, stockReal - reservadoPorOtros)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

module.exports = { reservar, liberar, liberarSesion, disponibilidad, limpiarVencidas };
