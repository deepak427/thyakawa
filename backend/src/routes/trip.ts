import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  assignOrdersToTrip,
  deleteTrip,
} from '../controllers/trip';

const router = Router();

// Trip routes require admin or floor manager authentication
const adminAuth = [authenticateToken, requireRole('ADMIN', 'FLOOR_MANAGER')];
const viewAuth = [authenticateToken, requireRole('ADMIN', 'FLOOR_MANAGER', 'DELIVERY_PERSON')];

router.post('/', ...adminAuth, createTrip);
router.get('/', ...adminAuth, getAllTrips);
router.get('/:id', ...viewAuth, getTripById); // Delivery person can view their trips
router.put('/:id', ...adminAuth, updateTrip);
router.post('/:id/assign-orders', ...adminAuth, assignOrdersToTrip);
router.delete('/:id', ...adminAuth, deleteTrip);

export default router;
