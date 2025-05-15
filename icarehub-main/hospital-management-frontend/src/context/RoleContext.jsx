import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserFromToken } from '../utils/JwtHelper';
import { useAuth } from './AuthContext';

const RoleContext = createContext(null);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize role from token on mount
    const userData = getUserFromToken();
    if (userData?.role) {
      setRole(userData.role);
    }
  }, []);

  // Keep role in sync with user's role from AuthContext
  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  const updateRole = (newRole) => {
    setRole(newRole);
  };

  const value = {
    role,
    updateRole,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export default RoleContext;