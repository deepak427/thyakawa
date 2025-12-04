# 🔐 Test Credentials

All test users have the same password: **`test123`**

## Login Methods

You can login using either:
- **Email + Password**
- **Phone + OTP** (OTP will be displayed in the UI for testing)

---

## 👤 Test Users

### 1. Admin User
- **Email:** `admin@test.com`
- **Phone:** `1111111111`
- **Password:** `test123`
- **Role:** Admin
- **Access:** Full system management, services, centers, timeslots, payouts

### 2. Floor Manager
- **Email:** `manager@test.com`
- **Phone:** `2222222222`
- **Password:** `test123`
- **Role:** Floor Manager
- **Access:** Create trips, assign delivery persons, manage orders

### 3. Center Operator
- **Email:** `operator@test.com`
- **Phone:** `3333333333`
- **Password:** `test123`
- **Role:** Center Operator
- **Access:** Process orders (AT_CENTER → PROCESSING → QC → READY)

### 4. Delivery Person
- **Email:** `delivery@test.com`
- **Phone:** `4444444444`
- **Password:** `test123`
- **Role:** Delivery Person
- **Access:** View assigned trips, pickup/deliver orders with OTP

### 5. Customer
- **Email:** `customer@test.com`
- **Phone:** `5555555555`
- **Password:** `test123`
- **Role:** Customer
- **Access:** Place orders, track status, manage wallet (₹1000 initial balance)
- **Address:** 123 Test Street, Apt 4B, Mumbai 400001

---

## 🗄️ Initial Database State

### Services Available
- Shirt: ₹30
- Trouser: ₹40
- Saree: ₹60
- Bedsheet: ₹50

### Centers
- Mumbai Central (456 Processing Lane, Mumbai)

### Customer Wallet
- Initial Balance: ₹1000

---

## 🚀 Quick Start

1. **Reset Database:**
   ```bash
   cd backend
   npx prisma migrate reset --force
   ```

2. **Start Backend:**
   ```bash
   npm run dev
   ```

3. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Login:**
   - Go to `http://localhost:5173/login`
   - Use any test credentials above
   - For phone login, OTP will be shown in the UI

---

## 📝 Testing Workflow

### Complete Order Flow:

1. **Customer** (`customer@test.com`):
   - Login → Place Order → Select services → Choose timeslot
   - Order status: PLACED

2. **Manager** (`manager@test.com`):
   - Login → Create Pickup Trip → Assign to delivery person
   - Order status: ASSIGNED_FOR_PICKUP

3. **Delivery Person** (`delivery@test.com`):
   - Login → View trip → Start trip → Pickup order (verify OTP)
   - Order status: PICKED_UP

4. **Operator** (`operator@test.com`):
   - Login → Move order: AT_CENTER → PROCESSING → QC → READY
   - Order status: READY_FOR_DELIVERY

5. **Manager** (`manager@test.com`):
   - Create Delivery Trip → Assign to delivery person
   - Order status: ASSIGNED_FOR_DELIVERY

6. **Delivery Person** (`delivery@test.com`):
   - View trip → Start trip → Deliver order (verify OTP)
   - Order status: DELIVERED

---

## 🎯 Role Dashboards

| Role | Dashboard URL |
|------|---------------|
| Admin | `/admin/dashboard` |
| Manager | `/manager/dashboard` |
| Operator | `/operator/dashboard` |
| Delivery | `/delivery/dashboard` |
| Customer | `/user/dashboard` |

---

## 💡 Tips

- **OTP Testing:** OTPs are displayed in the UI (no SMS in dev mode)
- **Wallet:** Customer starts with ₹1000 balance
- **Database Reset:** Run `npx prisma migrate reset --force` to start fresh
- **View Schema:** Click the floating database icon on any page
