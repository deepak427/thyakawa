import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { Order, OrderStatus } from '../types';
import api from '../services/api';

interface CenterOrdersResponse {
  orders: Order[];
}

const CenterDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Get center ID from user (assuming it's stored in user object or we use a default)
  // For MVP, we'll fetch the first center from the database
  // In production, this should be associated with the center operator user
  const [centerId, setCenterId] = useState<string>('');

  useEffect(() => {
    // Fetch the first center ID for MVP
    // In production, this should come from the user's profile
    const fetchCenterId = async () => {
      try {
        const response = await api.get('/centers');
        const centers = Array.isArray(response.data) ? response.data : (response.data.centers || []);
        if (centers.length > 0) {
          setCenterId(centers[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch center ID:', err);
      }
    };
    fetchCenterId();
  }, []);

  useEffect(() => {
    if (centerId) {
      fetchCenterOrders();
    }
  }, [centerId]);

  const fetchCenterOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get<CenterOrdersResponse>(`/center/${centerId}/orders`);
      setOrders(response.data.orders || []);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load center orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await api.post(`/center/order/${orderId}/update-stage`, { status: newStatus });
      showToast('Order status updated successfully', 'success');
      await fetchCenterOrders();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update processing stage', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      AT_CENTER: 'bg-orange-100 text-orange-800 border-orange-200',
      PROCESSING: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      QC: 'bg-teal-100 text-teal-800 border-teal-200',
      READY_FOR_DELIVERY: 'bg-lime-100 text-lime-800 border-lime-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getNextStageButton = (currentStatus: OrderStatus, orderId: string) => {
    const isUpdating = updatingOrderId === orderId;

    switch (currentStatus) {
      case OrderStatus.AT_CENTER:
        return (
          <button
            onClick={() => updateStage(orderId, OrderStatus.PROCESSING)}
            disabled={isUpdating}
            className="bg-cyan-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {isUpdating ? 'Updating...' : 'Start Processing'}
          </button>
        );
      case OrderStatus.PROCESSING:
        return (
          <button
            onClick={() => updateStage(orderId, OrderStatus.QC)}
            disabled={isUpdating}
            className="bg-teal-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {isUpdating ? 'Updating...' : 'Move to QC'}
          </button>
        );
      case OrderStatus.QC:
        return (
          <button
            onClick={() => updateStage(orderId, OrderStatus.READY_FOR_DELIVERY)}
            disabled={isUpdating}
            className="bg-lime-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-lime-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {isUpdating ? 'Updating...' : 'Mark Ready for Delivery'}
          </button>
        );
      case OrderStatus.READY_FOR_DELIVERY:
        return (
          <span className="text-sm text-secondary-500 italic font-medium">Waiting for partner pickup</span>
        );
      default:
        return null;
    }
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter(order => order.status === status);
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">Center Operator Dashboard</h1>
          <p className="text-secondary-500">Welcome, {user?.name}! Manage orders at your center</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-orange-50 to-white border-orange-100">
            <p className="text-sm font-medium text-orange-700 mb-1">At Center</p>
            <p className="text-3xl font-bold text-orange-600">
              {getOrdersByStatus(OrderStatus.AT_CENTER).length}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-cyan-50 to-white border-cyan-100">
            <p className="text-sm font-medium text-cyan-700 mb-1">Processing</p>
            <p className="text-3xl font-bold text-cyan-600">
              {getOrdersByStatus(OrderStatus.PROCESSING).length}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-teal-50 to-white border-teal-100">
            <p className="text-sm font-medium text-teal-700 mb-1">Quality Check</p>
            <p className="text-3xl font-bold text-teal-600">
              {getOrdersByStatus(OrderStatus.QC).length}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-lime-50 to-white border-lime-100">
            <p className="text-sm font-medium text-lime-700 mb-1">Ready for Delivery</p>
            <p className="text-3xl font-bold text-lime-600">
              {getOrdersByStatus(OrderStatus.READY_FOR_DELIVERY).length}
            </p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-secondary-900">Orders at Center</h2>
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-secondary-300">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-secondary-500 mb-2">No orders at center</p>
              <p className="text-sm text-secondary-400">Orders will appear here when they arrive</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-secondary-100 hover:shadow-md hover:border-primary-200 transition-all"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-secondary-900 text-lg">Order #{order.id?.slice(0, 8)}</h3>
                        <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div className="bg-secondary-50 rounded-lg p-3 border border-secondary-100">
                      <p className="text-xs text-secondary-500 uppercase tracking-wider font-medium mb-1">Customer</p>
                      <p className="text-sm font-medium text-secondary-900">{order.user?.name || 'N/A'}</p>
                      <p className="text-xs text-secondary-600">{order.user?.phone || 'N/A'}</p>
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-xs text-secondary-500 uppercase tracking-wider font-medium mb-2">Items</p>
                      <div className="space-y-1">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-secondary-700">
                              {item.name} × {item.quantity}
                            </span>
                            <span className="text-secondary-900 font-medium">
                              {formatCurrency(item.priceCents * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-secondary-200">
                        <span className="text-secondary-700">Total</span>
                        <span className="text-primary-600">{formatCurrency(order.totalCents)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end pt-4 mt-4 border-t border-secondary-100">
                    {getNextStageButton(order.status as OrderStatus, order.id)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CenterDashboard;
