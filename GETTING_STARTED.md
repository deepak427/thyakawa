# 🚀 Getting Started with IronPress

Welcome! This guide will help you set up and run the IronPress laundry service platform.

## ⚡ Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your Neon PostgreSQL connection string:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
```

### 3. Setup Database
```bash
# Reset database and seed test users
npx prisma migrate reset --force
```

Or use the helper scripts:
- **Windows:** Double-click `reset-db.bat`
- **Mac/Linux:** Run `./reset-db.sh`

### 4. Start Backend
```bash
npm run dev
```
Backend runs on: http://localhost:3000

### 5. Start Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:5173

---

## 🎯 First Login

1. Go to http://localhost:5173/login
2. Use any test account (see below)
3. Explore the dashboard!

### Test Accounts

| Role | Email | Phone | Password |
|------|-------|-------|----------|
| Customer | customer@test.com | 5555555555 | test123 |
| Delivery | delivery@test.com | 4444444444 | test123 |
| Operator | operator@test.com | 3333333333 | test123 |
| Manager | manager@test.com | 2222222222 | test123 |
| Admin | admin@test.com | 1111111111 | test123 |

---

## 📱 Try the Complete Workflow

### Step 1: Place an Order (Customer)
1. Login as **customer@test.com**
2. Click "Create New Order"
3. Select services (Shirt, Trouser, etc.)
4. Choose pickup timeslot
5. Place order (₹1000 wallet balance available)

### Step 2: Create Pickup Trip (Manager)
1. Login as **manager@test.com**
2. Go to "Orders" tab
3. Click "Create Pickup Trip"
4. Select orders and assign delivery person
5. Create trip

### Step 3: Pickup Order (Delivery Person)
1. Login as **delivery@test.com**
2. View assigned trip
3. Click "Start Trip"
4. Click "Pickup" on order
5. Enter OTP (shown in UI)
6. Mark as picked up

### Step 4: Process at Center (Operator)
1. Login as **operator@test.com**
2. See order in "At Center" stage
3. Click "Start Processing"
4. Click "Move to QC"
5. Click "Mark Ready for Delivery"

### Step 5: Create Delivery Trip (Manager)
1. Login as **manager@test.com**
2. Go to "Orders" tab
3. Click "Create Delivery Trip"
4. Select ready orders
5. Assign delivery person

### Step 6: Deliver Order (Delivery Person)
1. Login as **delivery@test.com**
2. View delivery trip
3. Click "Start Trip"
4. Click "Deliver" on order
5. Enter OTP
6. Complete delivery

---

## 🔧 Useful Commands

### Database
```bash
# Reset database (clean slate)
npx prisma migrate reset --force

# View database in browser
npx prisma studio

# Create new migration
npx prisma migrate dev --name your_migration_name
```

### Development
```bash
# Backend (hot reload)
cd backend && npm run dev

# Frontend (hot reload)
cd frontend && npm run dev

# Build for production
npm run build
```

### Troubleshooting
```bash
# Kill port 3000 (backend)
npx kill-port 3000

# Kill port 5173 (frontend)
npx kill-port 5173

# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 🎨 Features to Explore

### Customer Features
- ✅ Place orders with multiple items
- ✅ Track order status in real-time
- ✅ Manage multiple delivery addresses
- ✅ Wallet system for payments
- ✅ Referral code system

### Delivery Person Features
- ✅ View assigned trips
- ✅ OTP verification for pickup/delivery
- ✅ Mark orders at center
- ✅ Report delivery failures

### Manager Features
- ✅ Create pickup trips
- ✅ Create delivery trips
- ✅ Assign delivery persons
- ✅ Filter orders by status/timeslot
- ✅ View all orders

### Operator Features
- ✅ Process orders through stages
- ✅ Quality control checks
- ✅ Filter by processing stage
- ✅ One-click status updates

### Admin Features
- ✅ Manage services and pricing
- ✅ Create centers and timeslots
- ✅ View all users
- ✅ Manage payouts

---

## 🗄️ Database Schema Viewer

Click the **floating database icon** (bottom-right) on any page to:
- View relevant tables for that page
- See field types and relationships
- Hover over relations to explore nested tables
- Understand the data structure

---

## 📚 More Information

- **Full Documentation:** [README.md](./README.md)
- **Test Credentials:** [TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md)
- **Tech Stack:** React, TypeScript, Node.js, PostgreSQL, Prisma

---

## 💡 Tips

- **OTP Testing:** OTPs are displayed in the UI (no SMS in dev mode)
- **Wallet Balance:** Customer starts with ₹1000
- **Database Reset:** Use `reset-db.bat` (Windows) or `reset-db.sh` (Mac/Linux)
- **Schema Viewer:** Available on every page via floating button

---

## 🆘 Need Help?

1. Check [TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md) for login details
2. Check [README.md](./README.md) for detailed documentation
3. Run `npx prisma studio` to inspect database
4. Check browser console for errors

---

**Happy coding! 🎉**
