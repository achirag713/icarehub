import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patient } from '../services/api';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [patientProfile, setPatientProfile] = useState(null);

  // Debug output
  useEffect(() => {
    console.log('Sidebar mounted with user:', user);
  }, [user]);

  // Fetch additional patient data if user is patient
  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (user && user.role && user.role.toLowerCase() === 'patient') {
        try {
          const response = await patient.getProfile();
          setPatientProfile(response.data);
          console.log('Patient profile loaded:', response.data);
        } catch (error) {
          console.error('Error loading patient profile:', error);
        }
      }
    };

    fetchPatientProfile();
  }, [user]);

  const handleLogout = () => {
    console.log('Logout clicked');
    logout();
    navigate('/');
  };

  const getMenuItems = () => {
    if (!user || !user.role) {
      console.error('No user or role found in Sidebar');
      return [];
    }

    const role = user.role.toLowerCase();
    console.log('Getting menu items for role:', role);
    
    switch (role) {
      case 'admin':
        return [
          { icon: '📊', label: 'Dashboard', path: '/admin/dashboard' },
          { icon: '👨‍⚕️', label: 'Doctors', path: '/admin/doctors' },
          { icon: '🏥', label: 'Patients', path: '/admin/patients' },
          { icon: '📅', label: 'Appointments', path: '/admin/appointments' },
          { icon: '⚙️', label: 'Settings', path: '/admin/settings' },
        ];
      case 'doctor':
        return [
          { icon: '📊', label: 'Dashboard', path: '/doctor/dashboard' },
          { icon: '👥', label: 'My Patients', path: '/doctor/my-patients' },
          { icon: '📅', label: 'Appointments', path: '/doctor/appointments' },
          { icon: '⚙️', label: 'Settings', path: '/doctor/settings' },
        ];
      case 'patient':
        return [
          { icon: '📊', label: 'Dashboard', path: '/patient/dashboard' },
          { icon: '👨‍⚕️', label: 'Find Doctors', path: '/patient/find-doctors' },
          { icon: '📅', label: 'Book Appointment', path: '/patient/book-appointments' },
          { icon: '📋', label: 'My Bookings', path: '/patient/my-bookings' },
          { icon: '📁', label: 'Medical Records', path: '/patient/medical-records' },
          { icon: '💳', label: 'Billings', path: '/patient/billings' },
          { icon: '⚙️', label: 'Settings', path: '/patient/settings' },
        ];
      default:
        console.error('Unknown role:', role);
        return [];
    }
  };

  const menuItems = getMenuItems();
  console.log('Menu items:', menuItems);

  if (!user) {
    console.error('No user found in Sidebar');
    return null;
  }

  // Determine the name to display
  const displayName = (() => {
    // If patient profile is loaded and has a name, use it
    if (patientProfile && patientProfile.name) {
      return patientProfile.name;
    }
    // Otherwise use the name from auth context if available
    if (user.name) {
      return user.name;
    }
    // Fall back to username if name is not available
    if (user.username) {
      return user.username;
    }
    // Default fallback
    return user.role || 'User';
  })();

  return (
    <div className={`sidebar ${user.role.toLowerCase()}-sidebar`}>
      <div className="user-profile">
        <div className="avatar">
          {displayName?.charAt(0) || 'U'}
        </div>
        <div className="user-info">
          <h3>{displayName}</h3>
          <p>{user.email || 'user@example.com'}</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span className="label">Logout</span>
        </button>
      </div>

      <div className="menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `menu-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;