const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/Reservas/reservas.controller');

router.get('/disponibilidad',  ctrl.disponibilidad);
router.post('/',               ctrl.reservar);
router.delete('/',              ctrl.liberar);
router.delete('/sesion',        ctrl.liberarSesion);

module.exports = router;
