import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './ContactUs.css';

const ContactUs = () => {
  return (
    <div className="contact-us-page">
      <Navbar />
      
      <div className="contact-us-container">
        <div className="container">
          <section className="contact-us-hero">
            <h1>Contact Us</h1>
            <p className="lead">We're here to help with any questions or concerns you might have.</p>
          </section>
          
          <div className="contact-us-content">
            <div className="contact-us-info">
              <div className="contact-card">
                <h2>Get in Touch</h2>
                <p><strong>Email:</strong> contact@hospitalsys.com</p>
                <p><strong>Phone:</strong> 123-456-7890</p>
                <p><strong>Fax:</strong> 123-456-7891</p>
                
                <h3>Hospital Hours</h3>
                <p><strong>Monday - Friday:</strong> 8:00 AM - 8:00 PM</p>
                <p><strong>Saturday:</strong> 9:00 AM - 5:00 PM</p>
                <p><strong>Sunday:</strong> Emergency Services Only</p>
                
                <h3>Location</h3>
                <p>123 Medical Center Drive<br/>Healthcare City, HC 12345</p>
              </div>
              
              <div className="contact-card">
                <h2>Emergency Services</h2>
                <p>Our emergency department is open 24/7.</p>
                <p>For emergencies, please call: <strong>911</strong></p>
                <p>For urgent but non-emergency situations: <strong>123-456-7899</strong></p>
              </div>
            </div>
            
            <div className="contact-us-form-container">
              <h2>Send Us a Message</h2>
              <form className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" placeholder="Your Name" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" placeholder="Your Email" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" placeholder="Your Phone Number" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input type="text" id="subject" placeholder="Subject" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" rows="5" placeholder="Your Message" required></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ContactUs;
