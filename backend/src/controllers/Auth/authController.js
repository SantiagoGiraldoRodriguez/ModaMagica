const pool   = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { enviarCorreo, codigoEmailHTML } = require('../../utils/correo');

const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

const calcularEdad = fechaNacimiento => {
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
};

// ─── LOGIN ADMIN ──────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !correo.trim())
    return res.status(400).json({ error: 'El correo es obligatorio.' });
  if (!contrasena)
    return res.status(400).json({ error: 'La contraseña es obligatoria.' });

  try {
    const result = await pool.query(
      'SELECT * FROM usuario WHERE LOWER(correo) = LOWER($1)',
      [correo.trim()]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const usuario = result.rows[0];

    if (usuario.estado === 'inactivo')
      return res.status(403).json({ error: 'Tu cuenta está inactiva.' });

    if (usuario.id_rol !== 1 && usuario.id_rol !== 2)
      return res.status(403).json({ error: 'Acceso no válido. Solo pueden ingresar administradores.' });

    const validPassword = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!validPassword)
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.id_rol },
      process.env.JWT_SECRET || 'modamagica_secret',
      { expiresIn: '8h' }
    );

    res.json({
      message:         'Bienvenido a Moda Mágica ✦',
      token,
      rol:             usuario.id_rol,
      nombre:          usuario.primer_nombre,
      apellido:        usuario.primer_apellido        || '',
      segundoNombre:   usuario.segundo_nombre         || '',
      segundoApellido: usuario.segundo_apellido       || '',
      correo:          usuario.correo,
      numero:          usuario.telefono               || '',
      estado:          usuario.estado,
      fechaRegistro:   usuario.fecha_creacion         || '',
      id:              usuario.id_usuario
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
};

// ─── LOGIN CLIENTE (tienda) ───────────────────────────────────────────────────
exports.loginCliente = async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !correo.trim())
    return res.status(400).json({ error: 'El correo es obligatorio.' });
  if (!contrasena)
    return res.status(400).json({ error: 'La contraseña es obligatoria.' });

  try {
    const result = await pool.query(
      'SELECT * FROM usuario WHERE LOWER(correo) = LOWER($1)',
      [correo.trim()]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const usuario = result.rows[0];

    if (usuario.estado === 'inactivo')
      return res.status(403).json({ error: 'Tu cuenta está inactiva. Contacta al administrador.' });

    if (usuario.id_rol !== 3)
      return res.status(403).json({ error: 'Este acceso es solo para clientes.' });

    const validPassword = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!validPassword)
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.id_rol },
      process.env.JWT_SECRET || 'modamagica_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message:          'Bienvenido a Moda Mágica ✦',
      token,
      id:               usuario.id_usuario,
      nombre:           usuario.primer_nombre,
      segundo_nombre:   usuario.segundo_nombre   || '',
      apellido:         usuario.primer_apellido  || '',
      segundo_apellido: usuario.segundo_apellido || '',
      correo:           usuario.correo,
      telefono:         usuario.telefono         || '',
      direccion:        usuario.direccion        || '',
      estado:           usuario.estado,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
};

// ─── REGISTRO (tienda) ────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  const {
    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    correo, contrasena, telefono, direccion, fecha_nacimiento
  } = req.body;

  const errores = {};

  if (!primer_nombre || !primer_nombre.trim())
    errores.primer_nombre = 'El primer nombre es obligatorio.';
  else if (!soloLetras.test(primer_nombre.trim()))
    errores.primer_nombre = 'El primer nombre solo permite letras.';

  if (segundo_nombre && segundo_nombre.trim() && !soloLetras.test(segundo_nombre.trim()))
    errores.segundo_nombre = 'El segundo nombre solo permite letras.';

  if (!primer_apellido || !primer_apellido.trim())
    errores.primer_apellido = 'El primer apellido es obligatorio.';
  else if (!soloLetras.test(primer_apellido.trim()))
    errores.primer_apellido = 'El primer apellido solo permite letras.';

  if (segundo_apellido && segundo_apellido.trim() && !soloLetras.test(segundo_apellido.trim()))
    errores.segundo_apellido = 'El segundo apellido solo permite letras.';

  if (!correo || !correo.trim())
    errores.correo = 'El correo es obligatorio.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()))
    errores.correo = 'Ingresa un correo electrónico válido.';

  if (!contrasena || contrasena.length < 6)
    errores.contrasena = 'La contraseña debe tener mínimo 6 caracteres.';

  if (!telefono || !telefono.trim())
    errores.telefono = 'El teléfono es obligatorio.';
  else if (!/^[0-9]{7,15}$/.test(telefono.trim()))
    errores.telefono = 'El teléfono debe tener entre 7 y 15 dígitos.';

  if (!direccion || !direccion.trim())
    errores.direccion = 'La dirección es obligatoria.';

  if (!fecha_nacimiento)
    errores.fecha_nacimiento = 'La fecha de nacimiento es obligatoria.';
  else if (calcularEdad(fecha_nacimiento) < 18)
    errores.fecha_nacimiento = 'Debes ser mayor de 18 años para registrarte.';

  if (Object.keys(errores).length > 0)
    return res.status(400).json({ errores });

  try {
    const existe = await pool.query(
      'SELECT id_usuario FROM usuario WHERE LOWER(correo) = LOWER($1)',
      [correo.trim()]
    );
    if (existe.rows.length > 0)
      return res.status(409).json({ error: 'El correo ya está registrado.' });

    const existeTelefono = await pool.query(
      'SELECT id_usuario FROM usuario WHERE telefono = $1',
      [telefono.trim()]
    );
    if (existeTelefono.rows.length > 0)
      return res.status(409).json({ error: 'Ese teléfono ya está registrado con otra cuenta.' });

    const hash = await bcrypt.hash(contrasena, 10);

    const result = await pool.query(
      `INSERT INTO usuario
        (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
         correo, contrasena, telefono, direccion, fecha_nacimiento,
         id_rol, estado, verify_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, 3, 'activo', NULL)
       RETURNING id_usuario`,
      [
        primer_nombre.trim(),
        segundo_nombre ? segundo_nombre.trim() : null,
        primer_apellido.trim(),
        segundo_apellido ? segundo_apellido.trim() : null,
        correo.trim(), hash, telefono.trim(), direccion.trim(), fecha_nacimiento
      ]
    );

    const nuevoId = result.rows[0].id_usuario;

    // Enviar correo de bienvenida (no crítico)
    try {
      await enviarCorreo({
        to: correo.trim(),
        subject: '✦ Bienvenido a Moda Mágica',
        html: codigoEmailHTML(primer_nombre.trim(), '', 'Tu cuenta ha sido creada exitosamente. ¡Ya puedes iniciar sesión!')
      });
    } catch (mailErr) {
      console.error('No se pudo enviar el correo de bienvenida:', mailErr.message);
    }

    res.json({
      message: '¡Cuenta creada exitosamente! Ya puedes iniciar sesión 🎉',
      userId: nuevoId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
};

// ─── VERIFICAR CUENTA ─────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  const { userId, codigo } = req.body;

  if (!userId || !codigo)
    return res.status(400).json({ error: 'userId y código son obligatorios.' });

  try {
    const result = await pool.query(
      'SELECT * FROM usuario WHERE id_usuario = $1',
      [userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    const usuario = result.rows[0];

    if (usuario.estado === 'activo')
      return res.json({ message: 'La cuenta ya estaba verificada.' });

    if (usuario.verify_code !== codigo)
      return res.status(400).json({ error: 'Código incorrecto ❌' });

    await pool.query(
      "UPDATE usuario SET estado = 'activo', verify_code = NULL WHERE id_usuario = $1",
      [userId]
    );

    res.json({ message: '¡Cuenta verificada correctamente! 🎉' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al verificar.' });
  }
};

// ─── REENVIAR CÓDIGO ──────────────────────────────────────────────────────────
exports.reenviarCodigo = async (req, res) => {
  const { userId } = req.body;

  if (!userId)
    return res.status(400).json({ error: 'userId es obligatorio.' });

  try {
    const result = await pool.query(
      'SELECT * FROM usuario WHERE id_usuario = $1',
      [userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    const usuario = result.rows[0];

    if (usuario.estado === 'activo')
      return res.json({ message: 'La cuenta ya está verificada.' });

    const nuevoCodigo = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      'UPDATE usuario SET verify_code = $1 WHERE id_usuario = $2',
      [nuevoCodigo, userId]
    );

    await enviarCorreo({
      to: usuario.correo,
      subject: '✦ Nuevo código de verificación - Moda Mágica',
      html: codigoEmailHTML(usuario.primer_nombre, nuevoCodigo, 'Tu nuevo código de verificación es:')
    });

    res.json({ message: 'Nuevo código enviado 📧' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reenviar código.' });
  }
};

// ─── RECOVERY: SOLICITAR CÓDIGO ───────────────────────────────────────────────
exports.recoveryRequest = async (req, res) => {
  const { correo } = req.body;

  if (!correo || !correo.trim())
    return res.status(400).json({ error: 'El correo es obligatorio.' });

  try {
    const result = await pool.query(
      'SELECT * FROM usuario WHERE LOWER(correo) = LOWER($1)',
      [correo.trim()]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'No existe una cuenta con ese correo.' });

    const usuario = result.rows[0];
    const codigo  = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      'UPDATE usuario SET verify_code = $1 WHERE id_usuario = $2',
      [codigo, usuario.id_usuario]
    );

    await enviarCorreo({
      to: correo.trim(),
      subject: '✦ Recuperar contraseña - Moda Mágica',
      html: codigoEmailHTML(usuario.primer_nombre, codigo, 'Recibimos una solicitud para restablecer tu contraseña. Tu código es:')
    });

    res.json({ message: 'Código enviado 📧', userId: usuario.id_usuario });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Error en el servidor.' });
  }
};

// ─── RECOVERY: VERIFICAR CÓDIGO ──────────────────────────────────────────────
exports.recoveryVerify = async (req, res) => {
  const { userId, codigo } = req.body;

  if (!userId || !codigo)
    return res.status(400).json({ error: 'userId y código son obligatorios.' });

  try {
    const result = await pool.query(
      'SELECT * FROM usuario WHERE id_usuario = $1',
      [userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    const usuario = result.rows[0];

    if (usuario.verify_code !== codigo)
      return res.status(400).json({ error: 'Código incorrecto.' });

    res.json({ message: 'Código verificado correctamente.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al verificar código.' });
  }
};

// ─── RECOVERY: CAMBIAR CONTRASEÑA ─────────────────────────────────────────────
exports.recoveryReset = async (req, res) => {
  const { userId, nuevaContrasena } = req.body;

  if (!userId || !nuevaContrasena)
    return res.status(400).json({ error: 'userId y nuevaContrasena son obligatorios.' });

  if (nuevaContrasena.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres.' });

  try {
    const result = await pool.query(
      'SELECT * FROM usuario WHERE id_usuario = $1',
      [userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    const hash = await bcrypt.hash(nuevaContrasena, 10);

    await pool.query(
      'UPDATE usuario SET contrasena = $1, verify_code = NULL WHERE id_usuario = $2',
      [hash, userId]
    );

    res.json({ message: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar contraseña.' });
  }
};

// ─── OBTENER TODOS LOS USUARIOS ───────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_usuario, primer_nombre, primer_apellido, correo, id_rol, estado FROM usuario'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar usuarios.' });
  }
};

// ─── ACTUALIZAR ROL ───────────────────────────────────────────────────────────
exports.updateRole = async (req, res) => {
  const { id, nuevoRol } = req.body;

  if (!id || !nuevoRol)
    return res.status(400).json({ error: 'id y nuevoRol son obligatorios.' });

  const rolesPermitidos = [1, 2, 3];
  if (!rolesPermitidos.includes(Number(nuevoRol)))
    return res.status(400).json({ error: 'Rol no válido.' });

  try {
    const result = await pool.query(
      'UPDATE usuario SET id_rol = $1 WHERE id_usuario = $2 RETURNING id_usuario',
      [nuevoRol, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    res.json({ message: `Rol actualizado a ${nuevoRol} correctamente.` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar rol.' });
  }
};