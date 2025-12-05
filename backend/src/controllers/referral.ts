import { Request, Response } from 'express';
import prisma from '../db';
import crypto from 'crypto';

function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function getReferralStats(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        referrals: true,
        transactions: {
          where: { type: 'REFERRAL_BONUS' },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Generate referral code if user doesn't have one
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = generateReferralCode();
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode },
      });
    }

    const totalEarned = user.transactions.reduce((sum, t) => sum + t.coins, 0);

    res.json({
      stats: {
        referralCode,
        totalReferrals: user.referrals.length,
        totalEarned,
      },
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
}
