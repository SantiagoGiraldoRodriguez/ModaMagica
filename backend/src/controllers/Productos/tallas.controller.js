const pool = require('../../config/db');

const getAll = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM talla ORDER BY id_talla ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  const { nombre_talla, grupo } = req.body;
  if (!nombre_talla?.trim())
    return res.status(400).json({ error: 'El nombre de la talla es obligatorio.' });
  try {
    const existe = await pool.query(
      'SELECT id_talla FROM talla WHERE LOWER(nombre_talla) = LOWER($1)',
      [nombre_talla.trim()]
    );
    if (existe.rows.length > 0)
      return res.status(400).json({ error: 'Ya existe una talla con ese nombre.' });
    const result = await pool.query(
      'INSERT INTO talla (nombre_talla, grupo) VALUES ($1, $2) RETURNING *',
      [nombre_talla.trim(), grupo || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  const { nombre_talla } = req.body;
  if (!nombre_talla?.trim())
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  try {
    const result = await pool.query(
      'UPDATE talla SET nombre_talla = $1 WHERE id_talla = $2 RETURNING *',
      [nombre_talla.trim(), req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Talla no encontrada.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM talla WHERE id_talla = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Talla no encontrada.' });
    res.json({ mensaje: 'Talla eliminada.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, create, update, remove };