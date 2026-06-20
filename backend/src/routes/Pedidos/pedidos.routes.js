const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/Pedidos/pedidos.controller');

router.get('/',                          ctrl.getAll);
router.get('/clientes',                  ctrl.getClientes);
router.get('/productos',                 ctrl.getProductos);
router.get('/descuento/:codigo',         ctrl.validarDescuento);
router.get('/cliente/:id_usuario',       ctrl.getByCliente);
router.get('/:id',                       ctrl.getById);
router.post('/',                         ctrl.create);
router.put('/:id/estado',               ctrl.updateEstado);
router.delete('/:id',                    ctrl.remove);

module.exports = router;