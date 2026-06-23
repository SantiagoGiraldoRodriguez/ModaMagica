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

    // Si hay descuento aplicado, se envía un único item con el total_final
    // para que Mercado Pago refleje el precio real a cobrar.
    // Si no hay descuento, se envían los items normales.
    let items;
    if (Number(pedido.descuento_aplicado) > 0) {
      const nombreProductos = detalles.rows.map(d => d.nombre_producto).join(', ');
      items = [
        {
          id:          String(id_pedido),
          title:       nombreProductos,
          quantity:    1,
          unit_price:  Number(pedido.total_final),
          currency_id: 'COP',
        }
      ];
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
    const id_pedido = pago.external_reference;

    const estadoPago   = pago.status === 'approved' ? 'pagado'
                       : pago.status === 'pending'  ? 'pendiente'
                       : 'rechazado';
    const estadoPedido = pago.status === 'approved' ? 'procesando' : 'pendiente';

    await pool.query(`
      UPDATE pedido
      SET estado_pago     = $1,
          metodo_pago     = $2,
          referencia_pago = $3,
          estado_pedido   = $4
      WHERE id_pedido = $5
    `, [estadoPago, pago.payment_type_id, String(pago.id), estadoPedido, id_pedido]);
  } catch (err) {
    console.error('webhook MP:', err.message);
  }

  res.sendStatus(200);
};

module.exports = { crearPreferencia, webhook };
