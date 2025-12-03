# Services

This directory contains business logic services for the ironing service application.

## Order State Machine Service

The `orderStateMachine.ts` service manages the order lifecycle and enforces valid state transitions.

### Key Functions

- **`validateTransition(fromStatus, toStatus)`**: Validates if a state transition is allowed
- **`transitionOrderStatus(orderId, toStatus, actorId, actorRole, metadata?)`**: Transitions an order to a new status with atomic logging
- **`getAllowedTransitions(status)`**: Returns array of allowed next statuses
- **`isExceptionState(status)`**: Checks if a status is a terminal exception state

### Valid State Transitions

**Standard Flow:**
```
PLACED → ASSIGNED_TO_PARTNER → PICKUP_PENDING → PICKED_UP → AT_CENTER → 
PROCESSING → QC → READY_FOR_DELIVERY → OUT_FOR_DELIVERY → DELIVERED → COMPLETED
```

**Cancellation:**
- PLACED → CANCELLED
- ASSIGNED_TO_PARTNER → CANCELLED

**Exception Paths:**
- PICKUP_PENDING → PICKUP_FAILED
- OUT_FOR_DELIVERY → DELIVERY_FAILED
- Any status → REFUND_REQUESTED (admin only)

### Exception States

Orders in these states cannot transition to other states:
- CANCELLED
- PICKUP_FAILED
- DELIVERY_FAILED
- REFUND_REQUESTED
- COMPLETED

### Usage Example

```typescript
import { transitionOrderStatus } from './services/orderStateMachine';
import { OrderStatus, Role } from '@prisma/client';

// Transition order from PLACED to ASSIGNED_TO_PARTNER
try {
  const updatedOrder = await transitionOrderStatus(
    orderId,
    OrderStatus.ASSIGNED_TO_PARTNER,
    adminId,
    Role.ADMIN,
    { partnerId: 'partner-123' }
  );
  console.log('Order transitioned successfully:', updatedOrder);
} catch (error) {
  console.error('Transition failed:', error.message);
}
```

### Requirements Satisfied

- **20.1**: Validates transitions against allowed transitions
- **20.2**: Updates order status and creates log entry atomically
- **20.3**: Rejects invalid transitions with error messages
- **20.4**: Allows DELIVERED → COMPLETED transition
- **20.5**: Prevents transitions from exception states
