const pool = require('../../config/db');
const fs = require('fs');
const path = require('path');

// ────────────────────────────────────────────────────────────────
// Carpeta donde se guardan físicamente las imágenes
// ────────────────────────────────────────────────────────────────
const DIR_UPLOADS = path.join(__dirname, '../../../uploads/productos');

if (!fs.existsSync(DIR_UPLOADS)) {
  fs.mkdirSync(DIR_UPLOADS, { recursive: true });
}

// ────────────────────────────────────────────────────────────────
// Escribe un buffer a disco con reintentos.
// En carpetas sincronizadas con OneDrive es común que la primera
// escritura falle con ENOENT/EBUSY/EPERM porque OneDrive bloquea
// el archivo un instante mientras detecta el cambio. Reintentamos
// con una pequeña espera antes de rendirnos.
// ────────────────────────────────────────────────────────────────
const escribirArchivoConReintento = async (rutaCompleta, buffer, intentos = 5) => {
  for (let i = 1; i <= intentos; i++) {
    try {
      await fs.promises.writeFile(rutaCompleta, buffer);
      return;
    } catch (err) {
      const esBloqueoTemporal = ['ENOENT', 'EBUSY', 'EPERM'].includes(err.code);
      if (!esBloqueoTemporal || i === intentos) throw err;
      await new Promise(r => setTimeout(r, 150 * i));
    }
  }
};

// GET /api/imagenes/:id_producto
const getByProducto = async (req, res) => {
  try {

    const result = await pool.query(
      `
      SELECT *
      FROM imagen_producto
      WHERE id_producto = $1
      ORDER BY orden ASC
      `,
      [req.params.id_producto]
    );
    return res.json(result.rows);
  } catch (err) {

    return res.status(500).json({
      error: err.message
    });
  }
};

// POST /api/imagenes/:id_producto
const upload = async (req, res) => {

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: 'No se enviaron imágenes.'
    });
  }
  try {
    const existentes = await pool.query(
      `
      SELECT COUNT(*)
      FROM imagen_producto
      WHERE id_producto = $1
      `,
      [req.params.id_producto]
    );
    let orden = parseInt(existentes.rows[0].count) + 1;
    const insertadas = [];
    for (const file of req.files) {
      const ext = path.extname(file.originalname) || '.jpg';
      const nombreArchivo = `producto_${Date.now()}_${orden}${ext}`;
      const rutaCompleta = path.join(DIR_UPLOADS, nombreArchivo);

      // Escribe el archivo a disco ahora que ya está completo en memoria
      await escribirArchivoConReintento(rutaCompleta, file.buffer);

      const url = `/uploads/productos/${nombreArchivo}`;
      const esPrincipal = orden === 1 ? 1 : 0;
      const result = await pool.query(
        `
        INSERT INTO imagen_producto
        (
          id_producto,
          url_imagen,
          nombre_archivo,
          orden,
          es_principal,
          alt_text
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          req.params.id_producto,
          url,
          nombreArchivo,
          orden,
          esPrincipal,
          file.originalname
        ]
      );
      insertadas.push(result.rows[0]);
      orden++;
    }
    return res.status(201).json(insertadas);
  } catch (err) {
    return res.status(500).json({
      error: err.message
    });

  }

};

// ════════════════════════════════════════════════════════════════
// PUT /api/imagenes/principal/:id_imagen
// ════════════════════════════════════════════════════════════════
const setPrincipal = async (req, res) => {

  try {

    // Buscar imagen
    const img = await pool.query(
      `
      SELECT id_producto
      FROM imagen_producto
      WHERE id_imagen = $1
      `,
      [req.params.id_imagen]
    );

    // Validar existencia
    if (img.rows.length === 0) {

      return res.status(404).json({
        error: 'Imagen no encontrada.'
      });

    }

    const id_producto = img.rows[0].id_producto;

    // Quitar principal anterior
    await pool.query(
      `
      UPDATE imagen_producto
      SET es_principal = 0
      WHERE id_producto = $1
      `,
      [id_producto]
    );

    // Asignar nueva principal
    await pool.query(
      `
      UPDATE imagen_producto
      SET es_principal = 1
      WHERE id_imagen = $1
      `,
      [req.params.id_imagen]
    );

    return res.json({
      mensaje: 'Imagen principal actualizada.'
    });

  } catch (err) {

    return res.status(500).json({
      error: err.message
    });

  }

};

// ════════════════════════════════════════════════════════════════
// DELETE /api/imagenes/:id_imagen
// ════════════════════════════════════════════════════════════════
const remove = async (req, res) => {

  try {

    // Eliminar imagen
    const result = await pool.query(
      `
      DELETE FROM imagen_producto
      WHERE id_imagen = $1
      RETURNING *
      `,
      [req.params.id_imagen]
    );

    // Validar existencia
    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Imagen no encontrada.'
      });

    }

    // Construir ruta del archivo
    const filePath = path.join(
      DIR_UPLOADS,
      result.rows[0].nombre_archivo || ''
    );

    // Validar existencia física
    const existeArchivo = fs.existsSync(filePath);

    // Eliminar archivo físico
    if (existeArchivo) {

      fs.unlinkSync(filePath);

    }

    return res.json({
      mensaje: 'Imagen eliminada.'
    });

  } catch (err) {

    return res.status(500).json({
      error: err.message
    });

  }

};

module.exports = {
  getByProducto,
  upload,
  setPrincipal,
  remove
};