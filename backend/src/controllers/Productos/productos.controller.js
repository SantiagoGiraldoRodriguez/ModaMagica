const pool = require('../../config/db');

// HELPERS
const resolverCategorias = body => {
  if (Array.isArray(body.categorias) && body.categorias.length > 0) {
    return body.categorias.map(Number);
  }
  if (body.id_categoria) {
    return [Number(body.id_categoria)];
  }
  return [];
};

const variantesAColores = variantes => {
  const map = new Map();
  for (const v of variantes) {
    if (!map.has(v.id_color)) {
      map.set(v.id_color, []);
    }
    map.get(v.id_color).push({
      id_talla:     v.id_talla,
      stock_actual: v.stock_actual || 0
    });
  }
  return Array.from(map.entries()).map(([id_color, tallas]) => ({ id_color, tallas }));
};

// Validaciones
const validar = ({ nombre_producto, precio_unitario }, categoriasArr) => {
  const errores = {};
  if (!nombre_producto || !nombre_producto.trim()) {
    errores.nombre_producto = 'El nombre es obligatorio.';
  } else if (nombre_producto.trim().length > 150) {
    errores.nombre_producto = 'El nombre no puede superar 150 caracteres.';
  }
  if (!categoriasArr || categoriasArr.length === 0) {
    errores.id_categoria = 'La categoría es obligatoria.';
  }
  if (precio_unitario === undefined || precio_unitario === null || precio_unitario === '') {
    errores.precio_unitario = 'El precio es obligatorio.';
  } else if (isNaN(precio_unitario) || Number(precio_unitario) < 0) {
    errores.precio_unitario = 'El precio debe ser un número mayor o igual a 0.';
  }
  return errores;
};

// CARGAR COLORES
const cargarColores = async (client, id_producto) => {
  const colores = await client.query(`
    SELECT
      pc.id_producto_color,
      co.id_color,
      co.nombre_color,
      co.hex_code
    FROM producto_color pc
    JOIN color co ON co.id_color = pc.id_color
    WHERE pc.id_producto = $1
    ORDER BY co.nombre_color ASC
  `, [id_producto]);

  return Promise.all(
    colores.rows.map(async c => {
      const tallas = await client.query(`
        SELECT
          ict.id,
          ict.id_talla,
          t.nombre_talla,
          ict.stock_actual
        FROM inventario_color_talla ict
        JOIN talla t ON t.id_talla = ict.id_talla
        WHERE ict.id_producto_color = $1
        ORDER BY t.id_talla ASC
      `, [c.id_producto_color]);
      return { ...c, tallas: tallas.rows };
    })
  );
};

// CARGAR CATEGORÍAS
const cargarCategorias = async (client, id_producto) => {
  const res = await client.query(`
    SELECT c.id_categoria, c.nombre_categoria
    FROM producto_categoria pc
    JOIN categoria_producto c ON c.id_categoria = pc.id_categoria
    WHERE pc.id_producto = $1
    ORDER BY c.nombre_categoria ASC
  `, [id_producto]);
  return res.rows;
};

// CARGAR IMÁGENES
const cargarImagenes = async (client, id_producto) => {
  const res = await client.query(`
    SELECT id_imagen, url_imagen, orden, es_principal, alt_text
    FROM imagen_producto
    WHERE id_producto = $1
    ORDER BY orden ASC
  `, [id_producto]);
  return res.rows;
};

// ═════════════════════════════════════════════
// GET ALL
// ═════════════════════════════════════════════
const getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        COALESCE(ic_sum.stock_total, 0) AS stock_total
      FROM producto p
      LEFT JOIN (
        SELECT pc.id_producto, SUM(ic.stock_actual) AS stock_total
        FROM producto_color pc
        JOIN inventario_color ic ON ic.id_producto_color = pc.id_producto_color
        GROUP BY pc.id_producto
      ) ic_sum ON ic_sum.id_producto = p.id_producto
      ORDER BY p.id_producto ASC
    `);

    const productos = await Promise.all(
      result.rows.map(async p => {
        const [colores, categorias, imagenes] = await Promise.all([
          cargarColores(pool, p.id_producto),
          cargarCategorias(pool, p.id_producto),
          cargarImagenes(pool, p.id_producto)
        ]);
        const principal = imagenes.find(img => img.es_principal === 1 || img.es_principal === true);
        return {
          ...p,
          colores,
          categorias,
          imagenes,
          imagen_principal: principal?.url_imagen || imagenes[0]?.url_imagen || null
        };
      })
    );

    return res.json(productos);
  } catch (err) {
    console.error('getAll error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ═════════════════════════════════════════════
// GET ALL TIENDA (público)
// ═════════════════════════════════════════════
const getAllTienda = async (req, res) => {
  const session_id = req.query.session_id || '';
  try {
    await pool.query(`DELETE FROM reserva_stock WHERE expira_en < now()`);

    const result = await pool.query(`
      SELECT
        p.*,
        COALESCE(ic_sum.stock_total, 0) AS stock_total
      FROM producto p
      LEFT JOIN (
        SELECT pc.id_producto, SUM(ic.stock_actual) AS stock_total
        FROM producto_color pc
        JOIN inventario_color ic ON ic.id_producto_color = pc.id_producto_color
        GROUP BY pc.id_producto
      ) ic_sum ON ic_sum.id_producto = p.id_producto
      ORDER BY p.id_producto ASC
    `);

    const reservasRes = await pool.query(`
      SELECT id_producto_color, id_talla, SUM(cantidad) AS reservado
      FROM reserva_stock
      WHERE session_id != $1
      GROUP BY id_producto_color, id_talla
    `, [session_id]);

    const reservasMap = new Map();
    reservasRes.rows.forEach(r => {
      reservasMap.set(`${r.id_producto_color}-${r.id_talla}`, Number(r.reservado));
    });

    const productos = await Promise.all(
      result.rows.map(async p => {
        const [colores, categorias, imagenes] = await Promise.all([
          cargarColores(pool, p.id_producto),
          cargarCategorias(pool, p.id_producto),
          cargarImagenes(pool, p.id_producto)
        ]);

        let stockTotalAjustado = 0;
        const coloresAjustados = colores.map(c => ({
          ...c,
          tallas: c.tallas.map(t => {
            const reservado = reservasMap.get(`${c.id_producto_color}-${t.id_talla}`) || 0;
            const disponible = Math.max(0, t.stock_actual - reservado);
            stockTotalAjustado += disponible;
            return { ...t, stock_actual: disponible };
          })
        }));

        const principal = imagenes.find(img => img.es_principal === 1 || img.es_principal === true);
        return {
          ...p,
          colores: coloresAjustados,
          categorias,
          imagenes,
          stock_total: stockTotalAjustado,
          imagen_principal: principal?.url_imagen || imagenes[0]?.url_imagen || null
        };
      })
    );

    return res.json(productos);
  } catch (err) {
    console.error('getAllTienda error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ═════════════════════════════════════════════
// GET BY ID
// ═════════════════════════════════════════════
const getById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM producto WHERE id_producto = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    const p = result.rows[0];
    const [colores, categorias, imagenes] = await Promise.all([
      cargarColores(pool, p.id_producto),
      cargarCategorias(pool, p.id_producto),
      cargarImagenes(pool, p.id_producto)
    ]);
    const principal = imagenes.find(img => img.es_principal === 1 || img.es_principal === true);
    return res.json({
      ...p,
      colores,
      categorias,
      imagenes,
      imagen_principal: principal?.url_imagen || imagenes[0]?.url_imagen || null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ═════════════════════════════════════════════
// CREATE
// ═════════════════════════════════════════════
const create = async (req, res) => {
  const categoriasArr = resolverCategorias(req.body);
  const errores = validar(req.body, categoriasArr);
  if (Object.keys(errores).length > 0) return res.status(400).json({ errores });

  const { nombre_producto, descripcion, precio_unitario } = req.body;

  let colores = req.body.colores;
  if ((!colores || colores.length === 0) && req.body.variantes?.length > 0) {
    colores = variantesAColores(req.body.variantes);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existe = await client.query(
      `SELECT id_producto FROM producto WHERE LOWER(nombre_producto) = LOWER($1)`,
      [nombre_producto.trim()]
    );
    if (existe.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Ya existe un producto con ese nombre.' });
    }

    const prod = await client.query(`
      INSERT INTO producto (nombre_producto, descripcion, precio_unitario, estado)
      VALUES ($1, $2, $3, 'activo')
      RETURNING *
    `, [nombre_producto.trim(), descripcion?.trim() || null, precio_unitario]);

    const id_producto = prod.rows[0].id_producto;

    for (const id_cat of categoriasArr) {
      await client.query(`
        INSERT INTO producto_categoria (id_producto, id_categoria)
        VALUES ($1, $2) ON CONFLICT DO NOTHING
      `, [id_producto, id_cat]);
    }

    if (colores && colores.length > 0) {
      for (const c of colores) {
        const pc = await client.query(`
          INSERT INTO producto_color (id_producto, id_color)
          VALUES ($1, $2) RETURNING id_producto_color
        `, [id_producto, c.id_color]);

        const id_producto_color = pc.rows[0].id_producto_color;
        const stockTotal = c.tallas?.reduce((a, t) => a + Number(t.stock_actual), 0) || 0;

        await client.query(`
          INSERT INTO inventario_color (id_producto_color, stock_actual)
          VALUES ($1, $2)
        `, [id_producto_color, stockTotal]);

        if (c.tallas?.length > 0) {
          for (const t of c.tallas) {
            await client.query(`
              INSERT INTO inventario_color_talla (id_producto_color, id_talla, stock_actual)
              VALUES ($1, $2, $3)
              ON CONFLICT (id_producto_color, id_talla) DO UPDATE SET stock_actual = $3
            `, [id_producto_color, t.id_talla, t.stock_actual || 0]);
          }
        }
      }
    }

    await client.query('COMMIT');
    return res.status(201).json(prod.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('create error:', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ═════════════════════════════════════════════
// UPDATE  ← AQUÍ ESTÁ EL FIX
// ═════════════════════════════════════════════
const update = async (req, res) => {
  const categoriasArr = resolverCategorias(req.body);
  const errores = validar(req.body, categoriasArr);
  if (Object.keys(errores).length > 0) return res.status(400).json({ errores });

  const { nombre_producto, descripcion, precio_unitario, estado } = req.body;

  // FIX: igual que en create, aceptar tanto "colores" como "variantes"
  let colores = req.body.colores;
  if ((!colores || colores.length === 0) && req.body.variantes?.length > 0) {
    colores = variantesAColores(req.body.variantes);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existe = await client.query(`
      SELECT id_producto FROM producto
      WHERE LOWER(nombre_producto) = LOWER($1) AND id_producto != $2
    `, [nombre_producto.trim(), req.params.id]);

    if (existe.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Ya existe otro producto con ese nombre.' });
    }

    const result = await client.query(`
      UPDATE producto
      SET nombre_producto = $1, descripcion = $2, precio_unitario = $3, estado = $4
      WHERE id_producto = $5
      RETURNING *
    `, [
      nombre_producto.trim(),
      descripcion?.trim() || null,
      precio_unitario,
      estado || 'activo',
      req.params.id
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    // Actualizar categorías
    await client.query(`DELETE FROM producto_categoria WHERE id_producto = $1`, [req.params.id]);
    for (const id_cat of categoriasArr) {
      await client.query(`
        INSERT INTO producto_categoria (id_producto, id_categoria)
        VALUES ($1, $2) ON CONFLICT DO NOTHING
      `, [req.params.id, id_cat]);
    }

    // Actualizar colores y tallas
    if (colores && colores.length > 0) {
      for (const c of colores) {
        const pc = await client.query(`
          INSERT INTO producto_color (id_producto, id_color)
          VALUES ($1, $2)
          ON CONFLICT (id_producto, id_color) DO UPDATE SET id_color = EXCLUDED.id_color
          RETURNING id_producto_color
        `, [req.params.id, c.id_color]);

        const id_producto_color = pc.rows[0].id_producto_color;
        const stockTotal = c.tallas?.reduce((a, t) => a + Number(t.stock_actual), 0) || 0;

        await client.query(`
          INSERT INTO inventario_color (id_producto_color, stock_actual)
          VALUES ($1, $2)
          ON CONFLICT (id_producto_color) DO UPDATE SET stock_actual = $2
        `, [id_producto_color, stockTotal]);

        if (c.tallas?.length > 0) {
          for (const t of c.tallas) {
            await client.query(`
              INSERT INTO inventario_color_talla (id_producto_color, id_talla, stock_actual)
              VALUES ($1, $2, $3)
              ON CONFLICT (id_producto_color, id_talla) DO UPDATE SET stock_actual = $3
            `, [id_producto_color, t.id_talla, t.stock_actual || 0]);
          }
        }
      }
    }

    await client.query('COMMIT');
    return res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('update error:', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ═════════════════════════════════════════════
// REMOVE
// ═════════════════════════════════════════════
const remove = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = req.params.id;
    const prod = await client.query(
      `SELECT id_producto FROM producto WHERE id_producto = $1`, [id]
    );
    if (prod.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const pcs = await client.query(
      `SELECT id_producto_color FROM producto_color WHERE id_producto = $1`, [id]
    );
    const pcIds = pcs.rows.map(r => r.id_producto_color);

    if (pcIds.length > 0) {
      await client.query(`DELETE FROM detalle_pedido WHERE id_producto_color = ANY($1::int[])`, [pcIds]);
      await client.query(`DELETE FROM movimiento_inventario WHERE id_producto_color = ANY($1::int[])`, [pcIds]);
      await client.query(`DELETE FROM inventario_color_talla WHERE id_producto_color = ANY($1::int[])`, [pcIds]);
      await client.query(`DELETE FROM inventario_color WHERE id_producto_color = ANY($1::int[])`, [pcIds]);
      await client.query(`DELETE FROM producto_color WHERE id_producto = $1`, [id]);
    }

    await client.query(`DELETE FROM imagen_producto WHERE id_producto = $1`, [id]);
    await client.query(`DELETE FROM producto_categoria WHERE id_producto = $1`, [id]);
    await client.query(`DELETE FROM producto WHERE id_producto = $1`, [id]);

    await client.query('COMMIT');
    return res.json({ mensaje: 'Producto eliminado correctamente.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('remove error:', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ═════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════
module.exports = { getAll, getAllTienda, getById, create, update, remove };
