import { Request, Response } from 'express';
import prisma from '../db';

/**
 * POST /api/addresses
 * Creates a new address for the authenticated user
 */
export async function createAddress(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { label, line1, city, pincode, lat, lng } = req.body;

    // Validate required fields
    if (!label || !line1 || !city || !pincode) {
      res.status(400).json({ error: 'Missing required fields: label, line1, city, pincode' });
      return;
    }

    // Create address
    const address = await prisma.address.create({
      data: {
        userId: req.user.userId,
        label,
        line1,
        city,
        pincode,
        lat: lat !== undefined ? lat : null,
        lng: lng !== undefined ? lng : null,
      },
    });

    res.status(201).json({ address });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/addresses
 * Returns all addresses for the authenticated user
 */
export async function getAddresses(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        label: 'asc',
      },
    });

    res.json({ addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/addresses/:id
 * Updates an existing address
 */
export async function updateAddress(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { label, line1, city, pincode, lat, lng } = req.body;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    if (existingAddress.userId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Update address
    const address = await prisma.address.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(line1 !== undefined && { line1 }),
        ...(city !== undefined && { city }),
        ...(pincode !== undefined && { pincode }),
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
      },
    });

    res.json({ address });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/addresses/:id
 * Deletes an address
 */
export async function deleteAddress(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    if (existingAddress.userId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Delete address
    await prisma.address.delete({
      where: { id },
    });

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
