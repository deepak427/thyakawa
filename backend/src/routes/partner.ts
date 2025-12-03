import { Router } from 'express';
import {
  getPartnerAssignments,
  requestPickupOTP,
  verifyPickupOTP,
  markOutForDelivery,
  updateOrderStatus,
  markPickupFailure,
} from '../controllers/partner';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All delivery routes require authentication and DELIVERY_PERSON role
router.get('/assignments', authenticateToken, requireRole('DELIVERY_PERSON'), getPartnerAssignments);
router.post('/order/:id/pickup', authenticateToken, requireRole('DELIVERY_PERSON'), requestPickupOTP);
router.post('/order/:id/verify-pickup', authenticateToken, requireRole('DELIVERY_PERSON'), verifyPickupOTP);
router.post('/order/:id/delivery', authenticateToken, requireRole('DELIVERY_PERSON'), markOutForDelivery);
router.post('/order/:id/pickup-failure', authenticateToken, requireRole('DELIVERY_PERSON'), markPickupFailure);

export default router;
