import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Hash password for all users
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  // Create users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ironing.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@ironing.com',
      phone: '+1234567890',
      passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log('Created admin user:', adminUser.email);

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'user@example.com',
      phone: '+1234567891',
      passwordHash,
      role: Role.USER,
      wallet: {
        create: {
          balanceCents: 50000, // $500 initial balance
        },
      },
      addresses: {
        create: {
          label: 'Home',
          line1: '123 Main Street',
          city: 'New York',
          pincode: '10001',
          lat: 40.7128,
          lng: -74.0060,
        },
      },
    },
  });
  console.log('Created regular user:', regularUser.email);

  const deliveryPerson = await prisma.user.upsert({
    where: { email: 'delivery@ironing.com' },
    update: {},
    create: {
      name: 'Delivery Person',
      email: 'delivery@ironing.com',
      phone: '+1234567892',
      passwordHash,
      role: Role.DELIVERY_PERSON,
    },
  });
  console.log('Created delivery person:', deliveryPerson.email);

  const floorManager = await prisma.user.upsert({
    where: { email: 'manager@ironing.com' },
    update: {},
    create: {
      name: 'Floor Manager',
      email: 'manager@ironing.com',
      phone: '+1234567893',
      passwordHash,
      role: Role.FLOOR_MANAGER,
    },
  });
  console.log('Created floor manager:', floorManager.email);

  // Create center
  const center = await prisma.center.upsert({
    where: { id: 'default-center-id' },
    update: {},
    create: {
      id: 'default-center-id',
      name: 'Downtown Ironing Center',
      address: '456 Business Ave, New York, NY 10002',
    },
  });
  console.log('Created center:', center.name);

  // Create services
  const shirtService = await prisma.service.upsert({
    where: { id: 'service-shirt' },
    update: {},
    create: {
      id: 'service-shirt',
      name: 'Shirt',
      basePriceCents: 500, // $5.00
    },
  });
  console.log('Created service:', shirtService.name);

  const pantsService = await prisma.service.upsert({
    where: { id: 'service-pants' },
    update: {},
    create: {
      id: 'service-pants',
      name: 'Pants',
      basePriceCents: 700, // $7.00
    },
  });
  console.log('Created service:', pantsService.name);

  const dressService = await prisma.service.upsert({
    where: { id: 'service-dress' },
    update: {},
    create: {
      id: 'service-dress',
      name: 'Dress',
      basePriceCents: 1200, // $12.00
    },
  });
  console.log('Created service:', dressService.name);

  // Create timeslots for next 5 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeSlots = [
    { startTime: '09:00', endTime: '11:00' },
    { startTime: '11:00', endTime: '13:00' },
  ];

  let timeslotCount = 0;
  for (let day = 0; day < 5; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);

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
      timeslotCount++;
    }
  }
  console.log(`Created ${timeslotCount} timeslots for next 5 days`);

  console.log('\n✅ Seed completed successfully!');
  console.log('\n🔑 Default credentials (all users):');
  console.log('Password: password123');
  console.log('\n👥 User accounts:');
  console.log('- Admin: admin@ironing.com (Settings & User Management)');
  console.log('- Floor Manager: manager@ironing.com (Trip & Operations Management)');
  console.log('- Delivery Person: delivery@ironing.com');
  console.log('- Customer: user@example.com');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
