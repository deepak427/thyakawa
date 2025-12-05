import { Request, Response } from 'express';
import prisma from '../db';
import { generateToken } from '../utils/auth';
import crypto from 'crypto';

/**
 * POST /api/auth/send-otp
 * Sends OTP to phone number
 */
export async function sendOTP(req: Request, res: Response): Promise<void> {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Store OTP (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await prisma.authOTP.create({
      data: {
        phone,
        codeHash,
        expiresAt,
      },
    });

    // In production, send SMS via Twilio/SNS
    // For MVP, return OTP in response (ONLY FOR DEVELOPMENT)
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({ 
      message: 'OTP sent successfully',
      // Remove this in production!
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}

/**
 * POST /api/auth/verify-otp
 * Verifies OTP and creates/logs in user
 */
export async function verifyOTP(req: Request, res: Response): Promise<void> {
  try {
    const { phone, otp, name, email, referralCode } = req.body;

    if (!phone || !otp) {
      res.status(400).json({ error: 'Phone and OTP are required' });
      return;
    }

    // Hash the provided OTP
    const codeHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Find valid OTP
    const authOTP = await prisma.authOTP.findFirst({
      where: {
        phone,
        codeHash,
        expiresAt: { gte: new Date() },
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!authOTP) {
      res.status(401).json({ error: 'Invalid or expired OTP' });
      return;
    }

    // Mark OTP as verified
    await prisma.authOTP.update({
      where: { id: authOTP.id },
      data: { verifiedAt: new Date() },
    });

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    // If user doesn't exist, create new user (signup flow)
    if (!user) {
      if (!name) {
        res.status(400).json({ error: 'Name is required for new users' });
        return;
      }

      // Check if referral code is valid
      let referrerId: string | null = null;
      if (referralCode) {
        const referrer = await prisma.user.findUnique({
          where: { referralCode },
        });
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      // Create user with referral bonus
      const initialBalance = referrerId ? 5000 : 0; // ₹50 bonus for referred users

      user = await prisma.user.create({
        data: {
          name,
          phone,
          email: email || null,
          passwordHash: null,
          role: 'USER',
          referredBy: referrerId,
          wallet: {
            create: {
              coins: initialBalance,
            },
          },
        },
      });

      // Create transaction for referral bonus
      if (referrerId && initialBalance > 0) {
        await prisma.transaction.create({
          data: {
            userId: user.id,
            type: 'REFERRAL_BONUS',
            coins: initialBalance,
            description: 'Welcome bonus for using referral code',
          },
        });
      }
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email || '',
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      isNewUser: !authOTP.userId,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
}
