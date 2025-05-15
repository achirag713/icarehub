import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaHome, FaCalendarAlt, FaFileMedical, FaMoneyBill, FaCog } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderNavigationLinks = () => {
    if (!user) return null;

    switch (user.role) {
      case 'Patient':
        return (
          <>
            <Link to="/patient/dashboard" className="nav-link">
              <FaHome /> Dashboard
            </Link>
            <Link to="/patient/appointments" className="nav-link">
              <FaCalendarAlt /> Appointments
            </Link>
            <Link to="/patient/medical-records" className="nav-link">
              <FaFileMedical /> Medical Records
            </Link>
            <Link to="/patient/billings" className="nav-link">
              <FaMoneyBill /> Billings
            </Link>
            <Link to="/patient/settings" className="nav-link">
              <FaCog /> Settings
            </Link>
          </>
        );
      case 'Doctor':
        return (
          <>
            <Link to="/doctor/dashboard" className="nav-link">
              <FaHome /> Dashboard
            </Link>
            <Link to="/doctor/appointments" className="nav-link">
              <FaCalendarAlt /> Appointments
            </Link>
            <Link to="/doctor/patients" className="nav-link">
              <FaUser /> Patients
            </Link>
            <Link to="/doctor/settings" className="nav-link">
              <FaCog /> Settings
            </Link>
          </>
        );
      case 'Admin':
        return (
          <>
            <Link to="/admin/dashboard" className="nav-link">
              <FaHome /> Dashboard
            </Link>
            <Link to="/admin/doctors" className="nav-link">
              <FaUser /> Doctors
            </Link>
            <Link to="/admin/patients" className="nav-link">
              <FaUser /> Patients
            </Link>
            <Link to="/admin/settings" className="nav-link">
              <FaCog /> Settings
            </Link>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">ICareHub</Link>
      </div>

      <div className="navbar-menu">
        {user ? (
          <>
            <div className="navbar-links">
              {renderNavigationLinks()}
            </div>
            <div className="navbar-item">
              <span className="user-info">
                <FaUser className="user-icon" />
                {user.name}
              </span>
            </div>
            <div className="navbar-item">
              <button className="logout-btn" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="navbar-item">
              <Link to="/login" className="login-btn">
                <FaSignInAlt /> Login
              </Link>
            </div>
            <div className="navbar-item">
              <Link to="/register" className="register-btn">
                <FaUserPlus /> Register
              </Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 