import React from 'react';
import Sidebar from '../components/Sidebar';
import './PatientLayout.css';

const PatientLayout = ({ children }) => {
  return (
    <div className="patient-layout">
      <Sidebar />
      <div className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PatientLayout;