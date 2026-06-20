// ─── ENVÍO DE CORREO CON GMAIL (nodemailer) ────────────────────────────────

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const emailBase = contenido => `
  <div style="max-width:500px;margin:auto;font-family:sans-serif;border:1px solid #eee;padding:28px;border-radius:12px;">
    <h2 style="color:#C8920A;text-align:center;">✦ MODA MÁGICA ✦</h2>
    ${contenido}
    <p style="font-size:12px;color:#aaa;margin-top:20px;">Si no realizaste esta acción, ignora este mensaje.</p>
  </div>
`;

/**
 * Envía un correo usando Gmail vía nodemailer.
 * @param {string} to - correo destinatario
 * @param {string} subject - asunto
 * @param {string} html - contenido HTML del correo
 */
const enviarCorreo = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('⚠️  EMAIL_USER/EMAIL_PASS no configurados en el .env — correo NO enviado.');
    throw new Error('El servicio de correo no está configurado.');
  }

  await transporter.sendMail({
    from: `"Moda Mágica" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

const codigoEmailHTML = (nombre, codigo, mensaje) => emailBase(`
  <p>Hola <strong>${nombre}</strong>,</p>
  <p>${mensaje}</p>
  <div style="background:#f4f4f4;padding:16px;text-align:center;font-size:30px;font-weight:bold;letter-spacing:10px;color:#C8920A;border-radius:8px;">
    ${codigo}
  </div>
`);

module.exports = { enviarCorreo, emailBase, codigoEmailHTML };
