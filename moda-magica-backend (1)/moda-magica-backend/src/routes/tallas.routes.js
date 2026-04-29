const router     = require('express').Router();
const controller = require('../controllers/tallas.controller');

router.get('/', controller.getAll);

module.exports = router;