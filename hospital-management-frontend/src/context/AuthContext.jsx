import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserFromToken, removeToken } from '../utils/JwtHelper';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const initAuth = () => {
      const userData = getUserFromToken();
      if (userData) {
        console.log('Initializing auth with user data:', userData);
        // Ensure name property exists (backwards compatibility)
        if (userData.username && !userData.name) {
          userData.name = userData.username;
        }
        setUser(userData);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData) => {
    console.log('Login called with user data:', userData);
    if (!userData || !userData.role) {
      console.error('Invalid user data provided to login:', userData);
      return;
    }
    
    // Ensure name property exists (backwards compatibility)
    if (userData.username && !userData.name) {
      userData.name = userData.username;
    }
    
    setUser(userData);
    console.log('User state updated:', userData);
  };

  const logout = () => {
    console.log('Logout called');
    setUser(null);
    removeToken();
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;