const router             = require('express').Router();
const recoveryController = require('../../controllers/Auth/recoveryController');

// ─── RUTAS DE RECUPERACIÓN ────────────────────────────────────────────────────
router.post('/solicitar',      recoveryController.enviarRecovery);
router.post('/nueva-password', recoveryController.guardarNuevaPassword);

module.exports = router;