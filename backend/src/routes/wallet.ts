import { Router } from 'express';
import { getWallet, topupWallet } from '../controllers/wallet';
import { getTransactions } from '../controllers/transaction';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All wallet routes require authentication
router.get('/', authenticateToken, getWallet);
router.post('/topup', authenticateToken, topupWallet);
router.get('/transactions', authenticateToken, getTransactions);

export default router;
