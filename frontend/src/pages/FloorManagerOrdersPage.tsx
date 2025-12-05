import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import api from '../services/api';
import { Order, OrderStatus } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
}

const FloorManagerOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PLACED');
  const [timeSlotFilter, setTimeSlotFilter] = useState('');
  
  // Trip creation
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showTripModal, setShowTripModal] = useState(false);
  const [TripStatus, setTripStatus] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [deliveryPersonId, setDeliveryPersonId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchDeliveryPersons();
  }, [statusFilter, timeSlotFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await api.get(`/admin/orders?${params.toString()}`);
      let fetchedOrders = Array.isArray(response.data) ? response.data : (response.data.orders || []);
      
      // Filter by time slot if selected
      if (timeSlotFilter) {
        fetchedOrders = fetchedOrders.filter((order: Order) => {
          const orderSlot = order.timeslot ? `${order.timeslot.startTime}-${order.timeslot.endTime}` : '';
          return orderSlot === timeSlotFilter;
        });
      }
      
      setOrders(fetchedOrders);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
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
    
    if (!deliveryPersonId || !scheduledDate || !startTime || !endTime || !TripStatus) {
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
      showToast(`${TripStatus} trip created with ${selectedOrderIds.length} orders!`, 'success');
      setShowTripModal(false);
      setSelectedOrderIds([]);
      resetForm();
      fetchOrders();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create trip', 'error');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setDeliveryPersonId('');
    setScheduledDate('');
    setStartTime('09:00');
    setEndTime('12:00');
    setTripStatus('PICKUP');
  };

  const getUniqueTimeSlots = () => {
    const slots = new Set<string>();
    orders.forEach(order => {
      if (order.timeslot) {
        slots.add(`${order.timeslot.startTime}-${order.timeslot.endTime}`);
      }
    });
    return Array.from(slots).sort();
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: OrderStatus) => {
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
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && orders.length === 0) {
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
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Orders Management</h1>
            <p className="text-secondary-500 mt-1">Select orders and create trips</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/manager/dashboard')}
              className="btn-secondary"
            >
              ← Back
            </button>
            {selectedOrderIds.length > 0 && (
              <button
                onClick={() => {
                  // Auto-set trip type based on order status
                  if (statusFilter === 'READY_FOR_DELIVERY') {
                    setTripStatus('DELIVERY');
                  } else if (statusFilter === 'PLACED') {
                    setTripStatus('PICKUP');
                  }
                  setShowTripModal(true);
                }}
                className="btn-primary"
              >
                {statusFilter === 'READY_FOR_DELIVERY' ? '🚚 Create Delivery Trip' : '📦 Create Pickup Trip'} ({selectedOrderIds.length} orders)
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card bg-white p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary-700 mb-2 block">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setSelectedOrderIds([]);
                  setTimeSlotFilter('');
                }}
                className="input-field"
              >
                <option value="">All Orders</option>
                <option value="PLACED">Placed (Ready for Pickup)</option>
                <option value="ASSIGNED_FOR_PICKUP">Assigned for Pickup</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="AT_CENTER">At Center</option>
                <option value="PROCESSING">Processing</option>
                <option value="QC">Quality Check</option>
                <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
                <option value="ASSIGNED_FOR_DELIVERY">Assigned for Delivery</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              </select>
            </div>
            
            {statusFilter === 'PLACED' && getUniqueTimeSlots().length > 0 && (
              <div>
                <label className="text-sm font-medium text-secondary-700 mb-2 block">Filter by Pickup Time Slot:</label>
                <select
                  value={timeSlotFilter}
                  onChange={(e) => {
                    setTimeSlotFilter(e.target.value);
                    setSelectedOrderIds([]);
                  }}
                  className="input-field"
                >
                  <option value="">All Time Slots</option>
                  {getUniqueTimeSlots().map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="card bg-white p-12 text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-secondary-500">No orders found with this status</p>
            </div>
          ) : (
            orders.map((order) => {
              const canSelect = order.status === 'PLACED' || order.status === 'READY_FOR_DELIVERY';
              return (
                <div
                  key={order.id}
                  className={`card bg-white p-5 ${canSelect ? 'cursor-pointer' : ''} transition-all ${
                    selectedOrderIds.includes(order.id)
                      ? 'ring-2 ring-primary-500 bg-primary-50'
                      : canSelect ? 'hover:shadow-md' : ''
                  }`}
                  onClick={() => canSelect && toggleOrderSelection(order.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    {canSelect && (
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="w-5 h-5 text-primary-600 rounded mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}

                    {/* Order Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-secondary-900">{order.user?.name}</h3>
                          <p className="text-sm text-secondary-500">{order.user?.phone}</p>
                          <p className="text-sm text-secondary-600 mt-1">
                            📍 {order.address?.line1}, {order.address?.city}
                          </p>
                          {order.timeslot && order.status === 'PLACED' && (
                            <p className="text-sm text-primary-600 font-medium mt-1">
                              🕐 Pickup: {order.timeslot.startTime} - {order.timeslot.endTime}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-secondary-900">
                            {formatCurrency(order.totalCoins)}
                          </p>
                          <p className="text-xs text-secondary-500 mt-1">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        {order.deliveryType === 'PREMIUM' ? (
                          <span className="text-xs text-amber-600 font-medium">⚡ Premium</span>
                        ) : (
                          <span className="text-xs text-secondary-500">🕐 Standard</span>
                        )}
                        <span className="text-xs text-secondary-500">
                          {order.items?.length || 0} items
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Trip Modal */}
      {showTripModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              {TripStatus === 'PICKUP' ? '📦 Create Pickup Trip' : '🚚 Create Delivery Trip'}
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                {TripStatus === 'PICKUP' 
                  ? `Creating pickup trip for ${selectedOrderIds.length} orders (Status: PLACED)` 
                  : `Creating delivery trip for ${selectedOrderIds.length} orders (Status: READY_FOR_DELIVERY)`}
              </p>
            </div>
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Trip Type *
                </label>
                <select
                  value={TripStatus}
                  onChange={(e) => setTripStatus(e.target.value as 'PICKUP' | 'DELIVERY')}
                  className="input-field"
                  required
                >
                  <option value="PICKUP">📦 Pickup Trip</option>
                  <option value="DELIVERY">🚚 Delivery Trip</option>
                </select>
                <p className="text-xs text-secondary-500 mt-1">
                  {TripStatus === 'PICKUP' 
                    ? 'For collecting orders from customers' 
                    : 'For delivering processed orders to customers'}
                </p>
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

              <div className="grid grid-cols-2 gap-4">
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

              {timeSlotFilter && TripStatus === 'PICKUP' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    📌 Selected orders have pickup slot: <strong>{timeSlotFilter}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTripModal(false);
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
                  disabled={creating}
                >
                  {creating ? 'Creating...' : `Create ${TripStatus} Trip`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FloorManagerOrdersPage;
