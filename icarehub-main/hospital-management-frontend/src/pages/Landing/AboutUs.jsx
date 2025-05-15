import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-us-page">
      <Navbar />
      
      <div className="about-us-container">
        <div className="container">
          <section className="about-us-hero">
            <h1>About Us</h1>
            <p className="lead">We provide top-tier healthcare services with modern facilities and expert staff.</p>
          </section>
          
          <section className="about-us-content">
            <div className="about-us-section">
              <h2>Our Mission</h2>
              <p>
                At Hospital Management System, our mission is to deliver exceptional healthcare 
                services that improve the quality of life for our patients. We are committed to 
                providing compassionate care, innovative treatments, and personalized attention 
                to each individual who walks through our doors.
              </p>
            </div>
            
            <div className="about-us-section">
              <h2>Our Vision</h2>
              <p>
                To be the leading healthcare provider focused on delivering personalized, 
                high-quality medical care to our patients. We strive to create a healthcare 
                environment where patients feel valued, respected, and cared for at every step 
                of their treatment journey.
              </p>
            </div>
            
            <div className="about-us-section">
              <h2>Our Values</h2>
              <ul>
                <li><strong>Patient-Centered Care:</strong> We put patients at the center of everything we do.</li>
                <li><strong>Excellence:</strong> We strive for excellence in all aspects of healthcare delivery.</li>
                <li><strong>Integrity:</strong> We act with honesty, transparency, and ethical behavior.</li>
                <li><strong>Compassion:</strong> We treat everyone with dignity, respect, and empathy.</li>
                <li><strong>Innovation:</strong> We embrace new technologies and approaches to improve care.</li>
              </ul>
            </div>
            
            <div className="about-us-section">
              <h2>Our Team</h2>
              <p>
                Our hospital is staffed with experienced medical professionals dedicated to providing 
                the best healthcare experience. Our team includes specialists in various fields, 
                all committed to delivering exceptional care to our patients.
              </p>
              <p>
                From our front desk staff to our medical specialists, everyone at Hospital Management 
                System works together to ensure you receive the highest level of care.
              </p>
            </div>
          </section>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutUs;
