# Frontend Application

React + TypeScript + TailwindCSS frontend for the Ironing Service Management System.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Backend API running on http://localhost:3000

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Access
- Development: http://localhost:5173
- Production build: `npm run build && npm run preview`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/              # Route components
│   │   ├── LoginPage.tsx
│   │   ├── UserDashboard.tsx
│   │   ├── DeliveryPersonDashboard.tsx
│   │   ├── FloorManagerOrdersPage.tsx
│   │   ├── CenterOperatorDashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── components/         # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ProtectedRoute.tsx
│   ├── context/            # React Context
│   │   ├── AuthContext.tsx
│   │   └── ToastContext.tsx
│   ├── services/           # API calls
│   │   └── api.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── index.html
├── tailwind.config.js      # TailwindCSS config
├── vite.config.ts          # Vite config
└── tsconfig.json           # TypeScript config
```

## 🎨 Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: React Context

## 🔐 Authentication

### Login Flow
1. User enters phone/email and password
2. Or requests OTP for phone login
3. JWT token stored in localStorage
4. Token sent in Authorization header
5. Auto-redirect based on role

### Protected Routes
```tsx
<ProtectedRoute allowedRoles={[Role.ADMIN]}>
  <AdminDashboard />
</ProtectedRoute>
```

## 📱 Pages by Role

### Customer (USER)
- `/user/dashboard` - Order history
- `/user/orders/new` - Create order
- `/user/orders/:id` - Order details
- `/user/wallet` - Wallet management
- `/user/addresses` - Address management
- `/user/referral` - Referral program

### Delivery Person
- `/delivery/dashboard` - Assigned trips
- `/delivery/trips/:id` - Trip details with actions

### Floor Manager
- `/manager/dashboard` - Overview
- `/manager/orders` - Order management & trip creation
- `/manager/trips` - Trip management
- `/manager/trips/:id` - Trip details
- `/manager/delivery-partners` - Delivery person management

### Center Operator
- `/operator/dashboard` - Process orders through stages

### Admin
- `/admin/dashboard` - System overview
- `/admin/timeslots` - Timeslot management
- `/admin/services` - Service management
- `/admin/centers` - Center management
- `/admin/payouts` - Payout management

## 🎨 UI Components

### Layout
Consistent header, navigation, and footer across all pages.

```tsx
<Layout>
  <YourContent />
</Layout>
```

### Loading Spinner
```tsx
<LoadingSpinner />
```

### Toast Notifications
```tsx
const { showToast } = useToast();
showToast('Success message', 'success');
showToast('Error message', 'error');
```

## 🔧 Configuration

### API Base URL
Edit `src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

### Tailwind Theme
Edit `tailwind.config.js` for custom colors, fonts, etc.

## 🎯 Key Features

### Order Creation
- Service selection with quantities
- Time slot picker
- Delivery type (Standard/Premium)
- Address selection
- Wallet payment

### Trip Management
- Filter orders by status
- Filter by time slot
- Multi-select orders
- Create pickup/delivery trips
- Auto-detect trip type

### Center Operations
- Stage-based processing
- One-click status updates
- Order details view
- Stats dashboard

### OTP Verification
- Request OTP for pickup
- 6-digit code entry
- Verification with feedback

## 🎨 Styling

### TailwindCSS Classes
```tsx
// Buttons
className="btn-primary"
className="btn-secondary"

// Cards
className="card"
className="card-hover"

// Inputs
className="input-field"

// Status badges
className="badge-success"
className="badge-warning"
```

### Custom Colors
```css
--primary-600: #2563eb
--secondary-900: #0f172a
--accent-600: #10b981
```

## 📊 State Management

### Auth Context
```tsx
const { user, login, logout, isAuthenticated } = useAuth();
```

### Toast Context
```tsx
const { showToast } = useToast();
```

## 🔄 API Integration

### Example API Call
```typescript
import api from '../services/api';

const fetchOrders = async () => {
  const response = await api.get('/orders/user');
  setOrders(response.data);
};
```

### Error Handling
```typescript
try {
  await api.post('/orders', orderData);
  showToast('Order created!', 'success');
} catch (err: any) {
  showToast(err.response?.data?.error || 'Failed', 'error');
}
```

## 🧪 Development

### Hot Reload
Vite provides instant HMR (Hot Module Replacement).

### TypeScript
Strict mode enabled for type safety.

### Linting
```bash
npm run lint
```

## 🏗️ Build

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm run preview
```

### Output
Build files in `dist/` directory.

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly UI
- Optimized for all screen sizes

## 🎨 Design System

### Colors
- Primary: Blue (#2563eb)
- Secondary: Slate (#0f172a)
- Accent: Emerald (#10b981)
- Success: Green
- Warning: Yellow
- Error: Red

### Typography
- Font: Inter (system fallback)
- Sizes: text-sm, text-base, text-lg, text-xl, etc.

### Spacing
- Consistent spacing scale (4px base)
- Padding: p-4, p-6, p-8
- Margin: m-4, m-6, m-8

## 🔒 Security

- JWT token in localStorage
- Auto-logout on token expiry
- Role-based route protection
- XSS prevention (React default)
- CSRF protection (SameSite cookies)

## 📈 Performance

- Code splitting by route
- Lazy loading components
- Optimized images
- Minimal bundle size
- Fast initial load

## 🐛 Debugging

### React DevTools
Install React DevTools browser extension.

### Network Tab
Monitor API calls in browser DevTools.

### Console Logs
Check browser console for errors.

---

For backend API documentation, see [../backend/README.md](../backend/README.md)
