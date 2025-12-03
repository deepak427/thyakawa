import { Router } from 'express';
import { createAddress, getAddresses, updateAddress, deleteAddress } from '../controllers/address';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All address routes require authentication
router.post('/', authenticateToken, createAddress);
router.get('/', authenticateToken, getAddresses);
router.put('/:id', authenticateToken, updateAddress);
router.delete('/:id', authenticateToken, deleteAddress);

export default router;
