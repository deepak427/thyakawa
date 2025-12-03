import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Handle connection with retry logic
let isConnected = false;

export async function connectDB(retries = 5) {
  if (isConnected) return;

  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      isConnected = true;
      console.log('✅ Database connected successfully');
      return;
    } catch (err) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, err);
      if (i < retries - 1) {
        const delay = (i + 1) * 2000;
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('❌ Failed to connect to database after multiple attempts');
  // Don't exit process here, let the application handle the failure
  throw new Error('Database connection failed');
}

// Auto-connect when imported, but don't block
connectDB().catch(err => console.error('Initial DB connection failed:', err));

// Handle process termination
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
