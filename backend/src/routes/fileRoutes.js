const router = require('express').Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');
const { uploadFile, listFiles } = require('../controllers/fileController');
router.use(requireAuth);
router.post('/', upload.single('file'), uploadFile);
router.get('/', listFiles);
module.exports = router;
