import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { Order, Wallet } from '../types';
import api from '../services/api';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, walletRes] = await Promise.all([
        api.get<{ orders: Order[] }>('/orders/user'),
        api.get<{ wallet: Wallet }>('/wallet'),
      ]);
      setOrders(ordersRes.data.orders || []);
      setWallet(walletRes.data.wallet);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLACED: 'bg-blue-100 text-blue-800 border-blue-200',
      ASSIGNED_TO_PARTNER: 'bg-purple-100 text-purple-800 border-purple-200',
      PICKUP_PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PICKED_UP: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      AT_CENTER: 'bg-orange-100 text-orange-800 border-orange-200',
      PROCESSING: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      QC: 'bg-teal-100 text-teal-800 border-teal-200',
      READY_FOR_DELIVERY: 'bg-lime-100 text-lime-800 border-lime-200',
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-primary-900 mb-2">Welcome, {user?.name}!</h1>
            <p className="text-secondary-500">Manage your ironing orders and account</p>
          </div>
          <button
            onClick={() => navigate('/user/orders/new')}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New Order
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wallet Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-premium p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-primary-100 text-sm font-medium mb-1">Wallet Balance</p>
                <p className="text-4xl font-bold font-display">{wallet ? formatCurrency(wallet.balanceCents) : '₹0.00'}</p>
              </div>
              <button
                onClick={() => navigate('/user/wallet')}
                className="bg-white/20 backdrop-blur-md text-white px-6 py-2 rounded-xl font-semibold hover:bg-white/30 transition border border-white/30"
              >
                Top Up
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card flex flex-col justify-center gap-4">
            <button
              onClick={() => navigate('/user/addresses')}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600 group-hover:text-primary-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="font-medium text-secondary-700">Manage Addresses</span>
              </div>
              <svg className="w-5 h-5 text-secondary-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => navigate('/user/transactions')}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600 group-hover:text-primary-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="font-medium text-secondary-700">Transaction History</span>
              </div>
              <svg className="w-5 h-5 text-secondary-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => navigate('/user/referral')}
              className="flex items-center justify-between p-4 rounded-xl bg-accent-50 hover:bg-accent-100 transition group border border-accent-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-accent-600 group-hover:text-accent-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <span className="font-medium text-accent-700">Refer & Earn</span>
              </div>
              <svg className="w-5 h-5 text-accent-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-secondary-900">Recent Orders</h2>
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-secondary-300">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-secondary-500 mb-4">No orders placed yet</p>
              <button
                onClick={() => navigate('/user/orders/new')}
                className="text-primary-600 hover:text-primary-700 font-semibold hover:underline"
              >
                Start your first order today
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/user/orders/${order.id}`)}
                  className="bg-white rounded-xl p-6 shadow-sm border border-secondary-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-secondary-900">Order #{order.id?.slice(0, 8)}</h3>
                          <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                            {order.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-secondary-500">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-8 pl-14 md:pl-0">
                      <div>
                        <p className="text-xs text-secondary-400 uppercase tracking-wider font-medium">Items</p>
                        <p className="font-semibold text-secondary-700">{order.items?.length || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-secondary-400 uppercase tracking-wider font-medium">Total</p>
                        <p className="font-bold text-primary-600 text-lg">{formatCurrency(order.totalCents)}</p>
                      </div>
                      <div className="hidden md:block text-secondary-300 group-hover:text-primary-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
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

export default UserDashboard;
