import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Role } from './types';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UserDashboard from './pages/UserDashboard';
import WalletPage from './pages/WalletPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import ReferralPage from './pages/ReferralPage';
import AddressManagementPage from './pages/AddressManagementPage';
import CreateOrderPage from './pages/CreateOrderPage';
import EditOrderPage from './pages/EditOrderPage';
import OrderDetailPage from './pages/OrderDetailPage';
import DeliveryPersonDashboard from './pages/DeliveryPersonDashboard';
import DeliveryPersonTripPage from './pages/DeliveryPersonTripPage';
import FloorManagerDashboard from './pages/FloorManagerDashboard';
import FloorManagerOrdersPage from './pages/FloorManagerOrdersPage';
import FloorManagerTripsPage from './pages/FloorManagerTripsPage';
import FloorManagerTripDetailsPage from './pages/FloorManagerTripDetailsPage';
import FloorManagerDeliveryPartnersPage from './pages/FloorManagerDeliveryPartnersPage';
import CenterOperatorDashboard from './pages/CenterOperatorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TimeslotManagementPage from './pages/TimeslotManagementPage';
import CenterManagementPage from './pages/CenterManagementPage';
import ServiceManagementPage from './pages/ServiceManagementPage';
import PayoutManagementPage from './pages/PayoutManagementPage';

const DashboardRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case Role.USER:
      return <Navigate to="/user/dashboard" replace />;
    case Role.DELIVERY_PERSON:
      return <Navigate to="/delivery/dashboard" replace />;
    case Role.FLOOR_MANAGER:
      return <Navigate to="/manager/dashboard" replace />;
    case Role.CENTER_OPERATOR:
      return <Navigate to="/operator/dashboard" replace />;
    case Role.ADMIN:
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

import { ToastProvider } from './context/ToastContext';

// ... imports ...

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected routes - User */}
            <Route
              path="/user/dashboard"
              element={
                <ProtectedRoute allowedRoles={[Role.USER]}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/wallet"
              element={
                <ProtectedRoute allowedRoles={[Role.USER]}>
                  <WalletPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/transactions"
              element={
                <ProtectedRoute allowedRoles={[Role.USER]}>
                  <TransactionHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/referral"
              element={
                <ProtectedRoute allowedRoles={[Role.USER]}>
                  <ReferralPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/addresses"
              element={
                <ProtectedRoute allowedRoles={[Role.USER]}>
                  <AddressManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/orders/new"
              element={
                <ProtectedRoute allowedRoles={[Role.USER]}>
                  <CreateOrderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/orders/:orderId"
              element={
                <ProtectedRoute allowedRoles={[Role.USER]}>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/orders/:orderId/edit"
              element={
                <ProtectedRoute allowedRoles={[Role.USER]}>
                  <EditOrderPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Delivery Person */}
            <Route
              path="/delivery/dashboard"
              element={
                <ProtectedRoute allowedRoles={[Role.DELIVERY_PERSON]}>
                  <DeliveryPersonDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery/trips/:tripId"
              element={
                <ProtectedRoute allowedRoles={[Role.DELIVERY_PERSON]}>
                  <DeliveryPersonTripPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Center Operator */}
            <Route
              path="/operator/dashboard"
              element={
                <ProtectedRoute allowedRoles={[Role.CENTER_OPERATOR, Role.ADMIN]}>
                  <CenterOperatorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Floor Manager */}
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={[Role.FLOOR_MANAGER, Role.ADMIN]}>
                  <FloorManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/orders"
              element={
                <ProtectedRoute allowedRoles={[Role.FLOOR_MANAGER, Role.ADMIN]}>
                  <FloorManagerOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/trips"
              element={
                <ProtectedRoute allowedRoles={[Role.FLOOR_MANAGER, Role.ADMIN]}>
                  <FloorManagerTripsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/trips/:tripId"
              element={
                <ProtectedRoute allowedRoles={[Role.FLOOR_MANAGER, Role.ADMIN]}>
                  <FloorManagerTripDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/delivery-partners"
              element={
                <ProtectedRoute allowedRoles={[Role.FLOOR_MANAGER, Role.ADMIN]}>
                  <FloorManagerDeliveryPartnersPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Admin */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/timeslots"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                  <TimeslotManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/centers"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                  <CenterManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                  <ServiceManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payouts"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                  <PayoutManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<DashboardRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
