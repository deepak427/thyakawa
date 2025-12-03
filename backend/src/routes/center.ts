import { Router } from 'express';
import { getCenterOrders, updateProcessingStage } from '../controllers/center';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All center routes require authentication and CENTER_OPERATOR role
router.get('/:id/orders', authenticateToken, requireRole('CENTER_OPERATOR'), getCenterOrders);
router.post('/order/:id/update-stage', authenticateToken, requireRole('CENTER_OPERATOR'), updateProcessingStage);

export default router;
