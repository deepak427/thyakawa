import { OrderStatus, Role } from '@prisma/client';
import prisma from '../db';

// Define valid state transitions based on the design document
const STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: [OrderStatus.ASSIGNED_FOR_PICKUP, OrderStatus.CANCELLED],
  ASSIGNED_FOR_PICKUP: [OrderStatus.PICKED_UP, OrderStatus.PICKUP_FAILED, OrderStatus.CANCELLED],
  PICKED_UP: [OrderStatus.AT_CENTER],
  AT_CENTER: [OrderStatus.PROCESSING],
  PROCESSING: [OrderStatus.QC],
  QC: [OrderStatus.READY_FOR_DELIVERY],
  READY_FOR_DELIVERY: [OrderStatus.ASSIGNED_FOR_DELIVERY],
  ASSIGNED_FOR_DELIVERY: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERY_FAILED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.DELIVERY_FAILED],
  DELIVERED: [OrderStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
  PICKUP_FAILED: [],
  DELIVERY_FAILED: [],
  REFUND_REQUESTED: [],
};

// Exception states that prevent further standard transitions
const EXCEPTION_STATES: OrderStatus[] = [
  OrderStatus.CANCELLED,
  OrderStatus.PICKUP_FAILED,
  OrderStatus.DELIVERY_FAILED,
  OrderStatus.REFUND_REQUESTED,
];

/**
 * Validates if a state transition is allowed
 * @param fromStatus Current order status
 * @param toStatus Desired order status
 * @returns true if transition is valid, false otherwise
 */
export function validateTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): boolean {
  const allowedTransitions = STATE_TRANSITIONS[fromStatus];
  return allowedTransitions.includes(toStatus);
}

/**
 * Transitions an order to a new status with logging
 * @param orderId Order ID to transition
 * @param toStatus New status
 * @param actorId ID of the user performing the transition
 * @param actorRole Role of the user performing the transition
 * @param metadata Optional metadata to store with the log
 * @returns Updated order or null if transition failed
 */
export async function transitionOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  actorId: string,
  actorRole: Role,
  metadata?: Record<string, any>
): Promise<any> {
  // Get current order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const fromStatus = order.status;

  // Check if order is in an exception state
  if (EXCEPTION_STATES.includes(fromStatus) && fromStatus !== toStatus) {
    throw new Error(
      `Cannot transition from exception state ${fromStatus}. Order is in a terminal state.`
    );
  }

  // Validate transition
  if (!validateTransition(fromStatus, toStatus)) {
    const allowedTransitions = STATE_TRANSITIONS[fromStatus];
    throw new Error(
      `Invalid transition from ${fromStatus} to ${toStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`
    );
  }

  // Update order status and create log entry (no transaction for serverless DB)
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: toStatus },
  });

  // Create order log entry
  await prisma.orderLog.create({
    data: {
      orderId,
      fromStatus,
      toStatus,
      actorId,
      actorRole,
      metadata: metadata || {},
    },
  });

  return updatedOrder;
}

/**
 * Gets allowed transitions for a given status
 * @param status Current order status
 * @returns Array of allowed next statuses
 */
export function getAllowedTransitions(status: OrderStatus): OrderStatus[] {
  return STATE_TRANSITIONS[status] || [];
}

/**
 * Checks if a status is an exception state
 * @param status Order status to check
 * @returns true if status is an exception state
 */
export function isExceptionState(status: OrderStatus): boolean {
  return EXCEPTION_STATES.includes(status);
}
