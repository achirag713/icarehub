import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Hospital Management System</h3>
            <p>
              Providing quality healthcare services with cutting-edge
              technology and experienced medical professionals.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f">📘</i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter">🐦</i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram">📷</i></a>
              <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in">💼</i></a>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about-us">About Us</Link></li>
              <li><Link to="/contact-us">Contact Us</Link></li>
              <li><Link to="/signin">Sign In</Link></li>
              <li><Link to="/signup">Sign Up</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Services</h3>
            <ul className="footer-links">
              <li><a href="#">Emergency Care</a></li>
              <li><a href="#">Outpatient Services</a></li>
              <li><a href="#">Laboratory Services</a></li>
              <li><a href="#">Pharmacy</a></li>
              <li><a href="#">Rehabilitation</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact Us</h3>
            <p>
              <i className="fas fa-map-marker-alt">📍</i> 123 Health Avenue, Medical District
            </p>
            <p>
              <i className="fas fa-phone">📞</i> +1 (555) 123-4567
            </p>
            <p>
              <i className="fas fa-envelope">📧</i> info@hospitalmgmt.com
            </p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} Hospital Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;