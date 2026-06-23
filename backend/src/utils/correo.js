const emailBase = contenido => `
  <div style="max-width:520px;margin:auto;font-family:sans-serif;border:1px solid #eee;padding:28px;border-radius:12px;">
    <h2 style="color:#C8920A;text-align:center;">✦ MODA MÁGICA ✦</h2>
    ${contenido}
    <p style="font-size:12px;color:#aaa;margin-top:20px;">Si no realizaste esta acción, ignora este mensaje.</p>
  </div>
`;

const enviarCorreo = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('⚠️  RESEND_API_KEY no configurado — correo NO enviado.');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Moda Mágica <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error('Resend error:', err);
  }
};

const codigoEmailHTML = (nombre, codigo, mensaje) => emailBase(`
  <p>Hola <strong>${nombre}</strong>,</p>
  <p>${mensaje}</p>
  <div style="background:#f4f4f4;padding:16px;text-align:center;font-size:30px;font-weight:bold;letter-spacing:10px;color:#C8920A;border-radius:8px;">
    ${codigo}
  </div>
`);

module.exports = { enviarCorreo, emailBase, codigoEmailHTML };