import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import OrderTimeline from '../components/OrderTimeline';
import { Order, OrderStatus } from '../types';
import api from '../services/api';

const PartnerOrderActionPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pickup OTP state
  const [pickupOtp, setPickupOtp] = useState('');
  const [generatedPickupOtp, setGeneratedPickupOtp] = useState('');
  const [requestingPickupOtp, setRequestingPickupOtp] = useState(false);
  const [verifyingPickupOtp, setVerifyingPickupOtp] = useState(false);
  const [pickupOtpError, setPickupOtpError] = useState('');
  const [pickupOtpSuccess, setPickupOtpSuccess] = useState('');
  
  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');
  
  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<{ order: Order }>(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPickupOtp = async () => {
    try {
      setRequestingPickupOtp(true);
      setPickupOtpError('');
      setPickupOtpSuccess('');
      const response = await api.post(`/partner/order/${orderId}/pickup`);
      setGeneratedPickupOtp(response.data.code);
      setPickupOtpSuccess(`Pickup OTP generated: ${response.data.code}`);
    } catch (err: any) {
      setPickupOtpError(err.response?.data?.error || 'Failed to generate OTP');
    } finally {
      setRequestingPickupOtp(false);
    }
  };

  const handleVerifyPickupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pickupOtp || pickupOtp.length !== 6) {
      setPickupOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifyingPickupOtp(true);
      setPickupOtpError('');
      await api.post(`/orders/${orderId}/otp/verify`, {
        action: 'pickup',
        code: pickupOtp,
      });
      setPickupOtpSuccess('Pickup verified successfully!');
      setPickupOtp('');
      setGeneratedPickupOtp('');
      await fetchOrder();
    } catch (err: any) {
      setPickupOtpError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setVerifyingPickupOtp(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pickup' | 'delivery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setPhotoError('');
      setPhotoSuccess('');
      
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', type);

      await api.post(`/orders/${orderId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setPhotoSuccess(`${type === 'pickup' ? 'Pickup' : 'Delivery'} photo uploaded successfully`);
      await fetchOrder();
    } catch (err: any) {
      setPhotoError(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!confirm(`Are you sure you want to update status to ${newStatus.replace(/_/g, ' ')}?`)) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusError('');
      await api.post(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrder();
    } catch (err: any) {
      setStatusError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ASSIGNED_TO_PARTNER: 'bg-purple-100 text-purple-800',
      PICKUP_PENDING: 'bg-yellow-100 text-yellow-800',
      PICKED_UP: 'bg-indigo-100 text-indigo-800',
      AT_CENTER: 'bg-orange-100 text-orange-800',
      PROCESSING: 'bg-cyan-100 text-cyan-800',
      QC: 'bg-teal-100 text-teal-800',
      READY_FOR_DELIVERY: 'bg-lime-100 text-lime-800',
      OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-800',
      DELIVERED: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ErrorMessage message="Order not found" onClose={() => navigate('/partner/dashboard')} />
        </div>
      </Layout>
    );
  }

  const canRequestPickup = order.status === OrderStatus.ASSIGNED_TO_PARTNER || order.status === OrderStatus.PICKUP_PENDING;
  const canMarkAtCenter = order.status === OrderStatus.PICKED_UP;
  const canMarkOutForDelivery = order.status === OrderStatus.READY_FOR_DELIVERY;
  const showPickupPhoto = order.status === OrderStatus.PICKUP_PENDING || order.status === OrderStatus.PICKED_UP;
  const showDeliveryPhoto = order.status === OrderStatus.OUT_FOR_DELIVERY;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/partner/dashboard')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Order Actions</h1>
              <p className="text-gray-600 mt-2">Order #{order.id?.slice(0, 8) || 'N/A'}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {order.status?.replace(/_/g, ' ') || 'Unknown'}
            </span>
          </div>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
        {statusError && <ErrorMessage message={statusError} onClose={() => setStatusError('')} />}

        {/* Order Timeline */}
        {order.logs && order.logs.length > 0 && (
          <div className="mb-6">
            <OrderTimeline currentStatus={order.status} logs={order.logs} />
          </div>
        )}

        {/* Order Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-medium">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-medium text-lg">{formatCurrency(order.totalCents)}</p>
            </div>
            {order.address && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Delivery Address</p>
                <p className="font-medium">{order.address.line1}</p>
                <p className="text-sm text-gray-600">
                  {order.address.city}, {order.address.pincode}
                </p>
              </div>
            )}
            {order.timeslot && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Pickup Timeslot</p>
                <p className="font-medium">
                  {new Date(order.timeslot.date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                  {' '}
                  {order.timeslot.startTime} - {order.timeslot.endTime}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Items</h2>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <p className="font-semibold">{formatCurrency(item.priceCents * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pickup OTP Section */}
        {canRequestPickup && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Pickup Verification</h2>
            <p className="text-gray-600 mb-4">
              Request a pickup OTP and verify with the customer to confirm item collection.
            </p>
            
            {pickupOtpError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                {pickupOtpError}
              </div>
            )}
            {pickupOtpSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
                {pickupOtpSuccess}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleRequestPickupOtp}
                disabled={requestingPickupOtp}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {requestingPickupOtp ? 'Generating OTP...' : 'Request Pickup OTP'}
              </button>

              {generatedPickupOtp && (
                <form onSubmit={handleVerifyPickupOtp} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP from Customer
                    </label>
                    <input
                      type="text"
                      value={pickupOtp}
                      onChange={(e) => setPickupOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={verifyingPickupOtp || pickupOtp.length !== 6}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
                  >
                    {verifyingPickupOtp ? 'Verifying...' : 'Verify Pickup OTP'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Photo Upload Section */}
        {(showPickupPhoto || showDeliveryPhoto) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Photo Upload</h2>
            <p className="text-gray-600 mb-4">
              Upload photos to document the condition of items.
            </p>
            
            {photoError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                {photoError}
              </div>
            )}
            {photoSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
                {photoSuccess}
              </div>
            )}

            <div className="space-y-4">
              {showPickupPhoto && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'pickup')}
                    disabled={uploadingPhoto}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              
              {showDeliveryPhoto && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'delivery')}
                    disabled={uploadingPhoto}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Update Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Update Status</h2>
          <p className="text-gray-600 mb-4">
            Update the order status as you progress through pickup and delivery.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {canMarkAtCenter && (
              <button
                onClick={() => handleStatusUpdate(OrderStatus.AT_CENTER)}
                disabled={updatingStatus}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition disabled:bg-gray-400"
              >
                Mark as At Center
              </button>
            )}
            
            {canMarkOutForDelivery && (
              <button
                onClick={() => handleStatusUpdate(OrderStatus.OUT_FOR_DELIVERY)}
                disabled={updatingStatus}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition disabled:bg-gray-400"
              >
                Mark Out for Delivery
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PartnerOrderActionPage;
