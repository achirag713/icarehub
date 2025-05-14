import React from 'react';
import Sidebar from '../components/Sidebar';
// Removed Header import
import './PatientLayout.css';

const PatientLayout = ({ children }) => {
  return (
    <div className="patient-layout">
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

export default PatientLayout;