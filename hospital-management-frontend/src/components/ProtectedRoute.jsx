import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';

const ProtectedRoute = ({ element, allowedRoles = [] }) => {
  const { user } = useAuth();
  const { role } = useRole();
  
  // Debug output
  console.log('ProtectedRoute user:', user, 'role:', role);
  
  // If user is not authenticated, redirect to sign-in page
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  // Get the effective role (from role context or user object)
  const effectiveRole = (role || user.role || '').toLowerCase();
  
  // If allowedRoles is empty or the user's role is in the allowed roles, render the element
  if (allowedRoles.length === 0 || allowedRoles.map(r => r.toLowerCase()).includes(effectiveRole)) {
    return element;
  }
  
  // If user doesn't have the required role, redirect to their dashboard
  switch (effectiveRole) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'doctor':
      return <Navigate to="/doctor/dashboard" replace />;
    case 'patient':
      return <Navigate to="/patient/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;