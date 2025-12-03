import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface Order {
  id: string;
  status: string;
  deliveryType: string;
  totalCents: number;
  user: {
    name: string;
    phone: string;
  };
  address: {
    line1: string;
    city: string;
    pincode: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    priceCents: number;
  }>;
}

interface Trip {
  id: string;
  type: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  pickupOrders?: Order[];
  deliveryOrders?: Order[];
}

const DeliveryPersonTripPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showPickupOtpModal, setShowPickupOtpModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  
  // Form states
  const [pickupOtp, setPickupOtp] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/trips/${tripId}`);
      setTrip(response.data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load trip', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPickupOtp = async (orderId: string) => {
    try {
      const response = await api.post(`/partner/order/${orderId}/pickup`);
      showToast(`Pickup OTP: ${response.data.code}`, 'success');
      setSelectedOrderId(orderId);
      setShowPickupOtpModal(true);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to request OTP', 'error');
    }
  };

  const handleVerifyPickupOtp = async () => {
    if (!pickupOtp.trim()) {
      showToast('Please enter OTP', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/partner/order/${selectedOrderId}/verify-pickup`, {
        code: pickupOtp,
      });
      showToast('Pickup verified! Order picked up', 'success');
      setShowPickupOtpModal(false);
      setPickupOtp('');
      await fetchTrip();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Invalid OTP', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkOutForDelivery = async (orderId: string) => {
    try {
      await api.post(`/partner/order/${orderId}/delivery`);
      showToast('Order marked as out for delivery', 'success');
      await fetchTrip();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update status', 'error');
    }
  };

  const handlePickupFailure = async () => {
    if (!failureReason.trim()) {
      showToast('Please provide a reason', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/partner/order/${selectedOrderId}/pickup-failure`, {
        reason: failureReason,
      });
      showToast('Pickup failure recorded', 'success');
      setShowFailureModal(false);
      setFailureReason('');
      await fetchTrip();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to record failure', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLACED: 'bg-blue-100 text-blue-800',
      ASSIGNED_FOR_PICKUP: 'bg-purple-100 text-purple-800',
      PICKED_UP: 'bg-indigo-100 text-indigo-800',
      AT_CENTER: 'bg-cyan-100 text-cyan-800',
      ASSIGNED_FOR_DELIVERY: 'bg-teal-100 text-teal-800',
      OUT_FOR_DELIVERY: 'bg-lime-100 text-lime-800',
      DELIVERED: 'bg-green-100 text-green-800',
      PICKUP_FAILED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!trip) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-secondary-500">Trip not found</p>
        </div>
      </Layout>
    );
  }

  const orders = trip.type === 'PICKUP' ? (trip.pickupOrders || []) : (trip.deliveryOrders || []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/delivery/dashboard')}
              className="text-primary-600 hover:text-primary-700 font-medium mb-2 flex items-center gap-2"
            >
              ← Back to Trips
            </button>
            <h1 className="text-3xl font-bold text-secondary-900">
              {trip.type === 'PICKUP' ? '📦 Pickup' : '🚚 Delivery'} Trip
            </h1>
            <p className="text-secondary-500 mt-1">
              {formatDate(trip.scheduledDate)} • {trip.startTime} - {trip.endTime}
            </p>
          </div>
          <div className="text-right">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(trip.status)}`}>
              {trip.status}
            </span>
            <p className="text-sm text-secondary-500 mt-2">{orders.length} Orders</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order, index) => (
            <div key={order.id} className="card bg-white p-6 hover:shadow-lg transition-shadow">
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary-900">{order.user.name}</h3>
                    <p className="text-sm text-secondary-500">{order.user.phone}</p>
                    <p className="text-sm text-secondary-600 mt-1">
                      📍 {order.address.line1}, {order.address.city} - {order.address.pincode}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-secondary-900">{formatCurrency(order.totalCents)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {order.deliveryType === 'PREMIUM' ? (
                      <span className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                        </svg>
                        Premium (24h)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-secondary-500 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Standard (48h)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-secondary-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-secondary-700 mb-2">Items:</h4>
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-secondary-600">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-secondary-900 font-medium">
                        {formatCurrency(item.priceCents)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>

                <div className="flex gap-2">
                  {/* Pickup Trip Actions */}
                  {trip.type === 'PICKUP' && order.status === 'ASSIGNED_FOR_PICKUP' && (
                    <>
                      <button
                        onClick={() => handleRequestPickupOtp(order.id)}
                        className="btn-primary text-sm"
                      >
                        Request Pickup OTP
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setShowFailureModal(true);
                        }}
                        className="btn-secondary text-sm"
                      >
                        Mark Failure
                      </button>
                    </>
                  )}

                  {trip.type === 'PICKUP' && order.status === 'PICKED_UP' && (
                    <button
                      onClick={async () => {
                        try {
                          await api.post(`/orders/${order.id}/status`, { status: 'AT_CENTER' });
                          showToast('Order marked at center', 'success');
                          await fetchTrip();
                        } catch (err: any) {
                          showToast(err.response?.data?.error || 'Failed to update status', 'error');
                        }
                      }}
                      className="btn-primary text-sm"
                    >
                      Mark at Center
                    </button>
                  )}

                  {/* Delivery Trip Actions */}
                  {trip.type === 'DELIVERY' && order.status === 'ASSIGNED_FOR_DELIVERY' && (
                    <button
                      onClick={() => handleMarkOutForDelivery(order.id)}
                      className="btn-primary text-sm"
                    >
                      Mark Out for Delivery
                    </button>
                  )}

                  {trip.type === 'DELIVERY' && order.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={async () => {
                        try {
                          await api.post(`/orders/${order.id}/status`, { status: 'DELIVERED' });
                          showToast('Order delivered successfully!', 'success');
                          await fetchTrip();
                        } catch (err: any) {
                          showToast(err.response?.data?.error || 'Failed to update status', 'error');
                        }
                      }}
                      className="btn-primary text-sm"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pickup OTP Modal */}
      {showPickupOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-secondary-900 mb-4">Verify Pickup OTP</h2>
            <p className="text-secondary-600 mb-6">
              Ask the customer for the 6-digit OTP to confirm pickup
            </p>
            <input
              type="text"
              value={pickupOtp}
              onChange={(e) => setPickupOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="input-field text-center text-2xl tracking-widest mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPickupOtpModal(false);
                  setPickupOtp('');
                }}
                className="btn-secondary flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyPickupOtp}
                className="btn-primary flex-1"
                disabled={submitting || pickupOtp.length !== 6}
              >
                {submitting ? 'Verifying...' : 'Verify & Pickup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Failure Modal */}
      {showFailureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-secondary-900 mb-4">Pickup Failure</h2>
            <p className="text-secondary-600 mb-4">
              Please provide a reason for the pickup failure
            </p>
            <textarea
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              placeholder="e.g., Customer not available, Wrong address, etc."
              className="input-field min-h-[100px] mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFailureModal(false);
                  setFailureReason('');
                }}
                className="btn-secondary flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handlePickupFailure}
                className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
                disabled={submitting || !failureReason.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Failure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DeliveryPersonTripPage;
