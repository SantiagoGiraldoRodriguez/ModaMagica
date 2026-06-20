const pool = require('../../config/db');

// ═══════════════════════════════════════════
// GET ALL
// ═══════════════════════════════════════════
const getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id_pedido,
        p.fecha_pedido,
        p.estado_pedido,
        p.total_pedido,
        p.descuento_aplicado,
        p.total_final,
        p.id_descuento,
        u.id_usuario,
        u.primer_nombre || ' ' || u.primer_apellido AS nombre_cliente,
        u.correo,
        u.telefono,
        d.id_direccion,
        d.direccion AS direccion_envio,
        desc2.codigo AS codigo_descuento,
        desc2.valor_descuento AS porcentaje_descuento
      FROM pedido p
      JOIN usuario u ON u.id_usuario = p.id_cliente
      JOIN direccion_envio d ON d.id_direccion = p.id_direccion
      LEFT JOIN descuentos desc2 ON desc2.id_descuento = p.id_descuento
      ORDER BY p.id_pedido DESC
    `);

    const pedidos = await Promise.all(result.rows.map(async p => {
      const detalles = await pool.query(`
        SELECT
          dp.id_detalle,
          dp.cantidad,
          dp.precio_vendido,
          dp.subtotal,
          pr.id_producto,
          pr.nombre_producto,
          co.nombre_color,
          co.hex_code,
          t.nombre_talla,
          pc.id_producto_color,
          (
            SELECT url_imagen FROM imagen_producto
            WHERE id_producto = pr.id_producto
              AND es_principal = 1
            LIMIT 1
          ) AS imagen_principal
        FROM detalle_pedido dp
        JOIN producto_color pc ON pc.id_producto_color = dp.id_producto_color
        JOIN producto pr ON pr.id_producto = pc.id_producto
        JOIN color co ON co.id_color = pc.id_color
        LEFT JOIN inventario_color_talla ict ON ict.id_producto_color = dp.id_producto_color
        LEFT JOIN talla t ON t.id_talla = ict.id_talla
        WHERE dp.id_pedido = $1
      `, [p.id_pedido]);
      return { ...p, detalles: detalles.rows };
    }));

    res.json(pedidos);
  } catch (err) {
    console.error('getAll pedidos:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════
// GET BY CLIENTE (pedidos de un usuario específico, para "Mis pedidos")
// ═══════════════════════════════════════════
const getByCliente = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id_pedido,
        p.fecha_pedido,
        p.estado_pedido,
        p.total_pedido,
        p.descuento_aplicado,
        p.total_final,
        p.id_descuento,
        u.id_usuario,
        u.primer_nombre || ' ' || u.primer_apellido AS nombre_cliente,
        u.correo,
        u.telefono,
        d.id_direccion,
        d.direccion AS direccion_envio,
        desc2.codigo AS codigo_descuento,
        desc2.valor_descuento AS porcentaje_descuento
      FROM pedido p
      JOIN usuario u ON u.id_usuario = p.id_cliente
      JOIN direccion_envio d ON d.id_direccion = p.id_direccion
      LEFT JOIN descuentos desc2 ON desc2.id_descuento = p.id_descuento
      WHERE p.id_cliente = $1
      ORDER BY p.id_pedido DESC
    `, [req.params.id_usuario]);

    const pedidos = await Promise.all(result.rows.map(async p => {
      const detalles = await pool.query(`
        SELECT
          dp.id_detalle,
          dp.cantidad,
          dp.precio_vendido,
          dp.subtotal,
          pr.id_producto,
          pr.nombre_producto,
          co.nombre_color,
          co.hex_code,
          t.nombre_talla,
          pc.id_producto_color,
          (
            SELECT url_imagen FROM imagen_producto
            WHERE id_producto = pr.id_producto
              AND es_principal = 1
            LIMIT 1
          ) AS imagen_principal
        FROM detalle_pedido dp
        JOIN producto_color pc ON pc.id_producto_color = dp.id_producto_color
        JOIN producto pr ON pr.id_producto = pc.id_producto
        JOIN color co ON co.id_color = pc.id_color
        LEFT JOIN inventario_color_talla ict ON ict.id_producto_color = dp.id_producto_color
        LEFT JOIN talla t ON t.id_talla = ict.id_talla
        WHERE dp.id_pedido = $1
      `, [p.id_pedido]);
      return { ...p, detalles: detalles.rows };
    }));

    res.json(pedidos);
  } catch (err) {
    console.error('getByCliente pedidos:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════
// GET BY ID
// ═══════════════════════════════════════════
const getById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id_pedido,
        p.fecha_pedido,
        p.estado_pedido,
        p.total_pedido,
        p.descuento_aplicado,
        p.total_final,
        p.id_descuento,
        u.id_usuario,
        u.primer_nombre || ' ' || u.primer_apellido AS nombre_cliente,
        u.correo,
        u.telefono,
        d.id_direccion,
        d.direccion AS direccion_envio,
        desc2.codigo AS codigo_descuento,
        desc2.valor_descuento AS porcentaje_descuento
      FROM pedido p
      JOIN usuario u ON u.id_usuario = p.id_cliente
      JOIN direccion_envio d ON d.id_direccion = p.id_direccion
      LEFT JOIN descuentos desc2 ON desc2.id_descuento = p.id_descuento
      WHERE p.id_pedido = $1
    `, [req.params.id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Pedido no encontrado.' });

    const p = result.rows[0];
    const detalles = await pool.query(`
      SELECT
        dp.id_detalle,
        dp.cantidad,
        dp.precio_vendido,
        dp.subtotal,
        pr.id_producto,
        pr.nombre_producto,
        co.nombre_color,
        co.hex_code,
        t.nombre_talla,
        pc.id_producto_color,
        (
          SELECT url_imagen FROM imagen_producto
          WHERE id_producto = pr.id_producto
            AND es_principal = 1
          LIMIT 1
        ) AS imagen_principal
      FROM detalle_pedido dp
      JOIN producto_color pc ON pc.id_producto_color = dp.id_producto_color
      JOIN producto pr ON pr.id_producto = pc.id_producto
      JOIN color co ON co.id_color = pc.id_color
      LEFT JOIN inventario_color_talla ict ON ict.id_producto_color = dp.id_producto_color
      LEFT JOIN talla t ON t.id_talla = ict.id_talla
      WHERE dp.id_pedido = $1
    `, [p.id_pedido]);

    res.json({ ...p, detalles: detalles.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════
// GET CLIENTES
// ═══════════════════════════════════════════
const getClientes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_usuario,
             primer_nombre || ' ' || primer_apellido AS nombre,
             correo, telefono
      FROM usuario
      WHERE estado = 'activo'
      ORDER BY primer_nombre ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════
// GET PRODUCTOS ACTIVOS CON VARIANTES E IMAGEN
// ═══════════════════════════════════════════
const getProductos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        pc.id_producto_color,
        pr.id_producto,
        pr.nombre_producto,
        pr.precio_unitario,
        co.nombre_color,
        co.hex_code,
        t.id_talla,
        t.nombre_talla,
        ict.stock_actual,
        (
          SELECT url_imagen FROM imagen_producto
          WHERE id_producto = pr.id_producto
            AND es_principal = 1
          LIMIT 1
        ) AS imagen_principal
      FROM producto_color pc
      JOIN producto pr ON pr.id_producto = pc.id_producto
      JOIN color co ON co.id_color = pc.id_color
      JOIN inventario_color_talla ict ON ict.id_producto_color = pc.id_producto_color
      JOIN talla t ON t.id_talla = ict.id_talla
      WHERE pr.estado = 'activo' AND ict.stock_actual > 0
      ORDER BY pr.nombre_producto, co.nombre_color, t.id_talla
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════
// VALIDAR CÓDIGO DE DESCUENTO
// Consulta la tabla "descuentos" (la del módulo de Descuentos del panel,
// con prendas_ids), no la tabla vieja "descuento". Devuelve prendas_ids
// para que el frontend pueda calcular sobre qué productos del pedido
// aplica el descuento.
// ═══════════════════════════════════════════
const validarDescuento = async (req, res) => {
  const { codigo } = req.params;
  try {
    const result = await pool.query(`
      SELECT id_descuento, codigo, descripcion, valor_descuento,
             estado, fecha_inicio, fecha_cierre, limite_usos, usos_actuales, prendas_ids
      FROM descuentos
      WHERE UPPER(codigo) = UPPER($1)
    `, [codigo]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Código de descuento no encontrado.' });

    const d = result.rows[0];

    if (d.estado !== 'activo')
      return res.status(400).json({ error: `El descuento está ${d.estado}.` });

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (new Date(d.fecha_cierre) < hoy)
      return res.status(400).json({ error: 'El descuento ha vencido.' });

    if (new Date(d.fecha_inicio) > hoy)
      return res.status(400).json({ error: 'El descuento aún no está vigente.' });

    if (d.usos_actuales >= d.limite_usos)
      return res.status(400).json({ error: 'El descuento ha alcanzado su límite de usos.' });

    res.json({
      id_descuento:    d.id_descuento,
      codigo:          d.codigo,
      descripcion:     d.descripcion,
      valor_descuento: d.valor_descuento,
      prendas_ids:     d.prendas_ids || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════
// CREATE
// El descuento (tabla "descuentos") aplica solo sobre el subtotal de las
// prendas del pedido que estén en prendas_ids; el cálculo final ya viene
// hecho desde el frontend (descuento_aplicado), aquí solo se valida que
// el descuento siga vigente y se registra el uso.
// ═══════════════════════════════════════════
const create = async (req, res) => {
  const { id_cliente, id_descuento, descuento_aplicado, items } = req.body;

  if (!id_cliente)   return res.status(400).json({ error: 'El cliente es obligatorio.' });
  if (!items || items.length === 0)
    return res.status(400).json({ error: 'El pedido debe tener al menos un producto.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Resolver dirección de envío a partir del perfil del usuario ─────────
    // El perfil solo guarda un texto libre (usuario.direccion); la tabla
    // direccion_envio sigue existiendo porque pedido.id_direccion la requiere,
    // así que aquí se crea/reutiliza una fila automáticamente.
    const usuarioRes = await client.query(
      'SELECT direccion FROM usuario WHERE id_usuario = $1',
      [id_cliente]
    );
    if (usuarioRes.rows.length === 0) throw new Error('Cliente no encontrado.');

    const direccionTexto = (usuarioRes.rows[0].direccion || '').trim();
    if (!direccionTexto)
      throw new Error('Debes registrar una dirección en tu perfil antes de finalizar la compra.');

    let id_direccion;
    const dirExistente = await client.query(
      `SELECT id_direccion FROM direccion_envio
       WHERE id_usuario = $1 AND direccion = $2
       ORDER BY id_direccion DESC LIMIT 1`,
      [id_cliente, direccionTexto]
    );
    if (dirExistente.rows.length > 0) {
      id_direccion = dirExistente.rows[0].id_direccion;
    } else {
      const nuevaDir = await client.query(
        `INSERT INTO direccion_envio (id_usuario, direccion, es_predeterminada, activa)
         VALUES ($1, $2, 1, 1)
         RETURNING id_direccion`,
        [id_cliente, direccionTexto]
      );
      id_direccion = nuevaDir.rows[0].id_direccion;
    }

    let total_pedido = 0;
    for (const item of items) {
      const prod = await client.query(`
        SELECT pr.precio_unitario
        FROM producto_color pc
        JOIN producto pr ON pr.id_producto = pc.id_producto
        WHERE pc.id_producto_color = $1
      `, [item.id_producto_color]);
      if (prod.rows.length === 0) throw new Error(`Variante ${item.id_producto_color} no encontrada.`);

      const stock = await client.query(`
        SELECT stock_actual FROM inventario_color_talla
        WHERE id_producto_color = $1 AND id_talla = $2
      `, [item.id_producto_color, item.id_talla]);
      if (!stock.rows.length || stock.rows[0].stock_actual < item.cantidad)
        throw new Error(`Stock insuficiente para una de las variantes.`);

      total_pedido += Number(prod.rows[0].precio_unitario) * item.cantidad;
    }

    let descuento_final = 0;
    let id_descuento_final = null;
    if (id_descuento) {
      const desc = await client.query(`
        SELECT * FROM descuentos
        WHERE id_descuento = $1 AND estado = 'activo'
          AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_cierre
          AND usos_actuales < limite_usos
      `, [id_descuento]);
      if (desc.rows.length > 0) {
        id_descuento_final = desc.rows[0].id_descuento;
        // El monto exacto ya viene calculado desde el frontend solo sobre
        // las prendas que califican; se respeta siempre que no sea mayor
        // al subtotal del pedido, como salvaguarda contra manipulación.
        descuento_final = Math.min(Number(descuento_aplicado) || 0, total_pedido);
      }
    }

    const total_final = Math.max(0, total_pedido - descuento_final);

    const pedidoRes = await client.query(`
      INSERT INTO pedido (id_cliente, id_direccion, id_descuento, descuento_aplicado, total_pedido, total_final)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id_cliente, id_direccion, id_descuento_final, descuento_final, total_pedido, total_final]);

    const id_pedido = pedidoRes.rows[0].id_pedido;

    for (const item of items) {
      const prod = await client.query(`
        SELECT pr.precio_unitario
        FROM producto_color pc
        JOIN producto pr ON pr.id_producto = pc.id_producto
        WHERE pc.id_producto_color = $1
      `, [item.id_producto_color]);

      const precio = Number(prod.rows[0].precio_unitario);

      await client.query(`
        INSERT INTO detalle_pedido (id_pedido, id_producto_color, cantidad, precio_vendido)
        VALUES ($1, $2, $3, $4)
      `, [id_pedido, item.id_producto_color, item.cantidad, precio]);

      await client.query(`
        UPDATE inventario_color_talla
        SET stock_actual = stock_actual - $1
        WHERE id_producto_color = $2 AND id_talla = $3
      `, [item.cantidad, item.id_producto_color, item.id_talla]);

      await client.query(`
        UPDATE inventario_color
        SET stock_actual = stock_actual - $1
        WHERE id_producto_color = $2
      `, [item.cantidad, item.id_producto_color]);

      await client.query(`
        INSERT INTO movimiento_inventario (id_producto_color, tipo, cantidad, id_pedido, motivo, id_usuario)
        VALUES ($1, 'salida', $2, $3, 'Venta pedido', $4)
      `, [item.id_producto_color, item.cantidad, id_pedido, id_cliente]);
    }

    await client.query(`
      INSERT INTO historial_estado_pedido (id_pedido, estado_nuevo, id_usuario_cambio)
      VALUES ($1, 'pendiente', $2)
    `, [id_pedido, id_cliente]);

    if (id_descuento_final) {
      await client.query(`
        UPDATE descuentos SET usos_actuales = usos_actuales + 1 WHERE id_descuento = $1
      `, [id_descuento_final]);
      await client.query(`
        INSERT INTO descuentos_usos (id_descuento, id_usuario) VALUES ($1, $2)
        ON CONFLICT (id_descuento, id_usuario) DO NOTHING
      `, [id_descuento_final, id_cliente]);
    }

    await client.query('COMMIT');
    res.status(201).json(pedidoRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('create pedido:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ═══════════════════════════════════════════
// UPDATE ESTADO
// ═══════════════════════════════════════════
const updateEstado = async (req, res) => {
  const { estado_pedido, id_usuario_cambio, observacion } = req.body;
  const ESTADOS = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];

  if (!ESTADOS.includes(estado_pedido))
    return res.status(400).json({ error: 'Estado inválido.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const actual = await client.query(
      'SELECT estado_pedido FROM pedido WHERE id_pedido = $1',
      [req.params.id]
    );
    if (actual.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    const estado_anterior = actual.rows[0].estado_pedido;

    const result = await client.query(`
      UPDATE pedido SET estado_pedido = $1 WHERE id_pedido = $2 RETURNING *
    `, [estado_pedido, req.params.id]);

    await client.query(`
      INSERT INTO historial_estado_pedido (id_pedido, estado_anterior, estado_nuevo, id_usuario_cambio, observacion)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.params.id, estado_anterior, estado_pedido, id_usuario_cambio || 1, observacion || null]);

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ═══════════════════════════════════════════
// DELETE
// Solo se puede eliminar si el estado es 'entregado'
// ═══════════════════════════════════════════
const remove = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verificar que el pedido existe
    const existe = await client.query(
      'SELECT id_pedido, estado_pedido FROM pedido WHERE id_pedido = $1',
      [req.params.id]
    );
    if (existe.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    // 2. Bloquear si el estado NO es 'entregado'
    const { estado_pedido } = existe.rows[0];
    if (estado_pedido !== 'entregado') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `No se puede eliminar el pedido porque está en estado "${estado_pedido}". Solo se pueden eliminar pedidos entregados.`
      });
    }

    // 3. Eliminar en orden correcto
    await client.query('DELETE FROM historial_estado_pedido WHERE id_pedido = $1', [req.params.id]);
    await client.query('DELETE FROM movimiento_inventario  WHERE id_pedido = $1', [req.params.id]);
    await client.query('DELETE FROM detalle_pedido         WHERE id_pedido = $1', [req.params.id]);
    await client.query('DELETE FROM pedido                 WHERE id_pedido = $1', [req.params.id]);

    await client.query('COMMIT');
    res.json({ mensaje: 'Pedido eliminado correctamente.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

module.exports = {
  getAll,
  getByCliente,
  getById,
  getClientes,
  getProductos,
  validarDescuento,
  create,
  updateEstado,
  remove
};