import { Request, Response } from 'express';
import prisma from '../db';
import { TripStatus, TripType } from '@prisma/client';

/**
 * POST /api/admin/trips
 * Create a new trip with multiple orders (pickup or delivery)
 */
export async function createTrip(req: Request, res: Response): Promise<void> {
  try {
    const { deliveryPersonId, scheduledDate, startTime, endTime, orderIds, type } = req.body;

    if (!deliveryPersonId || !scheduledDate || !startTime || !endTime || !type) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (!['PICKUP', 'DELIVERY'].includes(type)) {
      res.status(400).json({ error: 'Trip type must be PICKUP or DELIVERY' });
      return;
    }

    // Verify delivery person exists
    const deliveryPerson = await prisma.user.findUnique({
      where: { id: deliveryPersonId },
    });

    if (!deliveryPerson || deliveryPerson.role !== 'DELIVERY_PERSON') {
      res.status(400).json({ error: 'Invalid delivery person ID' });
      return;
    }

    // Create trip
    const trip = await prisma.trip.create({
      data: {
        deliveryPersonId,
        type: type as TripType,
        scheduledDate: new Date(scheduledDate),
        startTime,
        endTime,
        status: TripStatus.PENDING,
      },
    });

    // Assign orders to trip if provided
    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      if (type === 'PICKUP') {
        await prisma.order.updateMany({
          where: {
            id: { in: orderIds },
            status: 'PLACED',
          },
          data: {
            pickupTripId: trip.id,
            status: 'ASSIGNED_FOR_PICKUP',
          },
        });
      } else {
        await prisma.order.updateMany({
          where: {
            id: { in: orderIds },
            status: 'READY_FOR_DELIVERY',
          },
          data: {
            deliveryTripId: trip.id,
            status: 'ASSIGNED_FOR_DELIVERY',
          },
        });
      }
    }

    // Fetch updated trip with orders
    const updatedTrip = await prisma.trip.findUnique({
      where: { id: trip.id },
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
    });

    res.status(201).json(updatedTrip);
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
}

/**
 * GET /api/admin/trips
 * Get all trips with optional filters
 */
export async function getAllTrips(req: Request, res: Response): Promise<void> {
  try {
    const { status, deliveryPersonId, startDate, endDate, type } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (deliveryPersonId) {
      where.deliveryPersonId = deliveryPersonId;
    }
    if (type) {
      where.type = type;
    }
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) {
        where.scheduledDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.scheduledDate.lte = new Date(endDate as string);
      }
    }

    const trips = await prisma.trip.findMany({
      where,
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

    res.json(trips);
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
}

/**
 * GET /api/admin/trips/:id
 * Get trip details
 */
export async function getTripById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        pickupOrders: {
          include: {
            items: {
              include: {
                service: true,
              },
            },
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
        },
      },
    });

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    // If delivery person, ensure they can only see their own trips
    if (req.user?.role === 'DELIVERY_PERSON' && trip.deliveryPersonId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied - not your trip' });
      return;
    }

    res.json(trip);
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
}

/**
 * PUT /api/admin/trips/:id
 * Update trip details
 */
export async function updateTrip(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { deliveryPersonId, scheduledDate, startTime, endTime, status } = req.body;

    const data: any = {};
    if (deliveryPersonId) data.deliveryPersonId = deliveryPersonId;
    if (scheduledDate) data.scheduledDate = new Date(scheduledDate);
    if (startTime) data.startTime = startTime;
    if (endTime) data.endTime = endTime;
    if (status) data.status = status;

    const trip = await prisma.trip.update({
      where: { id },
      data,
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
    });

    res.json(trip);
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
}

/**
 * POST /api/admin/trips/:id/assign-orders
 * Assign orders to a trip
 */
export async function assignOrdersToTrip(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      res.status(400).json({ error: 'Order IDs are required' });
      return;
    }

    // Verify trip exists
    const trip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    // Assign orders based on trip type
    if (trip.type === 'PICKUP') {
      await prisma.order.updateMany({
        where: {
          id: { in: orderIds },
          status: 'PLACED',
        },
        data: {
          pickupTripId: id,
          status: 'ASSIGNED_FOR_PICKUP',
        },
      });
    } else {
      await prisma.order.updateMany({
        where: {
          id: { in: orderIds },
          status: 'READY_FOR_DELIVERY',
        },
        data: {
          deliveryTripId: id,
          status: 'ASSIGNED_FOR_DELIVERY',
        },
      });
    }

    // Fetch updated trip
    const updatedTrip = await prisma.trip.findUnique({
      where: { id },
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
    });

    res.json(updatedTrip);
  } catch (error) {
    console.error('Assign orders to trip error:', error);
    res.status(500).json({ error: 'Failed to assign orders' });
  }
}

/**
 * DELETE /api/admin/trips/:id
 * Delete a trip (only if no orders assigned)
 */
export async function deleteTrip(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Check if trip has orders
    const pickupCount = await prisma.order.count({
      where: { pickupTripId: id },
    });
    const deliveryCount = await prisma.order.count({
      where: { deliveryTripId: id },
    });

    if (pickupCount > 0 || deliveryCount > 0) {
      res.status(400).json({ error: 'Cannot delete trip with assigned orders' });
      return;
    }

    await prisma.trip.delete({
      where: { id },
    });

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
}
