import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { Order } from '../types';
import api from '../services/api';

interface PartnerAssignmentsResponse {
  orders: Order[];
}

const PartnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.get<PartnerAssignmentsResponse>('/partner/assignments');
      setOrders(response.data.orders || []);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ASSIGNED_FOR_PICKUP: 'bg-purple-100 text-purple-800 border-purple-200',
      PICKED_UP: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      AT_CENTER: 'bg-orange-100 text-orange-800 border-orange-200',
      PROCESSING: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      QC: 'bg-teal-100 text-teal-800 border-teal-200',
      READY_FOR_DELIVERY: 'bg-lime-100 text-lime-800 border-lime-200',
      ASSIGNED_FOR_DELIVERY: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-800 border-amber-200',
      DELIVERED: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ASSIGNED_FOR_PICKUP') {
      return 'Pickup Required';
    } else if (status === 'READY_FOR_DELIVERY' || status === 'OUT_FOR_DELIVERY') {
      return 'Delivery Required';
    } else if (status === 'PICKED_UP' || status === 'AT_CENTER' || status === 'PROCESSING' || status === 'QC') {
      return 'At Center';
    } else if (status === 'DELIVERED') {
      return 'Delivered';
    }
    return status.replace(/_/g, ' ');
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
          <h1 className="text-4xl font-bold text-primary-900 mb-2">Partner Dashboard</h1>
          <p className="text-secondary-500">Welcome, {user?.name}! Manage your pickup and delivery assignments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-gradient-to-br from-white to-secondary-50">
            <p className="text-sm font-medium text-secondary-500 mb-1">Total Assignments</p>
            <p className="text-3xl font-bold text-secondary-900">{orders.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
            <p className="text-sm font-medium text-yellow-700 mb-1">Pending Pickups</p>
            <p className="text-3xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'ASSIGNED_FOR_PICKUP').length}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-amber-50 to-white border-amber-100">
            <p className="text-sm font-medium text-amber-700 mb-1">Pending Deliveries</p>
            <p className="text-3xl font-bold text-amber-600">
              {orders.filter(o => o.status === 'READY_FOR_DELIVERY' || o.status === 'OUT_FOR_DELIVERY').length}
            </p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-secondary-900">Your Assignments</h2>
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-secondary-300">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-secondary-500 mb-2">No assignments yet</p>
              <p className="text-sm text-secondary-400">Check back later for new orders</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/partner/orders/${order.id}`)}
                  className="bg-white rounded-xl p-6 shadow-sm border border-secondary-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-secondary-900 text-lg">Order #{order.id?.slice(0, 8)}</h3>
                        <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {getStatusBadge(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600 text-lg">{formatCurrency(order.totalCoins)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Address */}
                    {order.address && (
                      <div className="bg-secondary-50 rounded-lg p-3 border border-secondary-100">
                        <p className="text-xs text-secondary-500 uppercase tracking-wider font-medium mb-1">Delivery Address</p>
                        <p className="text-sm font-medium text-secondary-900">{order.address}</p>
                        <p className="text-xs text-secondary-600">
                          {order.address}, {order.address.pincode}
                        </p>
                      </div>
                    )}

                    {/* Timeslot */}
                    {order.timeslot && (
                      <div className="bg-secondary-50 rounded-lg p-3 border border-secondary-100">
                        <p className="text-xs text-secondary-500 uppercase tracking-wider font-medium mb-1">Pickup Timeslot</p>
                        <p className="text-sm font-medium text-secondary-900">
                          {new Date(order.timeslot.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <p className="text-xs text-secondary-600">
                          {order.timeslot.startTime} - {order.timeslot.endTime}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items Summary */}
                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-secondary-100">
                    <p className="text-sm text-secondary-600 font-medium">
                      {order.items?.length || 0} item(s)
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/partner/orders/${order.id}`);
                      }}
                      className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                    >
                      View Details <span>→</span>
                    </button>
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

export default PartnerDashboard;
