const router = require('express').Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireJson } = require('../middlewares/validationMiddleware');
const { createLink, downloadFile, revokeLink } = require('../controllers/linkController');

router.post('/', requireAuth, requireJson, createLink);
router.get('/:token', downloadFile);
router.delete('/:linkId', requireAuth, revokeLink);
module.exports = router;
