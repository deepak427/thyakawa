import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components';
import { DatabaseSchemaViewer } from '../components/DatabaseSchemaViewer';
import { Logo } from '../components/Logo';
import { Role } from '../types';
import api from '../services/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, setAuthData } = useAuth();
  const { showToast } = useToast();

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
  });
  const [otp, setOtp] = useState('');
  const [displayedOtp, setDisplayedOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show success message from signup
    if (location.state?.message) {
      showToast(location.state.message, 'success');
      // Clear state to prevent showing toast again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, showToast]);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      redirectBasedOnRole(user.role);
    }
  }, [isAuthenticated, user]);

  const redirectBasedOnRole = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        navigate('/admin/dashboard');
        break;
      case Role.FLOOR_MANAGER:
        navigate('/manager/dashboard');
        break;
      case Role.CENTER_OPERATOR:
        navigate('/operator/dashboard');
        break;
      case Role.DELIVERY_PERSON:
        navigate('/delivery/dashboard');
        break;
      case Role.USER:
      default:
        navigate('/user/dashboard');
        break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData);
      showToast('Welcome back!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Invalid email or password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone) {
      showToast('Please enter your phone number', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/send-otp', { phone: formData.phone });
      
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
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthData(token, user);

      showToast('Welcome back!', 'success');
      redirectBasedOnRole(user.role);
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
          <h1 className="text-3xl font-bold text-primary-900 mb-2">Welcome Back</h1>
          <p className="text-secondary-500">
            {step === 'otp' ? 'Verify your phone number' : 'Login to your account'}
          </p>
        </div>

        {step === 'credentials' && (
          <>
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  loginMethod === 'phone'
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                }`}
              >
                Phone OTP
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  loginMethod === 'email'
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                }`}
              >
                Email
              </button>
            </div>

            {loginMethod === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {loading ? <LoadingSpinner /> : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {loading ? <LoadingSpinner /> : 'Login'}
                </button>
              </form>
            )}
          </>
        )}

        {step === 'otp' && (
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
                  setStep('credentials');
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
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-primary-600 font-semibold hover:text-primary-700 transition"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>

      {/* Database Schema Viewer */}
      <DatabaseSchemaViewer tables={['User']} />
    </div>
  );
};

export default LoginPage;
