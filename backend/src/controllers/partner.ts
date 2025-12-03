import { Request, Response } from 'express';
import prisma from '../db';
import { OrderStatus } from '@prisma/client';
import { createOTP } from '../services/otp';
import { transitionOrderStatus } from '../services/orderStateMachine';

/**
 * GET /api/delivery/trips
 * Returns trips assigned to the authenticated delivery person
 */
export async function getPartnerAssignments(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const trips = await prisma.trip.findMany({
      where: {
        deliveryPersonId: req.user.userId,
      },
      include: {
        pickupOrders: {
          include: {
            items: true,
            address: true,
            timeslot: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        deliveryOrders: {
          include: {
            items: true,
            address: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });

    res.json({ trips });
  } catch (error) {
    console.error('Get partner assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/partner/order/:id/pickup
 * Request pickup OTP for an order
 */
export async function requestPickupOTP(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id: orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pickupTrip: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (!order.pickupTrip || order.pickupTrip.deliveryPersonId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied - order not assigned to you' });
      return;
    }

    const code = await createOTP(orderId, 'pickup');

    res.json({
      message: 'Pickup OTP generated successfully',
      code,
      expiresIn: '15 minutes',
    });
  } catch (error) {
    console.error('Request pickup OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/partner/order/:id/verify-pickup
 * Verify pickup OTP and mark order as picked up
 */
export async function verifyPickupOTP(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id: orderId } = req.params;
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ error: 'OTP code is required' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pickupTrip: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (!order.pickupTrip || order.pickupTrip.deliveryPersonId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied - order not assigned to you' });
      return;
    }

    const { verifyOTP } = await import('../services/otp');
    const isValid = await verifyOTP(orderId, 'pickup', code);

    if (!isValid) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    const updatedOrder = await transitionOrderStatus(
      orderId,
      OrderStatus.PICKED_UP,
      req.user.userId,
      req.user.role,
      { action: 'pickup_verified' }
    );

    res.json({
      message: 'Pickup verified successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Verify pickup OTP error:', error);
    res.status(500).json({ error: 'Failed to verify pickup OTP' });
  }
}

/**
 * POST /api/partner/order/:id/delivery
 * Mark order as out for delivery
 */
export async function markOutForDelivery(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id: orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryTrip: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (!order.deliveryTrip || order.deliveryTrip.deliveryPersonId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied - order not assigned to you' });
      return;
    }

    const updatedOrder = await transitionOrderStatus(
      orderId,
      OrderStatus.OUT_FOR_DELIVERY,
      req.user.userId,
      req.user.role,
      { action: 'marked_out_for_delivery' }
    );

    res.json({
      message: 'Order marked as out for delivery',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Mark out for delivery error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

/**
 * POST /api/orders/:id/status
 * Update order status with state machine validation
 */
export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id: orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      res.status(400).json({ error: 'Invalid status value' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // For delivery persons, verify they are assigned to this order
    if (req.user.role === 'DELIVERY_PERSON') {
      const orderWithTrips = await prisma.order.findUnique({
        where: { id: orderId },
        include: { pickupTrip: true, deliveryTrip: true },
      });
      const isAssigned = 
        (orderWithTrips?.pickupTrip?.deliveryPersonId === req.user.userId) ||
        (orderWithTrips?.deliveryTrip?.deliveryPersonId === req.user.userId);
      
      if (!isAssigned) {
        res.status(403).json({ error: 'Access denied - order not assigned to you' });
        return;
      }
    }

    const updatedOrder = await transitionOrderStatus(
      orderId,
      status as OrderStatus,
      req.user.userId,
      req.user.role,
      { updatedBy: req.user.role }
    );

    // Check if trip should be completed
    await checkAndCompleteTripIfNeeded(orderId);

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

/**
 * Check if a trip should be completed based on order statuses
 */
async function checkAndCompleteTripIfNeeded(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      pickupTrip: {
        include: {
          pickupOrders: true,
        },
      },
      deliveryTrip: {
        include: {
          deliveryOrders: true,
        },
      },
    },
  });

  if (!order) return;

  // Check pickup trip completion
  if (order.pickupTrip && order.pickupTrip.status !== 'COMPLETED') {
    const allOrdersAtCenterOrBeyond = order.pickupTrip.pickupOrders.every(
      (o) => ['AT_CENTER', 'PROCESSING', 'QC', 'READY_FOR_DELIVERY', 'ASSIGNED_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(o.status)
    );

    if (allOrdersAtCenterOrBeyond) {
      await prisma.trip.update({
        where: { id: order.pickupTrip.id },
        data: { status: 'COMPLETED' },
      });
      console.log(`Pickup trip ${order.pickupTrip.id} completed - all orders at center or beyond`);
    }
  }

  // Check delivery trip completion
  if (order.deliveryTrip && order.deliveryTrip.status !== 'COMPLETED') {
    const allOrdersDelivered = order.deliveryTrip.deliveryOrders.every(
      (o) => ['DELIVERED', 'COMPLETED'].includes(o.status)
    );

    if (allOrdersDelivered) {
      await prisma.trip.update({
        where: { id: order.deliveryTrip.id },
        data: { status: 'COMPLETED' },
      });
      console.log(`Delivery trip ${order.deliveryTrip.id} completed - all orders delivered`);
    }
  }
}

/**
 * POST /api/partner/order/:id/pickup-failure
 * Mark pickup as failed with reason
 */
export async function markPickupFailure(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id: orderId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      res.status(400).json({ error: 'Failure reason is required' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pickupTrip: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (!order.pickupTrip || order.pickupTrip.deliveryPersonId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied - order not assigned to you' });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PICKUP_FAILED,
        pickupFailureReason: reason.trim(),
      },
      include: {
        items: {
          include: {
            service: true,
          },
        },
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      message: 'Pickup marked as failed',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Mark pickup failure error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
