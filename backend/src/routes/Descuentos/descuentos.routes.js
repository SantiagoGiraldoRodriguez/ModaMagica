// src/routes/descuentos/descuentos.routes.js

const router     = require('express').Router();
const controller = require('../../controllers/Descuentos/descuentos.controller');

router.get('/productos-activos', controller.getProductosActivos); // ← selector de prendas
router.post('/aplicar',          controller.aplicar);             // ← validar y aplicar código

router.get('/',        controller.getAll);
router.get('/:id',     controller.getById);
router.post('/',       controller.create);
router.put('/:id',     controller.update);
router.delete('/:id',  controller.remove);

module.exports = router;