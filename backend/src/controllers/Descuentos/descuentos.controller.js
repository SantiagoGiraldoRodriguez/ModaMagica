const pool = require('../../config/db');

const validar = ({ codigo, descripcion, valor_descuento, limite_usos, fecha_inicio, fecha_cierre }, esEdicion = false) => {
  const errores = {};

  if (!esEdicion) {
    if (!codigo || !codigo.trim())
      errores.codigo = 'El código es obligatorio.';
    else if (codigo.trim().length > 50)
      errores.codigo = 'El código no puede superar 50 caracteres.';
  }

  if (!descripcion || !descripcion.trim())
    errores.descripcion = 'La descripción es obligatoria.';
  else if (descripcion.trim().length > 255)
    errores.descripcion = 'La descripción no puede superar 255 caracteres.';

  const valorNum = parseFloat(valor_descuento);
  if (valor_descuento === undefined || valor_descuento === null || valor_descuento === '')
    errores.valor_descuento = 'El valor del descuento es obligatorio.';
  else if (isNaN(valorNum) || valorNum < 1 || valorNum > 25)
    errores.valor_descuento = 'El valor debe estar entre 1 y 25.';

  const limiteNum = parseInt(limite_usos);
  if (limite_usos === undefined || limite_usos === null || limite_usos === '')
    errores.limite_usos = 'El límite de personas es obligatorio.';
  else if (isNaN(limiteNum) || limiteNum <= 0)
    errores.limite_usos = 'El límite de personas debe ser un número entero positivo.';

  if (!fecha_inicio)
    errores.fecha_inicio = 'La fecha de inicio es obligatoria.';

  if (!fecha_cierre)
    errores.fecha_cierre = 'La fecha de cierre es obligatoria.';
  else if (fecha_inicio && new Date(fecha_cierre) < new Date(fecha_inicio))
    errores.fecha_cierre = 'La fecha de cierre no puede ser anterior a la de inicio.';

  return errores;
};

const marcarVencidos = async () => {
  await pool.query(`
    UPDATE descuentos
    SET estado = 'vencido'
    WHERE fecha_cierre < CURRENT_DATE
      AND estado <> 'vencido'
  `);
};

const getAll = async (req, res) => {
  try {
    await marcarVencidos();
    const result = await pool.query('SELECT * FROM descuentos ORDER BY id_descuento ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM descuentos WHERE id_descuento = $1', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Descuento no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  const errores = validar(req.body, false);
  if (Object.keys(errores).length > 0)
    return res.status(400).json({ errores });

  const { codigo, descripcion, valor_descuento, limite_usos, fecha_inicio, fecha_cierre, prendas_ids } = req.body;

  // Validar que se hayan seleccionado prendas
  if (!prendas_ids || !Array.isArray(prendas_ids) || prendas_ids.length === 0)
    return res.status(400).json({ errores: { prendas_ids: 'Debes seleccionar al menos una prenda.' } });

  try {
    const existe = await pool.query(
      'SELECT id_descuento FROM descuentos WHERE LOWER(codigo) = LOWER($1)',
      [codigo.trim()]
    );
    if (existe.rows.length > 0)
      return res.status(400).json({ error: `El código "${codigo.trim().toUpperCase()}" ya está registrado.` });

    const result = await pool.query(
      `INSERT INTO descuentos (codigo, descripcion, valor_descuento, limite_usos, fecha_inicio, fecha_cierre, prendas_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        codigo.trim().toUpperCase(),
        descripcion.trim(),
        parseFloat(valor_descuento),
        parseInt(limite_usos),
        fecha_inicio,
        fecha_cierre,
        prendas_ids
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'El código ya está registrado.' });
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  const errores = validar(req.body, true);
  if (Object.keys(errores).length > 0)
    return res.status(400).json({ errores });

  const { descripcion, valor_descuento, limite_usos, fecha_inicio, fecha_cierre, estado, prendas_ids } = req.body;

  // Validar que se hayan seleccionado prendas
  if (!prendas_ids || !Array.isArray(prendas_ids) || prendas_ids.length === 0)
    return res.status(400).json({ errores: { prendas_ids: 'Debes seleccionar al menos una prenda.' } });

  const estadoFinal = new Date(fecha_cierre) < new Date()
    ? 'vencido'
    : (estado || 'activo');

  try {
    const result = await pool.query(
      `UPDATE descuentos
       SET descripcion = $1, valor_descuento = $2, limite_usos = $3,
           fecha_inicio = $4, fecha_cierre = $5, estado = $6, prendas_ids = $7
       WHERE id_descuento = $8 RETURNING *`,
      [
        descripcion.trim(),
        parseFloat(valor_descuento),
        parseInt(limite_usos),
        fecha_inicio,
        fecha_cierre,
        estadoFinal,
        prendas_ids,
        req.params.id
      ]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Descuento no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM descuentos WHERE id_descuento = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Descuento no encontrado.' });
    res.json({ mensaje: 'Descuento eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Aplicar un descuento: valida prenda permitida y uso único por cliente
const aplicar = async (req, res) => {
  const { codigo, id_usuario, id_producto } = req.body;

  if (!codigo || !id_usuario || !id_producto)
    return res.status(400).json({ error: 'Faltan campos requeridos: codigo, id_usuario, id_producto.' });

  try {
    // 1. Buscar descuento activo y vigente
    const { rows } = await pool.query(
      `SELECT * FROM descuentos
       WHERE LOWER(codigo) = LOWER($1)
         AND estado = 'activo'
         AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_cierre`,
      [codigo]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: 'Código inválido, inactivo o expirado.' });

    const desc = rows[0];

    // 2. Verificar que la prenda esté en la lista de prendas permitidas
    const prendasPermitidas = desc.prendas_ids || [];
    if (!prendasPermitidas.includes(Number(id_producto)))
      return res.status(400).json({ error: 'Este descuento no aplica a la prenda seleccionada.' });

    // 3. Verificar que el cliente no haya usado este código antes (uso único)
    const usoExistente = await pool.query(
      `SELECT 1 FROM descuentos_usos
       WHERE id_descuento = $1 AND id_usuario = $2`,
      [desc.id_descuento, id_usuario]
    );
    if (usoExistente.rows.length > 0)
      return res.status(400).json({ error: 'Ya utilizaste este código de descuento anteriormente.' });

    // 4. Verificar que no se haya superado el límite general de usos
    if (desc.usos_actuales >= desc.limite_usos)
      return res.status(400).json({ error: 'Este código ha alcanzado su límite máximo de usos.' });

    // 5. Registrar el uso del cliente y actualizar el contador
    await pool.query(
      `INSERT INTO descuentos_usos (id_descuento, id_usuario) VALUES ($1, $2)`,
      [desc.id_descuento, id_usuario]
    );
    await pool.query(
      `UPDATE descuentos SET usos_actuales = usos_actuales + 1 WHERE id_descuento = $1`,
      [desc.id_descuento]
    );

    res.json({
      valor_descuento: desc.valor_descuento,
      mensaje: `Descuento del ${desc.valor_descuento}% aplicado correctamente.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Obtiene lista de productos activos con imagen principal para el selector de prendas
const getProductosActivos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id_producto,
        p.nombre_producto,
        p.precio_unitario,
        p.estado,
        img.url_imagen
      FROM producto p
      LEFT JOIN imagen_producto img
        ON img.id_producto = p.id_producto
        AND img.es_principal = 1::smallint
      WHERE p.estado = 'activo'
      ORDER BY p.nombre_producto ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// validar se exporta para poder cubrirla directamente en tests
module.exports = { getAll, getById, create, update, remove, aplicar, getProductosActivos, validar };