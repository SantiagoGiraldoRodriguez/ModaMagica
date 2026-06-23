const { Preference, Payment } = require('mercadopago');
const mp   = require('../../config/mercadopago');
const pool = require('../../config/db');

// ── Crear preferencia de pago ─────────────────────────────────────────────
const crearPreferencia = async (req, res) => {
  const { id_pedido } = req.body;
  if (!id_pedido) return res.status(400).json({ error: 'id_pedido es requerido.' });

  try {
    const pedResult = await pool.query(
      'SELECT * FROM pedido WHERE id_pedido = $1', [id_pedido]
    );
    if (pedResult.rows.length === 0)
      return res.status(404).json({ error: 'Pedido no encontrado.' });

    const pedido = pedResult.rows[0];

    const detalles = await pool.query(`
      SELECT pr.nombre_producto, dp.cantidad, dp.precio_vendido
      FROM detalle_pedido dp
      JOIN producto_color pc ON pc.id_producto_color = dp.id_producto_color
      JOIN producto pr ON pr.id_producto = pc.id_producto
      WHERE dp.id_pedido = $1
    `, [id_pedido]);

    let items;
    if (Number(pedido.descuento_aplicado) > 0) {
      const nombreProductos = detalles.rows.map(d => d.nombre_producto).join(', ');
      items = [{
        id:          String(id_pedido),
        title:       nombreProductos,
        quantity:    1,
        unit_price:  Number(pedido.total_final),
        currency_id: 'COP',
      }];
    } else {
      items = detalles.rows.map(d => ({
        id:          String(id_pedido),
        title:       d.nombre_producto,
        quantity:    Number(d.cantidad),
        unit_price:  Number(d.precio_vendido),
        currency_id: 'COP',
      }));
    }

    const preference = new Preference(mp);
    const response = await preference.create({
      body: {
        items,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/tienda/pago-resultado?estado=success`,
          failure: `${process.env.FRONTEND_URL}/tienda/pago-resultado?estado=failure`,
          pending: `${process.env.FRONTEND_URL}/tienda/pago-resultado?estado=pending`,
        },
        auto_return:        'approved',
        external_reference: String(id_pedido),
        notification_url:   `${process.env.BACKEND_URL}/api/pagos/webhook`,
      },
    });

    await pool.query(
      'UPDATE pedido SET preference_id = $1 WHERE id_pedido = $2',
      [response.id, id_pedido]
    );

    res.json({ preference_id: response.id, init_point: response.init_point });
  } catch (err) {
    console.error('crearPreferencia:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── Webhook de Mercado Pago ───────────────────────────────────────────────
const webhook = async (req, res) => {
  const { type, data } = req.body;
  if (type !== 'payment') return res.sendStatus(200);

  try {
    const paymentApi = new Payment(mp);
    const pago = await paymentApi.get({ id: data.id });

    const id_pedido    = pago.external_reference;
    const estado       = pago.status;
    const estadoPago   = estado === 'approved' ? 'pagado'
                       : estado === 'pending'  ? 'pendiente'
                       : 'rechazado';
    const estadoPedido = estado === 'approved' ? 'procesando' : 'pendiente';

    await pool.query(`
      UPDATE pedido
      SET estado_pago     = $1,
          metodo_pago     = $2,
          referencia_pago = $3,
          estado_pedido   = $4
      WHERE id_pedido = $5
    `, [estadoPago, pago.payment_type_id, String(pago.id), estadoPedido, id_pedido]);

    // ── Correo de confirmación al cliente ─────────────────────────────────
    if (estado === 'approved') {
      try {
        const { enviarCorreo, emailBase } = require('../../utils/correo');

        const pedRes = await pool.query(`
          SELECT p.id_pedido, p.total_final, u.correo_electronico,
                 u.primer_nombre, u.primer_apellido
          FROM pedido p
          JOIN usuario u ON u.id_usuario = p.id_usuario
          WHERE p.id_pedido = $1
        `, [id_pedido]);

        const detallesRes = await pool.query(`
          SELECT pr.nombre_producto, c.nombre_color, t.nombre_talla,
                 dp.cantidad, dp.precio_vendido
          FROM detalle_pedido dp
          JOIN producto_color pc ON pc.id_producto_color = dp.id_producto_color
          JOIN producto pr ON pr.id_producto = pc.id_producto
          JOIN color c ON c.id_color = pc.id_color
          JOIN talla t ON t.id_talla = pc.id_talla
          WHERE dp.id_pedido = $1
        `, [id_pedido]);

        if (pedRes.rows.length > 0) {
          const { correo_electronico, primer_nombre, primer_apellido, total_final } = pedRes.rows[0];

          const filasProductos = detallesRes.rows.map(d => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #f0f0f0;">
                <strong>${d.nombre_producto}</strong><br>
                <span style="color:#888;font-size:13px;">${d.nombre_color} · ${d.nombre_talla}</span>
              </td>
              <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center;">${d.cantidad}</td>
              <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;">
                $${Number(d.precio_vendido).toLocaleString('es-CO')}
              </td>
            </tr>
          `).join('');

          const html = emailBase(`
            <p>Hola <strong>${primer_nombre} ${primer_apellido}</strong>,</p>
            <p>¡Tu pago fue aprobado! 🎉 Aquí está el resumen de tu pedido <strong>#${id_pedido}</strong>:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <thead>
                <tr style="background:#f9f3e8;">
                  <th style="padding:8px;text-align:left;">Producto</th>
                  <th style="padding:8px;text-align:center;">Cant.</th>
                  <th style="padding:8px;text-align:right;">Precio</th>
                </tr>
              </thead>
              <tbody>${filasProductos}</tbody>
            </table>
            <p style="text-align:right;font-size:18px;">
              <strong>Total: $${Number(total_final).toLocaleString('es-CO')}</strong>
            </p>
            <p style="color:#555;">Pronto nos pondremos en contacto contigo para coordinar la entrega. ¡Gracias por tu compra! 💛</p>
          `);

          enviarCorreo({
            to: correo_electronico,
            subject: `✦ Confirmación de pedido #${id_pedido} — Moda Mágica`,
            html,
          }).catch(e => console.error('correo confirmación:', e.message));
        }
      } catch (mailErr) {
        console.error('correo webhook error:', mailErr.message);
      }
    }

  } catch (err) {
    console.error('webhook MP:', err.message);
  }

  res.sendStatus(200);
};

module.exports = { crearPreferencia, webhook };