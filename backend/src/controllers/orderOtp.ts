import { Request, Response } from 'express';
import prisma from '../db';
import { verifyOTP } from '../services/otp';
import { transitionOrderStatus } from '../services/orderStateMachine';

/**
 * POST /api/orders/:id/otp/verify
 * Verify delivery OTP
 */
export async function verifyDeliveryOTP(req: Request, res: Response): Promise<void> {
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

    // Verify order belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.userId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Verify OTP
    const isValid = await verifyOTP(orderId, 'delivery', code);

    if (!isValid) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    // Transition order to DELIVERED
    await transitionOrderStatus(
      orderId,
      'DELIVERED',
      req.user.userId,
      req.user.role || 'USER'
    );

    res.json({ message: 'Delivery verified successfully' });
  } catch (error) {
    console.error('Verify delivery OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
}
