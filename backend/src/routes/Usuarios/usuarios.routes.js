const router     = require('express').Router();
const controller = require('../../controllers/Usuarios/usuarios.controllers');

router.get('/',     controller.getAll);
router.get('/:id',  controller.getById);
router.post('/',    controller.create);
router.put('/:id/perfil-tienda', controller.updatePerfilTienda);
router.put('/:id',  controller.update);
router.delete('/:id', controller.remove);

module.exports = router;