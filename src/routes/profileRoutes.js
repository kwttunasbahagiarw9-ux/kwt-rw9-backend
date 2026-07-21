import { Router } from 'express';
import { updateProfile, updateAvatar, deleteAvatar } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import { singlePhoto } from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.put('/me', updateProfile);
router.put('/avatar', singlePhoto, updateAvatar);
router.delete('/avatar', deleteAvatar);

export default router;
