# Backend API Documentation

Express + TypeScript + Prisma backend for the Ironing Service Management System.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (Neon serverless recommended)

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run migrations
npx prisma migrate dev

# Seed test data
npx tsx prisma/seed-test.ts

# Start development server
npm run dev
```

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/signup          # Register new user
POST   /api/auth/login           # Login with email/password
POST   /api/auth/request-otp     # Request OTP for phone login
POST   /api/auth/verify-otp      # Verify OTP and login
GET    /api/auth/me              # Get current user
```

### Orders
```
POST   /api/orders               # Create new order
GET    /api/orders/user          # Get user's orders
GET    /api/orders/:id           # Get order details
PUT    /api/orders/:id           # Update order
POST   /api/orders/:id/cancel    # Cancel order
POST   /api/orders/:id/status    # Update order status
```

### Trips (Admin/Manager)
```
POST   /api/admin/trips          # Create trip
GET    /api/admin/trips          # Get all trips
GET    /api/admin/trips/:id      # Get trip details
PUT    /api/admin/trips/:id      # Update trip
DELETE /api/admin/trips/:id      # Delete trip
POST   /api/admin/trips/:id/assign-orders  # Assign orders to trip
```

### Delivery Person
```
GET    /api/partner/assignments  # Get assigned trips
POST   /api/partner/order/:id/pickup  # Request pickup OTP
POST   /api/partner/order/:id/verify-pickup  # Verify pickup OTP
POST   /api/partner/order/:id/delivery  # Mark out for delivery
POST   /api/partner/order/:id/pickup-failure  # Report pickup failure
```

### Admin
```
GET    /api/admin/users          # Get users by role
GET    /api/admin/orders         # Get all orders
POST   /api/admin/timeslots      # Create timeslot
GET    /api/admin/timeslots      # Get timeslots
POST   /api/admin/services       # Create service
GET    /api/admin/services       # Get services
```

## 🔐 Authentication

All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## 🗄️ Database

### Technology
- **ORM**: Prisma
- **Database**: PostgreSQL (Neon serverless)
- **Migrations**: Prisma Migrate

### Commands
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Seed database
npx tsx prisma/seed-test.ts
```

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed-test.ts            # Test data seeder
│   └── migrations/             # Migration files
├── src/
│   ├── controllers/            # Request handlers
│   │   ├── admin.ts
│   │   ├── order.ts
│   │   ├── partner.ts
│   │   └── trip.ts
│   ├── routes/                 # Route definitions
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   ├── order.ts
│   │   └── partner.ts
│   ├── services/               # Business logic
│   │   ├── otp.ts
│   │   └── orderStateMachine.ts
│   ├── middleware/             # Express middleware
│   │   └── auth.ts
│   ├── db.ts                   # Prisma client
│   └── index.ts                # App entry point
├── uploads/                    # File uploads
├── .env                        # Environment variables
└── tsconfig.json              # TypeScript config
```

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="your-secret-key"

# Server
PORT=3000
NODE_ENV=development

# File Upload
UPLOAD_DIR=./uploads
```

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Test with curl
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

## 📊 Database Schema

See [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md) for detailed schema documentation.

## 🚨 Error Handling

All errors return JSON:
```json
{
  "error": "Error message"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## 🔄 State Machine

Orders follow a strict state machine for status transitions. See `src/services/orderStateMachine.ts` for valid transitions.

## 📝 Logging

Structured logging with context:
```typescript
console.log('[INFO]', 'Message', { context });
console.error('[ERROR]', 'Error', { error });
```

## 🛠️ Development

### Hot Reload
```bash
npm run dev  # Uses tsx watch
```

### Build
```bash
npm run build  # Compiles TypeScript
```

### Production
```bash
npm start  # Runs compiled JS
```

## 🔒 Security

- JWT authentication
- Password hashing with bcrypt
- OTP verification for pickups
- Role-based access control
- Input validation
- SQL injection prevention (Prisma)

## 📈 Performance

- Connection pooling (Neon)
- No database transactions (serverless compatible)
- Efficient queries with Prisma
- Indexed database fields

---

For database schema details, see [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
