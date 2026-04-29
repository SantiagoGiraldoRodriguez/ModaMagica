const descuentos = [];
let nextId = 1;

const getAll = async (req, res) => {
  try {
    res.json(descuentos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const descuento = descuentos.find(d => d.id_descuento === parseInt(req.params.id));
    if (!descuento)
      return res.status(404).json({ error: 'Descuento no encontrado.' });
    res.json(descuento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { codigo, descripcion, valor_descuento, fecha_inicio, fecha_cierre, limite_usos } = req.body;

    const nuevoDescuento = {
      id_descuento:    nextId++,
      codigo:          codigo,
      descripcion:     descripcion || null,
      tipo_descuento:  'porcentaje',
      valor_descuento: parseFloat(valor_descuento),
      fecha_inicio:    fecha_inicio,
      fecha_cierre:    fecha_cierre,
      limite_usos:     parseInt(limite_usos, 10),
      usos_actuales:   0,
      estado:          'activo'
    };

    descuentos.push(nuevoDescuento);
    res.status(201).json(nuevoDescuento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const id    = parseInt(req.params.id);
    const index = descuentos.findIndex(d => d.id_descuento === id);
    if (index === -1)
      return res.status(404).json({ error: 'Descuento no encontrado.' });

    const { codigo, descripcion, valor_descuento, fecha_inicio, fecha_cierre, limite_usos, estado } = req.body;

    descuentos[index] = {
      ...descuentos[index],
      codigo:          codigo,
      descripcion:     descripcion || null,
      tipo_descuento:  'porcentaje',
      valor_descuento: parseFloat(valor_descuento),
      fecha_inicio:    fecha_inicio,
      fecha_cierre:    fecha_cierre,
      limite_usos:     parseInt(limite_usos, 10),
      estado:          estado || descuentos[index].estado
    };

    res.json(descuentos[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const id    = parseInt(req.params.id);
    const index = descuentos.findIndex(d => d.id_descuento === id);
    if (index === -1)
      return res.status(404).json({ error: 'Descuento no encontrado.' });

    descuentos.splice(index, 1);
    res.json({ mensaje: 'Descuento eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };