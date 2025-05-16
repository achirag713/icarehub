import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { admin } from '../../services/api';
import './Patients.css';

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    medicalHistory: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await admin.getPatients();
        setPatients(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.username,
      gender: patient.gender,
      phoneNumber: patient.phoneNumber || '',
      dateOfBirth: patient.dateOfBirth || new Date().toISOString().split('T')[0],
      address: patient.address || '',
      bloodGroup: patient.bloodGroup || '',
      medicalHistory: patient.medicalHistory || ''
    });
    setErrors({});
    setIsEditModalOpen(true);
  };

  const handleRemovePatient = async (patientId) => {
    if (window.confirm('Are you sure you want to remove this patient?')) {
      try {
        // Note: API endpoint doesn't exist yet - would need to be added to backend
        await admin.deletePatient(patientId);
        setPatients(patients.filter(patient => patient.id !== patientId));
      } catch (error) {
        console.error('Error removing patient:', error);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of Birth is required';
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
      // Send the data with field names matching the backend PatientUpdateDto
      await admin.updatePatient(selectedPatient.id, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address || '',
        bloodGroup: formData.bloodGroup || '',
        medicalHistory: formData.medicalHistory || ''
      });
      
      // Update the local patients list
      setPatients(patients.map(patient => 
        patient.id === selectedPatient.id ? { 
          ...patient, 
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          address: formData.address,
          bloodGroup: formData.bloodGroup,
          medicalHistory: formData.medicalHistory
        } : patient
      ));
      
      setIsEditModalOpen(false);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Error updating patient:', error);
      // Show error in UI
      if (error.response && error.response.data) {
        setErrors({
          ...errors,
          form: error.response.data.message || 'Error updating patient'
        });
      } else {
        setErrors({
          ...errors,
          form: 'Error connecting to server'
        });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const filteredPatients = patients.filter(patient => {
    const patientName = (patient.name || '').toLowerCase();
    const patientEmail = (patient.email || '').toLowerCase(); 
    return patientName.includes(searchTerm.toLowerCase()) ||
           patientEmail.includes(searchTerm.toLowerCase());
  });

  const renderPatientCard = (patient) => (
    <div key={patient.id} className="patient-card">
      <div className="patient-header">
        <div className="patient-info">
          <h3>{patient.name}</h3>
          <span className="patient-age-gender"> {patient.gender}</span>
        </div>
        <div className="patient-actions">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleEditPatient(patient)}
          >
            Edit
          </Button>
          <Button 
            variant="danger" 
            size="sm"
            onClick={() => handleRemovePatient(patient.id)}
          >
            Remove
          </Button>
        </div>
      </div>
      
      <div className="patient-details">
        <p><strong>Email:</strong> {patient.email}</p>
        <p><strong>Phone:</strong> {patient.phoneNumber}</p>
        <p><strong>Address:</strong> {patient.address}</p>
        <p><strong>Medical History:</strong> {patient.medicalHistory}</p>
        <p><strong>Blood Group:</strong> {patient.bloodGroup}</p>
      </div>
    </div>
  );

  const renderPatientForm = () => (
    <form onSubmit={handleSubmit} className="patient-form">
      <div className="form-group">
        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
          placeholder="Enter patient's full name"
        />
        {errors.name && <div className="error-message">{errors.name}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="dateOfBirth">Date of Birth</label>
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleChange}
          className={errors.dateOfBirth ? 'error' : ''}
        />
        {errors.dateOfBirth && <div className="error-message">{errors.dateOfBirth}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="gender">Gender</label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
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
          placeholder="Enter patient's phone number"
        />
        {errors.phoneNumber && <div className="error-message">{errors.phoneNumber}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="address">Address</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter patient's address"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="bloodGroup">Blood Group</label>
        <select
          id="bloodGroup"
          name="bloodGroup"
          value={formData.bloodGroup}
          onChange={handleChange}
        >
          <option value="">Select Blood Group</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="medicalHistory">Medical History</label>
        <textarea
          id="medicalHistory"
          name="medicalHistory"
          value={formData.medicalHistory}
          onChange={handleChange}
          placeholder="Enter patient's medical history"
          rows="3"
        />
      </div>
    </form>
  );

  return (
    <AdminLayout>
      <div className="admin-patients">
        <div className="page-header">
          <h1>Patients</h1>
        </div>

        <div className="filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading patients...</p>
          </div>
        ) : (
          <div className="patients-grid">
            {filteredPatients.map(renderPatientCard)}
          </div>
        )}

        {/* Edit Patient Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPatient(null);
          }}
          title="Edit Patient"
          footer={
            <div className="modal-footer">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedPatient(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                Update Patient
              </Button>
            </div>
          }
        >
          <div className="modal-content">
            {renderPatientForm()}
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminPatients;