const router         = require('express').Router();
const authController = require('../../controllers/Auth/authController');
const { verifyToken, isAdmin } = require('../../middleware/authMiddleware');

// ─── RUTAS PÚBLICAS ───────────────────────────────────────────
router.post('/login',            authController.login);
router.post('/login-cliente',    authController.loginCliente);
router.post('/register',         authController.register);
router.post('/verify',           authController.verifyEmail);
router.post('/resend-code',      authController.reenviarCodigo);
router.post('/recovery-request', authController.recoveryRequest);
router.post('/recovery-verify',  authController.recoveryVerify);
router.post('/recovery-reset',   authController.recoveryReset);

// ─── RUTAS PROTEGIDAS (requieren token + rol admin) ───────────
router.get('/users',       verifyToken, isAdmin, authController.getAllUsers);
router.put('/update-role', verifyToken, isAdmin, authController.updateRole);

module.exports = router;