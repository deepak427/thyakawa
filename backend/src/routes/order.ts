import { Router } from 'express';
import { createOrder, getUserOrders, getOrderById, updateOrder, cancelOrder } from '../controllers/order';
import { verifyDeliveryOTP } from '../controllers/orderOtp';
import { updateOrderStatus } from '../controllers/partner';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All order routes require authentication
router.post('/', authenticateToken, createOrder);
router.get('/user', authenticateToken, getUserOrders);
router.get('/:id', authenticateToken, getOrderById);
router.put('/:id', authenticateToken, updateOrder);
router.post('/:id/cancel', authenticateToken, cancelOrder);
router.post('/:id/otp/verify', authenticateToken, verifyDeliveryOTP);
router.post('/:id/status', authenticateToken, updateOrderStatus);

export default router;
