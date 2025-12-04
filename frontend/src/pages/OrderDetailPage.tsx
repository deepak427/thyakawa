import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderTimeline from '../components/OrderTimeline';
import { Order, OrderStatus } from '../types';
import api from '../services/api';

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ order: Order }>(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      showToast('Please provide a cancellation reason', 'error');
      return;
    }

    try {
      setCancelling(true);
      await api.post(`/orders/${orderId}/cancel`, { reason: cancellationReason });
      showToast('Order cancelled successfully', 'success');
      setShowCancelModal(false);
      setCancellationReason('');
      await fetchOrder();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to cancel order', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    try {
      setVerifyingOtp(true);
      await api.post(`/orders/${orderId}/otp/verify`, { code: otp });
      showToast('Delivery verified successfully!', 'success');
      setOtp('');
      await fetchOrder();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Invalid OTP', 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`;
  };

  const canCancel = (status: OrderStatus) => {
    return status === OrderStatus.PLACED || status === OrderStatus.ASSIGNED_FOR_PICKUP;
  };

  const canEdit = (status: OrderStatus) => {
    return status === OrderStatus.PLACED || status === OrderStatus.ASSIGNED_FOR_PICKUP;
  };

  const showOtpInput = (status: OrderStatus) => {
    return status === OrderStatus.OUT_FOR_DELIVERY;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLACED: 'bg-blue-100 text-blue-800 border-blue-200',
      ASSIGNED_FOR_PICKUP: 'bg-purple-100 text-purple-800 border-purple-200',
      PICKED_UP: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      AT_CENTER: 'bg-orange-100 text-orange-800 border-orange-200',
      PROCESSING: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      QC: 'bg-teal-100 text-teal-800 border-teal-200',
      READY_FOR_DELIVERY: 'bg-lime-100 text-lime-800 border-lime-200',
      ASSIGNED_FOR_DELIVERY: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-800 border-amber-200',
      DELIVERED: 'bg-green-100 text-green-800 border-green-200',
      COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (!order) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16 bg-secondary-50 rounded-2xl border border-dashed border-secondary-300">
            <p className="text-secondary-500 mb-4 font-medium">Order not found</p>
            <button
              onClick={() => navigate('/user/dashboard')}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <button
            onClick={() => navigate('/user/dashboard')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-primary-900">Order Details</h1>
              <p className="text-secondary-500 mt-2 font-mono">Order #{order.id?.slice(0, 8) || 'N/A'}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(order.status)} shadow-sm`}>
              {order.status?.replace(/_/g, ' ') || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Order Timeline */}
        {order.logs && order.logs.length > 0 && (
          <div className="mb-8 animate-slide-up">
            <OrderTimeline currentStatus={order.status} logs={order.logs} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <div className="card bg-white p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-bold text-secondary-900 mb-6 border-b border-secondary-100 pb-2">Items</h2>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-secondary-50 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center text-secondary-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-secondary-900">{item.name}</p>
                        <p className="text-sm text-secondary-500 font-medium">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-bold text-secondary-900">{formatCurrency(item.priceCents * item.quantity)}</p>
                  </div>
                ))}
                {order.deliveryChargeCents > 0 && (
                  <div className="flex justify-between items-center pt-3 text-secondary-600">
                    <span className="font-medium">Delivery Charge</span>
                    <span className="font-semibold">{formatCurrency(order.deliveryChargeCents)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 mt-2 border-t border-secondary-200">
                  <span className="text-lg font-bold text-secondary-900">Total</span>
                  <span className="text-2xl font-bold text-primary-600">{formatCurrency(order.totalCents)}</span>
                </div>
              </div>
            </div>

            {/* OTP Verification for Delivery */}
            {showOtpInput(order.status) && (
              <div className="card bg-gradient-to-br from-primary-50 to-white border-primary-100 p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-secondary-900 mb-2">Verify Delivery</h2>
                    <p className="text-secondary-600 mb-4">
                      Enter the OTP provided by the delivery partner to confirm receipt of your items.
                    </p>
                    <form onSubmit={handleVerifyOtp} className="flex gap-3 max-w-md">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="input-field text-center text-2xl tracking-[0.5em] font-mono font-bold"
                        required
                      />
                      <button
                        type="submit"
                        disabled={verifyingOtp || otp.length !== 6}
                        className="btn-primary whitespace-nowrap shadow-lg shadow-primary-500/30"
                      >
                        {verifyingOtp ? 'Verifying...' : 'Verify'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Order Information */}
            <div className="card bg-white p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-lg font-bold text-secondary-900 mb-4 border-b border-secondary-100 pb-2">Order Info</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-secondary-500 uppercase tracking-wider font-bold mb-1">Order Date</p>
                  <p className="font-medium text-secondary-900">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500 uppercase tracking-wider font-bold mb-1">Delivery Type</p>
                  <div className="flex items-center gap-2">
                    {order.deliveryType === 'PREMIUM' ? (
                      <>
                        <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="font-bold text-accent-600">Premium (24h)</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-secondary-900">Standard (48h)</span>
                      </>
                    )}
                  </div>
                </div>
                {order.estimatedDeliveryTime && (
                  <div>
                    <p className="text-xs text-secondary-500 uppercase tracking-wider font-bold mb-1">Estimated Delivery</p>
                    <p className="font-medium text-secondary-900">
                      {new Date(order.estimatedDeliveryTime).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-secondary-500 uppercase tracking-wider font-bold mb-1">Payment Method</p>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="font-medium text-secondary-900">{order.paymentMethod}</p>
                  </div>
                </div>
                {order.address && (
                  <div>
                    <p className="text-xs text-secondary-500 uppercase tracking-wider font-bold mb-1">Delivery Address</p>
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                      <p className="font-bold text-secondary-900 mb-1">{order.address?.line1 || 'N/A'}</p>
                      <p className="text-sm text-secondary-600">
                        {order.address?.city || 'N/A'}, {order.address?.pincode || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
                {order.timeslot && (
                  <div>
                    <p className="text-xs text-secondary-500 uppercase tracking-wider font-bold mb-1">Pickup Timeslot</p>
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                      <p className="font-bold text-secondary-900 mb-1">
                        {new Date(order.timeslot.date).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-sm text-primary-600 font-semibold">
                        {order.timeslot.startTime} - {order.timeslot.endTime}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Order Button */}
            {canEdit(order.status) && (
              <div className="card bg-primary-50 border-primary-100 p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <h2 className="text-lg font-bold text-primary-900 mb-2">Edit Order</h2>
                <p className="text-primary-700 text-sm mb-4">
                  You can modify this order before pickup.
                </p>
                <button
                  onClick={() => navigate(`/user/orders/${orderId}/edit`)}
                  className="w-full py-3 px-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-md"
                >
                  Edit Order
                </button>
              </div>
            )}

            {/* Cancel Order Button */}
            {canCancel(order.status) && (
              <div className="card bg-red-50 border-red-100 p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <h2 className="text-lg font-bold text-red-900 mb-2">Cancel Order</h2>
                <p className="text-red-700 text-sm mb-4">
                  You can cancel this order and get a full refund to your wallet.
                </p>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full py-3 px-4 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  Cancel Order
                </button>
              </div>
            )}

            {/* Show cancellation reason if cancelled */}
            {order.cancellationReason && (
              <div className="card bg-red-50 border-red-100 p-6">
                <h2 className="text-lg font-bold text-red-900 mb-2">Cancellation Reason</h2>
                <p className="text-red-700">{order.cancellationReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-secondary-900 mb-4">Cancel Order</h2>
            <p className="text-secondary-600 mb-4">Please provide a reason for cancellation:</p>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="input-field min-h-[100px] mb-4"
              placeholder="e.g., Changed my mind, Found better option, etc."
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                }}
                className="flex-1 btn-secondary py-3"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-red-700"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OrderDetailPage;
