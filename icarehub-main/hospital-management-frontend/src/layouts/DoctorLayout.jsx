import React from 'react';
import Sidebar from '../components/Sidebar';
import './DoctorLayout.css';

const DoctorLayout = ({ children }) => {
  return (
    <div className="doctor-layout">
      <Sidebar />
      <div className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DoctorLayout;