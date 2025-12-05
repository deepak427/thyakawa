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
      { name: 'passwordHash', type: 'String' },
      { name: 'role', type: 'Role', required: true },
      { name: 'referralCode', type: 'String', unique: true },
      { name: 'referredBy', type: 'String' },
      { name: 'otpCodeHash', type: 'String' },
      { name: 'otpExpiresAt', type: 'DateTime' },
      { name: 'createdAt', type: 'DateTime', required: true },
    ],
  },
  Address: {
    name: 'Address',
    description: 'User saved addresses (address string, lat, lng)',
    color: 'bg-amber-50 border-amber-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'userId', type: 'String', required: true },
      { name: 'address', type: 'String', required: true },
      { name: 'lat', type: 'Float' },
      { name: 'lng', type: 'Float' },
    ],
  },
  Order: {
    name: 'Order',
    description: 'Customer orders with items and status',
    color: 'bg-emerald-50 border-emerald-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'userId', type: 'String', required: true },
      { name: 'addressId', type: 'String', required: true },
      { name: 'centerId', type: 'String' },
      { name: 'timeslotId', type: 'String', required: true },
      { name: 'pickupDate', type: 'DateTime', required: true },
      { name: 'tripId', type: 'String' },
      { name: 'status', type: 'OrderStatus', required: true },
      { name: 'deliveryType', type: 'DeliveryType', required: true },
      { name: 'deliveryChargeCoins', type: 'Int', required: true },
      { name: 'estimatedDeliveryTime', type: 'DateTime' },
      { name: 'totalCoins', type: 'Int', required: true },
      { name: 'paymentMethod', type: 'String', required: true },
      { name: 'alternatePhone', type: 'String' },
      { name: 'cancellationReason', type: 'String' },
      { name: 'pickupFailureReason', type: 'String' },
      { name: 'pickupOtpHash', type: 'String' },
      { name: 'pickupOtpExpiresAt', type: 'DateTime' },
      { name: 'deliveryOtpHash', type: 'String' },
      { name: 'deliveryOtpExpiresAt', type: 'DateTime' },
      { name: 'createdAt', type: 'DateTime', required: true },
      { name: 'updatedAt', type: 'DateTime', required: true },
    ],
  },
  Trip: {
    name: 'Trip',
    description: 'Unified trips with mixed pickup and delivery orders',
    color: 'bg-purple-50 border-purple-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'deliveryPersonId', type: 'String', required: true },
      { name: 'status', type: 'TripStatus', required: true },
      { name: 'scheduledDate', type: 'DateTime', required: true },
      { name: 'startTime', type: 'String', required: true },
      { name: 'endTime', type: 'String', required: true },
      { name: 'createdAt', type: 'DateTime', required: true },
      { name: 'updatedAt', type: 'DateTime', required: true },
    ],
  },

  Wallet: {
    name: 'Wallet',
    description: 'User wallet with coins balance',
    color: 'bg-green-50 border-green-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'userId', type: 'String', required: true, unique: true },
      { name: 'coins', type: 'Int', required: true },
    ],
  },
  Transaction: {
    name: 'Transaction',
    description: 'Wallet transaction history in coins',
    color: 'bg-cyan-50 border-cyan-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'userId', type: 'String', required: true },
      { name: 'type', type: 'String', required: true },
      { name: 'coins', type: 'Int', required: true },
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
      { name: 'orderId', type: 'String', required: true },
      { name: 'serviceId', type: 'String', required: true },
      { name: 'name', type: 'String', required: true },
      { name: 'quantity', type: 'Int', required: true },
      { name: 'coins', type: 'Int', required: true },
    ],
  },
  Service: {
    name: 'Service',
    description: 'Available laundry services',
    color: 'bg-indigo-50 border-indigo-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'name', type: 'String', required: true },
      { name: 'baseCoins', type: 'Int', required: true },
    ],
  },
  Timeslot: {
    name: 'Timeslot',
    description: 'Fixed time slots for each center (e.g., 10-11, 14-15, 17-18)',
    color: 'bg-orange-50 border-orange-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'centerId', type: 'String', required: true },
      { name: 'startTime', type: 'String', required: true },
      { name: 'endTime', type: 'String', required: true },
    ],
  },
  Center: {
    name: 'Center',
    description: 'Processing centers with coverage area',
    color: 'bg-teal-50 border-teal-200',
    fields: [
      { name: 'id', type: 'String', required: true },
      { name: 'name', type: 'String', required: true },
      { name: 'address', type: 'String', required: true },
      { name: 'coverageKm', type: 'Float', required: true },
      { name: 'lat', type: 'Float', required: true },
      { name: 'lng', type: 'Float', required: true },
    ],
  },


};

// Page-specific schema mappings
export const PAGE_SCHEMAS: Record<string, string[]> = {
  // Auth pages
  'login': ['User'],
  'signup': ['User', 'Wallet'],
  
  // Customer pages
  'user-dashboard': ['User', 'Order', 'Wallet'],
  'create-order': ['Order', 'OrderItem', 'Service', 'Address', 'Timeslot'],
  'order-detail': ['Order', 'OrderItem', 'Trip'],
  'wallet': ['Wallet', 'Transaction', 'User'],
  'addresses': ['Address', 'User'],
  'referral': ['User'],
  
  // Delivery person pages
  'delivery-dashboard': ['Trip', 'Order', 'User'],
  'delivery-trip': ['Trip', 'Order', 'Address'],
  
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
};
