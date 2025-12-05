import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning database...');
  
  // Delete all data in correct order (respecting foreign keys)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.address.deleteMany();
  await prisma.timeslot.deleteMany();
  await prisma.center.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleaned');
  console.log('🌱 Seeding test users...');

  const password = 'test123';
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@test.com',
      phone: '1111111111',
      passwordHash,
      role: Role.ADMIN,
      referralCode: 'ADMIN001',
    },
  });
  console.log('✅ Created Admin:', admin.email);

  // 2. Floor Manager
  const manager = await prisma.user.create({
    data: {
      name: 'Manager User',
      email: 'manager@test.com',
      phone: '2222222222',
      passwordHash,
      role: Role.FLOOR_MANAGER,
      referralCode: 'MGR001',
    },
  });
  console.log('✅ Created Manager:', manager.email);

  // 3. Center Operator
  const operator = await prisma.user.create({
    data: {
      name: 'Operator User',
      email: 'operator@test.com',
      phone: '3333333333',
      passwordHash,
      role: Role.CENTER_OPERATOR,
      referralCode: 'OPR001',
    },
  });
  console.log('✅ Created Operator:', operator.email);

  // 4. Delivery Person
  const delivery = await prisma.user.create({
    data: {
      name: 'Delivery User',
      email: 'delivery@test.com',
      phone: '4444444444',
      passwordHash,
      role: Role.DELIVERY_PERSON,
      referralCode: 'DEL001',
    },
  });
  console.log('✅ Created Delivery Person:', delivery.email);

  // 5. Regular Customer
  const customer = await prisma.user.create({
    data: {
      name: 'Customer User',
      email: 'customer@test.com',
      phone: '5555555555',
      passwordHash,
      role: Role.USER,
      referralCode: 'CUST001',
    },
  });
  console.log('✅ Created Customer:', customer.email);

  // Create wallet for customer
  await prisma.wallet.create({
    data: {
      userId: customer.id,
      coins: 100000,
    },
  });
  console.log('✅ Created Wallet for customer');

  // Create address for customer
  await prisma.address.create({
    data: {
      userId: customer.id,
      address: '123 Test Street, Apt 4B, Mumbai 400001',
      lat: 19.0760,
      lng: 72.8777,
    },
  });
  console.log('✅ Created Address for customer');

  // Create a center for testing
  const center = await prisma.center.create({
    data: {
      name: 'Mumbai Central',
      address: '456 Processing Lane, Mumbai',
      coverageKm: 10.0,
      lat: 19.0760,
      lng: 72.8777,
    },
  });
  console.log('✅ Created Center:', center.name);

  // Create basic services
  const services = await prisma.service.createMany({
    data: [
      { name: 'Shirt', baseCoins: 3000 }, // ₹30
      { name: 'Trouser', baseCoins: 4000 }, // ₹40
      { name: 'Saree', baseCoins: 6000 }, // ₹60
      { name: 'Bedsheet', baseCoins: 5000 }, // ₹50
    ],
  });
  console.log('✅ Created Services:', services.count);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('All users have password: test123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:     admin@test.com     | 1111111111');
  console.log('Manager:   manager@test.com   | 2222222222');
  console.log('Operator:  operator@test.com  | 3333333333');
  console.log('Delivery:  delivery@test.com  | 4444444444');
  console.log('Customer:  customer@test.com  | 5555555555');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
