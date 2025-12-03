import { Request, Response } from 'express';
import prisma from '../db';
import { OrderStatus } from '@prisma/client';
import { transitionOrderStatus } from '../services/orderStateMachine';

/**
 * GET /api/center/:id/orders
 * Returns orders at the specified center filtered by processing statuses
 */
export async function getCenterOrders(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id: centerId } = req.params;

    // Processing statuses for center operators
    const processingStatuses = [
      OrderStatus.AT_CENTER,
      OrderStatus.PROCESSING,
      OrderStatus.QC,
      OrderStatus.READY_FOR_DELIVERY,
    ];

    const orders = await prisma.order.findMany({
      where: {
        centerId,
        status: {
          in: processingStatuses,
        },
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
        timeslot: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get center orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/center/order/:id/update-stage
 * Updates the processing stage of an order
 */
export async function updateProcessingStage(req: Request, res: Response): Promise<void> {
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

    // Validate status is a valid OrderStatus enum value
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      res.status(400).json({ error: 'Invalid status value' });
      return;
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Transition order status using state machine
    const updatedOrder = await transitionOrderStatus(
      orderId,
      status as OrderStatus,
      req.user.userId,
      req.user.role,
      { updatedBy: 'CENTER_OPERATOR', stage: status }
    );

    res.json({
      message: 'Processing stage updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update processing stage error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
