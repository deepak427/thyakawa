# 🧺 IronPress - Professional Laundry Service

A modern, full-stack laundry and ironing service management platform with separate pickup and delivery workflows, center operations, and role-based access control.

![Made with React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?logo=postgresql)

## 🎯 Features

- **Customer Portal**: Place orders, track status, manage wallet
- **Delivery Person App**: Handle pickups and deliveries with OTP verification
- **Floor Manager Dashboard**: Create trips, assign delivery persons
- **Center Operator Dashboard**: Process orders through washing, QC stages
- **Admin Panel**: Full system management

## 🚀 Quick Start

**New to the project?** Check out [GETTING_STARTED.md](./GETTING_STARTED.md) for a detailed walkthrough!

### Prerequisites
- Node.js 18+
- PostgreSQL (Neon serverless)
- npm or pnpm

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup backend
cd backend
cp .env.example .env
# Edit .env and add your DATABASE_URL

# 3. Reset database and seed test data
npx prisma migrate reset --force
# Or use: reset-db.bat (Windows) / ./reset-db.sh (Mac/Linux)

# 4. Start backend
npm run dev
```

```bash
# 5. Setup frontend (in new terminal)
cd frontend
npm install
npm run dev
```

### Access the Application
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## 👥 Test Credentials

See [TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md) for complete login details.

**Quick Reference:**
- Admin: `admin@test.com` / `1111111111` / `test123`
- Manager: `manager@test.com` / `2222222222` / `test123`
- Operator: `operator@test.com` / `3333333333` / `test123`
- Delivery: `delivery@test.com` / `4444444444` / `test123`
- Customer: `customer@test.com` / `5555555555` / `test123`

## 📋 Order Workflow

### 1. Customer Places Order
- Select services and quantities
- Choose pickup time slot
- Select delivery type (Standard/Premium)
- Pay via wallet

### 2. Pickup Trip (Floor Manager → Delivery Person)
- Manager creates PICKUP trip
- Groups orders by time slot
- Assigns delivery person
- Delivery person collects with OTP verification
- Marks orders at center

### 3. Center Processing (Center Operator)
- AT_CENTER → PROCESSING → QC → READY_FOR_DELIVERY
- One-click status updates
- Quality control checks

### 4. Delivery Trip (Floor Manager → Delivery Person)
- Manager creates DELIVERY trip
- Assigns delivery person (can be different)
- Delivery person delivers to customer
- Trip auto-completes when all delivered

## 🏗️ Tech Stack

### Backend
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL (Neon)
- JWT Authentication
- OTP Verification

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- React Router
- Axios

## 📁 Project Structure

```
├── backend/
│   ├── prisma/          # Database schema & migrations
│   ├── src/
│   │   ├── controllers/ # Business logic
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Shared services
│   │   └── middleware/  # Auth, validation
│   └── uploads/         # File storage
├── frontend/
│   ├── src/
│   │   ├── pages/       # Route components
│   │   ├── components/  # Reusable UI
│   │   ├── context/     # State management
│   │   └── services/    # API calls
│   └── public/
└── README.md
```

## 🔐 Roles & Permissions

### Customer
- Place orders
- Track order status
- Manage addresses
- Wallet management
- Referral system

### Delivery Person
- View assigned trips
- Pickup with OTP verification
- Mark orders at center
- Deliver orders
- Report failures

### Floor Manager
- Create pickup trips
- Create delivery trips
- Manage delivery persons
- View all orders
- Filter by time slots

### Center Operator
- Process orders at center
- Move through stages
- Quality control
- Mark ready for delivery

### Admin
- Full system access
- User management
- Service management
- Timeslot management
- Payout management

## 🔄 Order Status Flow

```
PLACED
  ↓ (Manager creates pickup trip)
ASSIGNED_FOR_PICKUP
  ↓ (Delivery person picks up with OTP)
PICKED_UP
  ↓ (Delivery person at center)
AT_CENTER
  ↓ (Operator processes)
PROCESSING
  ↓ (Operator QC)
QC
  ↓ (Operator marks ready)
READY_FOR_DELIVERY
  ↓ (Manager creates delivery trip)
ASSIGNED_FOR_DELIVERY
  ↓ (Delivery person out for delivery)
OUT_FOR_DELIVERY
  ↓ (Delivery person delivers)
DELIVERED
  ↓ (System completes)
COMPLETED
```

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev        # Start with hot reload
npm run build      # Build for production
npx prisma studio  # Open database GUI
```

### Frontend Development
```bash
cd frontend
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Database Management
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Seed test data
npx tsx prisma/seed-test.ts

# View database
npx prisma studio
```

## 🚀 Deployment

Deploy to Vercel in 10 minutes:
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
- **Quick Start:** [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) - 10-minute guide
- **Full Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete documentation
- **Troubleshooting:** [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) - Fix common issues

## 📚 Documentation

- [Getting Started](./GETTING_STARTED.md) - Complete setup guide
- [Test Credentials](./TEST_CREDENTIALS.md) - All test user logins and workflow guide
- [Deployment Guide](./DEPLOYMENT.md) - Deploy to Vercel
- Database Schema - Click the floating DB icon on any page in the app

## 🐛 Troubleshooting

### Database Connection Issues
- Check DATABASE_URL in .env
- Verify Neon project is active
- Check network connectivity

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 5173
npx kill-port 5173
```

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

---

**Built with ❤️ for efficient laundry service management**
