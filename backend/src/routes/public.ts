import { Router } from 'express';
import { getServices, getCenters, getTimeslots } from '../controllers/admin';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes (require authentication but not admin role)
router.get('/services', authenticateToken, getServices);
router.get('/centers', authenticateToken, getCenters);
router.get('/timeslots', authenticateToken, getTimeslots);

export default router;
