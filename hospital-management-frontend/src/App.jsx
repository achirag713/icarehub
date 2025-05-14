import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <RoleProvider>
            <AppRoutes />
        </RoleProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
