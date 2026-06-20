const pool       = require('../../config/db');
const bcrypt     = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { enviarCorreo } = require('../../utils/correo');

// ─── PASO 1: Recibe el correo y envía el link ──────────────────────────────
exports.enviarRecovery = async (req, res) => {
  const { correo } = req.body;

  if (!correo || !correo.trim())
    return res.status(400).json({ error: 'El correo es obligatorio.' });

  try {
    const result = await pool.query(
      'SELECT * FROM usuario WHERE LOWER(correo) = LOWER($1)',
      [correo.trim()]
    );

    // Por seguridad siempre respondemos lo mismo aunque no exista
    if (result.rows.length === 0)
      return res.json({ message: 'Si el correo existe, recibirás un enlace 📧' });

    const usuario = result.rows[0];
    const token   = uuidv4();

    await pool.query(
      'UPDATE usuario SET recovery_token = $1 WHERE id_usuario = $2',
      [token, usuario.id_usuario]
    );

    const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/nueva-password?token=${token}`;

    try {
      await enviarCorreo({
        to: correo.trim(),
        subject: '✦ Recupera tu contraseña - Moda Mágica',
        html: `
          <div style="max-width:500px;margin:auto;font-family:sans-serif;border:1px solid #eee;padding:28px;border-radius:12px;">
            <h2 style="color:#C8920A;text-align:center;letter-spacing:2px;">✦ MODA MÁGICA ✦</h2>
            <p>Hola <strong>${usuario.primer_nombre}</strong>,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <p>Haz clic en el botón para crear una nueva:</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${link}"
                style="background:linear-gradient(135deg,#9A6E08,#C8920A);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:1px;">
                Restablecer contraseña
              </a>
            </div>
            <p style="font-size:12px;color:#aaa;">Si no solicitaste esto, puedes ignorar este correo. El enlace expira en 1 hora.</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error('Error enviando correo de recovery:', mailErr.message);
    }

    res.json({ message: 'Si el correo existe, recibirás un enlace 📧' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
};

// ─── PASO 2: Recibe el token y guarda la nueva contraseña ─────────────────
exports.guardarNuevaPassword = async (req, res) => {
  const { token, contrasena } = req.body;

  if (!token)
    return res.status(400).json({ error: 'Token inválido.' });

  if (!contrasena || contrasena.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres.' });
  if (!/[a-z]/.test(contrasena))
    return res.status(400).json({ error: 'La contraseña debe tener al menos una minúscula.' });
  if (!/[A-Z]/.test(contrasena))
    return res.status(400).json({ error: 'La contraseña debe tener al menos una mayúscula.' });
  if (!/[0-9]/.test(contrasena))
    return res.status(400).json({ error: 'La contraseña debe tener al menos un número.' });

  try {
    const result = await pool.query(
      'SELECT * FROM usuario WHERE recovery_token = $1',
      [token]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ error: 'El enlace no es válido o ya fue usado.' });

    const usuario   = result.rows[0];
    const hashNuevo = await bcrypt.hash(contrasena, 10);

    await pool.query(
      'UPDATE usuario SET contrasena = $1, recovery_token = NULL WHERE id_usuario = $2',
      [hashNuevo, usuario.id_usuario]
    );

    res.json({ message: 'Contraseña actualizada correctamente ✅' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
};
