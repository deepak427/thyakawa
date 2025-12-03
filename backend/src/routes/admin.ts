import { Router } from 'express';
import {
  getUsersByRole,
  getAllOrders,
  assignPartner,
  getTimeslots,
  createTimeslot,
  updateTimeslot,
  deleteTimeslot,
  getCenters,
  createCenter,
  updateCenter,
  deleteCenter,
  getServices,
  createService,
  updateService,
  deleteService,
  getPayouts,
  createPayout,
  completePayout,
} from '../controllers/admin';
import { authenticateToken, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Admin and Floor Manager routes
const adminAuth = [authenticateToken, requireRole(Role.ADMIN, Role.FLOOR_MANAGER)];

// Admin, Floor Manager, and Center Operator routes (for viewing orders)
const orderViewAuth = [authenticateToken, requireRole(Role.ADMIN, Role.FLOOR_MANAGER, Role.CENTER_OPERATOR)];

// User management
router.get('/users', ...adminAuth, getUsersByRole);

// Order management
router.get('/orders', ...orderViewAuth, getAllOrders);
router.post('/orders/:id/assign-partner', ...adminAuth, assignPartner);

// Timeslot management
router.get('/timeslots', ...adminAuth, getTimeslots);
router.post('/timeslots', ...adminAuth, createTimeslot);
router.put('/timeslots/:id', ...adminAuth, updateTimeslot);
router.delete('/timeslots/:id', ...adminAuth, deleteTimeslot);

// Center management
router.get('/centers', ...adminAuth, getCenters);
router.post('/centers', ...adminAuth, createCenter);
router.put('/centers/:id', ...adminAuth, updateCenter);
router.delete('/centers/:id', ...adminAuth, deleteCenter);

// Service management
router.get('/services', ...adminAuth, getServices);
router.post('/services', ...adminAuth, createService);
router.put('/services/:id', ...adminAuth, updateService);
router.delete('/services/:id', ...adminAuth, deleteService);

// Payout management
router.get('/payouts', ...adminAuth, getPayouts);
router.post('/payouts', ...adminAuth, createPayout);
router.put('/payouts/:id/complete', ...adminAuth, completePayout);

export default router;
