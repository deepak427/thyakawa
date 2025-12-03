import { Router } from 'express';
import { getReferralStats } from '../controllers/referral';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/referral-stats', authenticateToken, getReferralStats);

export default router;
