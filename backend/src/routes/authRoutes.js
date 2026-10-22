const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const { requireJson } = require('../middlewares/validationMiddleware');
router.post('/register', requireJson, register);
router.post('/login', requireJson, login);
module.exports = router;
