const jwt = require('jsonwebtoken');

// ─── VERIFICAR TOKEN ──────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader)
    return res.status(403).json({ error: 'Token requerido.' });

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET || 'modamagica_secret', (err, decoded) => {
    if (err)
      return res.status(401).json({ error: 'Token inválido o expirado.' });

    req.user = decoded; // { id, rol }
    next();
  });
};

// ─── VERIFICAR ROL ADMIN (id_rol 1 = Superadmin, 2 = Admin) ──────────────────
const isAdmin = (req, res, next) => {
  if (req.user.rol !== 1 && req.user.rol !== 2)
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol Admin.' });
  next();
};

// ─── VERIFICAR SUPERADMIN (id_rol 1 = Superadmin) ────────────────────────────
const isSuperadmin = (req, res, next) => {
  if (req.user.rol !== 1)
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol Superadmin.' });
  next();
};

module.exports = { verifyToken, isAdmin, isSuperadmin };