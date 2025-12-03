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
  timeslot?: {
    startTime: string;
    endTime: string;
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

const FloorManagerTripDetailsPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

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
      PROCESSING: 'bg-yellow-100 text-yellow-800',
      QC: 'bg-orange-100 text-orange-800',
      READY_FOR_DELIVERY: 'bg-emerald-100 text-emerald-800',
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
              onClick={() => navigate('/manager/trips')}
              className="text-primary-600 hover:text-primary-700 font-medium mb-2 flex items-center gap-2"
            >
              ← Back to Trips
            </button>
            <h1 className="text-3xl font-bold text-secondary-900">
              {trip.type === 'PICKUP' ? '📦 Pickup' : '🚚 Delivery'} Trip Details
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
          {orders.length === 0 ? (
            <div className="card bg-white p-12 text-center">
              <p className="text-secondary-500">No orders in this trip</p>
            </div>
          ) : (
            orders.map((order, index) => (
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
                      {order.timeslot && trip.type === 'PICKUP' && (
                        <p className="text-sm text-primary-600 font-medium mt-1">
                          🕐 Pickup: {order.timeslot.startTime} - {order.timeslot.endTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-secondary-900">{formatCurrency(order.totalCents)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {order.deliveryType === 'PREMIUM' ? (
                        <span className="text-amber-600 text-sm font-medium">⚡ Premium</span>
                      ) : (
                        <span className="text-secondary-500 text-sm">🕐 Standard</span>
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
                        <span className="font-medium text-secondary-900">
                          {formatCurrency(item.priceCents)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Status */}
                <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <button
                    onClick={() => navigate(`/manager/orders`)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FloorManagerTripDetailsPage;
