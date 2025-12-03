import bcrypt from 'bcrypt';
import prisma from '../db';

const OTP_EXPIRY_MINUTES = 15;
const SALT_ROUNDS = 10;

/**
 * Generates a 6-digit OTP code
 * @returns 6-digit numeric string
 */
export function generateOTP(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

/**
 * Creates and stores an OTP for an order
 * @param orderId Order ID
 * @param action Action type (e.g., 'pickup', 'delivery')
 * @returns The generated OTP code (for console logging in MVP)
 */
export async function createOTP(orderId: string, action: string): Promise<string> {
  const code = generateOTP();
  // For MVP, store plain code for easier debugging (in production, use hash)
  const codeHash = code; // Simplified for MVP
  
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  await prisma.oTP.create({
    data: {
      orderId,
      codeHash,
      action,
      expiresAt,
    },
  });

  // Console log for MVP (no SMS integration)
  console.log(`[OTP] Order ${orderId} - Action: ${action} - Code: ${code}`);

  return code;
}

/**
 * Verifies an OTP code for an order
 * @param orderId Order ID
 * @param action Action type
 * @param code OTP code to verify
 * @returns true if OTP is valid and not expired, false otherwise
 */
export async function verifyOTP(
  orderId: string,
  action: string,
  code: string
): Promise<boolean> {
  // Find the most recent unverified OTP for this order and action
  const otp = await prisma.oTP.findFirst({
    where: {
      orderId,
      action,
      verifiedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otp) {
    return false;
  }

  // Check if OTP has expired
  if (new Date() > otp.expiresAt) {
    return false;
  }

  // Verify the code (simplified for MVP - direct comparison)
  const isValid = code === otp.codeHash;

  if (isValid) {
    // Mark OTP as verified
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { verifiedAt: new Date() },
    });
  }

  return isValid;
}
