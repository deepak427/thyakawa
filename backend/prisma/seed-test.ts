import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning database...');
  
  // Delete all data in correct order
  await prisma.orderLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.oTP.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.order.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.timeslot.deleteMany();
  await prisma.address.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.authOTP.deleteMany();
  await prisma.user.deleteMany();
  await prisma.service.deleteMany();
  await prisma.center.deleteMany();

  console.log('✅ Database cleaned');

  // Create test users
  const password = await bcrypt.hash('test123', 10);

  const testUser = await prisma.user.create({
    data: {
      name: 'Test Customer',
      phone: '9999999999',
      email: 'customer@test.com',
      passwordHash: password,
      role: 'USER',
      referralCode: 'TEST001',
    },
  });

  const deliveryPerson = await prisma.user.create({
    data: {
      name: 'Test Delivery Person',
      phone: '8888888888',
      email: 'delivery@test.com',
      passwordHash: password,
      role: 'DELIVERY_PERSON',
    },
  });

  const floorManager = await prisma.user.create({
    data: {
      name: 'Test Floor Manager',
      phone: '7777777777',
      email: 'manager@test.com',
      passwordHash: password,
      role: 'FLOOR_MANAGER',
    },
  });

  const centerOperator = await prisma.user.create({
    data: {
      name: 'Test Center Operator',
      phone: '5555555555',
      email: 'operator@test.com',
      passwordHash: password,
      role: 'CENTER_OPERATOR',
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Test Admin',
      phone: '6666666666',
      email: 'admin@test.com',
      passwordHash: password,
      role: 'ADMIN',
    },
  });

  console.log('✅ Test users created');

  // Create wallets
  await prisma.wallet.create({
    data: {
      userId: testUser.id,
      balanceCents: 100000, // ₹1000
    },
  });

  console.log('✅ Wallets created');

  // Create test address
  await prisma.address.create({
    data: {
      userId: testUser.id,
      label: 'Home',
      line1: '123 Test Street, Test Area',
      city: 'Mumbai',
      pincode: '400001',
      lat: 19.0760,
      lng: 72.8777,
    },
  });

  console.log('✅ Test address created');

  // Create services
  const services = [
    { name: 'Shirt', basePriceCents: 3000 },
    { name: 'Trouser', basePriceCents: 4000 },
    { name: 'T-Shirt', basePriceCents: 2500 },
    { name: 'Jeans', basePriceCents: 4500 },
    { name: 'Saree', basePriceCents: 10000 },
  ];

  for (const service of services) {
    await prisma.service.create({ data: service });
  }

  console.log('✅ Services created');

  // Create center
  const center = await prisma.center.create({
    data: {
      name: 'Test Center',
      address: 'Test Center Address, Mumbai',
    },
  });

  console.log('✅ Center created');

  // Create timeslots for next 7 days
  const today = new Date();
  const timeSlots = [
    { startTime: '09:00', endTime: '12:00' },
    { startTime: '12:00', endTime: '15:00' },
    { startTime: '15:00', endTime: '18:00' },
    { startTime: '18:00', endTime: '21:00' },
  ];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    for (const slot of timeSlots) {
      await prisma.timeslot.create({
        data: {
          centerId: center.id,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: 10,
          remainingCapacity: 10,
        },
      });
    }
  }

  console.log('✅ Timeslots created');

  console.log('\n🎉 Test database seeded successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('Customer: 9999999999 / test123');
  console.log('Delivery: 8888888888 / test123');
  console.log('Manager:  7777777777 / test123');
  console.log('Operator: 5555555555 / test123');
  console.log('Admin:    6666666666 / test123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
