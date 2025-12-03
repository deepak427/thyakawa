import { Router } from 'express';
import { signup, login, getProfile } from '../controllers/auth';
import { sendOTP, verifyOTP } from '../controllers/otp';
import { getReferralStats } from '../controllers/referral';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// OTP routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Protected routes
router.get('/me', authenticateToken, getProfile);

export default router;
