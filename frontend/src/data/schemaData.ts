export interface SchemaField {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  relation?: string;
}

export interface SchemaTable {
  name: string;
  description: string;
  fields: SchemaField[];
  color: string;
}

export const SCHEMA_DATA: Record<string, SchemaTable> = {
  User: {
    name: 'User',
    description: 'System users across all roles',
    color: 'bg-blue-50 border-blue-200',
    fields: [
      { name: 'id', type: 'String', required: true, unique: true },
      { name: 'name', type: 'String', required: true },
      { name: 'email', type: 'String', unique: true },
      { name: 'phone', type: 'String', required: true, unique: true },
      { name: 'role', type: 'Role', required: true },
      { name: 'referralCode', type: 'String', unique: true },
      { name: 'addresses', type: 'Address[]', relation: 'Address' },
      { name: 'wallet', type: 'Wallet', relation: 'Wallet' },
      { name: 'orders', type: 'Order[]', relation: 'Order' },
    ],
  },
  Order: {
    name: 'Order',
    description: 'Customer orders with items and status',
    color: 'bg-emerald-50 border-emerald-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'userId', type: 'String', required: true, relation: 'User' },
      { name: 'status', type: 'OrderStatus', required: true },
      { name: 'deliveryType', type: 'DeliveryType', required: true },
      { name: 'totalCents', type: 'Int', required: true },
      { name: 'pickupTripId', type: 'String', relation: 'Trip' },
      { name: 'deliveryTripId', type: 'String', relation: 'Trip' },
      { name: 'items', type: 'OrderItem[]', relation: 'OrderItem' },
      { name: 'address', type: 'Address', relation: 'Address' },
      { name: 'timeslot', type: 'Timeslot', relation: 'Timeslot' },
    ],
  },
  Trip: {
    name: 'Trip',
    description: 'Pickup and delivery trips',
    color: 'bg-purple-50 border-purple-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'type', type: 'TripType', required: true },
      { name: 'status', type: 'TripStatus', required: true },
      { name: 'deliveryPersonId', type: 'String', required: true, relation: 'User' },
      { name: 'scheduledDate', type: 'DateTime', required: true },
      { name: 'startTime', type: 'String', required: true },
      { name: 'endTime', type: 'String', required: true },
      { name: 'pickupOrders', type: 'Order[]', relation: 'Order' },
      { name: 'deliveryOrders', type: 'Order[]', relation: 'Order' },
    ],
  },
  Address: {
    name: 'Address',
    description: 'Customer delivery addresses',
    color: 'bg-amber-50 border-amber-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'userId', type: 'String', required: true, relation: 'User' },
      { name: 'label', type: 'String', required: true },
      { name: 'line1', type: 'String', required: true },
      { name: 'city', type: 'String', required: true },
      { name: 'pincode', type: 'String', required: true },
      { name: 'lat', type: 'Float' },
      { name: 'lng', type: 'Float' },
    ],
  },
  Wallet: {
    name: 'Wallet',
    description: 'User wallet for payments',
    color: 'bg-green-50 border-green-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'userId', type: 'String', required: true, unique: true, relation: 'User' },
      { name: 'balanceCents', type: 'Int', required: true },
    ],
  },
  Transaction: {
    name: 'Transaction',
    description: 'Wallet transaction history',
    color: 'bg-cyan-50 border-cyan-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'userId', type: 'String', required: true, relation: 'User' },
      { name: 'type', type: 'String', required: true },
      { name: 'amountCents', type: 'Int', required: true },
      { name: 'description', type: 'String', required: true },
      { name: 'createdAt', type: 'DateTime', required: true },
    ],
  },
  OrderItem: {
    name: 'OrderItem',
    description: 'Items in an order',
    color: 'bg-pink-50 border-pink-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'orderId', type: 'String', required: true, relation: 'Order' },
      { name: 'serviceId', type: 'String', required: true, relation: 'Service' },
      { name: 'name', type: 'String', required: true },
      { name: 'quantity', type: 'Int', required: true },
      { name: 'priceCents', type: 'Int', required: true },
    ],
  },
  Service: {
    name: 'Service',
    description: 'Available laundry services',
    color: 'bg-indigo-50 border-indigo-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'name', type: 'String', required: true },
      { name: 'basePriceCents', type: 'Int', required: true },
    ],
  },
  Timeslot: {
    name: 'Timeslot',
    description: 'Available pickup time slots',
    color: 'bg-orange-50 border-orange-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'centerId', type: 'String', required: true, relation: 'Center' },
      { name: 'date', type: 'DateTime', required: true },
      { name: 'startTime', type: 'String', required: true },
      { name: 'endTime', type: 'String', required: true },
      { name: 'capacity', type: 'Int', required: true },
      { name: 'remainingCapacity', type: 'Int', required: true },
    ],
  },
  Center: {
    name: 'Center',
    description: 'Processing centers',
    color: 'bg-teal-50 border-teal-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'name', type: 'String', required: true },
      { name: 'address', type: 'String', required: true },
      { name: 'timeslots', type: 'Timeslot[]', relation: 'Timeslot' },
    ],
  },
  OTP: {
    name: 'OTP',
    description: 'Order verification OTPs',
    color: 'bg-red-50 border-red-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'orderId', type: 'String', required: true, relation: 'Order' },
      { name: 'codeHash', type: 'String', required: true },
      { name: 'action', type: 'String', required: true },
      { name: 'expiresAt', type: 'DateTime', required: true },
      { name: 'verifiedAt', type: 'DateTime' },
    ],
  },
  Payout: {
    name: 'Payout',
    description: 'Delivery person payouts',
    color: 'bg-lime-50 border-lime-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'deliveryPersonId', type: 'String', required: true, relation: 'User' },
      { name: 'orderId', type: 'String', required: true, relation: 'Order' },
      { name: 'amountCents', type: 'Int', required: true },
      { name: 'status', type: 'PayoutStatus', required: true },
    ],
  },
  AuthOTP: {
    name: 'AuthOTP',
    description: 'Authentication OTPs for phone login',
    color: 'bg-violet-50 border-violet-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'phone', type: 'String', required: true },
      { name: 'codeHash', type: 'String', required: true },
      { name: 'expiresAt', type: 'DateTime', required: true },
      { name: 'verifiedAt', type: 'DateTime' },
      { name: 'userId', type: 'String', relation: 'User' },
      { name: 'createdAt', type: 'DateTime', required: true },
    ],
  },
};

// Page-specific schema mappings
export const PAGE_SCHEMAS: Record<string, string[]> = {
  // Auth pages
  'login': ['User', 'AuthOTP'],
  'signup': ['User', 'Wallet'],
  
  // Customer pages
  'user-dashboard': ['User', 'Order', 'Wallet'],
  'create-order': ['Order', 'OrderItem', 'Service', 'Address', 'Timeslot'],
  'order-detail': ['Order', 'OrderItem', 'OTP', 'Trip'],
  'wallet': ['Wallet', 'Transaction', 'User'],
  'addresses': ['Address', 'User'],
  'referral': ['User'],
  
  // Delivery person pages
  'delivery-dashboard': ['Trip', 'Order', 'User'],
  'delivery-trip': ['Trip', 'Order', 'OTP', 'Address'],
  
  // Floor manager pages
  'manager-dashboard': ['Order', 'Trip', 'User'],
  'manager-orders': ['Order', 'Trip', 'User', 'Address', 'Timeslot'],
  'manager-trips': ['Trip', 'Order', 'User'],
  'manager-trip-detail': ['Trip', 'Order', 'User', 'Address'],
  'manager-partners': ['User'],
  
  // Center operator pages
  'operator-dashboard': ['Order', 'OrderItem', 'User'],
  
  // Admin pages
  'admin-dashboard': ['User', 'Order', 'Trip', 'Service', 'Center'],
  'admin-timeslots': ['Timeslot', 'Center'],
  'admin-services': ['Service', 'OrderItem'],
  'admin-centers': ['Center', 'Timeslot'],
  'admin-payouts': ['Payout', 'User', 'Order'],
};
