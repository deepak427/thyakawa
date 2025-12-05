import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface Trip {
  id: string;
  deliveryPersonId: string;
  type: string;
  status: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  orders?: any[];
  orders?: any[];
}

interface Order {
  id: string;
  user: { name: string; phone: string };
  address: { line1: string; city: string };
  totalCoins: number;
  deliveryType: string;
  createdAt: string;
}

interface DeliveryPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const FloorManagerTripsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [placedOrders, setPlacedOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Selected orders for trip
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  
  // Create trip form
  const [TripStatus, setTripStatus] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [deliveryPersonId, setDeliveryPersonId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTrips();
    fetchPlacedOrders();
    fetchDeliveryPersons();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/trips');
      setTrips(response.data || []);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to fetch trips', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlacedOrders = async () => {
    try {
      const response = await api.get('/admin/orders?status=PLACED');
      const orders = Array.isArray(response.data) ? response.data : (response.data.orders || []);
      setPlacedOrders(orders);
    } catch (err: any) {
      console.error('Failed to fetch placed orders:', err);
    }
  };

  const fetchDeliveryPersons = async () => {
    try {
      const response = await api.get('/admin/users?role=DELIVERY_PERSON');
      setDeliveryPersons(response.data || []);
    } catch (err) {
      console.error('Failed to fetch delivery persons:', err);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deliveryPersonId || !scheduledDate || !startTime || !endTime) {
      showToast('Please fill all fields', 'error');
      return;
    }

    if (selectedOrderIds.length === 0) {
      showToast('Please select at least one order', 'error');
      return;
    }

    try {
      setCreating(true);
      await api.post('/admin/trips', {
        deliveryPersonId,
        scheduledDate,
        startTime,
        endTime,
        orderIds: selectedOrderIds,
        type: TripStatus,
      });
      showToast(`${TripStatus} trip created with ${selectedOrderIds.length} orders`, 'success');
      setShowCreateModal(false);
      resetForm();
      fetchTrips();
      fetchPlacedOrders();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create trip', 'error');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTripStatus('PICKUP');
    setDeliveryPersonId('');
    setScheduledDate('');
    setStartTime('09:00');
    setEndTime('12:00');
    setSelectedOrderIds([]);
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
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading && trips.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary-900 mb-2">Trip Management</h1>
            <p className="text-secondary-500">Assign multiple orders to delivery partners</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/manager/dashboard')}
              className="btn-secondary"
            >
              ← Back
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
              disabled={placedOrders.length === 0}
            >
              + Create Trip
            </button>
          </div>
        </div>

        {/* Existing Trips */}
        <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-secondary-200 bg-secondary-50">
            <h2 className="text-lg font-bold text-secondary-900">Active Trips ({trips.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase">
                    Trip ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase">
                    Delivery Person
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase">
                    Time Window
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-secondary-500 uppercase">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-100">
                {trips.map((trip) => {
                  const dp = deliveryPersons.find(d => d.id === trip.deliveryPersonId);
                  return (
                    <tr 
                      key={trip.id} 
                      className="hover:bg-secondary-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/manager/trips/${trip.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                        {trip.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-900">
                          {dp?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-secondary-500">{dp?.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(trip.status)}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {formatDate(trip.scheduledDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {trip.startTime} - {trip.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-secondary-600">
                            {trip.type === 'PICKUP' ? '📦 Pickup' : '🚚 Delivery'}
                          </span>
                          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-bold">
                            {(trip.orders?.length || 0) + (trip.orders?.length || 0)} orders
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {trips.length === 0 && (
              <div className="text-center py-12 text-secondary-500">
                <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                No trips yet. Create your first trip with pending orders!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Create New Trip</h2>
            
            <form onSubmit={handleCreateTrip} className="space-y-6">
              {/* Trip Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Trip Type *
                  </label>
                  <select
                    value={TripStatus}
                    onChange={(e) => setTripStatus(e.target.value as 'PICKUP' | 'DELIVERY')}
                    className="input-field"
                    required
                  >
                    <option value="PICKUP">📦 Pickup Trip (Collect from customers)</option>
                    <option value="DELIVERY">🚚 Delivery Trip (Return to customers)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Delivery Person *
                  </label>
                  <select
                    value={deliveryPersonId}
                    onChange={(e) => setDeliveryPersonId(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select delivery person</option>
                    {deliveryPersons.map((dp) => (
                      <option key={dp.id} value={dp.id}>
                        {dp.name} - {dp.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="input-field"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* Select Orders */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-3">
                  Select Orders for Trip * ({selectedOrderIds.length} selected)
                </label>
                <div className="border border-secondary-200 rounded-lg max-h-96 overflow-y-auto">
                  {placedOrders.length === 0 ? (
                    <div className="text-center py-8 text-secondary-500">
                      No pending orders available
                    </div>
                  ) : (
                    <div className="divide-y divide-secondary-100">
                      {placedOrders.map((order) => (
                        <label
                          key={order.id}
                          className="flex items-center p-4 hover:bg-secondary-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(order.id)}
                            onChange={() => toggleOrderSelection(order.id)}
                            className="w-5 h-5 text-primary-600 rounded border-secondary-300 focus:ring-primary-500"
                          />
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-secondary-900">
                                  {order.user.name} - {order.user.phone}
                                </p>
                                <p className="text-xs text-secondary-500 mt-1">
                                  {order.address}, {order.address}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-secondary-900">
                                  {formatCurrency(order.totalCoins)}
                                </p>
                                <p className="text-xs text-secondary-500 mt-1">
                                  {order.deliveryType === 'PREMIUM' ? '⚡ Premium' : '🕐 Standard'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={creating || selectedOrderIds.length === 0}
                >
                  {creating ? 'Creating...' : `Create Trip with ${selectedOrderIds.length} Orders`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FloorManagerTripsPage;
