import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { admin } from '../../services/api';
import './Doctors.css';

// List of specializations
const specializations = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'Ophthalmology',
  'ENT',
  'Gynecology',
  'Urology',
  'Psychiatry',
  'Dentistry',
  'General Medicine'
];

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    specialization: '',
    licenseNumber: '',
    address: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await admin.getDoctors();
        setDoctors(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      phoneNumber: '',
      specialization: '',
      licenseNumber: '',
      address: '',
      password: ''
    });
    setErrors({});
  };

  const handleAddDoctor = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      username: doctor.username,
      email: doctor.email,
      phoneNumber: doctor.phoneNumber,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      address: doctor.address,
      password: ''
    });
    setErrors({});
    setIsEditModalOpen(true);
  };

  const handleRemoveDoctor = async (doctorId) => {
    if (window.confirm('Are you sure you want to remove this doctor?')) {
      try {
        await admin.deleteDoctor(doctorId);
        setDoctors(doctors.filter(doctor => doctor.id !== doctorId));
      } catch (error) {
        console.error('Error removing doctor:', error);
      }
    }
  };

 

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.specialization) {
      newErrors.specialization = 'Specialization is required';
    }
    
    if (!selectedDoctor && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!selectedDoctor && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (selectedDoctor) {
        // Update existing doctor
        await admin.updateDoctor(selectedDoctor.id, formData);
        
        const updatedDoctors = doctors.map(doctor => 
          doctor.id === selectedDoctor.id ? { ...doctor, ...formData } : doctor
        );
        
        setDoctors(updatedDoctors);
        setIsEditModalOpen(false);
        setSelectedDoctor(null);
      } else {
        // Add new doctor
        try {
          const response = await admin.createDoctor(formData);
          console.log('Doctor created successfully:', response.data);
          
          // Reload all doctors to ensure we have the complete updated list
          const doctorsResponse = await admin.getDoctors();
          setDoctors(doctorsResponse.data);
          
          setIsAddModalOpen(false);
        } catch (error) {
          console.error('Failed to create doctor:', error);
          
          // Although there was an error, the doctor might have been created in the database
          // Let's check by reloading the doctor list
          try {
            const doctorsResponse = await admin.getDoctors();
            const newDoctors = doctorsResponse.data;
            
            // Look for a doctor with the email we just tried to create
            const possibleNewDoctor = newDoctors.find(d => d.email === formData.email);
            
            if (possibleNewDoctor) {
              // The doctor was actually created despite the error
              console.log('Doctor was created despite error:', possibleNewDoctor);
              setDoctors(newDoctors);
              setIsAddModalOpen(false);
              alert("Doctor was created successfully, but there was an error displaying the results. The doctor list has been refreshed.");
              resetForm();
              return;
            }
          } catch (listError) {
            console.error('Error checking if doctor was created:', listError);
          }
          
          // If we get here, either the doctor wasn't created or we couldn't verify
          setErrors({
            ...errors,
            form: error.response?.data?.message || 'Error creating doctor'
          });
        }
      }
      resetForm();
    } catch (error) {
      console.error('Error saving doctor:', error);
      // Show error in UI
      if (error.response && error.response.data) {
        setErrors({
          ...errors,
          form: error.response.data.message || 'Error saving doctor'
        });
      } else {
        setErrors({
          ...errors,
          form: 'Error connecting to server'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCloseModal = () => {
    if (isAddModalOpen) {
      setIsAddModalOpen(false);
    }
    if (isEditModalOpen) {
      setIsEditModalOpen(false);
      setSelectedDoctor(null);
    }
    resetForm();
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = (doctor.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (doctor.specialization?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const renderDoctorCard = (doctor) => (
    <div key={doctor.id} className="doctor-card">
      <div className="doctor-header">
        <div className="doctor-info">
          <h2>Dr. {doctor.username}</h2>
         
        </div>
        <div className="doctor-actions">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleEditDoctor(doctor)}
          >
            Edit
          </Button>
          <Button 
            variant="danger" 
            size="sm"
            onClick={() => handleRemoveDoctor(doctor.id)}
          >
            Remove
          </Button>
        </div>
      </div>
      <div className="doctor-details">
        
        <p><strong>Specialization:</strong> {doctor.specialization}</p>
        <p><strong>License:</strong> {doctor.licenseNumber}</p>
        <p><strong>Email:</strong> {doctor.email}</p>
        <p><strong>Phone:</strong> {doctor.phoneNumber}</p>
        <p><strong>Address:</strong> {doctor.address}</p>
      </div>
      <div className="doctor-footer">
        
      </div>
    </div>
  );

  const renderDoctorForm = () => (
    <form id="doctorForm" onSubmit={handleSubmit} className="doctor-form">
      <div className="form-group">
        <label htmlFor="username">Full Name</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className={errors.username ? 'error' : ''}
          placeholder="Enter doctor's full name"
        />
        {errors.username && <div className="error-message">{errors.username}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'error' : ''}
          placeholder="Enter doctor's email"
        />
        {errors.email && <div className="error-message">{errors.email}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="phoneNumber">Phone Number</label>
        <input
          type="text"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          className={errors.phoneNumber ? 'error' : ''}
          placeholder="Enter doctor's phone number"
        />
        {errors.phoneNumber && <div className="error-message">{errors.phoneNumber}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="licenseNumber">License Number</label>
        <input
          type="text"
          id="licenseNumber"
          name="licenseNumber"
          value={formData.licenseNumber}
          onChange={handleChange}
          className={errors.licenseNumber ? 'error' : ''}
          placeholder="Enter doctor's license number"
        />
        {errors.licenseNumber && <div className="error-message">{errors.licenseNumber}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="address">Address</label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className={errors.address ? 'error' : ''}
          placeholder="Enter doctor's address"
          rows="3"
        />
        {errors.address && <div className="error-message">{errors.address}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="specialization">Specialization</label>
        <select
          id="specialization"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          className={errors.specialization ? 'error' : ''}
        >
          <option value="">Select Specialization</option>
          {specializations.map(spec => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
        {errors.specialization && <div className="error-message">{errors.specialization}</div>}
      </div>
      
      

      {!selectedDoctor && (
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? 'error' : ''}
            placeholder="Enter initial password"
          />
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>
      )}
      
      {errors.form && (
        <div className="form-group">
          <div className="error-message form-error">{errors.form}</div>
        </div>
      )}
    </form>
  );

  return (
    <AdminLayout>
      <div className="admin-doctors">
        <div className="page-header">
          <h1>Doctors</h1>
          <Button variant="primary" onClick={handleAddDoctor}>
            Add Doctor
          </Button>
        </div>

        <div className="filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading doctors...</p>
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="doctors-grid">
            {filteredDoctors.map(renderDoctorCard)}
          </div>
        ) : (
          <div className="no-data-message">
            <p>No doctors found. Add a new doctor to get started.</p>
          </div>
        )}

        {/* Add Doctor Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          title="Add New Doctor"
          footer={
            <div className="modal-footer">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                form="doctorForm"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Doctor'}
              </Button>
            </div>
          }
        >
          <div className="modal-content">
            {renderDoctorForm()}
          </div>
        </Modal>

        {/* Edit Doctor Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          title="Edit Doctor"
          footer={
            <div className="modal-footer">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                form="doctorForm"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Doctor'}
              </Button>
            </div>
          }
        >
          <div className="modal-content">
            {renderDoctorForm()}
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminDoctors;