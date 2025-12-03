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

export enum TripType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
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

export interface OrderLog {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  actorRole: Role;
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  city: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

export interface Wallet {
  id: string;
  balanceCents: number;
}

export interface Service {
  id: string;
  name: string;
  basePriceCents: number;
}

export interface Timeslot {
  id: string;
  centerId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remainingCapacity: number;
}

export interface OrderItem {
  id: string;
  serviceId: string;
  name: string;
  quantity: number;
  priceCents: number;
}

export interface Trip {
  id: string;
  deliveryPersonId: string;
  type: TripType;
  status: TripStatus;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  pickupOrders?: Order[];
  deliveryOrders?: Order[];
}

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  centerId?: string;
  timeslotId: string;
  pickupTripId?: string;
  deliveryTripId?: string;
  pickupTrip?: Trip;
  deliveryTrip?: Trip;
  status: OrderStatus;
  deliveryType: DeliveryType;
  deliveryChargeCents: number;
  estimatedDeliveryTime?: string;
  totalCents: number;
  paymentMethod: string;
  cancellationReason?: string;
  pickupFailureReason?: string;
  pickupTimeSlot?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  logs?: OrderLog[];
  address?: Address;
  timeslot?: Timeslot;
  user?: {
    id: string;
    name: string;
    phone: string;
  };
}
