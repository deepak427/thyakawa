import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  items: Array<{
    name: string;
    quantity: number;
  }>;
  createdAt: string;
}

const CenterOperatorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('AT_CENTER');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/orders');
      setAllOrders(Array.isArray(response.data) ? response.data : (response.data.orders || []));
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);
      await api.post(`/orders/${orderId}/status`, { status: newStatus });
      showToast(`Order updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
      await fetchOrders();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update order', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      AT_CENTER: 'bg-cyan-100 text-cyan-800',
      PROCESSING: 'bg-yellow-100 text-yellow-800',
      QC: 'bg-orange-100 text-orange-800',
      READY_FOR_DELIVERY: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNextStatus = (currentStatus: string) => {
    const flow: Record<string, { status: string; label: string }> = {
      AT_CENTER: { status: 'PROCESSING', label: 'Start Processing' },
      PROCESSING: { status: 'QC', label: 'Move to QC' },
      QC: { status: 'READY_FOR_DELIVERY', label: 'Mark Ready for Delivery' },
    };
    return flow[currentStatus];
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`;
  };

  const filteredOrders = allOrders.filter(o => o.status === statusFilter);

  if (loading && allOrders.length === 0) {
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
            <h1 className="text-4xl font-bold text-primary-900 mb-2">Center Operations</h1>
            <p className="text-secondary-500">Process and manage orders at the center</p>
          </div>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>

        {/* Stats - Always show ALL orders */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-cyan-50 border-cyan-200 p-4">
            <p className="text-sm text-cyan-600 font-medium">At Center</p>
            <p className="text-2xl font-bold text-cyan-900">
              {allOrders.filter(o => o.status === 'AT_CENTER').length}
            </p>
          </div>
          <div className="card bg-yellow-50 border-yellow-200 p-4">
            <p className="text-sm text-yellow-600 font-medium">Processing</p>
            <p className="text-2xl font-bold text-yellow-900">
              {allOrders.filter(o => o.status === 'PROCESSING').length}
            </p>
          </div>
          <div className="card bg-orange-50 border-orange-200 p-4">
            <p className="text-sm text-orange-600 font-medium">Quality Check</p>
            <p className="text-2xl font-bold text-orange-900">
              {allOrders.filter(o => o.status === 'QC').length}
            </p>
          </div>
          <div className="card bg-emerald-50 border-emerald-200 p-4">
            <p className="text-sm text-emerald-600 font-medium">Ready</p>
            <p className="text-2xl font-bold text-emerald-900">
              {allOrders.filter(o => o.status === 'READY_FOR_DELIVERY').length}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="card bg-white p-4">
          <label className="text-sm font-medium text-secondary-700 mb-2 block">Filter by Stage:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field max-w-xs"
          >
            <option value="AT_CENTER">At Center</option>
            <option value="PROCESSING">Processing</option>
            <option value="QC">Quality Check</option>
            <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
          </select>
        </div>

        {/* Orders List - Show filtered orders */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="card bg-white p-12 text-center">
              <p className="text-secondary-500">No orders at this stage</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const nextAction = getNextStatus(order.status);
              return (
                <div key={order.id} className="card bg-white p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-secondary-900">{order.user.name}</h3>
                      <p className="text-sm text-secondary-500">{order.user.phone}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        {order.deliveryType === 'PREMIUM' && (
                          <span className="text-xs text-amber-600 font-medium">⚡ Premium</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-secondary-900">{formatCurrency(order.totalCents)}</p>
                      <p className="text-xs text-secondary-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-secondary-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-secondary-700 mb-2">Items:</h4>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-secondary-600">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  {nextAction && (
                    <button
                      onClick={() => updateOrderStatus(order.id, nextAction.status)}
                      disabled={updating === order.id}
                      className="btn-primary w-full"
                    >
                      {updating === order.id ? 'Updating...' : nextAction.label}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CenterOperatorDashboard;
