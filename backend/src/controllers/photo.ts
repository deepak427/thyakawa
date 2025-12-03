import { Request, Response } from 'express';
import prisma from '../db';

export async function uploadPhoto(req: Request, res: Response) {
  try {
    const { id: orderId } = req.params;
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!type || !['pickup', 'delivery'].includes(type)) {
      return res.status(400).json({ error: 'Invalid photo type. Must be "pickup" or "delivery"' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        orderId,
        uploadedByRole: req.user.role,
        type,
        path: file.path
      }
    });

    res.status(201).json({
      message: 'Photo uploaded successfully',
      photo: {
        id: photo.id,
        type: photo.type,
        path: photo.path,
        createdAt: photo.createdAt
      }
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
}
