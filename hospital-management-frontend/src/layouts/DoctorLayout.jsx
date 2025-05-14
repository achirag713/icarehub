import React from 'react';
import Sidebar from '../components/Sidebar';
// Removed Header import
import './DoctorLayout.css';

const DoctorLayout = ({ children }) => {
  return (
    <div className="doctor-layout">
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

export default DoctorLayout;