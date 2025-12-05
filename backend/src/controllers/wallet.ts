import { Request, Response } from 'express';
import prisma from '../db';

/**
 * GET /api/wallet
 * Returns wallet information for the authenticated user
 */
export async function getWallet(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    res.json({ wallet });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/wallet/topup
 * Adds funds to the user's wallet
 */
export async function topupWallet(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { coins } = req.body;

    // Validate amount
    if (!coins || typeof coins !== 'number' || coins <= 0) {
      res.status(400).json({ error: 'Invalid amount: must be a positive number in cents' });
      return;
    }

    // Get current wallet
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    // Update wallet balance and create transaction (no transaction for serverless DB)
    const updatedWallet = await prisma.wallet.update({
      where: {
        userId: req.user.userId,
      },
      data: {
        coins: wallet.coins + coins,
      },
    });

    await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        type: 'TOPUP',
        coins,
        description: `Added ₹${(coins / 100).toFixed(2)} to wallet`,
      },
    });

    res.json({ wallet: updatedWallet });
  } catch (error) {
    console.error('Topup wallet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
