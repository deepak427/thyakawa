# Requirements Document

## Introduction

This document specifies the requirements for an ironing service web application MVP. The system enables users to place ironing orders, delivery partners to pick up and deliver items, center operators to process orders, and administrators to manage the entire operation. The application uses a Node.js/Express backend with Neon PostgreSQL and a React frontend with TypeScript and Tailwind CSS.

## Glossary

- **System**: The ironing service web application
- **User**: A customer who places ironing orders
- **Partner**: A delivery partner who picks up and delivers items
- **Center Operator**: An employee who processes items at the ironing center
- **Admin**: An administrator who manages the system
- **Order**: A request for ironing services
- **Timeslot**: A scheduled time window for pickup or delivery
- **Wallet**: A digital balance for storing prepaid funds
- **OTP**: One-time password for verification
- **Order State Machine**: The workflow defining valid order status transitions

## Requirements

### Requirement 1

**User Story:** As a user, I want to register and authenticate, so that I can access the ironing service.

#### Acceptance Criteria

1. WHEN a user provides name, email, phone, and password THEN the System SHALL create a new user account with hashed password
2. WHEN a user provides valid credentials THEN the System SHALL authenticate the user and issue a JWT token
3. WHEN a user provides invalid credentials THEN the System SHALL reject authentication and return an error message
4. WHEN an authenticated user requests their profile THEN the System SHALL return the user's information excluding the password hash

### Requirement 2

**User Story:** As a user, I want to manage delivery addresses, so that I can specify where items should be picked up and delivered.

#### Acceptance Criteria

1. WHEN a user creates an address THEN the System SHALL store the label, line1, city, pincode, latitude, and longitude
2. WHEN a user requests their addresses THEN the System SHALL return all addresses associated with that user
3. WHEN a user updates an address THEN the System SHALL modify the specified address fields
4. WHEN a user deletes an address THEN the System SHALL remove the address from the system

### Requirement 3

**User Story:** As a user, I want to manage my wallet balance, so that I can pay for ironing services.

#### Acceptance Criteria

1. WHEN a user tops up their wallet THEN the System SHALL increase the wallet balance by the specified amount in cents
2. WHEN a user requests wallet information THEN the System SHALL return the current balance in cents
3. WHEN an order is placed THEN the System SHALL deduct the order total from the user's wallet balance
4. WHEN wallet balance is insufficient THEN the System SHALL prevent order placement and return an error

### Requirement 4

**User Story:** As a user, I want to place an ironing order, so that I can get my items cleaned.

#### Acceptance Criteria

1. WHEN a user selects items, quantities, address, and timeslot THEN the System SHALL create an order with status PLACED
2. WHEN an order is created THEN the System SHALL calculate the total price based on service pricing and quantities
3. WHEN an order is created THEN the System SHALL create order items for each selected service
4. WHEN an order is created THEN the System SHALL log the state transition in the order log
5. WHEN a timeslot is selected THEN the System SHALL decrease the remaining capacity by one

### Requirement 5

**User Story:** As a user, I want to track my order status, so that I know where my items are in the process.

#### Acceptance Criteria

1. WHEN a user requests their orders THEN the System SHALL return all orders associated with that user
2. WHEN a user requests a specific order THEN the System SHALL return order details including status, items, and timeline
3. WHEN an order status changes THEN the System SHALL create an order log entry with timestamp and actor information
4. WHEN a user views order details THEN the System SHALL display the complete status history

### Requirement 6

**User Story:** As a user, I want to cancel my order, so that I can stop service if my plans change.

#### Acceptance Criteria

1. WHEN a user cancels an order with status PLACED or ASSIGNED_TO_PARTNER THEN the System SHALL change status to CANCELLED
2. WHEN an order is cancelled THEN the System SHALL refund the order total to the user's wallet
3. WHEN a user attempts to cancel an order with status beyond ASSIGNED_TO_PARTNER THEN the System SHALL reject the cancellation
4. WHEN an order is cancelled THEN the System SHALL restore the timeslot capacity

### Requirement 7

**User Story:** As a user, I want to verify delivery with an OTP, so that I can confirm receipt of my items.

#### Acceptance Criteria

1. WHEN a delivery is ready for verification THEN the System SHALL generate a 6-digit OTP and log it to console
2. WHEN a user provides the correct OTP THEN the System SHALL mark the OTP as verified and update order status to DELIVERED
3. WHEN a user provides an incorrect OTP THEN the System SHALL reject verification and return an error
4. WHEN an OTP expires THEN the System SHALL reject verification attempts with that OTP

### Requirement 8

**User Story:** As a partner, I want to view my assigned orders, so that I know which pickups and deliveries to handle.

#### Acceptance Criteria

1. WHEN a partner logs in THEN the System SHALL authenticate using partner credentials
2. WHEN a partner requests assignments THEN the System SHALL return orders assigned to that partner
3. WHEN orders are assigned to a partner THEN the System SHALL filter by partner ID and active statuses
4. WHEN a partner views assignments THEN the System SHALL display order details, addresses, and current status

### Requirement 9

**User Story:** As a partner, I want to request and verify pickup OTPs, so that I can confirm item collection from users.

#### Acceptance Criteria

1. WHEN a partner requests a pickup OTP THEN the System SHALL generate a 6-digit OTP and log it to console
2. WHEN a partner provides the correct pickup OTP THEN the System SHALL update order status to PICKED_UP
3. WHEN a partner provides an incorrect pickup OTP THEN the System SHALL reject verification
4. WHEN pickup is verified THEN the System SHALL create an order log entry with partner information

### Requirement 10

**User Story:** As a partner, I want to upload photos during pickup and delivery, so that I can document the condition of items.

#### Acceptance Criteria

1. WHEN a partner uploads a pickup photo THEN the System SHALL store the photo file in the uploads directory
2. WHEN a partner uploads a delivery photo THEN the System SHALL store the photo file in the uploads directory
3. WHEN a photo is uploaded THEN the System SHALL create a photo record with order ID, uploader role, type, and file path
4. WHEN a photo upload fails THEN the System SHALL return an error and maintain current order state

### Requirement 11

**User Story:** As a partner, I want to update order status during the delivery process, so that the system reflects current progress.

#### Acceptance Criteria

1. WHEN a partner marks an order as picked up THEN the System SHALL transition status from PICKUP_PENDING to PICKED_UP
2. WHEN a partner marks an order as at center THEN the System SHALL transition status from PICKED_UP to AT_CENTER
3. WHEN a partner marks an order as out for delivery THEN the System SHALL transition status from READY_FOR_DELIVERY to OUT_FOR_DELIVERY
4. WHEN a partner attempts an invalid status transition THEN the System SHALL reject the update and return an error

### Requirement 12

**User Story:** As a center operator, I want to view orders at my center, so that I can process them efficiently.

#### Acceptance Criteria

1. WHEN a center operator logs in THEN the System SHALL authenticate using center operator credentials
2. WHEN a center operator requests orders THEN the System SHALL return orders with status AT_CENTER, PROCESSING, QC, or READY_FOR_DELIVERY for their center
3. WHEN orders are displayed THEN the System SHALL show order details, items, and current processing stage
4. WHEN no orders are at the center THEN the System SHALL return an empty list

### Requirement 13

**User Story:** As a center operator, I want to update processing stages, so that I can track work progress through the center.

#### Acceptance Criteria

1. WHEN a center operator marks an order as processing THEN the System SHALL transition status from AT_CENTER to PROCESSING
2. WHEN a center operator marks an order as QC THEN the System SHALL transition status from PROCESSING to QC
3. WHEN a center operator marks an order as ready for delivery THEN the System SHALL transition status from QC to READY_FOR_DELIVERY
4. WHEN a stage update occurs THEN the System SHALL create an order log entry with center operator information

### Requirement 14

**User Story:** As an admin, I want to view all orders, so that I can monitor system operations.

#### Acceptance Criteria

1. WHEN an admin logs in THEN the System SHALL authenticate using admin credentials
2. WHEN an admin requests all orders THEN the System SHALL return orders from all users with complete details
3. WHEN orders are displayed THEN the System SHALL show user information, status, items, and assigned partner
4. WHEN an admin filters orders THEN the System SHALL apply the specified filter criteria

### Requirement 15

**User Story:** As an admin, I want to manually assign delivery partners to orders, so that I can ensure efficient routing.

#### Acceptance Criteria

1. WHEN an admin assigns a partner to an order THEN the System SHALL update the order with the partner ID
2. WHEN a partner is assigned THEN the System SHALL transition order status from PLACED to ASSIGNED_TO_PARTNER
3. WHEN a partner is assigned THEN the System SHALL create an order log entry with admin information
4. WHEN an invalid partner ID is provided THEN the System SHALL reject the assignment

### Requirement 16

**User Story:** As an admin, I want to manage timeslots, so that I can control service availability.

#### Acceptance Criteria

1. WHEN an admin creates a timeslot THEN the System SHALL store center ID, date, start time, end time, capacity, and remaining capacity
2. WHEN an admin updates a timeslot THEN the System SHALL modify the specified timeslot fields
3. WHEN an admin deletes a timeslot THEN the System SHALL remove the timeslot if no orders are using it
4. WHEN an admin requests timeslots THEN the System SHALL return all timeslots with availability information

### Requirement 17

**User Story:** As an admin, I want to manage centers, so that I can control service locations.

#### Acceptance Criteria

1. WHEN an admin creates a center THEN the System SHALL store the center name and address
2. WHEN an admin updates a center THEN the System SHALL modify the specified center fields
3. WHEN an admin deletes a center THEN the System SHALL remove the center if no active orders reference it
4. WHEN an admin requests centers THEN the System SHALL return all centers with their details

### Requirement 18

**User Story:** As an admin, I want to manage services, so that I can control available ironing options and pricing.

#### Acceptance Criteria

1. WHEN an admin creates a service THEN the System SHALL store the service name and base price in cents
2. WHEN an admin updates a service THEN the System SHALL modify the service name or price
3. WHEN an admin deletes a service THEN the System SHALL remove the service if no orders reference it
4. WHEN an admin requests services THEN the System SHALL return all available services with pricing

### Requirement 19

**User Story:** As an admin, I want to mark payouts for partners, so that I can track payment obligations.

#### Acceptance Criteria

1. WHEN an admin creates a payout THEN the System SHALL store partner ID, order ID, amount in cents, and status
2. WHEN an admin marks a payout as completed THEN the System SHALL update the payout status to COMPLETED
3. WHEN an admin requests payouts THEN the System SHALL return all payouts with partner and order information
4. WHEN a payout is created for a non-existent partner THEN the System SHALL reject the operation

### Requirement 20

**User Story:** As a system, I want to enforce the order state machine, so that orders follow valid workflows.

#### Acceptance Criteria

1. WHEN an order status transition is requested THEN the System SHALL validate against allowed transitions
2. WHEN a valid transition is requested THEN the System SHALL update the order status and create a log entry
3. WHEN an invalid transition is requested THEN the System SHALL reject the update and return an error
4. WHEN an order reaches DELIVERED status THEN the System SHALL allow transition to COMPLETED
5. WHEN an order is in an exception state (CANCELLED, PICKUP_FAILED, DELIVERY_FAILED, REFUND_REQUESTED) THEN the System SHALL prevent further standard transitions
