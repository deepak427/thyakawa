# Implementation Plan

- [x] 1. Set up project structure and dependencies




  - Create monorepo structure with backend and frontend directories
  - Initialize package.json for both backend and frontend
  - Install backend dependencies: express, prisma, bcrypt, jsonwebtoken, multer, cors, dotenv
  - Install frontend dependencies: react, react-router-dom, axios, tailwindcss
  - Configure TypeScript for both projects
  - Create uploads directory for file storage
  - _Requirements: All_

- [x] 2. Set up Prisma and database schema








  - Create prisma/schema.prisma with all models (User, Address, Wallet, Service, Center, Timeslot, Order, OrderItem, OrderLog, Photo, OTP, Payout)
  - Define enums (Role, OrderStatus, PayoutStatus)
  - Configure Neon PostgreSQL connection
  - Generate Prisma client
  - _Requirements: All_

- [x] 3. Create database seed script





  - Create prisma/seed.ts
  - Seed 1 admin user with hashed password
  - Seed 1 regular user with hashed password
  - Seed 1 delivery partner with hashed password
  - Seed 1 center operator with hashed password
  - Seed 1 center
  - Seed 3 services (shirt, pants, dress) with pricing
  - Seed 10 timeslots for next 5 days
  - _Requirements: All_

- [x] 4. Implement authentication system





  - [x] 4.1 Create auth utilities (JWT generation, password hashing)


    - Implement generateToken function
    - Implement hashPassword and comparePassword functions
    - _Requirements: 1.1, 1.2_
  
  - [x] 4.2 Create auth middleware


    - Implement authenticateToken middleware to verify JWT
    - Implement requireRole middleware for role-based access
    - _Requirements: 1.2, 1.4_
  
  - [x] 4.3 Create auth controller and routes


    - POST /api/auth/signup endpoint
    - POST /api/auth/login endpoint
    - GET /api/users/me endpoint
    - _Requirements: 1.1, 1.2, 1.4_

- [x] 5. Implement address management





  - [x] 5.1 Create address controller


    - POST /api/addresses endpoint
    - GET /api/addresses endpoint
    - PUT /api/addresses/:id endpoint
    - DELETE /api/addresses/:id endpoint
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Implement wallet management





  - [x] 6.1 Create wallet controller


    - GET /api/wallet endpoint
    - POST /api/wallet/topup endpoint
    - Implement wallet balance validation
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 7. Implement order state machine




  - [x] 7.1 Create order state machine service


    - Define valid state transitions map
    - Implement validateTransition function
    - Implement transitionOrderStatus function with logging
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [x] 8. Implement order management





  - [x] 8.1 Create order controller


    - POST /api/orders endpoint (create order with wallet deduction and timeslot capacity update)
    - GET /api/orders/user endpoint (user's orders)
    - GET /api/orders/:id endpoint (order details with items and logs)
    - POST /api/orders/:id/cancel endpoint (with refund and capacity restoration)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4_

- [x] 9. Implement OTP system




  - [x] 9.1 Create OTP service


    - Implement generateOTP function (6-digit code)
    - Implement verifyOTP function with expiration check
    - Console log OTPs for MVP
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.1, 9.2, 9.3_
  
  - [x] 9.2 Create OTP endpoints


    - POST /api/orders/:id/otp/request endpoint
    - POST /api/orders/:id/otp/verify endpoint
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.1, 9.2, 9.3, 9.4_

- [x] 10. Implement photo upload system





  - [x] 10.1 Configure Multer for file uploads


    - Set up multer with uploads directory
    - Configure file size limits (5MB)
    - Configure allowed file types (images only)
    - _Requirements: 10.1, 10.2_
  
  - [x] 10.2 Create photo upload endpoint


    - POST /api/orders/:id/photo endpoint
    - Store file and create photo record
    - Handle upload errors without changing order state
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 11. Implement partner operations





  - [x] 11.1 Create partner controller


    - GET /api/partner/assignments endpoint (filter by partnerId and active statuses)
    - POST /api/partner/order/:id/pickup endpoint (request pickup OTP)
    - POST /api/partner/order/:id/delivery endpoint (mark out for delivery)
    - POST /api/orders/:id/status endpoint (update order status with validation)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 11.1, 11.2, 11.3, 11.4_

- [x] 12. Implement center operator operations





  - [x] 12.1 Create center controller


    - GET /api/center/:id/orders endpoint (filter by centerId and processing statuses)
    - POST /api/center/order/:id/update-stage endpoint (update processing stage)
    - _Requirements: 12.1, 12.2, 12.3, 13.1, 13.2, 13.3, 13.4_



- [x] 13. Implement admin operations



  - [x] 13.1 Create admin order management


    - GET /api/admin/orders endpoint (all orders with filters)
    - POST /api/admin/orders/:id/assign-partner endpoint
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3, 15.4_
  
  - [x] 13.2 Create admin resource management


    - CRUD endpoints for /api/admin/timeslots
    - CRUD endpoints for /api/admin/centers
    - CRUD endpoints for /api/admin/services
    - Implement deletion protection for resources with active references
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 17.1, 17.2, 17.3, 17.4, 18.1, 18.2, 18.3, 18.4_
  
  - [x] 13.3 Create admin payout management


    - POST /api/admin/payouts endpoint
    - GET /api/admin/payouts endpoint
    - PUT /api/admin/payouts/:id/complete endpoint
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [x] 14. Set up backend server




  - Create Express app with CORS configuration
  - Register all routes
  - Add error handling middleware
  - Configure static file serving for uploads
  - Create server entry point
  - _Requirements: All_

- [x] 15. Set up frontend project structure




  - Configure React Router
  - Configure Tailwind CSS
  - Create axios instance with base URL and auth interceptor
  - Create authentication context for managing user state
  - Create ProtectedRoute component with role checking
  - _Requirements: All_

- [x] 16. Implement shared frontend components





  - Create Layout component with navigation
  - Create LoadingSpinner component
  - Create OrderTimeline component for status visualization
  - Create ErrorMessage component
  - _Requirements: 5.4_

- [x] 17. Implement user authentication pages




  - [x] 17.1 Create signup page


    - Form with name, email, phone, password fields
    - Call POST /api/auth/signup
    - Redirect to login on success
    - _Requirements: 1.1_
  
  - [x] 17.2 Create login page


    - Form with email and password fields
    - Call POST /api/auth/login
    - Store JWT token in localStorage
    - Redirect based on user role
    - _Requirements: 1.2, 1.3_

- [x] 18. Implement user dashboard and order flow





  - [x] 18.1 Create user dashboard


    - Display user orders list
    - Show wallet balance
    - Button to create new order
    - _Requirements: 3.2, 5.1_
  
  - [x] 18.2 Create wallet page


    - Display current balance
    - Top-up form with amount input
    - Call POST /api/wallet/topup
    - _Requirements: 3.1, 3.2_
  
  - [x] 18.3 Create address management page


    - List user addresses
    - Add/edit/delete address forms
    - Call address CRUD endpoints
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 18.4 Create order creation flow


    - Multi-step form: select services and quantities, select address, select timeslot
    - Display available timeslots with remaining capacity
    - Calculate and display total price
    - Call POST /api/orders
    - Handle insufficient balance error
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 3.4_
  
  - [x] 18.5 Create order detail page


    - Display order information, items, and total
    - Show OrderTimeline component with status history
    - Cancel button (conditional on status)
    - OTP input for delivery verification
    - _Requirements: 5.2, 5.4, 6.1, 6.3, 7.2, 7.3_

- [x] 19. Implement partner pages





  - [x] 19.1 Create partner dashboard


    - Display assigned orders list
    - Show order details, addresses, and status
    - _Requirements: 8.2, 8.3, 8.4_
  
  - [x] 19.2 Create partner order action page


    - Request pickup OTP button
    - OTP input for pickup verification
    - Photo upload for pickup and delivery
    - Status update buttons (picked up, at center, out for delivery)
    - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2, 11.1, 11.2, 11.3_

- [x] 20. Implement center operator pages





  - [x] 20.1 Create center operator dashboard


    - Display orders at center filtered by processing statuses
    - Show order details and items
    - _Requirements: 12.2, 12.3_
  
  - [x] 20.2 Create processing stage updater

    - Buttons to update stage: Processing, QC, Ready for Delivery
    - Call POST /api/center/order/:id/update-stage
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 21. Implement admin pages





  - [x] 21.1 Create admin dashboard


    - Display all orders in a table
    - Show user, status, partner, and total
    - Filter controls for status and date
    - _Requirements: 14.2, 14.3, 14.4_
  
  - [x] 21.2 Create partner assignment modal

    - Select partner dropdown
    - Call POST /api/admin/orders/:id/assign-partner
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [x] 21.3 Create timeslot management page


    - List timeslots with center, date, time, capacity
    - Add/edit/delete timeslot forms
    - Call timeslot CRUD endpoints
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [x] 21.4 Create center management page


    - List centers
    - Add/edit/delete center forms
    - Call center CRUD endpoints
    - _Requirements: 17.1, 17.2, 17.3, 17.4_
  
  - [x] 21.5 Create service management page


    - List services with pricing
    - Add/edit/delete service forms
    - Call service CRUD endpoints
    - _Requirements: 18.1, 18.2, 18.3, 18.4_
  
  - [x] 21.6 Create payout management page


    - List payouts with partner and order info
    - Mark payout as completed button
    - Call payout endpoints
    - _Requirements: 19.1, 19.2, 19.3_

- [x] 22. Create README documentation





  - Installation instructions
  - Environment variable setup
  - Database migration commands
  - Seed script instructions
  - Running backend and frontend
  - API endpoint documentation
  - Default user credentials from seed
  - _Requirements: All_

- [x] 23. Final checkpoint - Ensure all functionality works





  - Ensure all tests pass, ask the user if questions arise
  - Test complete user journey: signup → order → tracking
  - Test partner journey: login → pickup → delivery
  - Test center operator journey: login → processing stages
  - Test admin journey: login → assign partner → manage resources
  - Verify all state transitions work correctly
  - Verify wallet operations work correctly
  - Verify OTP system works correctly
  - Verify photo uploads work correctly
