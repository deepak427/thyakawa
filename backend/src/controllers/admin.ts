import { Request, Response } from 'express';
import prisma from '../db';
import { Role } from '@prisma/client';
import { transitionOrderStatus } from '../services/orderStateMachine';

/**
 * GET /api/admin/users
 * Get users by role
 */
export async function getUsersByRole(req: Request, res: Response): Promise<void> {
  try {
    const { role } = req.query;

    const where: any = {};
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * GET /api/admin/orders
 * Get all orders with optional filters
 */
export async function getAllOrders(req: Request, res: Response): Promise<void> {
  try {
    const { status, userId, tripId, startDate, endDate } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (userId) {
      where.userId = userId;
    }
    if (tripId) {
      where.tripId = tripId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        address: true,
        center: true,
        timeslot: true,
        items: {
          include: {
            service: true,
          },
        },
        logs: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

/**
 * POST /api/admin/orders/:id/assign-trip
 * Assign an order to a trip (replaces assignPartner)
 * TODO: Implement trip-based assignment
 */
export async function assignPartner(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { tripId } = req.body;

    if (!tripId) {
      res.status(400).json({ error: 'Trip ID is required' });
      return;
    }

    // Verify trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      res.status(400).json({ error: 'Invalid trip ID' });
      return;
    }

    // Get current order
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Update order with trip assignment
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        pickupTripId: tripId,
        status: 'ASSIGNED_FOR_PICKUP',
      },
    });

    const result = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        address: true,
        items: {
          include: {
            service: true,
          },
        },
        logs: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    res.json(result);
  } catch (error) {
    console.error('Error assigning partner:', error);
    res.status(500).json({ error: 'Failed to assign partner' });
  }
}

/**
 * Timeslot Management
 */

// GET /api/admin/timeslots
export async function getTimeslots(req: Request, res: Response): Promise<void> {
  try {
    const timeslots = await prisma.timeslot.findMany({
      include: {
        center: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    res.json(timeslots);
  } catch (error) {
    console.error('Error fetching timeslots:', error);
    res.status(500).json({ error: 'Failed to fetch timeslots' });
  }
}

// POST /api/admin/timeslots
export async function createTimeslot(req: Request, res: Response): Promise<void> {
  try {
    const { centerId, date, startTime, endTime, capacity } = req.body;

    if (!centerId || !date || !startTime || !endTime || !capacity) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const timeslot = await prisma.timeslot.create({
      data: {
        centerId,
        date: new Date(date),
        startTime,
        endTime,
        capacity,
        remainingCapacity: capacity,
      },
      include: {
        center: true,
      },
    });

    res.status(201).json(timeslot);
  } catch (error) {
    console.error('Error creating timeslot:', error);
    res.status(500).json({ error: 'Failed to create timeslot' });
  }
}

// PUT /api/admin/timeslots/:id
export async function updateTimeslot(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { centerId, date, startTime, endTime, capacity } = req.body;

    const data: any = {};
    if (centerId !== undefined) data.centerId = centerId;
    if (date !== undefined) data.date = new Date(date);
    if (startTime !== undefined) data.startTime = startTime;
    if (endTime !== undefined) data.endTime = endTime;
    if (capacity !== undefined) {
      data.capacity = capacity;
      // Adjust remaining capacity proportionally
      const currentTimeslot = await prisma.timeslot.findUnique({ where: { id } });
      if (currentTimeslot) {
        const usedCapacity = currentTimeslot.capacity - currentTimeslot.remainingCapacity;
        data.remainingCapacity = Math.max(0, capacity - usedCapacity);
      }
    }

    const timeslot = await prisma.timeslot.update({
      where: { id },
      data,
      include: {
        center: true,
      },
    });

    res.json(timeslot);
  } catch (error) {
    console.error('Error updating timeslot:', error);
    res.status(500).json({ error: 'Failed to update timeslot' });
  }
}

// DELETE /api/admin/timeslots/:id
export async function deleteTimeslot(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Check if timeslot has associated orders
    const ordersCount = await prisma.order.count({
      where: { timeslotId: id },
    });

    if (ordersCount > 0) {
      res.status(400).json({ error: 'Cannot delete timeslot with associated orders' });
      return;
    }

    await prisma.timeslot.delete({
      where: { id },
    });

    res.json({ message: 'Timeslot deleted successfully' });
  } catch (error) {
    console.error('Error deleting timeslot:', error);
    res.status(500).json({ error: 'Failed to delete timeslot' });
  }
}

/**
 * Center Management
 */

// GET /api/admin/centers
export async function getCenters(req: Request, res: Response): Promise<void> {
  try {
    const centers = await prisma.center.findMany({
      include: {
        timeslots: true,
      },
    });

    res.json(centers);
  } catch (error) {
    console.error('Error fetching centers:', error);
    res.status(500).json({ error: 'Failed to fetch centers' });
  }
}

// POST /api/admin/centers
export async function createCenter(req: Request, res: Response): Promise<void> {
  try {
    const { name, address } = req.body;

    if (!name || !address) {
      res.status(400).json({ error: 'Name and address are required' });
      return;
    }

    const center = await prisma.center.create({
      data: {
        name,
        address,
      },
    });

    res.status(201).json(center);
  } catch (error) {
    console.error('Error creating center:', error);
    res.status(500).json({ error: 'Failed to create center' });
  }
}

// PUT /api/admin/centers/:id
export async function updateCenter(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (address !== undefined) data.address = address;

    const center = await prisma.center.update({
      where: { id },
      data,
    });

    res.json(center);
  } catch (error) {
    console.error('Error updating center:', error);
    res.status(500).json({ error: 'Failed to update center' });
  }
}

// DELETE /api/admin/centers/:id
export async function deleteCenter(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Check if center has active orders
    const activeOrdersCount = await prisma.order.count({
      where: {
        centerId: id,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
    });

    if (activeOrdersCount > 0) {
      res.status(400).json({ error: 'Cannot delete center with active orders' });
      return;
    }

    await prisma.center.delete({
      where: { id },
    });

    res.json({ message: 'Center deleted successfully' });
  } catch (error) {
    console.error('Error deleting center:', error);
    res.status(500).json({ error: 'Failed to delete center' });
  }
}

/**
 * Service Management
 */

// GET /api/admin/services
export async function getServices(req: Request, res: Response): Promise<void> {
  try {
    const services = await prisma.service.findMany();

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
}

// POST /api/admin/services
export async function createService(req: Request, res: Response): Promise<void> {
  try {
    const { name, basePriceCents } = req.body;

    if (!name || basePriceCents === undefined) {
      res.status(400).json({ error: 'Name and base price are required' });
      return;
    }

    const service = await prisma.service.create({
      data: {
        name,
        basePriceCents,
      },
    });

    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
}

// PUT /api/admin/services/:id
export async function updateService(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, basePriceCents } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (basePriceCents !== undefined) data.basePriceCents = basePriceCents;

    const service = await prisma.service.update({
      where: { id },
      data,
    });

    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
}

// DELETE /api/admin/services/:id
export async function deleteService(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Check if service has associated order items
    const orderItemsCount = await prisma.orderItem.count({
      where: { serviceId: id },
    });

    if (orderItemsCount > 0) {
      res.status(400).json({ error: 'Cannot delete service with associated orders' });
      return;
    }

    await prisma.service.delete({
      where: { id },
    });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
}

/**
 * Payout Management
 */

// GET /api/admin/payouts
export async function getPayouts(req: Request, res: Response): Promise<void> {
  try {
    const payouts = await prisma.payout.findMany({
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add partner information
    const payoutsWithPartner = await Promise.all(
      payouts.map(async (payout: any) => {
        const partner = await prisma.user.findUnique({
          where: { id: payout.partnerId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        });

        return {
          ...payout,
          partner,
        };
      })
    );

    res.json(payoutsWithPartner);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
}

// POST /api/admin/payouts
export async function createPayout(req: Request, res: Response): Promise<void> {
  try {
    const { partnerId, orderId, amountCents } = req.body;

    if (!partnerId || !orderId || amountCents === undefined) {
      res.status(400).json({ error: 'Partner ID, order ID, and amount are required' });
      return;
    }

    // Verify delivery person exists
    const deliveryPerson = await prisma.user.findUnique({
      where: { id: partnerId },
    });

    if (!deliveryPerson || deliveryPerson.role !== 'DELIVERY_PERSON') {
      res.status(400).json({ error: 'Invalid delivery person ID' });
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

    const payout = await prisma.payout.create({
      data: {
        deliveryPersonId: partnerId,
        orderId,
        amountCents,
        status: 'PENDING',
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Add partner information
    const partnerInfo = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    res.status(201).json({
      ...payout,
      partner: partnerInfo,
    });
  } catch (error) {
    console.error('Error creating payout:', error);
    res.status(500).json({ error: 'Failed to create payout' });
  }
}

// PUT /api/admin/payouts/:id/complete
export async function completePayout(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const payout = await prisma.payout.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Add delivery person information
    const deliveryPerson = await prisma.user.findUnique({
      where: { id: payout.deliveryPersonId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    res.json({
      ...payout,
      deliveryPerson,
    });
  } catch (error) {
    console.error('Error completing payout:', error);
    res.status(500).json({ error: 'Failed to complete payout' });
  }
}
