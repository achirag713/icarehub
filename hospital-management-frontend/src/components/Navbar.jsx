import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import icarehub from'../assets/icarehub.png';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Debug output
  console.log('Navbar user:', user, 'role:', user?.role);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Determine user role safely
  const userRole = user && typeof user === 'object' && user.role ? user.role : null;
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Hospital Management System
        </Link>

        <div className={`menu-icon ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={() => setMenuOpen(false)}
            >
              Home
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink 
              to="/about-us" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={() => setMenuOpen(false)}
            >
              About Us
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink 
              to="/contact-us" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={() => setMenuOpen(false)}
            >
              Contact Us
            </NavLink>
          </li>
          {!user ? (
            <>
              <li className="nav-item">
                <NavLink 
                  to="/signin" 
                  className="nav-link btn-outline"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink 
                  to="/signup" 
                  className="nav-link btn-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <NavLink 
                  to={userRole ? `/${userRole.toLowerCase()}/dashboard` : '/dashboard'}
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </NavLink>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link btn-outline">
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
