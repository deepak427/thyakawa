import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';

    switch (user.role) {
      case Role.USER:
        return '/user/dashboard';
      case Role.DELIVERY_PERSON:
        return '/delivery/dashboard';
      case Role.FLOOR_MANAGER:
        return '/manager/dashboard';
      case Role.ADMIN:
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const getRoleName = () => {
    if (!user) return '';

    switch (user.role) {
      case Role.USER:
        return 'Customer';
      case Role.DELIVERY_PERSON:
        return 'Delivery Person';
      case Role.FLOOR_MANAGER:
        return 'Floor Manager';
      case Role.ADMIN:
        return 'Admin';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 relative">
      {/* Background decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to={getDashboardLink()} className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xl font-display font-bold text-secondary-900 tracking-tight">Ironing<span className="text-primary-600">Service</span></span>
              </Link>
            </div>

            {user && (
              <div className="flex items-center space-x-6">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-bold text-secondary-900">{user.name}</p>
                  <p className="text-xs text-secondary-500 font-medium">{getRoleName()}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-secondary-400 hover:text-accent-500 hover:bg-accent-50 rounded-xl transition-all"
                  title="Logout"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
