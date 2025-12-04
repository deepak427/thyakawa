import { Request, Response } from 'express';
import prisma from '../db';
import { OrderStatus } from '@prisma/client';

/**
 * POST /api/orders
 * Creates a new order with wallet deduction and timeslot capacity update
 */
export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { addressId, centerId, timeslotId, deliveryType, items } = req.body;

    // Validate required fields
    if (!addressId || !timeslotId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Missing required fields: addressId, timeslotId, items' });
      return;
    }

    // Validate delivery type
    const validDeliveryTypes = ['STANDARD', 'PREMIUM'];
    const selectedDeliveryType = deliveryType || 'STANDARD';
    if (!validDeliveryTypes.includes(selectedDeliveryType)) {
      res.status(400).json({ error: 'Invalid delivery type' });
      return;
    }

    // Validate items structure
    for (const item of items) {
      if (!item.serviceId || !item.quantity || item.quantity <= 0) {
        res.status(400).json({ error: 'Invalid item: must have serviceId and positive quantity' });
        return;
      }
    }

    // Verify address belongs to user
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== req.user.userId) {
      res.status(404).json({ error: 'Address not found or access denied' });
      return;
    }

    // Verify timeslot exists and has capacity
    const timeslot = await prisma.timeslot.findUnique({
      where: { id: timeslotId },
    });

    if (!timeslot) {
      res.status(404).json({ error: 'Timeslot not found' });
      return;
    }

    if (timeslot.remainingCapacity <= 0) {
      res.status(400).json({ error: 'Timeslot is full' });
      return;
    }

    // Get services and calculate total
    const serviceIds = items.map(item => item.serviceId);
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
      },
    });

    if (services.length !== serviceIds.length) {
      res.status(404).json({ error: 'One or more services not found' });
      return;
    }

    // Calculate delivery charge
    const DELIVERY_CHARGES = {
      STANDARD: 0,
      PREMIUM: 5000, // ₹50
    };
    const deliveryChargeCents = DELIVERY_CHARGES[selectedDeliveryType as keyof typeof DELIVERY_CHARGES];

    // Calculate estimated delivery time
    const now = new Date();
    const deliveryHours = selectedDeliveryType === 'PREMIUM' ? 24 : 48;
    const estimatedDeliveryTime = new Date(now.getTime() + deliveryHours * 60 * 60 * 1000);

    // Calculate total price
    let subtotalCents = 0;
    const orderItemsData = items.map(item => {
      const service = services.find((s: any) => s.id === item.serviceId);
      if (!service) {
        throw new Error('Service not found');
      }
      const itemTotal = service.basePriceCents * item.quantity;
      subtotalCents += itemTotal;
      return {
        serviceId: item.serviceId,
        name: service.name,
        quantity: item.quantity,
        priceCents: service.basePriceCents,
      };
    });

    const totalCents = subtotalCents + deliveryChargeCents;

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.userId },
    });

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    if (wallet.balanceCents < totalCents) {
      res.status(400).json({
        error: 'Insufficient wallet balance',
        required: totalCents,
        available: wallet.balanceCents,
      });
      return;
    }

    // Store userId for use
    const userId = req.user.userId;

    // Create order WITHOUT transaction (serverless DB friendly)
    // Deduct from wallet
    await prisma.wallet.update({
      where: { userId },
      data: {
        balanceCents: wallet.balanceCents - totalCents,
      },
    });

    // Decrease timeslot capacity
    await prisma.timeslot.update({
      where: { id: timeslotId },
      data: {
        remainingCapacity: timeslot.remainingCapacity - 1,
      },
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        addressId,
        centerId: centerId || null,
        timeslotId,
        status: OrderStatus.PLACED,
        deliveryType: selectedDeliveryType,
        deliveryChargeCents,
        estimatedDeliveryTime,
        totalCents,
        paymentMethod: 'WALLET',
        items: {
          create: orderItemsData,
        },
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId,
        type: 'ORDER_PAYMENT',
        amountCents: -totalCents,
        description: `Payment for order #${order.id.slice(0, 8)}`,
      },
    });

    // Create order log entry
    await prisma.orderLog.create({
      data: {
        orderId: order.id,
        fromStatus: null,
        toStatus: OrderStatus.PLACED,
        actorId: userId,
        actorRole: req.user?.role || 'USER',
        metadata: {},
      },
    });

    // Fetch complete order details after transaction
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        address: true,
        timeslot: true,
      },
    });

    res.status(201).json(completeOrder);
  } catch (error: any) {
    console.error('Create order error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({ 
      error: 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * GET /api/orders/user
 * Returns all orders for the authenticated user
 */
export async function getUserOrders(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        items: {
          include: {
            service: true,
          },
        },
        address: true,
        timeslot: {
          include: {
            center: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/orders/:id
 * Returns order details with items and logs
 */
export async function getOrderById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            service: true,
          },
        },
        address: true,
        timeslot: {
          include: {
            center: true,
          },
        },
        logs: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        photos: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Check if user has access to this order
    if (order.userId !== req.user.userId && req.user.role === 'USER') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/orders/:id/cancel
 * Cancels an order with refund and capacity restoration
 */
/**
 * PUT /api/orders/:id
 * Update order (only if not picked up yet)
 */
export async function updateOrder(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id: orderId } = req.params;
    const { addressId, timeslotId, deliveryType, items } = req.body;

    // Get existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (existingOrder.userId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check if order can be updated (only PLACED or ASSIGNED_TO_PARTNER)
    const updatableStatuses = ['PLACED', 'ASSIGNED_TO_PARTNER'];
    if (!updatableStatuses.includes(existingOrder.status)) {
      res.status(400).json({ error: 'Order cannot be updated after pickup' });
      return;
    }

    // Calculate new total if items changed
    let newTotalCents = existingOrder.totalCents;
    let newOrderItemsData: Array<{ serviceId: string; name: string; quantity: number; priceCents: number }> = [];

    if (items && Array.isArray(items)) {
      const serviceIds = items.map(item => item.serviceId);
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
      });

      let subtotalCents = 0;
      newOrderItemsData = items.map(item => {
        const service = services.find((s: any) => s.id === item.serviceId);
        if (!service) throw new Error('Service not found');
        const itemTotal = service.basePriceCents * item.quantity;
        subtotalCents += itemTotal;
        return {
          serviceId: item.serviceId,
          name: service.name,
          quantity: item.quantity,
          priceCents: service.basePriceCents,
        };
      });

      const DELIVERY_CHARGES = { STANDARD: 0, PREMIUM: 5000 };
      const deliveryCharge = DELIVERY_CHARGES[(deliveryType || existingOrder.deliveryType) as keyof typeof DELIVERY_CHARGES];
      newTotalCents = subtotalCents + deliveryCharge;
    }

    // Calculate refund/charge difference
    const priceDifference = newTotalCents - existingOrder.totalCents;

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.userId },
    });

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    // Check if user has enough balance for price increase
    if (priceDifference > 0 && wallet.balanceCents < priceDifference) {
      res.status(400).json({ error: 'Insufficient wallet balance for update' });
      return;
    }

    const userId = req.user.userId;

    // Update order WITHOUT transaction (serverless DB friendly)
    // Adjust wallet balance
    if (priceDifference !== 0) {
      await prisma.wallet.update({
        where: { userId },
        data: { balanceCents: wallet.balanceCents - priceDifference },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId,
          type: priceDifference > 0 ? 'ORDER_PAYMENT' : 'REFUND',
          amountCents: priceDifference,
          description: `Order update ${priceDifference > 0 ? 'charge' : 'refund'} for #${orderId.slice(0, 8)}`,
        },
      });
    }

    // Delete old items if items changed
    if (items) {
      await prisma.orderItem.deleteMany({
        where: { orderId },
      });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(addressId && { addressId }),
        ...(timeslotId && { timeslotId }),
        ...(deliveryType && {
          deliveryType,
          deliveryChargeCents: deliveryType === 'PREMIUM' ? 5000 : 0,
          estimatedDeliveryTime: new Date(Date.now() + (deliveryType === 'PREMIUM' ? 24 : 48) * 60 * 60 * 1000),
        }),
        totalCents: newTotalCents,
        ...(items && {
          items: {
            create: newOrderItemsData,
          },
        }),
      },
      include: {
        items: true,
        address: true,
        timeslot: true,
      },
    });

    res.json({ order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
}

export async function cancelOrder(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400).json({ error: 'Cancellation reason is required' });
      return;
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        timeslot: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Check if user owns the order
    if (order.userId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check if order can be cancelled (only PLACED or ASSIGNED_FOR_PICKUP)
    if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.ASSIGNED_FOR_PICKUP) {
      res.status(400).json({
        error: 'Order cannot be cancelled',
        currentStatus: order.status,
        message: 'Only orders with status PLACED or ASSIGNED_TO_PARTNER can be cancelled',
      });
      return;
    }

    // Cancel order WITHOUT transaction (serverless DB friendly)
    // Refund to wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: order.userId },
    });

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    await prisma.wallet.update({
      where: { userId: order.userId },
      data: {
        balanceCents: wallet.balanceCents + order.totalCents,
      },
    });

    // Restore timeslot capacity
    await prisma.timeslot.update({
      where: { id: order.timeslotId },
      data: {
        remainingCapacity: order.timeslot.remainingCapacity + 1,
      },
    });

    // Update order status and add cancellation reason
    const result = await prisma.order.update({
      where: { id },
      data: { 
        status: OrderStatus.CANCELLED,
        cancellationReason: reason,
      },
    });

    // Create transaction record for refund
    await prisma.transaction.create({
      data: {
        userId: order.userId,
        type: 'REFUND',
        amountCents: order.totalCents,
        description: `Refund for cancelled order #${id.slice(0, 8)}`,
      },
    });

    // Create order log entry
    await prisma.orderLog.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: OrderStatus.CANCELLED,
        actorId: req.user?.userId || '',
        actorRole: req.user?.role || 'USER',
        metadata: { reason: 'User cancellation' },
      },
    });

    res.json({
      message: 'Order cancelled successfully',
      order: result,
      refundedAmount: order.totalCents,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
