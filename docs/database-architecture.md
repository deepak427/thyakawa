# Database Architecture

Generated: 5/12/2025, 1:12:58 pm

## Overview

Total Tables: 10

## Tables

### User

| Field | Type | Required | Unique | Relation |
|-------|------|----------|--------|----------|
| id | String | ✓ |  |  |
| name | String | ✓ |  |  |
| email | String |  | ✓ |  |
| phone | String | ✓ | ✓ |  |
| passwordHash | String |  |  |  |
| role | Role | ✓ |  |  |
| referralCode | String |  | ✓ |  |
| referredBy | String |  |  |  |
| otpCodeHash | String |  |  |  |
| otpExpiresAt | DateTime |  |  |  |
| createdAt | DateTime | ✓ |  |  |

### Address

| Field | Type | Required | Unique | Relation |
|-------|------|----------|--------|----------|
| id | String | ✓ |  |  |
| userId | String | ✓ |  |  |
| address | String | ✓ |  |  |
| lat | Float |  |  |  |
| lng | Float |  |  |  |

### Transaction

| Field | Type | Required | Unique | Relation |
|-------|------|----------|--------|----------|
| id | String | ✓ |  |  |
| userId | String | ✓ |  |  |
| type | String | ✓ |  |  |
| coins | Int | ✓ |  |  |
| description | String | ✓ |  |  |
| createdAt | DateTime | ✓ |  |  |

### Wallet

| Field | Type | Required | Unique | Relation |
|-------|------|----------|--------|----------|
| id | String | ✓ |  |  |
| userId | String | ✓ | ✓ |  |
| coins | Int | ✓ |  |  |

### Service

| Field | Type | Required | Unique | Relation |
|-------|------|----------|--------|----------|
| id | String | ✓ |  |  |
| name | String | ✓ |  |  |
| baseCoins | Int | ✓ |  |  |

### Center

| Field | Type | Required | Unique | Relation |
|-------|------|----------|--------|----------|
| id | String | ✓ |  |  |
| name | String | ✓ |  |  |
| address | String | ✓ |  |  |
| coverageKm | Float | ✓ |  |  |
| lat | Float | ✓ |  |  |
| lng | Float | ✓ |  |  |

### Timeslot

| Field | Type | Required | Unique | Relation |
|-------|------|----------|--------|----------|
| id | String | ✓ |  |  |
| centerId | String | ✓ |  |  |
| startTime | String | ✓ |  |  |
| endTime | String | ✓ |  |  |

### Trip

| Field | Type | Required | Unique | Relation |
|-------|------|----------|--------|----------|
| id | String | ✓ |  |  |
| deliveryPersonId | String | ✓ |  |  |
| status | TripStatus | ✓ |  |  |
| scheduledDate | DateTime | ✓ |  |  |
| startTime | String | ✓ |  |  |
| endTime | String | ✓ |  |  |
| createdAt | DateTime | ✓ |  |  |
| updatedAt | DateTime | ✓ |  |  |

### Order

| Field | Type | Required | Unique | Relation |
|-------|------|----------|--------|----------|
| id | String | ✓ |  |  |
| userId | String | ✓ |  |  |
| addressId | String | ✓ |  |  |
| centerId | String |  |  |  |
| timeslotId | String | ✓ |  |  |
| pickupDate | DateTime | ✓ |  |  |
| tripId | String |  |  |  |
| status | OrderStatus | ✓ |  |  |
| deliveryType | DeliveryType | ✓ |  |  |
| deliveryChargeCoins | Int | ✓ |  |  |
| estimatedDeliveryTime | DateTime |  |  |  |
| totalCoins | Int | ✓ |  |  |
| paymentMethod | String | ✓ |  |  |
| alternatePhone | String |  |  |  |
| cancellationReason | String |  |  |  |
| pickupFailureReason | String |  |  |  |
| pickupOtpHash | String |  |  |  |
| pickupOtpExpiresAt | DateTime |  |  |  |
| deliveryOtpHash | String |  |  |  |
| deliveryOtpExpiresAt | DateTime |  |  |  |
| createdAt | DateTime | ✓ |  |  |
| updatedAt | DateTime | ✓ |  |  |

### OrderItem

| Field | Type | Required | Unique | Relation |
|-------|------|----------|--------|----------|
| id | String | ✓ |  |  |
| orderId | String | ✓ |  |  |
| serviceId | String | ✓ |  |  |
| name | String | ✓ |  |  |
| quantity | Int | ✓ |  |  |
| coins | Int | ✓ |  |  |

## Relationships

