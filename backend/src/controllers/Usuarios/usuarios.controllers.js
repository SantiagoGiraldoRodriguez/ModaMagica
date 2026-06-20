const pool       = require('../../config/db');
const bcrypt     = require('bcryptjs');
const dns        = require('dns').promises;
const { enviarCorreo, emailBase } = require('../../utils/correo');

// ─── VERIFICAR QUE EL DOMINIO DEL CORREO EXISTE (MX) ─────────────────────────
const dominioCorreoExiste = async correo => {
  try {
    const dominio = correo.trim().split('@')[1];
    const registros = await dns.resolveMx(dominio);
    return registros && registros.length > 0;
  } catch {
    return false;
  }
};

// ─── VALIDACIONES ─────────────────────────────────────────────────────────────
const soloLetras  = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const soloNumeros = /^[0-9]+$/;
const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validar = (body, esEdicion) => {
  esEdicion = esEdicion === true;
  const errores = {};
  const {
    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    correo, telefono, contrasena, id_rol,
    direccion, fecha_nacimiento
  } = body;

  if (!primer_nombre || !primer_nombre.trim())
    errores.primer_nombre = 'El primer nombre es obligatorio.';
  else if (!soloLetras.test(primer_nombre.trim()))
    errores.primer_nombre = 'El primer nombre solo permite letras.';
  else if (primer_nombre.trim().length < 2)
    errores.primer_nombre = 'El primer nombre debe tener al menos 2 caracteres.';
  else if (primer_nombre.trim().length > 50)
    errores.primer_nombre = 'El primer nombre no puede superar 50 caracteres.';

  if (segundo_nombre && segundo_nombre.trim()) {
    if (!soloLetras.test(segundo_nombre.trim()))
      errores.segundo_nombre = 'El segundo nombre solo permite letras.';
    else if (segundo_nombre.trim().length < 2)
      errores.segundo_nombre = 'El segundo nombre debe tener al menos 2 caracteres.';
    else if (segundo_nombre.trim().length > 50)
      errores.segundo_nombre = 'El segundo nombre no puede superar 50 caracteres.';
  }

  if (!primer_apellido || !primer_apellido.trim())
    errores.primer_apellido = 'El primer apellido es obligatorio.';
  else if (!soloLetras.test(primer_apellido.trim()))
    errores.primer_apellido = 'El primer apellido solo permite letras.';
  else if (primer_apellido.trim().length < 2)
    errores.primer_apellido = 'El primer apellido debe tener al menos 2 caracteres.';
  else if (primer_apellido.trim().length > 50)
    errores.primer_apellido = 'El primer apellido no puede superar 50 caracteres.';

  if (segundo_apellido && segundo_apellido.trim()) {
    if (!soloLetras.test(segundo_apellido.trim()))
      errores.segundo_apellido = 'El segundo apellido solo permite letras.';
    else if (segundo_apellido.trim().length < 2)
      errores.segundo_apellido = 'El segundo apellido debe tener al menos 2 caracteres.';
    else if (segundo_apellido.trim().length > 50)
      errores.segundo_apellido = 'El segundo apellido no puede superar 50 caracteres.';
  }

  if (!correo || !correo.trim())
    errores.correo = 'El correo es obligatorio.';
  else if ((correo.match(/@/g) || []).length > 1)
    errores.correo = 'El correo no puede contener más de un @.';
  else if (!regexCorreo.test(correo.trim()))
    errores.correo = 'Ingresa un correo electrónico válido.';
  else if (correo.trim().length > 100)
    errores.correo = 'El correo no puede superar 100 caracteres.';

  if (!telefono || !telefono.trim())
    errores.telefono = 'El teléfono es obligatorio.';
  else if (!soloNumeros.test(telefono.trim()))
    errores.telefono = 'El teléfono solo permite números.';
  else if (telefono.trim().length < 7 || telefono.trim().length > 15)
    errores.telefono = 'El teléfono debe tener entre 7 y 15 dígitos.';

  if (!esEdicion) {
    if (!contrasena || !contrasena.trim())
      errores.contrasena = 'La contraseña es obligatoria.';
    else if (contrasena.length < 6)
      errores.contrasena = 'La contraseña debe tener mínimo 6 caracteres.';
    else if (!/[a-z]/.test(contrasena))
      errores.contrasena = 'La contraseña debe tener al menos una minúscula.';
    else if (!/[A-Z]/.test(contrasena))
      errores.contrasena = 'La contraseña debe tener al menos una mayúscula.';
    else if (!/[0-9]/.test(contrasena))
      errores.contrasena = 'La contraseña debe tener al menos un número.';
  } else {
    if (contrasena && contrasena.trim()) {
      if (contrasena.length < 6)
        errores.contrasena = 'La contraseña debe tener mínimo 6 caracteres.';
      else if (!/[a-z]/.test(contrasena))
        errores.contrasena = 'La contraseña debe tener al menos una minúscula.';
      else if (!/[A-Z]/.test(contrasena))
        errores.contrasena = 'La contraseña debe tener al menos una mayúscula.';
      else if (!/[0-9]/.test(contrasena))
        errores.contrasena = 'La contraseña debe tener al menos un número.';
    }
  }

  if (!id_rol)
    errores.id_rol = 'Debes seleccionar un rol.';
  else if (![1, 2, 3].includes(Number(id_rol)))
    errores.id_rol = 'El rol seleccionado no es válido.';

  if (!direccion || !direccion.trim())
    errores.direccion = 'La dirección es obligatoria.';
  else if (direccion.trim().length > 255)
    errores.direccion = 'La dirección no puede superar 255 caracteres.';

  if (!fecha_nacimiento)
    errores.fecha_nacimiento = 'La fecha de nacimiento es obligatoria.';
  else {
    const nacimiento = new Date(fecha_nacimiento);
    if (isNaN(nacimiento.getTime())) {
      errores.fecha_nacimiento = 'La fecha de nacimiento no es válida.';
    } else {
      const hoy = new Date();
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const m = hoy.getMonth() - nacimiento.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
      if (edad < 18)
        errores.fecha_nacimiento = 'El usuario debe ser mayor de 18 años.';
    }
  }

  return errores;
};

// ─── GET ALL ──────────────────────────────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM usuario ORDER BY id_usuario ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
const getById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM usuario WHERE id_usuario = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
const create = async (req, res) => {
  const errores = validar(req.body, false);
  if (Object.keys(errores).length > 0)
    return res.status(400).json({ errores });

  const {
    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    correo, telefono, contrasena, id_rol, direccion, fecha_nacimiento
  } = req.body;

  try {
    // ── REGLA 1: Solo puede existir un superadmin (id_rol = 1) ────────────
    if (Number(id_rol) === 1) {
      const superadmins = await pool.query(
        'SELECT id_usuario FROM usuario WHERE id_rol = 1'
      );
      if (superadmins.rows.length > 0)
        return res.status(400).json({
          error: 'Ya existe un Superadmin. Solo puede haber uno en el sistema.'
        });
    }

    // ── REGLA 2: Verificar que el dominio del correo es real (MX) ─────────
    const dominioValido = await dominioCorreoExiste(correo);
    if (!dominioValido)
      return res.status(400).json({
        error: 'El correo ingresado no parece ser válido. Verifica que el dominio exista (ej: @gmail.com, @outlook.com).'
      });

    // ── Correo duplicado ──────────────────────────────────────────────────
    const existeCorreo = await pool.query(
      'SELECT id_usuario FROM usuario WHERE LOWER(correo) = LOWER($1)',
      [correo.trim()]
    );
    if (existeCorreo.rows.length > 0)
      return res.status(400).json({ error: 'Ya existe un usuario con ese correo.' });

    const hash = await bcrypt.hash(contrasena, 10);

    const result = await pool.query(
      `INSERT INTO usuario
        (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
         correo, telefono, contrasena, id_rol, direccion, fecha_nacimiento, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'activo')
       RETURNING *`,
      [
        primer_nombre.trim(),
        segundo_nombre   ? segundo_nombre.trim()   : null,
        primer_apellido.trim(),
        segundo_apellido ? segundo_apellido.trim()  : null,
        correo.trim(),
        telefono.trim(),
        hash,
        Number(id_rol),
        direccion.trim(),
        fecha_nacimiento
      ]
    );

    // ── Enviar correo de bienvenida ────────────────────────────────────────
    try {
      await enviarCorreo({
        to: correo.trim(),
        subject: '✦ Bienvenido a Moda Mágica',
        html: emailBase(`
          <p>Hola <strong>${primer_nombre.trim()}</strong>,</p>
          <p>Tu cuenta ha sido creada exitosamente en el panel de administración de Moda Mágica.</p>
          <p><strong>Correo:</strong> ${correo.trim()}</p>
          <p>Ya puedes iniciar sesión con las credenciales que te asignaron.</p>
        `)
      });
    } catch (mailErr) {
      // El correo de bienvenida es opcional, no falla la creación
      console.error('Error enviando correo de bienvenida:', mailErr.message);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
const update = async (req, res) => {
  const errores = validar(req.body, true);
  if (Object.keys(errores).length > 0)
    return res.status(400).json({ errores });

  const {
    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    correo, telefono, contrasena, id_rol, direccion, fecha_nacimiento, estado
  } = req.body;

  try {
    // ── REGLA 3: Usuario inactivo no puede ser modificado ─────────────────
    const usuarioActual = await pool.query(
      'SELECT estado, id_rol FROM usuario WHERE id_usuario = $1',
      [req.params.id]
    );
    if (usuarioActual.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (usuarioActual.rows[0].estado === 'inactivo')
      return res.status(400).json({
        error: 'No se puede modificar un usuario inactivo. Actívalo primero desde el campo Estado.'
      });

    // ── REGLA 1: No permitir asignar rol superadmin si ya existe otro ──────
    if (Number(id_rol) === 1 && usuarioActual.rows[0].id_rol !== 1) {
      const superadmins = await pool.query(
        'SELECT id_usuario FROM usuario WHERE id_rol = 1 AND id_usuario != $1',
        [req.params.id]
      );
      if (superadmins.rows.length > 0)
        return res.status(400).json({
          error: 'Ya existe un Superadmin. Solo puede haber uno en el sistema.'
        });
    }

    const existeCorreo = await pool.query(
      'SELECT id_usuario FROM usuario WHERE LOWER(correo) = LOWER($1) AND id_usuario != $2',
      [correo.trim(), req.params.id]
    );
    if (existeCorreo.rows.length > 0)
      return res.status(400).json({ error: 'Ya existe otro usuario con ese correo.' });

    let hashFinal;
    if (contrasena && contrasena.trim()) {
      hashFinal = await bcrypt.hash(contrasena, 10);
    } else {
      const actual = await pool.query(
        'SELECT contrasena FROM usuario WHERE id_usuario = $1',
        [req.params.id]
      );
      if (actual.rows.length === 0)
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      hashFinal = actual.rows[0].contrasena;
    }

    const result = await pool.query(
      `UPDATE usuario
       SET primer_nombre    = $1,
           segundo_nombre   = $2,
           primer_apellido  = $3,
           segundo_apellido = $4,
           correo           = $5,
           telefono         = $6,
           contrasena       = $7,
           id_rol           = $8,
           direccion        = $9,
           fecha_nacimiento = $10,
           estado           = $11
       WHERE id_usuario = $12
       RETURNING *`,
      [
        primer_nombre.trim(),
        segundo_nombre   ? segundo_nombre.trim()   : null,
        primer_apellido.trim(),
        segundo_apellido ? segundo_apellido.trim()  : null,
        correo.trim(),
        telefono.trim(),
        hashFinal,
        Number(id_rol),
        direccion.trim(),
        fecha_nacimiento,
        estado || 'activo',
        req.params.id
      ]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── UPDATE PERFIL (TIENDA) ──────────────────────────────────────────────────
const updatePerfilTienda = async (req, res) => {
  const { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, direccion } = req.body;

  const errores = {};
  if (!primer_nombre || !primer_nombre.trim())
    errores.primer_nombre = 'El primer nombre es obligatorio.';
  else if (!soloLetras.test(primer_nombre.trim()))
    errores.primer_nombre = 'El primer nombre solo permite letras.';

  if (!primer_apellido || !primer_apellido.trim())
    errores.primer_apellido = 'El primer apellido es obligatorio.';
  else if (!soloLetras.test(primer_apellido.trim()))
    errores.primer_apellido = 'El primer apellido solo permite letras.';

  if (!telefono || !telefono.trim())
    errores.telefono = 'El teléfono es obligatorio.';
  else if (!soloNumeros.test(telefono.trim()))
    errores.telefono = 'El teléfono solo permite números.';

  if (Object.keys(errores).length > 0)
    return res.status(400).json({ errores });

  try {
    const result = await pool.query(
      `UPDATE usuario
       SET primer_nombre    = $1,
           segundo_nombre   = $2,
           primer_apellido  = $3,
           segundo_apellido = $4,
           telefono         = $5,
           direccion        = $6
       WHERE id_usuario = $7
       RETURNING id_usuario, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, telefono, direccion, estado`,
      [
        primer_nombre.trim(),
        segundo_nombre ? segundo_nombre.trim() : null,
        primer_apellido.trim(),
        segundo_apellido ? segundo_apellido.trim() : null,
        telefono.trim(),
        direccion ? direccion.trim() : null,
        req.params.id
      ]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const pedidos = await pool.query(
      'SELECT COUNT(*) FROM pedido WHERE id_cliente = $1',
      [req.params.id]
    );
    if (parseInt(pedidos.rows[0].count) > 0)
      return res.status(400).json({
        error: 'No se puede eliminar el usuario porque tiene pedidos asociados. Solo se pueden eliminar usuarios sin pedidos.'
      });

    await pool.query('DELETE FROM direccion_envio WHERE id_usuario = $1', [req.params.id]);

    const result = await pool.query(
      'DELETE FROM usuario WHERE id_usuario = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    res.json({ mensaje: 'Usuario eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, create, update, updatePerfilTienda, remove };