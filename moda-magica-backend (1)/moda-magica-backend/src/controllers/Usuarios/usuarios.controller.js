const usuarios = [];
let nextId = 1;

const getAll = async (req, res) => {
  try {
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const usuario = usuarios.find(u => u.id_usuario === parseInt(req.params.id));
    if (!usuario)
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, telefono, contrasena, id_rol, direccion, fecha_nacimiento } = req.body;

    const nuevoUsuario = {
      id_usuario:       nextId++,
      primer_nombre:    primer_nombre,
      segundo_nombre:   segundo_nombre    || null,
      primer_apellido:  primer_apellido,
      segundo_apellido: segundo_apellido  || null,
      correo:           correo,
      telefono:         telefono,
      contrasena:       contrasena,
      id_rol:           parseInt(id_rol, 10),
      direccion:        direccion,
      fecha_nacimiento: fecha_nacimiento,
      estado:           'activo',
      fecha_creacion:   new Date().toISOString()
    };

    usuarios.push(nuevoUsuario);
    res.status(201).json(nuevoUsuario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const id    = parseInt(req.params.id);
    const index = usuarios.findIndex(u => u.id_usuario === id);
    if (index === -1)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    const { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, telefono, contrasena, id_rol, direccion, fecha_nacimiento, estado } = req.body;

    usuarios[index] = {
      ...usuarios[index],
      primer_nombre:    primer_nombre,
      segundo_nombre:   segundo_nombre    || null,
      primer_apellido:  primer_apellido,
      segundo_apellido: segundo_apellido  || null,
      correo:           correo,
      telefono:         telefono,
      contrasena:       contrasena,
      id_rol:           parseInt(id_rol, 10),
      direccion:        direccion,
      fecha_nacimiento: fecha_nacimiento,
      estado:           estado || usuarios[index].estado
    };

    res.json(usuarios[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const id    = parseInt(req.params.id);
    const index = usuarios.findIndex(u => u.id_usuario === id);
    if (index === -1)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    usuarios.splice(index, 1);
    res.json({ mensaje: 'Usuario eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };