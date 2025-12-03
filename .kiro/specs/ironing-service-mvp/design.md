# Design Document

## Overview

The ironing service MVP is a full-stack web application built with a Node.js/Express backend and React frontend. The system manages the complete lifecycle of ironing orders through a state machine, supporting four distinct user roles with role-based access control. The backend uses Prisma ORM to interact with Neon PostgreSQL, implements JWT-based authentication, and handles file uploads for order documentation. The frontend provides role-specific interfaces built with React, TypeScript, and Tailwind CSS.

## Architecture

### System Architecture

The application follows a three-tier architecture:

1. **Presentation Layer**: React SPA with role-based routing
2. **Application Layer**: Express REST API with JWT middleware
3. **Data Layer**: Neon PostgreSQL with Prisma ORM

### Technology Stack

**Backend:**
- Node.js with Express
- TypeScript for type safety
- Prisma ORM for database access
- JWT for authentication
- Bcrypt for password hashing
- Multer for file upload handling

**Frontend:**
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API communication

**Database:**
- Neon PostgreSQL (serverless)
- Accessed via MCP integration

### Monorepo Structure

```
/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
├── uploads/
└── README.md
```

## Components and Interfaces

### Backend Components

#### 1. Authentication System
- **AuthController**: Handles signup and login
- **AuthMiddleware**: Validates JWT tokens and extracts user information
- **RoleMiddleware**: Enforces role-based access control

#### 2. User Management
- **UserController**: Manages user profiles
- **AddressController**: CRUD operations for delivery addresses
- **WalletController**: Handles wallet top-ups and balance queries

#### 3. Order Management
- **OrderController**: Order creation, retrieval, cancellation
- **OrderService**: Business logic for order state transitions
- **OrderLogService**: Tracks all order state changes

#### 4. Partner Operations
- **PartnerController**: Assignment viewing, status updates
- **OTPService**: OTP generation, verification, and expiration
- **PhotoService**: File upload handling and storage

#### 5. Center Operations
- **CenterController**: Order viewing and stage updates
- **ProcessingService**: Manages center workflow stages

#### 6. Admin Operations
- **AdminController**: System-wide order management
- **TimeslotController**: CRUD for timeslots
- **ServiceController**: CRUD for services
- **CenterManagementController**: CRUD for centers
- **PayoutController**: Payout tracking and management

### Frontend Components

#### Shared Components
- **Layout**: Navigation and role-based menu
- **ProtectedRoute**: Route guard with role checking
- **OrderTimeline**: Visual status display
- **LoadingSpinner**: Loading state indicator

#### User Components
- **SignupForm**: User registration
- **LoginForm**: Authentication
- **Dashboard**: Order overview
- **CreateOrder**: Multi-step order form
- **TimeslotPicker**: Available slot selection
- **OrderDetail**: Status tracking and timeline
- **WalletPage**: Balance and top-up

#### Partner Components
- **PartnerDashboard**: Assigned orders list
- **OrderAction**: OTP input and photo upload
- **PickupFlow**: Pickup verification workflow
- **DeliveryFlow**: Delivery verification workflow

#### Center Operator Components
- **ProcessingQueue**: Orders at center
- **StageUpdater**: Processing stage buttons

#### Admin Components
- **AdminDashboard**: All orders table
- **PartnerAssignment**: Partner selection modal
- **TimeslotManager**: CRUD interface
- **CenterManager**: CRUD interface
- **ServiceManager**: CRUD interface
- **PayoutManager**: Payout tracking

## Data Models

### Prisma Schema

```prisma
model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  phone        String    @unique
  passwordHash String
  role         Role      @default(USER)
  createdAt    DateTime  @default(now())
  addresses    Address[]
  wallet       Wallet?
  orders       Order[]
}

enum Role {
  USER
  PARTNER
  CENTER_OPERATOR
  ADMIN
}

model Address {
  id       String  @id @default(uuid())
  userId   String
  user     User    @relation(fields: [userId], references: [id])
  label    String
  line1    String
  city     String
  pincode  String
  lat      Float?
  lng      Float?
  orders   Order[]
}

model Wallet {
  id           String @id @default(uuid())
  userId       String @unique
  user         User   @relation(fields: [userId], references: [id])
  balanceCents Int    @default(0)
}

model Service {
  id             String      @id @default(uuid())
  name           String
  basePriceCents Int
  orderItems     OrderItem[]
}

model Center {
  id        String     @id @default(uuid())
  name      String
  address   String
  timeslots Timeslot[]
  orders    Order[]
}

model Timeslot {
  id                String   @id @default(uuid())
  centerId          String
  center            Center   @relation(fields: [centerId], references: [id])
  date              DateTime
  startTime         String
  endTime           String
  capacity          Int
  remainingCapacity Int
  orders            Order[]
}

model Order {
  id            String      @id @default(uuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  addressId     String
  address       Address     @relation(fields: [addressId], references: [id])
  centerId      String?
  center        Center?     @relation(fields: [centerId], references: [id])
  timeslotId    String
  timeslot      Timeslot    @relation(fields: [timeslotId], references: [id])
  partnerId     String?
  status        OrderStatus @default(PLACED)
  totalCents    Int
  paymentMethod String      @default("WALLET")
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  items         OrderItem[]
  logs          OrderLog[]
  photos        Photo[]
  otps          OTP[]
  payouts       Payout[]
}

enum OrderStatus {
  PLACED
  ASSIGNED_TO_PARTNER
  PICKUP_PENDING
  PICKED_UP
  AT_CENTER
  PROCESSING
  QC
  READY_FOR_DELIVERY
  OUT_FOR_DELIVERY
  DELIVERED
  COMPLETED
  CANCELLED
  PICKUP_FAILED
  DELIVERY_FAILED
  REFUND_REQUESTED
}

model OrderItem {
  id         String  @id @default(uuid())
  orderId    String
  order      Order   @relation(fields: [orderId], references: [id])
  serviceId  String
  service    Service @relation(fields: [serviceId], references: [id])
  name       String
  quantity   Int
  priceCents Int
}

model OrderLog {
  id         String   @id @default(uuid())
  orderId    String
  order      Order    @relation(fields: [orderId], references: [id])
  fromStatus String?
  toStatus   String
  actorId    String
  actorRole  Role
  metadata   Json?
  createdAt  DateTime @default(now())
}

model Photo {
  id             String   @id @default(uuid())
  orderId        String
  order          Order    @relation(fields: [orderId], references: [id])
  uploadedByRole Role
  type           String
  path           String
  createdAt      DateTime @default(now())
}

model OTP {
  id         String    @id @default(uuid())
  orderId    String
  order      Order     @relation(fields: [orderId], references: [id])
  codeHash   String
  action     String
  expiresAt  DateTime
  verifiedAt DateTime?
  createdAt  DateTime  @default(now())
}

model Payout {
  id          String       @id @default(uuid())
  partnerId   String
  orderId     String
  order       Order        @relation(fields: [orderId], references: [id])
  amountCents Int
  status      PayoutStatus @default(PENDING)
  createdAt   DateTime     @default(now())
}

enum PayoutStatus {
  PENDING
  COMPLETED
}
```

### Order State Machine

Valid state transitions:
- PLACED → ASSIGNED_TO_PARTNER
- ASSIGNED_TO_PARTNER → PICKUP_PENDING
- PICKUP_PENDING → PICKED_UP
- PICKED_UP → AT_CENTER
- AT_CENTER → PROCESSING
- PROCESSING → QC
- QC → READY_FOR_DELIVERY
- READY_FOR_DELIVERY → OUT_FOR_DELIVERY
- OUT_FOR_DELIVERY → DELIVERED
- DELIVERED → COMPLETED

Exception transitions:
- PLACED → CANCELLED
- ASSIGNED_TO_PARTNER → CANCELLED
- PICKUP_PENDING → PICKUP_FAILED
- OUT_FOR_DELIVERY → DELIVERY_FAILED
- Any status → REFUND_REQUESTED (admin only)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Authentication and Authorization Properties

Property 1: Password hashing
*For any* user registration with valid credentials, the stored password hash should never equal the plain text password
**Validates: Requirements 1.1**

Property 2: JWT issuance on valid login
*For any* user with valid credentials, authentication should return a valid JWT token that can be decoded to extract user information
**Validates: Requirements 1.2**

Property 3: Authentication rejection for invalid credentials
*For any* login attempt with incorrect password or non-existent email, authentication should fail and return an error
**Validates: Requirements 1.3**

Property 4: Password hash exclusion from responses
*For any* authenticated user profile request, the response should never contain the passwordHash field
**Validates: Requirements 1.4**

### Address Management Properties

Property 5: Address persistence completeness
*For any* address creation with all required fields, retrieving that address should return all originally provided fields unchanged
**Validates: Requirements 2.1**

Property 6: Address ownership filtering
*For any* user requesting their addresses, the response should only contain addresses where userId matches the authenticated user
**Validates: Requirements 2.2**

Property 7: Address update persistence
*For any* address update operation, retrieving the address should reflect all modified fields
**Validates: Requirements 2.3**

Property 8: Address deletion completeness
*For any* deleted address, subsequent retrieval attempts should return not found
**Validates: Requirements 2.4**

### Wallet Management Properties

Property 9: Wallet balance increase on top-up
*For any* wallet top-up operation, the new balance should equal the old balance plus the top-up amount
**Validates: Requirements 3.1**

Property 10: Wallet balance accuracy
*For any* wallet retrieval, the returned balance should match the sum of all top-ups minus all order deductions
**Validates: Requirements 3.2**

Property 11: Wallet deduction on order placement
*For any* successful order placement, the wallet balance should decrease by exactly the order total
**Validates: Requirements 3.3**

Property 12: Insufficient balance rejection
*For any* order placement attempt where order total exceeds wallet balance, the order should be rejected and balance should remain unchanged
**Validates: Requirements 3.4**

### Order Creation Properties

Property 13: Order creation with correct initial status
*For any* valid order creation, the order should be created with status PLACED
**Validates: Requirements 4.1**

Property 14: Order total calculation accuracy
*For any* order with multiple items, the total should equal the sum of (service base price × quantity) for all items
**Validates: Requirements 4.2**

Property 15: Order items creation completeness
*For any* order creation with N services, exactly N order items should be created
**Validates: Requirements 4.3**

Property 16: Order creation logging
*For any* order creation, an order log entry should be created with toStatus = PLACED
**Validates: Requirements 4.4**

Property 17: Timeslot capacity decrease
*For any* order placement using a timeslot, the timeslot's remaining capacity should decrease by one
**Validates: Requirements 4.5**

### Order Tracking Properties

Property 18: Order ownership filtering
*For any* user requesting their orders, the response should only contain orders where userId matches the authenticated user
**Validates: Requirements 5.1**

Property 19: Order detail completeness
*For any* order detail request, the response should include status, all order items, and the complete order log history
**Validates: Requirements 5.2**

Property 20: Status change logging
*For any* order status change, an order log entry should be created with the old status, new status, actor ID, and actor role
**Validates: Requirements 5.3**

Property 21: Order history completeness
*For any* order with N status changes, the order log should contain at least N entries
**Validates: Requirements 5.4**

### Order Cancellation Properties

Property 22: Cancellation allowed for early stages
*For any* order with status PLACED or ASSIGNED_TO_PARTNER, cancellation should succeed and status should become CANCELLED
**Validates: Requirements 6.1**

Property 23: Refund on cancellation
*For any* cancelled order, the user's wallet balance should increase by the order total
**Validates: Requirements 6.2**

Property 24: Cancellation rejection for advanced stages
*For any* order with status beyond ASSIGNED_TO_PARTNER, cancellation should be rejected and status should remain unchanged
**Validates: Requirements 6.3**

Property 25: Timeslot capacity restoration on cancellation
*For any* cancelled order, the associated timeslot's remaining capacity should increase by one
**Validates: Requirements 6.4**

### OTP Verification Properties

Property 26: OTP format validation
*For any* generated OTP, the code should be exactly 6 digits
**Validates: Requirements 7.1**

Property 27: Correct OTP acceptance
*For any* OTP verification with the correct code before expiration, the OTP should be marked as verified and order status should update to DELIVERED
**Validates: Requirements 7.2**

Property 28: Incorrect OTP rejection
*For any* OTP verification with an incorrect code, verification should fail and order status should remain unchanged
**Validates: Requirements 7.3**

Property 29: Expired OTP rejection
*For any* OTP verification attempt after the expiration time, verification should fail regardless of code correctness
**Validates: Requirements 7.4**

### Partner Operations Properties

Property 30: Partner authentication
*For any* user with role PARTNER and valid credentials, authentication should succeed and return a JWT with role PARTNER
**Validates: Requirements 8.1**

Property 31: Partner assignment filtering
*For any* partner requesting assignments, the response should only contain orders where partnerId matches the authenticated partner
**Validates: Requirements 8.2**

Property 32: Partner assignment status filtering
*For any* partner assignment query, only orders with active statuses (not COMPLETED, CANCELLED, etc.) should be returned
**Validates: Requirements 8.3**

Property 33: Partner assignment detail completeness
*For any* partner assignment, the response should include order details, delivery address, and current status
**Validates: Requirements 8.4**

### Pickup OTP Properties

Property 34: Pickup OTP format validation
*For any* pickup OTP generation, the code should be exactly 6 digits
**Validates: Requirements 9.1**

Property 35: Pickup OTP verification and status update
*For any* pickup OTP verification with correct code, the order status should transition to PICKED_UP
**Validates: Requirements 9.2**

Property 36: Pickup OTP rejection
*For any* pickup OTP verification with incorrect code, verification should fail and status should remain unchanged
**Validates: Requirements 9.3**

Property 37: Pickup verification logging
*For any* successful pickup OTP verification, an order log entry should be created with actorRole = PARTNER
**Validates: Requirements 9.4**

### Photo Upload Properties

Property 38: Pickup photo storage
*For any* pickup photo upload, the file should be stored in the uploads directory and a photo record should be created with type = "pickup"
**Validates: Requirements 10.1**

Property 39: Delivery photo storage
*For any* delivery photo upload, the file should be stored in the uploads directory and a photo record should be created with type = "delivery"
**Validates: Requirements 10.2**

Property 40: Photo record completeness
*For any* photo upload, the photo record should contain orderId, uploadedByRole, type, and path
**Validates: Requirements 10.3**

Property 41: Photo upload failure state consistency
*For any* failed photo upload, the order status should remain unchanged
**Validates: Requirements 10.4**

### Partner Status Update Properties

Property 42: Pickup status transition
*For any* order with status PICKUP_PENDING, a partner status update to PICKED_UP should succeed
**Validates: Requirements 11.1**

Property 43: At center status transition
*For any* order with status PICKED_UP, a partner status update to AT_CENTER should succeed
**Validates: Requirements 11.2**

Property 44: Out for delivery status transition
*For any* order with status READY_FOR_DELIVERY, a partner status update to OUT_FOR_DELIVERY should succeed
**Validates: Requirements 11.3**

Property 45: Invalid transition rejection
*For any* status update request that violates the state machine rules, the update should be rejected and status should remain unchanged
**Validates: Requirements 11.4**

### Center Operator Properties

Property 46: Center operator authentication
*For any* user with role CENTER_OPERATOR and valid credentials, authentication should succeed and return a JWT with role CENTER_OPERATOR
**Validates: Requirements 12.1**

Property 47: Center order filtering
*For any* center operator requesting orders, only orders with status AT_CENTER, PROCESSING, QC, or READY_FOR_DELIVERY and matching centerId should be returned
**Validates: Requirements 12.2**

Property 48: Center order detail completeness
*For any* center order, the response should include order details, items, and current processing stage
**Validates: Requirements 12.3**

### Center Processing Properties

Property 49: Processing stage transition
*For any* order with status AT_CENTER, a center operator update to PROCESSING should succeed
**Validates: Requirements 13.1**

Property 50: QC stage transition
*For any* order with status PROCESSING, a center operator update to QC should succeed
**Validates: Requirements 13.2**

Property 51: Ready for delivery transition
*For any* order with status QC, a center operator update to READY_FOR_DELIVERY should succeed
**Validates: Requirements 13.3**

Property 52: Center stage update logging
*For any* center operator stage update, an order log entry should be created with actorRole = CENTER_OPERATOR
**Validates: Requirements 13.4**

### Admin Properties

Property 53: Admin authentication
*For any* user with role ADMIN and valid credentials, authentication should succeed and return a JWT with role ADMIN
**Validates: Requirements 14.1**

Property 54: Admin global order access
*For any* admin requesting all orders, orders from all users should be returned regardless of userId
**Validates: Requirements 14.2**

Property 55: Admin order detail completeness
*For any* admin order view, the response should include user information, status, items, and assigned partner
**Validates: Requirements 14.3**

Property 56: Admin order filtering
*For any* admin order query with filters, only orders matching all filter criteria should be returned
**Validates: Requirements 14.4**

### Partner Assignment Properties

Property 57: Partner assignment persistence
*For any* admin partner assignment, the order's partnerId should be updated to the specified partner
**Validates: Requirements 15.1**

Property 58: Partner assignment status transition
*For any* order with status PLACED receiving partner assignment, the status should transition to ASSIGNED_TO_PARTNER
**Validates: Requirements 15.2**

Property 59: Partner assignment logging
*For any* partner assignment, an order log entry should be created with actorRole = ADMIN
**Validates: Requirements 15.3**

Property 60: Invalid partner rejection
*For any* partner assignment with non-existent partnerId, the assignment should be rejected
**Validates: Requirements 15.4**

### Timeslot Management Properties

Property 61: Timeslot creation completeness
*For any* timeslot creation, all fields (centerId, date, startTime, endTime, capacity, remainingCapacity) should be stored
**Validates: Requirements 16.1**

Property 62: Timeslot update persistence
*For any* timeslot update, retrieving the timeslot should reflect all modified fields
**Validates: Requirements 16.2**

Property 63: Timeslot deletion with order protection
*For any* timeslot with associated orders, deletion should be rejected
**Validates: Requirements 16.3**

Property 64: Timeslot retrieval completeness
*For any* timeslot query, all timeslots should be returned with availability information
**Validates: Requirements 16.4**

### Center Management Properties

Property 65: Center creation persistence
*For any* center creation, the name and address should be stored and retrievable
**Validates: Requirements 17.1**

Property 66: Center update persistence
*For any* center update, retrieving the center should reflect all modified fields
**Validates: Requirements 17.2**

Property 67: Center deletion with order protection
*For any* center with active orders, deletion should be rejected
**Validates: Requirements 17.3**

Property 68: Center retrieval completeness
*For any* center query, all centers should be returned with their details
**Validates: Requirements 17.4**

### Service Management Properties

Property 69: Service creation persistence
*For any* service creation, the name and basePriceCents should be stored and retrievable
**Validates: Requirements 18.1**

Property 70: Service update persistence
*For any* service update, retrieving the service should reflect the modified name or price
**Validates: Requirements 18.2**

Property 71: Service deletion with order protection
*For any* service referenced by orders, deletion should be rejected
**Validates: Requirements 18.3**

Property 72: Service retrieval completeness
*For any* service query, all services should be returned with pricing information
**Validates: Requirements 18.4**

### Payout Management Properties

Property 73: Payout creation completeness
*For any* payout creation, partnerId, orderId, amountCents, and status should be stored
**Validates: Requirements 19.1**

Property 74: Payout status update
*For any* payout marked as completed, the status should change to COMPLETED
**Validates: Requirements 19.2**

Property 75: Payout retrieval with relations
*For any* payout query, all payouts should be returned with partner and order information
**Validates: Requirements 19.3**

Property 76: Invalid partner payout rejection
*For any* payout creation with non-existent partnerId, the operation should be rejected
**Validates: Requirements 19.4**

### State Machine Properties

Property 77: State transition validation
*For any* status transition request, only transitions defined in the state machine should be allowed
**Validates: Requirements 20.1**

Property 78: State transition atomicity
*For any* valid status transition, both the order status update and order log creation should succeed together
**Validates: Requirements 20.2**

Property 79: Invalid transition rejection
*For any* status transition not defined in the state machine, the request should be rejected and status should remain unchanged
**Validates: Requirements 20.3**

Property 80: Delivered to completed transition
*For any* order with status DELIVERED, transition to COMPLETED should be allowed
**Validates: Requirements 20.4**

Property 81: Exception state finality
*For any* order in an exception state (CANCELLED, PICKUP_FAILED, DELIVERY_FAILED, REFUND_REQUESTED), standard status transitions should be rejected
**Validates: Requirements 20.5**

## Error Handling

### Authentication Errors
- Invalid credentials: Return 401 with error message
- Missing token: Return 401 with "Authentication required"
- Invalid token: Return 401 with "Invalid token"
- Insufficient permissions: Return 403 with "Access denied"

### Validation Errors
- Missing required fields: Return 400 with field names
- Invalid data format: Return 400 with validation details
- Duplicate email/phone: Return 409 with conflict message
- Invalid state transition: Return 400 with allowed transitions

### Business Logic Errors
- Insufficient wallet balance: Return 400 with current balance
- Timeslot full: Return 400 with alternative slots
- Order not cancellable: Return 400 with current status
- Invalid OTP: Return 400 with retry information

### Database Errors
- Connection failure: Return 503 with retry message
- Query timeout: Return 504 with timeout message
- Constraint violation: Return 409 with conflict details

### File Upload Errors
- File too large: Return 413 with size limit
- Invalid file type: Return 400 with allowed types
- Storage failure: Return 500 with error message

## Testing Strategy

### Unit Testing

Unit tests will verify specific functionality and edge cases:

**Authentication:**
- Successful signup with valid data
- Login with correct credentials
- Login failure with wrong password
- Token validation and expiration

**Order Management:**
- Order creation with valid data
- Price calculation with multiple items
- Cancellation in allowed states
- Cancellation rejection in advanced states

**State Machine:**
- Each valid transition
- Invalid transition rejection
- Exception state handling

**Wallet:**
- Top-up with various amounts
- Deduction on order placement
- Insufficient balance handling

**OTP:**
- Generation and format
- Verification with correct code
- Expiration handling

### Property-Based Testing

Property-based tests will verify universal properties across many random inputs using **fast-check** library for TypeScript:

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with format: `**Feature: ironing-service-mvp, Property {number}: {property_text}**`
- One property-based test per correctness property

**Test Categories:**

1. **Authentication Properties (1-4)**: Password hashing, JWT issuance, credential validation, password hash exclusion
2. **Address Properties (5-8)**: CRUD operations, ownership filtering
3. **Wallet Properties (9-12)**: Balance calculations, top-ups, deductions, insufficient balance
4. **Order Creation Properties (13-17)**: Status initialization, price calculation, item creation, logging, capacity management
5. **Order Tracking Properties (18-21)**: Ownership filtering, detail completeness, logging
6. **Cancellation Properties (22-25)**: Stage validation, refunds, capacity restoration
7. **OTP Properties (26-29)**: Format, verification, expiration
8. **Partner Properties (30-45)**: Authentication, assignments, OTP verification, photo uploads, status updates
9. **Center Properties (46-52)**: Authentication, order filtering, stage transitions, logging
10. **Admin Properties (53-60)**: Authentication, global access, partner assignment
11. **Resource Management Properties (61-76)**: Timeslots, centers, services, payouts
12. **State Machine Properties (77-81)**: Transition validation, atomicity, exception states

**Generator Strategy:**
- User generators: random names, emails, phones, passwords
- Address generators: random addresses with valid formats
- Order generators: random items, quantities, valid timeslots
- Status generators: valid and invalid state transitions
- Amount generators: positive integers for prices and balances

### Integration Testing

Integration tests will verify end-to-end workflows:

**User Journey:**
1. Signup → Login → Add address → Top-up wallet → Create order → Track order → Verify delivery

**Partner Journey:**
1. Login → View assignments → Request pickup OTP → Verify OTP → Upload photo → Update status

**Center Journey:**
1. Login → View orders → Update through processing stages

**Admin Journey:**
1. Login → View all orders → Assign partner → Manage resources

### API Testing

Test all endpoints with:
- Valid requests
- Invalid authentication
- Missing required fields
- Invalid data formats
- Boundary conditions

## Implementation Notes

### Security Considerations
- All passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens expire after 24 hours
- Role-based middleware on all protected routes
- Input validation on all endpoints
- SQL injection prevention via Prisma parameterized queries

### Performance Considerations
- Database indexes on frequently queried fields (userId, orderId, status)
- Pagination for list endpoints (default: 20 items)
- File size limits for uploads (max: 5MB)
- Connection pooling via Prisma

### Scalability Considerations
- Stateless API design for horizontal scaling
- File storage can be migrated to S3/cloud storage
- Database can scale via Neon's serverless architecture
- OTP system can be replaced with SMS gateway

### Development Workflow
1. Set up Neon PostgreSQL connection
2. Initialize Prisma schema
3. Run migrations
4. Seed database with test data
5. Implement backend endpoints
6. Build frontend components
7. Test integration
8. Deploy

### Environment Variables
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
UPLOADS_DIR=./uploads
PORT=3000
NODE_ENV=development
```

### Seed Data
- 1 admin user
- 1 regular user
- 1 delivery partner
- 1 center operator
- 1 center
- 3 services (shirt, pants, dress)
- 10 timeslots for next 5 days
