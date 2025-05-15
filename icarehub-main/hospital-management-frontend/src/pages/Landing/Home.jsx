import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import hmsLogo from '../../assets/hms.png';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Quality Healthcare for a Better Life</h1>
            <p>
              Our hospital provides comprehensive healthcare services with 
              state-of-the-art facilities and experienced medical professionals.
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary">Register Now</Link>
              <Link to="/signin" className="btn btn-outline">Sign In</Link>
            </div>
          </div>
          <div className="hero-image">
            {hmsLogo && <img src={hmsLogo} alt="Hospital Management System" />}
          </div>
        </div>
      </section>
      
      {/* Services Section */}
      <section className="services">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">🏥</div>
              <h3>Emergency Care</h3>
              <p>24/7 emergency services with rapid response teams.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">👨‍⚕️</div>
              <h3>Expert Doctors</h3>
              <p>Experienced specialists across various medical fields.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">💊</div>
              <h3>Pharmacy</h3>
              <p>In-house pharmacy with all essential medications.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🔬</div>
              <h3>Lab Services</h3>
              <p>Advanced laboratory with quick result delivery.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* About Section */}
      <section className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>About Our Hospital</h2>
              <p>
                With over 20 years of experience in healthcare, our hospital has been
                providing quality medical services to the community. Our team of dedicated
                doctors, nurses, and support staff work together to ensure the best care
                for our patients.
              </p>
              <p>
                We are equipped with modern facilities and the latest medical technologies
                to diagnose and treat various health conditions effectively.
              </p>
              <Link to="/about-us" className="btn btn-secondary">Learn More</Link>
            </div>
            <div className="about-image">
              {hmsLogo && <img src={hmsLogo} alt="Hospital Management System Logo" />}
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Home;
