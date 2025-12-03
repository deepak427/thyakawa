import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const userRoleString = user.role as string;
    const allowedRoleStrings = allowedRoles.map(r => r as string);
    
    if (!allowedRoleStrings.includes(userRoleString)) {
      console.log('Access denied:', { 
        userRole: userRoleString, 
        allowedRoles: allowedRoleStrings, 
        user,
        comparison: allowedRoleStrings.map(r => `${r} === ${userRoleString} ? ${r === userRoleString}`)
      });
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500 mt-2">Your role: {userRoleString}</p>
            <p className="text-sm text-gray-500">Required: {allowedRoleStrings.join(', ')}</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
