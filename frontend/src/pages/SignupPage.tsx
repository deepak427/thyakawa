import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components';
import { DatabaseSchemaViewer } from '../components/DatabaseSchemaViewer';
import { Logo } from '../components/Logo';
import api from '../services/api';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    referralCode: '',
  });
  const [otp, setOtp] = useState('');
  const [displayedOtp, setDisplayedOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.name) {
      showToast('Please enter your name and phone number', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/send-otp', { phone: formData.phone });
      
      // For development, show OTP on screen
      if (response.data.otp) {
        setDisplayedOtp(response.data.otp);
      }
      
      showToast('OTP sent successfully!', 'success');
      setStep('otp');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        phone: formData.phone,
        otp,
        name: formData.name,
        email: formData.email || undefined,
        referralCode: formData.referralCode || undefined,
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthData(token, user);

      showToast('Welcome! Account created successfully', 'success');
      navigate('/user/dashboard');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Invalid OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="max-w-md w-full glass-panel rounded-2xl p-8 relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={true} />
          </div>
          <h1 className="text-3xl font-bold text-primary-900 mb-2">Create Account</h1>
          <p className="text-secondary-500">
            {step === 'phone' ? 'Join our ironing service today' : 'Verify your phone number'}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                Email Address <span className="text-secondary-400">(Optional)</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-secondary-700 mb-2">
                Referral Code <span className="text-secondary-400">(Optional)</span>
              </label>
              <input
                type="text"
                id="referralCode"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                className="input-field uppercase"
                placeholder="Enter referral code"
              />
              {formData.referralCode && (
                <p className="mt-1 text-sm text-accent-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  Get ₹50 bonus on signup!
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? <LoadingSpinner /> : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-secondary-700 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="input-field text-center text-2xl tracking-widest font-semibold"
                placeholder="000000"
                autoFocus
              />
              <p className="mt-2 text-sm text-secondary-500 text-center">
                OTP sent to {formData.phone}
              </p>
            </div>

            {displayedOtp && (
              <div className="bg-accent-50 border-2 border-accent-200 rounded-lg p-4 text-center">
                <p className="text-sm text-accent-700 font-medium mb-1">Development Mode</p>
                <p className="text-2xl font-bold text-accent-900 tracking-widest">{displayedOtp}</p>
                <p className="text-xs text-accent-600 mt-1">This will be sent via SMS in production</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setDisplayedOtp('');
                }}
                className="btn-secondary px-6 py-3"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary flex items-center justify-center"
              >
                {loading ? <LoadingSpinner /> : 'Verify OTP'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full text-primary-600 font-medium hover:text-primary-700 transition text-sm"
            >
              Resend OTP
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-secondary-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary-600 font-semibold hover:text-primary-700 transition"
            >
              Login
            </button>
          </p>
        </div>
      </div>

      {/* Database Schema Viewer */}
      <DatabaseSchemaViewer tables={['User', 'Wallet']} />
    </div>
  );
};

export default SignupPage;
