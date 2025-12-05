import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { Wallet } from '../types';
import api from '../services/api';

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ wallet: Wallet }>('/wallet');
      setWallet(response.data.wallet);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load wallet', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);

    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const coins = Math.round(amount * 100);
      await api.post('/wallet/topup', { coins });

      showToast(`Successfully added ₹${amount.toFixed(2)} to your wallet`, 'success');
      setTopupAmount('');
      await fetchWallet();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to top up wallet', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`;
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

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
          <h1 className="text-4xl font-bold text-primary-900">Wallet</h1>
          <p className="text-secondary-500 mt-2">Manage your wallet balance</p>
        </div>

        {/* Current Balance Card */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-xl shadow-primary-500/30 p-8 mb-8 text-white relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-primary-100 text-sm font-medium mb-2 uppercase tracking-wider">Current Balance</p>
            <p className="text-5xl font-bold mb-4 tracking-tight">
              {wallet ? formatCurrency(wallet.coins) : '₹0.00'}
            </p>
            <div className="flex items-center gap-2 text-primary-100 text-sm bg-white/10 inline-flex px-3 py-1 rounded-full backdrop-blur-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Available for orders
            </div>
          </div>
        </div>

        {/* Top-up Form */}
        <div className="card bg-white p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl font-bold text-secondary-900 mb-6">Add Money</h2>

          <form onSubmit={handleTopup}>
            <div className="mb-8">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Enter Amount (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-secondary-500 font-bold text-lg">₹</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-field pl-10 text-lg font-medium"
                  required
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-8">
              <p className="text-sm font-medium text-secondary-600 mb-3">Quick Add</p>
              <div className="flex flex-wrap gap-3">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTopupAmount(amount.toString())}
                    className="px-4 py-2 border border-secondary-200 rounded-xl hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700 transition-all text-sm font-semibold text-secondary-600 bg-white shadow-sm"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !topupAmount}
              className="btn-primary w-full py-4 text-lg shadow-lg shadow-primary-500/30"
            >
              {submitting ? 'Processing...' : 'Add Money'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-secondary-50 rounded-xl border border-secondary-100 flex items-start gap-3">
            <svg className="w-5 h-5 text-secondary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-secondary-600">
              <strong>Note:</strong> This is a demo MVP. In production, this would integrate with a payment gateway like Razorpay or Stripe.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WalletPage;
