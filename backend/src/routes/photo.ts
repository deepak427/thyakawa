import { Router } from 'express';
import { uploadPhoto } from '../controllers/photo';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../config/multer';

const router = Router();

// Photo upload endpoint - requires authentication
router.post('/:id/photo', authenticateToken, upload.single('photo'), uploadPhoto);

export default router;
