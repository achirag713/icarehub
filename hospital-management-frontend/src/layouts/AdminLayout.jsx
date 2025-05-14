import React from 'react';
import Sidebar from '../components/Sidebar';
// Removed Header import
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-content">
        {/* Removed Header component */}
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;