const pool = require('../../config/db');
const { enviarCorreo, emailBase } = require('../../utils/correo');

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
// GET BY CLIENTE
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
// GET PRODUCTOS ACTIVOS
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
// HTML DEL CORREO DE CONFIRMACIÓN
// ═══════════════════════════════════════════
const correoConfirmacionHTML = ({ nombre, id_pedido, fecha, items, subtotal, descuento, total, direccion }) => {
  const fmt = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const filasProductos = items.map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0ede8;">
        <strong style="color:#1a1a1a;">${item.nombre_producto}</strong><br/>
        <span style="color:#888;font-size:13px;">${item.nombre_color} · ${item.nombre_talla}</span>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0ede8;text-align:center;color:#555;">
        ${item.cantidad}
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0ede8;text-align:right;color:#1a1a1a;">
        ${fmt(item.precio_vendido)}
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0ede8;text-align:right;font-weight:bold;color:#C8920A;">
        ${fmt(item.precio_vendido * item.cantidad)}
      </td>
    </tr>
  `).join('')

  const filaDescuento = descuento > 0 ? `
    <tr>
      <td colspan="3" style="padding:8px;text-align:right;color:#10b981;">Descuento aplicado</td>
      <td style="padding:8px;text-align:right;color:#10b981;font-weight:bold;">− ${fmt(descuento)}</td>
    </tr>
  ` : ''

  return emailBase(`
    <p>Hola <strong>${nombre}</strong>, ¡gracias por tu compra! 🎉</p>
    <p style="color:#555;">Tu pedido ha sido recibido y está siendo procesado. A continuación el resumen:</p>

    <div style="background:#f9f7f4;border-radius:8px;padding:14px 16px;margin:16px 0;font-size:14px;color:#555;">
      <strong>Pedido #${id_pedido}</strong> &nbsp;·&nbsp; ${fecha}<br/>
      <span>📍 Envío a: ${direccion}</span>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:8px;">
      <thead>
        <tr style="background:#f0ede8;">
          <th style="padding:10px 8px;text-align:left;color:#888;font-weight:600;">Producto</th>
          <th style="padding:10px 8px;text-align:center;color:#888;font-weight:600;">Cant.</th>
          <th style="padding:10px 8px;text-align:right;color:#888;font-weight:600;">Precio u.</th>
          <th style="padding:10px 8px;text-align:right;color:#888;font-weight:600;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${filasProductos}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:8px;text-align:right;color:#555;">Subtotal</td>
          <td style="padding:8px;text-align:right;color:#1a1a1a;">${fmt(subtotal)}</td>
        </tr>
        ${filaDescuento}
        <tr>
          <td colspan="3" style="padding:10px 8px;text-align:right;font-weight:bold;font-size:15px;">Total pagado</td>
          <td style="padding:10px 8px;text-align:right;font-weight:bold;font-size:15px;color:#C8920A;">${fmt(total)}</td>
        </tr>
      </tfoot>
    </table>

    <p style="color:#555;font-size:13px;margin-top:16px;">
      Si tienes alguna pregunta sobre tu pedido, contáctanos por WhatsApp o Instagram. ¡Gracias por confiar en Moda Mágica! ✦
    </p>
  `)
}

// ═══════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════
const create = async (req, res) => {
  const { id_cliente, id_descuento, descuento_aplicado, items } = req.body;

  if (!id_cliente)   return res.status(400).json({ error: 'El cliente es obligatorio.' });
  if (!items || items.length === 0)
    return res.status(400).json({ error: 'El pedido debe tener al menos un producto.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const usuarioRes = await client.query(
      'SELECT primer_nombre, primer_apellido, correo, direccion FROM usuario WHERE id_usuario = $1',
      [id_cliente]
    );
    if (usuarioRes.rows.length === 0) throw new Error('Cliente no encontrado.');

    const usuario = usuarioRes.rows[0];
    const direccionTexto = (usuario.direccion || '').trim();
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
    const itemsConPrecio = [];

    for (const item of items) {
      const prod = await client.query(`
        SELECT pr.precio_unitario, pr.nombre_producto, co.nombre_color, t.nombre_talla
        FROM producto_color pc
        JOIN producto pr ON pr.id_producto = pc.id_producto
        JOIN color co ON co.id_color = pc.id_color
        JOIN inventario_color_talla ict ON ict.id_producto_color = pc.id_producto_color
        JOIN talla t ON t.id_talla = ict.id_talla
        WHERE pc.id_producto_color = $1 AND ict.id_talla = $2
      `, [item.id_producto_color, item.id_talla]);
      if (prod.rows.length === 0) throw new Error(`Variante ${item.id_producto_color} no encontrada.`);

      const stock = await client.query(`
        SELECT stock_actual FROM inventario_color_talla
        WHERE id_producto_color = $1 AND id_talla = $2
      `, [item.id_producto_color, item.id_talla]);
      if (!stock.rows.length || stock.rows[0].stock_actual < item.cantidad)
        throw new Error(`Stock insuficiente para una de las variantes.`);

      const precio = Number(prod.rows[0].precio_unitario);
      total_pedido += precio * item.cantidad;
      itemsConPrecio.push({
        ...item,
        precio_vendido: precio,
        nombre_producto: prod.rows[0].nombre_producto,
        nombre_color:    prod.rows[0].nombre_color,
        nombre_talla:    prod.rows[0].nombre_talla,
      });
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

    for (const item of itemsConPrecio) {
      await client.query(`
        INSERT INTO detalle_pedido (id_pedido, id_producto_color, cantidad, precio_vendido)
        VALUES ($1, $2, $3, $4)
      `, [id_pedido, item.id_producto_color, item.cantidad, item.precio_vendido]);

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

    // ── Enviar correo de confirmación (no bloquea la respuesta) ────────────
    const fechaFormateada = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const nombreCliente = `${usuario.primer_nombre} ${usuario.primer_apellido}`;

    enviarCorreo({
      to: usuario.correo,
      subject: `✦ Moda Mágica — Confirmación de tu pedido #${id_pedido}`,
      html: correoConfirmacionHTML({
        nombre:    nombreCliente,
        id_pedido,
        fecha:     fechaFormateada,
        items:     itemsConPrecio,
        subtotal:  total_pedido,
        descuento: descuento_final,
        total:     total_final,
        direccion: direccionTexto,
      }),
    }).catch(err => console.error('⚠️  Error enviando correo de confirmación:', err.message));

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
// ═══════════════════════════════════════════
const remove = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existe = await client.query(
      'SELECT id_pedido, estado_pedido FROM pedido WHERE id_pedido = $1',
      [req.params.id]
    );
    if (existe.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    const { estado_pedido } = existe.rows[0];
    if (estado_pedido !== 'entregado') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `No se puede eliminar el pedido porque está en estado "${estado_pedido}". Solo se pueden eliminar pedidos entregados.`
      });
    }

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
