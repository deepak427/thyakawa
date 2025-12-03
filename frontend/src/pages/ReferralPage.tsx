import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalEarned: number;
}

const ReferralPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ stats: ReferralStats }>('/users/referral-stats');
      setStats(response.data.stats);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load referral stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      showToast('Referral code copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferral = () => {
    const text = `Join our premium ironing service using my referral code: ${stats?.referralCode} and get ₹50 bonus in your wallet!`;
    const url = `${window.location.origin}/signup?ref=${stats?.referralCode}`;
    
    if (navigator.share) {
      navigator.share({ title: 'Join Our Service', text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      showToast('Referral link copied!', 'success');
    }
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
          <h1 className="text-4xl font-bold text-primary-900">Refer & Earn</h1>
          <p className="text-secondary-500 mt-2">Invite friends and earn rewards</p>
        </div>

        {/* Referral Code Card */}
        <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl shadow-xl shadow-accent-500/30 p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <p className="text-accent-100 text-sm font-medium mb-2 uppercase tracking-wider">Your Referral Code</p>
            <div className="flex items-center gap-4 mb-6">
              <p className="text-4xl font-bold tracking-wider font-mono bg-white/20 px-6 py-3 rounded-xl backdrop-blur-sm">
                {stats?.referralCode || 'LOADING'}
              </p>
              <button
                onClick={copyReferralCode}
                className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition border border-white/30 flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <button
              onClick={shareReferral}
              className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition flex items-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share with Friends
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-secondary-500 text-sm font-medium">Total Referrals</p>
                <p className="text-3xl font-bold text-secondary-900">{stats?.totalReferrals || 0}</p>
              </div>
            </div>
          </div>

          <div className="card bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent-100 rounded-xl text-accent-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-secondary-500 text-sm font-medium">Total Earned</p>
                <p className="text-3xl font-bold text-accent-600">₹{((stats?.totalEarned || 0) / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="card bg-white p-8">
          <h2 className="text-2xl font-bold text-secondary-900 mb-6">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900 mb-1">Share Your Code</h3>
                <p className="text-secondary-600">Share your unique referral code with friends and family</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900 mb-1">They Sign Up</h3>
                <p className="text-secondary-600">Your friend signs up using your referral code and gets ₹50 bonus</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900 mb-1">You Both Earn</h3>
                <p className="text-secondary-600">When they place their first order, you get ₹100 in your wallet!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReferralPage;
