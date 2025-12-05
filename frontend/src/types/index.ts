export enum Role {
  USER = 'USER',
  DELIVERY_PERSON = 'DELIVERY_PERSON',
  FLOOR_MANAGER = 'FLOOR_MANAGER',
  CENTER_OPERATOR = 'CENTER_OPERATOR',
  ADMIN = 'ADMIN',
}

export enum TripStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}



export enum OrderStatus {
  PLACED = 'PLACED',
  ASSIGNED_FOR_PICKUP = 'ASSIGNED_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  AT_CENTER = 'AT_CENTER',
  PROCESSING = 'PROCESSING',
  QC = 'QC',
  READY_FOR_DELIVERY = 'READY_FOR_DELIVERY',
  ASSIGNED_FOR_DELIVERY = 'ASSIGNED_FOR_DELIVERY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PICKUP_FAILED = 'PICKUP_FAILED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
}

export enum DeliveryType {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
}





export interface Wallet {
  id: string;
  coins: number;
}

export interface Service {
  id: string;
  name: string;
  baseCoins: number;
}

export interface Center {
  id: string;
  name: string;
  address: string;
  coverageKm: number;
  lat: number;
  lng: number;
}

export interface Timeslot {
  id: string;
  centerId: string;
  startTime: string;
  endTime: string;
}

export interface OrderItem {
  id: string;
  serviceId: string;
  name: string;
  quantity: number;
  coins: number;
}

export interface Trip {
  id: string;
  deliveryPersonId: string;
  status: TripStatus;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
}

export interface Address {
  id: string;
  userId: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  centerId?: string;
  timeslotId: string;
  pickupDate: string;
  tripId?: string;
  trip?: Trip;
  status: OrderStatus;
  deliveryType: DeliveryType;
  deliveryChargeCoins: number;
  estimatedDeliveryTime?: string;
  totalCoins: number;
  paymentMethod: string;
  alternatePhone?: string;
  cancellationReason?: string;
  pickupFailureReason?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  address?: Address;
  timeslot?: Timeslot;
  user?: {
    id: string;
    name: string;
    phone: string;
  };
}
