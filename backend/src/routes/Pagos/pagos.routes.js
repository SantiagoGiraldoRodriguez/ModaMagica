const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/Pagos/pagos.controller');

router.post('/crear-preferencia', ctrl.crearPreferencia);
router.post('/webhook',           ctrl.webhook);

module.exports = router;