import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { DatabaseSchemaViewer } from './DatabaseSchemaViewer';
import { Logo } from './Logo';
import { PAGE_SCHEMAS } from '../data/schemaData';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
              <Link to={getDashboardLink()} className="group">
                <Logo size="sm" showText={true} className="group-hover:scale-105 transition-transform" />
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

      {/* Database Schema Viewer */}
      <DatabaseSchemaViewer tables={getPageSchemas(location.pathname)} />
    </div>
  );
};

// Helper function to get schemas for current page
function getPageSchemas(pathname: string): string[] {
  // Auth pages
  if (pathname === '/login') return PAGE_SCHEMAS['login'];
  if (pathname === '/signup') return PAGE_SCHEMAS['signup'];
  
  // Map pathname to schema key
  if (pathname.includes('/user/dashboard')) return PAGE_SCHEMAS['user-dashboard'];
  if (pathname.includes('/user/orders/new')) return PAGE_SCHEMAS['create-order'];
  if (pathname.includes('/user/orders/')) return PAGE_SCHEMAS['order-detail'];
  if (pathname.includes('/user/wallet')) return PAGE_SCHEMAS['wallet'];
  if (pathname.includes('/user/addresses')) return PAGE_SCHEMAS['addresses'];
  if (pathname.includes('/user/referral')) return PAGE_SCHEMAS['referral'];
  
  if (pathname.includes('/delivery/dashboard')) return PAGE_SCHEMAS['delivery-dashboard'];
  if (pathname.includes('/delivery/trips/')) return PAGE_SCHEMAS['delivery-trip'];
  
  if (pathname.includes('/manager/dashboard')) return PAGE_SCHEMAS['manager-dashboard'];
  if (pathname.includes('/manager/orders')) return PAGE_SCHEMAS['manager-orders'];
  if (pathname.includes('/manager/trips/') && pathname.split('/').length > 3) return PAGE_SCHEMAS['manager-trip-detail'];
  if (pathname.includes('/manager/trips')) return PAGE_SCHEMAS['manager-trips'];
  if (pathname.includes('/manager/delivery-partners')) return PAGE_SCHEMAS['manager-partners'];
  
  if (pathname.includes('/operator/dashboard')) return PAGE_SCHEMAS['operator-dashboard'];
  
  if (pathname.includes('/admin/dashboard')) return PAGE_SCHEMAS['admin-dashboard'];
  if (pathname.includes('/admin/timeslots')) return PAGE_SCHEMAS['admin-timeslots'];
  if (pathname.includes('/admin/services')) return PAGE_SCHEMAS['admin-services'];
  if (pathname.includes('/admin/centers')) return PAGE_SCHEMAS['admin-centers'];
  if (pathname.includes('/admin/payouts')) return PAGE_SCHEMAS['admin-payouts'];
  
  return [];
}

export default Layout;
