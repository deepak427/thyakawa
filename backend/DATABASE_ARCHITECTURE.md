# Database Architecture

Complete database schema documentation for the Ironing Service Management System.

## 📊 Overview

- **Database**: PostgreSQL
- **ORM**: Prisma
- **Provider**: Neon (Serverless)
- **Total Tables**: 15
- **Enums**: 5

## 🗂️ Tables

### User
Stores all system users across different roles.

```prisma
model User {
  id            String
  name          String
  email         String?  (unique)
  phone         String   (unique)
  passwordHash  String?
  role          Role     (USER, DELIVERY_PERSON, FLOOR_MANAGER, CENTER_OPERATOR, ADMIN)
  referralCode  String?  (unique)
  referredBy    String?
  createdAt     DateTime
}
```

**Relationships:**
- Has many: addresses, orders, transactions, authOTPs
- Has one: wallet
- Self-referential: referrer/referrals

### Address
Customer delivery addresses.

```prisma
model Address {
  id      String
  userId  String
  label   String   (e.g., "Home", "Office")
  line1   String
  city    String
  pincode String
  lat     Float?
  lng     Float?
}
```

### Wallet
User wallet for payments.

```prisma
model Wallet {
  id           String
  userId       String  (unique)
  balanceCents Int     (stored in cents)
}
```

### Transaction
Wallet transaction history.

```prisma
model Transaction {
  id          String
  userId      String
  type        String   (CREDIT, DEBIT, REFUND)
  amountCents Int
  description String
  createdAt   DateTime
}
```

### Service
Available laundry services.

```prisma
model Service {
  id             String
  name           String   (e.g., "Shirt", "Trouser")
  basePriceCents Int
}
```

### Center
Processing centers.

```prisma
model Center {
  id      String
  name    String
  address String
}
```

### Timeslot
Available pickup time slots.

```prisma
model Timeslot {
  id                String
  centerId          String
  date              DateTime
  startTime         String   (e.g., "09:00")
  endTime           String   (e.g., "12:00")
  capacity          Int
  remainingCapacity Int
}
```

### Trip
Pickup or delivery trips.

```prisma
model Trip {
  id               String
  deliveryPersonId String
  type             TripType  (PICKUP, DELIVERY)
  status           TripStatus (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
  scheduledDate    DateTime
  startTime        String
  endTime          String
  createdAt        DateTime
  updatedAt        DateTime
}
```

**Relationships:**
- Has many: pickupOrders (via pickupTripId)
- Has many: deliveryOrders (via deliveryTripId)

### Order
Customer orders.

```prisma
model Order {
  id                    String
  userId                String
  addressId             String
  centerId              String?
  timeslotId            String
  pickupTripId          String?
  deliveryTripId        String?
  status                OrderStatus
  deliveryType          DeliveryType (STANDARD, PREMIUM)
  deliveryChargeCents   Int
  estimatedDeliveryTime DateTime?
  totalCents            Int
  paymentMethod         String
  cancellationReason    String?
  pickupFailureReason   String?
  pickupTimeSlot        String?
  createdAt             DateTime
  updatedAt             DateTime
}
```

**Relationships:**
- Belongs to: user, address, center, timeslot, pickupTrip, deliveryTrip
- Has many: items, logs, photos, otps, payouts

### OrderItem
Items in an order.

```prisma
model OrderItem {
  id         String
  orderId    String
  serviceId  String
  name       String
  quantity   Int
  priceCents Int
}
```

### OrderLog
Order status change history.

```prisma
model OrderLog {
  id         String
  orderId    String
  fromStatus String?
  toStatus   String
  actorId    String
  actorRole  Role
  metadata   Json?
  createdAt  DateTime
}
```

### Photo
Order photos (before/after).

```prisma
model Photo {
  id             String
  orderId        String
  uploadedByRole Role
  type           String   (BEFORE, AFTER)
  path           String
  createdAt      DateTime
}
```

### OTP
Order verification OTPs.

```prisma
model OTP {
  id         String
  orderId    String
  codeHash   String
  action     String   (pickup, delivery)
  expiresAt  DateTime
  verifiedAt DateTime?
  createdAt  DateTime
}
```

### AuthOTP
Authentication OTPs for phone login.

```prisma
model AuthOTP {
  id         String
  phone      String
  codeHash   String
  expiresAt  DateTime
  verifiedAt DateTime?
  userId     String?
  createdAt  DateTime
}
```

### Payout
Delivery person payouts.

```prisma
model Payout {
  id               String
  deliveryPersonId String
  orderId          String
  amountCents      Int
  status           PayoutStatus (PENDING, COMPLETED)
  createdAt        DateTime
}
```

## 🔢 Enums

### Role
```prisma
enum Role {
  USER              # Customer
  DELIVERY_PERSON   # Pickup & delivery
  FLOOR_MANAGER     # Trip management
  CENTER_OPERATOR   # Order processing
  ADMIN             # Full access
}
```

### TripStatus
```prisma
enum TripStatus {
  PENDING       # Created, not started
  IN_PROGRESS   # Active
  COMPLETED     # All orders done
  CANCELLED     # Cancelled
}
```

### TripType
```prisma
enum TripType {
  PICKUP    # Collect from customers
  DELIVERY  # Return to customers
}
```

### OrderStatus
```prisma
enum OrderStatus {
  PLACED                  # Order created
  ASSIGNED_FOR_PICKUP     # In pickup trip
  PICKED_UP               # Collected from customer
  AT_CENTER               # Arrived at center
  PROCESSING              # Being washed/ironed
  QC                      # Quality check
  READY_FOR_DELIVERY      # Ready to return
  ASSIGNED_FOR_DELIVERY   # In delivery trip
  OUT_FOR_DELIVERY        # On the way to customer
  DELIVERED               # Delivered to customer
  COMPLETED               # Fully completed
  CANCELLED               # Cancelled
  PICKUP_FAILED           # Pickup failed
  DELIVERY_FAILED         # Delivery failed
  REFUND_REQUESTED        # Refund requested
}
```

### DeliveryType
```prisma
enum DeliveryType {
  STANDARD  # 48 hours
  PREMIUM   # 24 hours
}
```

### PayoutStatus
```prisma
enum PayoutStatus {
  PENDING    # Not paid
  COMPLETED  # Paid
}
```

## 🔗 Relationships

### User Relationships
```
User
├── addresses (1:N)
├── wallet (1:1)
├── orders (1:N)
├── transactions (1:N)
├── authOTPs (1:N)
└── referrals (1:N self-referential)
```

### Order Relationships
```
Order
├── user (N:1)
├── address (N:1)
├── center (N:1)
├── timeslot (N:1)
├── pickupTrip (N:1)
├── deliveryTrip (N:1)
├── items (1:N)
├── logs (1:N)
├── photos (1:N)
├── otps (1:N)
└── payouts (1:N)
```

### Trip Relationships
```
Trip
├── pickupOrders (1:N via pickupTripId)
└── deliveryOrders (1:N via deliveryTripId)
```

## 📈 Indexes

### Performance Indexes
```sql
-- User lookups
CREATE INDEX idx_user_phone ON User(phone);
CREATE INDEX idx_user_email ON User(email);

-- Order queries
CREATE INDEX idx_order_user ON Order(userId);
CREATE INDEX idx_order_status ON Order(status);
CREATE INDEX idx_order_created ON Order(createdAt);

-- Trip queries
CREATE INDEX idx_trip_delivery_person ON Trip(deliveryPersonId);
CREATE INDEX idx_trip_status ON Trip(status);

-- Transaction history
CREATE INDEX idx_transaction_user_date ON Transaction(userId, createdAt);

-- OTP lookups
CREATE INDEX idx_auth_otp_phone ON AuthOTP(phone, expiresAt);
```

## 🔄 State Transitions

### Order Status Flow
```
PLACED
  ↓
ASSIGNED_FOR_PICKUP
  ↓
PICKED_UP
  ↓
AT_CENTER
  ↓
PROCESSING
  ↓
QC
  ↓
READY_FOR_DELIVERY
  ↓
ASSIGNED_FOR_DELIVERY
  ↓
OUT_FOR_DELIVERY
  ↓
DELIVERED
  ↓
COMPLETED
```

### Trip Status Flow
```
PENDING
  ↓
IN_PROGRESS
  ↓
COMPLETED
```

## 💾 Data Storage

### Monetary Values
All prices stored in **cents** (integer):
- `totalCents`: 5000 = ₹50.00
- `balanceCents`: 100000 = ₹1000.00

### Dates & Times
- `DateTime`: Full timestamp with timezone
- `String`: Time slots (e.g., "09:00", "12:00")

### Passwords & OTPs
- Hashed with bcrypt
- Never stored in plain text

## 🔒 Security

### Constraints
- Unique: email, phone, referralCode
- Required: name, phone, role
- Foreign keys: Cascade on delete where appropriate

### Validation
- Email format validation
- Phone number format
- Positive amounts only
- Valid enum values

## 📊 Sample Data

### Test Users
```sql
-- Customer
phone: 9999999999, role: USER

-- Delivery Person
phone: 8888888888, role: DELIVERY_PERSON

-- Floor Manager
phone: 7777777777, role: FLOOR_MANAGER

-- Center Operator
phone: 5555555555, role: CENTER_OPERATOR

-- Admin
phone: 6666666666, role: ADMIN
```

### Services
```sql
Shirt:    ₹30.00
Trouser:  ₹40.00
T-Shirt:  ₹25.00
Jeans:    ₹45.00
Saree:    ₹100.00
```

## 🛠️ Migrations

### Create Migration
```bash
npx prisma migrate dev --name migration_name
```

### Reset Database
```bash
npx prisma migrate reset
```

### Seed Data
```bash
npx tsx prisma/seed-test.ts
```

## 📝 Notes

- **No Transactions**: Designed for serverless (Neon) compatibility
- **Soft Deletes**: Not implemented (hard deletes used)
- **Audit Trail**: OrderLog tracks all status changes
- **Referential Integrity**: Enforced by foreign keys

---

For API documentation, see [README.md](./README.md)
