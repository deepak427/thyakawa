import { Request, Response } from 'express';
import prisma from '../db';

export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
}

export async function createTransaction(
  userId: string,
  type: string,
  coins: number,
  description: string
): Promise<void> {
  await prisma.transaction.create({
    data: {
      userId,
      type,
      coins,
      description,
    },
  });
}
